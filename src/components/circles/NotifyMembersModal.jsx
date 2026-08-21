import React, { useState } from 'react';
import { X, Bell, Users } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { tr, trf } from '../../i18n/translations';

// Sends an in-app push notification to members via the notifyMembers Cloud
// Function (the same one the mobile app uses). Stake scope pushes to everyone
// in the stake; ward scope pushes to one ward. The server enforces that a ward
// admin may only push to their own ward and a stake admin to their own stake.
export default function NotifyMembersModal({ scope, stakeId, wardId, stakeName, wardName, onClose }) {
  // scope: 'ward' or 'stake'
  const scopeLabel = scope === 'stake' ? (stakeName || tr('the stake')) : (wardName || tr('this ward'));

  const [formData, setFormData] = useState({
    title: '',
    body: '',
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.body.trim()) {
      setStatus(tr('Please enter both a title and a message'));
      return;
    }

    const confirmMsg = scope === 'stake'
      ? tr('Send this notification to EVERYONE in the stake?')
      : trf('Send this notification to everyone in {0}?', [wardName || tr('this ward')]);

    if (!confirm(confirmMsg)) return;

    setSending(true);
    setStatus(tr('Sending notification...'));

    try {
      const functions = getFunctions();
      const notifyMembers = httpsCallable(functions, 'notifyMembers');

      const payload = {
        stakeId,
        title: formData.title.trim(),
        body: formData.body.trim(),
      };
      if (scope === 'ward') {
        payload.wardId = wardId;
      }

      const result = await notifyMembers(payload);

      if (result.data?.success) {
        const n = result.data.recipients ?? 0;
        setStatus(n !== 1
          ? trf('Notification sent to {0} members with the app installed.', [n])
          : trf('Notification sent to {0} member with the app installed.', [n]));
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setStatus(tr('Error sending notification. Please try again.'));
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setStatus(trf('Error sending notification: {0}', [error.message]));
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
              {scope === 'stake' ? tr('Send Notification to Stake') : tr('Send Notification to Ward')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              <Users className="w-4 h-4 inline mr-1" />
              {trf('In-app push to everyone in {0}', [scopeLabel])}
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
          {/* Title field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Title')}</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              maxLength={80}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={tr('e.g. Stake Conference this Sunday')}
            />
          </div>

          {/* Message field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Message')}</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              rows={5}
              maxLength={240}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder={tr('Type the notification message here...')}
            />
          </div>

          {/* Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>{tr('Note:')}</strong> {tr('This sends a push notification to every member with the app installed')}
              {scope === 'stake' ? tr(' across all wards in the stake') : trf(' in {0}', [wardName || tr('this ward')])}.{' '}
              {tr("Members without the app won't receive it. Please use this responsibly.")}
            </p>
          </div>

          {/* Status message */}
          {status && (
            <div className={`p-3 rounded-lg ${
              status.includes('sent to')
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
            {tr('Cancel')}
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bell className="w-4 h-4" />
            {sending
              ? tr('Sending...')
              : (scope === 'stake' ? tr('Send to Stake') : tr('Send to Ward'))}
          </button>
        </div>
      </div>
    </div>
  );
}
