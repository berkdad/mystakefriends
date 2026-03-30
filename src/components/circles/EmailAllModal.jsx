import React, { useState } from 'react';
import { X, Send, Users } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function EmailAllModal({ scope, stakeId, wardId, stakeName, wardName, memberCount, onClose }) {
  // scope: 'ward' or 'stake'
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const scopeLabel = scope === 'stake' ? `${stakeName || 'Stake'}` : `${wardName || 'Ward'}`;

  const [formData, setFormData] = useState({
    from: currentUser?.email || '',
    subject: `Message from ${scopeLabel}`,
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  const handleSend = async () => {
    if (!formData.message.trim()) {
      setStatus('Please enter a message');
      return;
    }

    const confirmMsg = scope === 'stake'
      ? `Send this email to ALL members across the entire stake?`
      : `Send this email to ALL members in ${wardName || 'this ward'}?`;

    if (!confirm(confirmMsg)) return;

    setSending(true);
    setStatus('Sending emails...');

    try {
      const functions = getFunctions();
      const functionName = scope === 'stake' ? 'emailAllStakeMembers' : 'emailAllWardMembers';
      const emailAll = httpsCallable(functions, functionName);

      const payload = {
        stakeId,
        subject: formData.subject,
        message: formData.message,
        from: formData.from,
      };

      if (scope === 'ward') {
        payload.wardId = wardId;
        payload.wardName = wardName;
      }
      payload.stakeName = stakeName;

      const result = await emailAll(payload);

      if (result.data.success) {
        setStatus(`Successfully sent ${result.data.sent} email${result.data.sent !== 1 ? 's' : ''}!${result.data.failed > 0 ? ` (${result.data.failed} failed)` : ''}`);
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setStatus('Error sending emails. Please try again.');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      setStatus('Error sending emails: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Email All {scope === 'stake' ? 'Stake' : 'Ward'} Members
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              <Users className="w-4 h-4 inline mr-1" />
              Sending to all members in {scopeLabel}
              {memberCount !== undefined && ` (${memberCount} members with email)`}
            </p>
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
          {/* From field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="text"
              value={formData.from}
              onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-gray-50"
            />
          </div>

          {/* Subject field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* Message field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              placeholder="Type your message here..."
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> This will send an email to every member with an email address
              {scope === 'stake' ? ' across all wards in the stake' : ` in ${wardName || 'this ward'}`}.
              Please use this feature responsibly.
            </p>
          </div>

          {/* Status message */}
          {status && (
            <div className={`p-3 rounded-lg ${
              status.includes('Successfully')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : status.includes('Error') || status.includes('Please')
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
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : `Send to All ${scope === 'stake' ? 'Stake' : 'Ward'} Members`}
          </button>
        </div>
      </div>
    </div>
  );
}
