import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { tr, trf } from '../../i18n/translations';

export default function EmailCircleModal({ circle, members, stakeId, wardId, onClose }) {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [formData, setFormData] = useState({
    from: currentUser?.email || '',
    subject: trf('Message from {0}', [circle.name]),
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  const membersWithEmail = members.filter(m => m.email && m.email.trim() !== '');

  const handleSend = async () => {
    if (!formData.message.trim()) {
      setStatus(tr('Please enter a message'));
      return;
    }

    if (membersWithEmail.length === 0) {
      setStatus(tr('No members in this circle have email addresses'));
      return;
    }

    setSending(true);
    setStatus(tr('Sending email...'));

    try {
      const functions = getFunctions();
      const emailCircle = httpsCallable(functions, 'emailCircle');

      const result = await emailCircle({
        circleId: circle.id,
        circleName: circle.name,
        from: formData.from,
        subject: formData.subject,
        message: formData.message,
        memberIds: membersWithEmail.map(m => m.id),
        stakeId,
        wardId
      });

      if (result.data.success) {
        setStatus(result.data.sent !== 1
          ? trf('Successfully sent {0} emails!', [result.data.sent])
          : trf('Successfully sent {0} email!', [result.data.sent]));
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setStatus(tr('Error sending email. Please try again.'));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setStatus(tr('Error sending email. Please try again.'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{tr('Email Circle Members')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* To field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {trf('To: {0}', [circle.name])}
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex flex-wrap gap-2">
                {membersWithEmail.length === 0 ? (
                  <span className="text-sm text-gray-500 italic">
                    {tr('No members with email addresses')}
                  </span>
                ) : (
                  membersWithEmail.map((member) => (
                    <span
                      key={member.id}
                      className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded"
                    >
                      {member.fullName}
                      <span className="ml-1 text-xs text-primary-500">({member.email})</span>
                    </span>
                  ))
                )}
              </div>
              {members.length !== membersWithEmail.length && (
                <p className="text-xs text-amber-600 mt-2">
                  {trf('Note: {0} member(s) without email will not receive this message', [members.length - membersWithEmail.length])}
                </p>
              )}
            </div>
          </div>

          {/* Subject field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tr('Subject')}
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Message field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tr('Message')}
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder={tr('Type your message here...')}
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
            {tr('Cancel')}
          </button>
          <button
            onClick={handleSend}
            disabled={sending || membersWithEmail.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {sending ? tr('Sending...') : tr('Send Email')}
          </button>
        </div>
      </div>
    </div>
  );
}