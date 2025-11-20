import React, { useState } from 'react';
import { X, Send, Shield } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function EmailAdminsModal({ stakeId, stakeName, onClose }) {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [formData, setFormData] = useState({
    from: currentUser?.email || '',
    subject: `Message from ${stakeName} Leadership`,
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  const handleSend = async () => {
    if (!formData.message.trim()) {
      setStatus('Please enter a message');
      return;
    }

    setSending(true);
    setStatus('Sending email to all admins...');

    try {
      const functions = getFunctions();
      const emailAllAdmins = httpsCallable(functions, 'emailAllAdmins');

      const result = await emailAllAdmins({
        stakeId,
        stakeName,
        from: formData.from,
        subject: formData.subject,
        message: formData.message
      });

      if (result.data.success) {
        setStatus(`Successfully sent ${result.data.sent} email${result.data.sent !== 1 ? 's' : ''}!`);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setStatus('Error sending email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setStatus('Error sending email. Please try again.');
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
            <Shield className="w-6 h-6 text-rose-600" />
            <h2 className="text-xl font-bold text-gray-800">Email All Stake & Ward Admins</h2>
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
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <h3 className="font-semibold text-rose-900 mb-2">Who will receive this email:</h3>
            <ul className="text-sm text-rose-800 space-y-1 list-disc list-inside">
              <li>All Stake Admins</li>
              <li>All Ward Admins from every ward in the stake</li>
            </ul>
          </div>

          {/* Subject field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* Message field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              placeholder="Type your message to all stake and ward admins here..."
            />
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
            {sending ? 'Sending...' : 'Send to All Admins'}
          </button>
        </div>
      </div>
    </div>
  );
}