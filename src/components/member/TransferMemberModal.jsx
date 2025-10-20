import React, { useState } from 'react';
import { doc, writeBatch, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { X, ArrowRight, AlertCircle } from 'lucide-react';

export default function TransferMemberModal({ member, currentWard, wards, stakeId, db, onClose, onComplete }) {
  const [targetWardId, setTargetWardId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState('');

  const handleTransfer = async () => {
    if (!targetWardId || targetWardId === currentWard.id) {
      setError('Please select a different ward');
      return;
    }

    if (!confirm(`Transfer ${member.fullName} from ${currentWard.name} to ${wards.find(w => w.id === targetWardId)?.name}?\n\nThis will:\n- Move their member record\n- Remove them from any circles in the current ward\n- Update their user account (if they have one)`)) {
      return;
    }

    setTransferring(true);
    setError('');

    try {
      const batch = writeBatch(db);

      // 1. Create member in new ward
      const newMemberRef = doc(collection(db, 'stakes', stakeId, 'wards', targetWardId, 'members'));
      batch.set(newMemberRef, {
        ...member,
        updatedAt: new Date().toISOString(),
        transferredFrom: currentWard.id,
        transferredAt: new Date().toISOString()
      });

      // 2. Delete member from old ward (we'll do this separately to handle circles first)

      // Commit the member creation first
      await batch.commit();

      // 3. Remove from all circles in old ward
      const circlesQuery = query(collection(db, 'stakes', stakeId, 'wards', currentWard.id, 'circles'));
      const circlesSnapshot = await getDocs(circlesQuery);

      for (const circleDoc of circlesSnapshot.docs) {
        const circleData = circleDoc.data();
        if ((circleData.memberIds || []).includes(member.id)) {
          const updatedMemberIds = circleData.memberIds.filter(id => id !== member.id);
          const updatedCaptainId = circleData.captainId === member.id ? null : circleData.captainId;

          await doc(db, 'stakes', stakeId, 'wards', currentWard.id, 'circles', circleDoc.id).set({
            memberIds: updatedMemberIds,
            captainId: updatedCaptainId
          }, { merge: true });
        }
      }

      // 4. Update user account if exists
      if (member.email) {
        const usersQuery = query(
          collection(db, 'users'),
          where('email', '==', member.email)
        );
        const usersSnapshot = await getDocs(usersQuery);

        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          await doc(db, 'users', userDoc.id).set({
            wardId: targetWardId,
            memberWardId: targetWardId,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }

      // 5. Delete from old ward
      await deleteDoc(doc(db, 'stakes', stakeId, 'wards', currentWard.id, 'members', member.id));

      alert(`Successfully transferred ${member.fullName} to ${wards.find(w => w.id === targetWardId)?.name}`);
      onComplete();
    } catch (err) {
      console.error('Error transferring member:', err);
      setError(`Failed to transfer member: ${err.message}`);
    } finally {
      setTransferring(false);
    }
  };

  const targetWard = wards.find(w => w.id === targetWardId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Transfer Member</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Member</p>
            <p className="font-semibold text-gray-800">{member.fullName}</p>
            {member.email && <p className="text-sm text-gray-600">{member.email}</p>}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Current Ward</p>
              <p className="font-medium text-blue-800">{currentWard.name}</p>
            </div>

            <ArrowRight className="w-6 h-6 text-gray-400 flex-shrink-0" />

            <div className="flex-1 bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 mb-1">New Ward</p>
              <p className="font-medium text-green-800">
                {targetWard ? targetWard.name : 'Select...'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer to Ward
            </label>
            <select
              value={targetWardId}
              onChange={(e) => setTargetWardId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={transferring}
            >
              <option value="">Select a ward...</option>
              {wards
                .filter(w => w.id !== currentWard.id)
                .map(ward => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> This will remove the member from any circles in {currentWard.name}.
            They will need to be added to a circle in the new ward.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={transferring}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleTransfer}
            disabled={!targetWardId || transferring}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {transferring ? 'Transferring...' : 'Transfer Member'}
          </button>
        </div>
      </div>
    </div>
  );
}