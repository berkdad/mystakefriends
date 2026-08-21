import React from 'react';
import { X, PlayCircle, AlertCircle, UserPlus, Users, UserMinus, Mail, Smartphone } from 'lucide-react';
import { tr, trf } from '../../i18n/translations';

export default function ConfirmLiveModeModal({ circle, members, onConfirm, onCancel }) {
  // Get the last snapshot
  const lastSnapshot = circle.lastSnapshot || { memberIds: [] };
  const oldMemberIds = lastSnapshot.memberIds || [];
  const newMemberIds = circle.memberIds || [];

  // Calculate changes
  const addedMemberIds = newMemberIds.filter(id => !oldMemberIds.includes(id));
  const removedMemberIds = oldMemberIds.filter(id => !newMemberIds.includes(id));
  const existingMemberIds = oldMemberIds.filter(id => newMemberIds.includes(id));

  // Get member objects
  const addedMembers = members.filter(m => addedMemberIds.includes(m.id));
  const removedMembers = members.filter(m => removedMemberIds.includes(m.id));
  const existingMembers = members.filter(m => existingMemberIds.includes(m.id));

  const hasChanges = addedMemberIds.length > 0 || removedMemberIds.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <PlayCircle className="w-7 h-7 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">{tr('Switch to Live Mode?')}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {circle.name}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!hasChanges ? (
            /* No changes */
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">{tr('No Changes Detected')}</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    {tr('No members were added or removed since the last time this circle was Live. No notifications will be sent.')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900">{tr('Notifications Will Be Sent')}</h3>
                    <p className="text-sm text-amber-800 mt-1">
                      {tr('The following members will receive notifications (both push and email):')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Added Members */}
              {addedMembers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-800">
                      {trf('New Members Added ({0})', [addedMembers.length])}
                    </h3>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                    {addedMembers.map(member => (
                      <div key={member.id} className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {member.profilePicUrl ? (
                            <img
                              src={member.profilePicUrl}
                              alt={member.fullName}
                              className="w-10 h-10 rounded-full object-cover border-2 border-green-300"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center border-2 border-green-300">
                              <UserPlus className="w-5 h-5 text-green-700" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{member.fullName}</p>
                          {member.email && (
                            <p className="text-sm text-gray-600 truncate">{member.email}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-xs text-green-700">
                              <Smartphone className="w-3 h-3" />
                              <span>{trf('Push: "Welcome to {0}!"', [circle.name])}</span>
                            </div>
                            {member.email && (
                              <div className="flex items-center gap-1 text-xs text-green-700">
                                <Mail className="w-3 h-3" />
                                <span>{tr('Email: Welcome message')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Members (will be notified about new additions or removals) */}
              {existingMembers.length > 0 && (addedMembers.length > 0 || removedMembers.length > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-800">
                      {trf('Existing Members ({0})', [existingMembers.length])}
                    </h3>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="space-y-2">
                      {existingMembers.slice(0, 3).map(member => (
                        <div key={member.id} className="flex items-center gap-2">
                          <div className="flex-shrink-0">
                            {member.profilePicUrl ? (
                              <img
                                src={member.profilePicUrl}
                                alt={member.fullName}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                                <Users className="w-4 h-4 text-blue-700" />
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-900">{member.fullName}</p>
                        </div>
                      ))}
                      {existingMembers.length > 3 && (
                        <p className="text-sm text-gray-600 pl-10">
                          {trf('...and {0} more', [existingMembers.length - 3])}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-300">
                      <div className="space-y-1">
                        {addedMembers.length > 0 && (
                          <div className="flex items-start gap-2 text-xs text-blue-700">
                            <Smartphone className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>
                              {addedMembers.length > 1
                                ? trf('Push & Email: "{0} were added to your circle"', [addedMembers.map(m => m.fullName).join(', ')])
                                : trf('Push & Email: "{0} was added to your circle"', [addedMembers.map(m => m.fullName).join(', ')])}
                            </span>
                          </div>
                        )}
                        {removedMembers.length > 0 && (
                          <div className="flex items-start gap-2 text-xs text-blue-700">
                            <Smartphone className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>
                              {removedMembers.length > 1
                                ? trf('Push & Email: "{0} were reassigned"', [removedMembers.map(m => m.fullName).join(', ')])
                                : trf('Push & Email: "{0} was reassigned"', [removedMembers.map(m => m.fullName).join(', ')])}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Removed Members */}
              {removedMembers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserMinus className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">
                      {trf('Members Removed ({0})', [removedMembers.length])}
                    </h3>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                    {removedMembers.map(member => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {member.profilePicUrl ? (
                            <img
                              src={member.profilePicUrl}
                              alt={member.fullName}
                              className="w-8 h-8 rounded-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserMinus className="w-4 h-4 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{member.fullName}</p>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <p className="text-xs text-gray-600 italic">
                        {tr('Note: Removed members will NOT receive a notification. They will receive a welcome notification when added to their new circle.')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Info about what Live mode means */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 text-sm mb-2">{tr('What happens in Live mode:')}</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>{tr('Circle is marked as active and finalized')}</li>
              <li>{tr('Members can see and interact with the circle')}</li>
              <li>{tr('You can switch back to Edit mode anytime to make more changes')}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
          >
            {tr('Cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <PlayCircle className="w-5 h-5" />
            {hasChanges
              ? (addedMembers.length + existingMembers.length !== 1
                ? trf('Confirm & Send {0} Notifications', [addedMembers.length + existingMembers.length])
                : trf('Confirm & Send {0} Notification', [addedMembers.length + existingMembers.length]))
              : tr('Switch to Live Mode')}
          </button>
        </div>
      </div>
    </div>
  );
}