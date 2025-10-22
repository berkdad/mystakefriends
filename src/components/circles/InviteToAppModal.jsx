import React, { useState } from 'react';
import { X, Send, Smartphone } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function InviteToAppModal({ circle, members, stakeId, wardId, stakeName, wardName, onClose }) {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  // Filter members who haven't logged in and have email
  const pendingMembers = members.filter(m => !m.hasLoggedIn && m.email && m.email.trim() !== '');

  const handleSendInvites = async () => {
    if (pendingMembers.length === 0) {
      setStatus('No pending members to invite.');
      return;
    }

    setSending(true);
    setStatus('Sending invitations...');

    try {
      const functions = getFunctions();
      const inviteCircleToApp = httpsCallable(functions, 'inviteCircleToApp');

      const result = await inviteCircleToApp({
        circleId: circle.id,
        circleName: circle.name,
        memberIds: pendingMembers.map(m => m.id),
        stakeId,
        wardId,
        stakeName,
        wardName
      });

      if (result.data.success) {
        setStatus(`Successfully sent ${result.data.sent} invitation${result.data.sent !== 1 ? 's' : ''}!`);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setStatus('Error sending invitations. Please try again.');
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      setStatus('Error sending invitations. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-800">Invite Circle to App</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">What this does:</h3>
            <ul className="text-sm text-purple-800 space-y-1 list-disc list-inside">
              <li>Sends invitation emails to all members who haven't logged in yet</li>
              <li>Includes instructions to set up their account on the website</li>
              <li>Provides links to download the iOS app (Android coming soon!)</li>
              <li>Members must accept the invite and set their password on the web before using the app</li>
            </ul>
          </div>

          {/* Members to invite */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Members to Invite ({pendingMembers.length})
            </label>
            {pendingMembers.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">
                  All members in this circle have already been invited and logged in!
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                <div className="space-y-2">
                  {pendingMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.fullName}</p>
                        <p className="text-xs text-gray-500">{member.email}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Already invited members */}
          {members.length !== pendingMembers.length && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Already Active ({members.length - pendingMembers.length})
              </label>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-xs text-green-700">
                  {members.length - pendingMembers.length} member{members.length - pendingMembers.length !== 1 ? 's' : ''} already logged in and won't receive an invitation.
                </p>
              </div>
            </div>
          )}

          {/* Status message */}
          {status && (
            <div className={`p-3 rounded-lg ${
              status.includes('Successfully') 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : status.includes('Error')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              <p className="text-sm">{status}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendInvites}
            disabled={sending || pendingMembers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : `Send ${pendingMembers.length} Invitation${pendingMembers.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}