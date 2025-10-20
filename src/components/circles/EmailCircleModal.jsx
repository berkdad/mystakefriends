import React, { useState } from 'react';
import { X, Send, Paperclip } from 'lucide-react';
import { getAuth } from 'firebase/auth';

export default function EmailCircleModal({ circle, members, onClose }) {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const [formData, setFormData] = useState({
    from: currentUser?.email || '',
    subject: `Message from ${circle.name}`,
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const membersWithEmail = members.filter(m => m.email && m.email.trim() !== '');
  const recipientEmails = membersWithEmail.map(m => m.email).join(', ');

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!formData.message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (membersWithEmail.length === 0) {
      alert('No members in this circle have email addresses');
      return;
    }

    // In a real implementation, you would send this to a cloud function
    // For now, we'll open the user's email client
    const mailtoLink = `mailto:${recipientEmails}?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(formData.message)}`;

    window.location.href = mailtoLink;

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Email Circle Members</h2>
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
              To: {circle.name}
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex flex-wrap gap-2">
                {membersWithEmail.length === 0 ? (
                  <span className="text-sm text-gray-500 italic">
                    No members with email addresses
                  </span>
                ) : (
                  membersWithEmail.map((member, idx) => (
                    <span
                      key={member.id}
                      className="inline-flex items-center px-2 py-1 bg-rose-100 text-rose-700 text-sm rounded"
                    >
                      {member.fullName}
                      <span className="ml-1 text-xs text-rose-500">({member.email})</span>
                    </span>
                  ))
                )}
              </div>
              {members.length !== membersWithEmail.length && (
                <p className="text-xs text-amber-600 mt-2">
                  Note: {members.length - membersWithEmail.length} member(s) without email will not receive this message
                </p>
              )}
            </div>
          </div>

          {/* From field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="email"
              value={formData.from}
              onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="your@email.com"
            />
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
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
              placeholder="Type your message here..."
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-rose-400 cursor-pointer transition-colors">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">Add Attachment</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>
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
            disabled={sending || membersWithEmail.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}