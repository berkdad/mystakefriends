import React, { useState, useEffect, useCallback } from 'react';
import { X, Megaphone, Trash2, Plus } from 'lucide-react';
import {
  MESSAGE_DURATION_OPTIONS,
  createMessage,
  listMessages,
  setActive,
  deleteMessage,
  isLive,
} from '../../services/systemMessagesService';
import { tr, trf } from '../../i18n/translations';

// Authors and manages persistent in-app banner messages (systemMessages) that
// members see when they open the app. Stake scope posts stake-wide; ward scope
// posts to a single ward. Ward admins only see/manage their own ward's messages.
export default function ManageMessagesModal({
  db,
  scope, // 'stake' | 'ward'
  stakeId,
  wardId,
  wardName,
  createdBy,
  createdByName,
  onClose,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [durationLabel, setDurationLabel] = useState(MESSAGE_DURATION_OPTIONS[2].label); // 1 week
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const scopeLabel = scope === 'stake' ? tr('the whole stake') : (wardName || tr('your ward'));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listMessages(db, stakeId);
      // Ward admins manage only their own ward's messages; stake admins see all.
      const visible = scope === 'ward'
        ? all.filter((m) => m.wardId === wardId)
        : all;
      setMessages(visible);
    } catch (e) {
      setStatus(trf('Could not load messages: {0}', [e.message]));
    } finally {
      setLoading(false);
    }
  }, [db, stakeId, scope, wardId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!text.trim()) {
      setStatus(tr('Please enter a message'));
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      const opt = MESSAGE_DURATION_OPTIONS.find((o) => o.label === durationLabel);
      await createMessage(db, {
        stakeId,
        message: text,
        createdBy,
        createdByName,
        durationMs: opt ? opt.ms : null,
        wardId: scope === 'ward' ? wardId : null,
        wardName: scope === 'ward' ? (wardName || null) : null,
      });
      setText('');
      await load();
      setStatus(tr('Message posted.'));
    } catch (e) {
      setStatus(trf('Could not post message: {0}', [e.message]));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (m) => {
    try {
      await setActive(db, stakeId, m.id, !m.active);
      await load();
    } catch (e) {
      setStatus(trf('Could not update message: {0}', [e.message]));
    }
  };

  const handleDelete = async (m) => {
    if (!confirm(tr('Delete this message? Members will no longer see it.'))) return;
    try {
      await deleteMessage(db, stakeId, m.id);
      await load();
    } catch (e) {
      setStatus(trf('Could not delete message: {0}', [e.message]));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{tr('Announcements')}</h2>
            <p className="text-sm text-gray-500 mt-1">
              <Megaphone className="w-4 h-4 inline mr-1" />
              {trf('Banner shown in the app to {0}', [scopeLabel])}
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Composer */}
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder={trf('Write an announcement for {0}...', [scopeLabel])}
            />
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">{tr('Show for:')}</label>
              <select
                value={durationLabel}
                onChange={(e) => setDurationLabel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
              >
                {MESSAGE_DURATION_OPTIONS.map((o) => (
                  <option key={o.label} value={o.label}>{tr(o.label)}</option>
                ))}
              </select>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 ml-auto"
              >
                <Plus className="w-4 h-4" />
                {saving ? tr('Posting...') : tr('Post')}
              </button>
            </div>
          </div>

          {status && (
            <div className={`p-3 rounded-lg text-sm ${
              status.startsWith('Could not') || status.startsWith('Please')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {status}
            </div>
          )}

          {/* Existing messages */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">{tr('Current messages')}</h3>
            {loading && <p className="text-sm text-gray-500">{tr('Loading…')}</p>}
            {!loading && messages.length === 0 && (
              <p className="text-sm text-gray-500">{tr('No messages yet.')}</p>
            )}
            {messages.map((m) => {
              const live = isLive(m);
              return (
                <div
                  key={m.id}
                  className="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{m.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {m.wardId ? (m.wardName || tr('Ward')) : tr('Stake-wide')}
                      {' · '}
                      {m.createdByName || tr('Leadership')}
                      {' · '}
                      <span className={live ? 'text-green-600' : 'text-gray-400'}>
                        {m.active ? (live ? tr('Active') : tr('Expired')) : tr('Off')}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggle(m)}
                      className={`px-2 py-1 text-xs rounded-lg border ${
                        m.active
                          ? 'text-gray-600 border-gray-300 hover:bg-gray-50'
                          : 'text-green-700 border-green-300 hover:bg-green-50'
                      }`}
                    >
                      {m.active ? tr('Turn off') : tr('Turn on')}
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      title={tr('Delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {tr('Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
