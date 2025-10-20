import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';

export default function QuickAddMemberModal({ stakeId, wardId, wards, db, onClose, onSave }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    selectedWardId: wardId || '' // Pre-select if ward is provided
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user types
  };

  const handleSave = async () => {
    // Validation
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // If wards are provided (stake admin viewing all wards), require ward selection
    if (wards && wards.length > 0 && !formData.selectedWardId) {
      setError('Please select a ward');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const targetWardId = formData.selectedWardId || wardId;
      const emailLower = formData.email.trim().toLowerCase();

      // Check if a user with this email already exists
      const { getAuth } = await import('firebase/auth');
      const { collection: firestoreCollection, query, where, getDocs } = await import('firebase/firestore');

      const auth = getAuth();
      const usersRef = firestoreCollection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', emailLower));
      const userSnapshot = await getDocs(userQuery);

      let userId = null;
      let existingUserData = null;

      if (!userSnapshot.empty) {
        // User exists - get their ID and data
        const userDoc = userSnapshot.docs[0];
        userId = userDoc.id;
        existingUserData = userDoc.data();
      }

      // Create the member document
      const memberData = {
        fullName: formData.fullName.trim(),
        email: emailLower,
        phone: formData.phone.trim(),
        hasLoggedIn: existingUserData ? existingUserData.hasLoggedIn || false : false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // If user exists, add their userId to the member document
      if (userId) {
        memberData.userId = userId;
      }

      await addDoc(collection(db, 'stakes', stakeId, 'wards', targetWardId, 'members'), memberData);

      onSave();
    } catch (err) {
      console.error('Error adding member:', err);
      setError('Failed to add member. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Quick Add Member</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="John Doe"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="john.doe@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>

          {/* Ward Selection - only show if multiple wards available */}
          {wards && wards.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ward <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.selectedWardId}
                onChange={(e) => handleChange('selectedWardId', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="">Select a ward...</option>
                {wards.map(ward => (
                  <option key={ward.id} value={ward.id}>{ward.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              📝 The member can complete their profile after accepting their invitation and logging in.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}