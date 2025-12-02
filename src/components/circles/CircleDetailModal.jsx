import React, { useState } from 'react';
import { X, Plus, Users, Crown, Mail, Phone, User, Trash2, Edit2, PlayCircle, PauseCircle, Send } from 'lucide-react';

export default function CircleDetailModal({
  circle,
  members,
  allAvailableMembers,
  onClose,
  onUpdateName,
  onSetCaptain,
  onRemoveMembers,
  onAddMembers,
  onToggleMode,
  onResendInvite,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(circle.name);
  const [selectedForRemoval, setSelectedForRemoval] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedForAdd, setSelectedForAdd] = useState([]);
  const [addSearchTerm, setAddSearchTerm] = useState('');

  const captain = members.find(m => m.id === circle.captainId);
  const regularMembers = members
    .filter(m => m.id !== circle.captainId)
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

  const isEditMode = circle.mode === 'edit';
  const isLiveMode = circle.mode === 'live';

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== circle.name) {
      onUpdateName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const toggleRemovalSelection = (memberId) => {
    setSelectedForRemoval(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleRemoveSelected = () => {
    if (selectedForRemoval.length > 0) {
      onRemoveMembers(selectedForRemoval);
      setSelectedForRemoval([]);
    }
  };

  const toggleAddSelection = (memberId) => {
    setSelectedForAdd(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAddSelected = () => {
    if (selectedForAdd.length > 0) {
      onAddMembers(selectedForAdd);
      setSelectedForAdd([]);
      setShowAddMembers(false);
      setAddSearchTerm('');
    }
  };

  const filteredAvailableMembers = allAvailableMembers.filter(member =>
    member.fullName?.toLowerCase().includes(addSearchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(addSearchTerm.toLowerCase())
  );

  const MemberRow = ({ member, isCaptain = false, showCheckbox = true }) => {
    const hasNotLoggedIn = !member.hasLoggedIn;

    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        selectedForRemoval.includes(member.id)
          ? 'bg-red-50 border-red-200'
          : isCaptain
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}>
        {/* Checkbox for removal */}
        {showCheckbox && (
          <input
            type="checkbox"
            checked={selectedForRemoval.includes(member.id)}
            onChange={() => toggleRemovalSelection(member.id)}
            className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
          />
        )}

        {/* Profile picture */}
        <div className="flex-shrink-0">
          {member.profilePicUrl ? (
            <img
              src={member.profilePicUrl}
              alt={member.fullName}
              className="w-10 h-10 rounded-full object-cover border-2 border-rose-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center border-2 border-rose-200">
              <User className="w-5 h-5 text-rose-400" />
            </div>
          )}
        </div>

        {/* Member info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">{member.fullName}</p>
            {isCaptain && (
              <Crown className="w-4 h-4 text-amber-500 fill-current flex-shrink-0" />
            )}
          </div>
          {member.email && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Mail className="w-3 h-3" />
              <span className="truncate">{member.email}</span>
            </div>
          )}
          {member.phone && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Phone className="w-3 h-3" />
              <span>{member.phone}</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Resend invite */}
          {hasNotLoggedIn && onResendInvite && (
            <button
              onClick={() => onResendInvite(member.id)}
              className="p-1.5 rounded text-purple-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
              title="Resend invite email"
            >
              <Send className="w-4 h-4" />
            </button>
          )}

          {/* Set/remove captain */}
          <button
            onClick={() => onSetCaptain(isCaptain ? null : member.id)}
            className={`p-1.5 rounded transition-colors ${
              isCaptain
                ? 'text-amber-500 hover:text-gray-400 hover:bg-gray-50'
                : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
            }`}
            title={isCaptain ? "Remove as captain" : "Set as captain"}
          >
            <Crown className={`w-4 h-4 ${isCaptain ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`p-6 border-b flex-shrink-0 ${
          isEditMode
            ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200'
            : isLiveMode
            ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
            : 'bg-gradient-to-r from-rose-50 to-amber-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Users className="w-6 h-6 text-rose-500" />
              {isEditingName ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                  className="flex-1 px-3 py-1.5 border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-lg font-bold"
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-800">{circle.name}</h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                    title="Rename circle"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Mode toggle */}
            <button
              onClick={onToggleMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all mr-3 ${
                isEditMode
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : isLiveMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              }`}
              title={isEditMode ? "Click to go Live" : "Click to Edit mode"}
            >
              {isEditMode ? (
                <>
                  <PauseCircle className="w-4 h-4" />
                  <span>Edit Mode</span>
                </>
              ) : isLiveMode ? (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>Live</span>
                </>
              ) : (
                <span>Unknown</span>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-2">
            {members.length} member{members.length !== 1 ? 's' : ''}
            {captain && <span className="ml-2 text-rose-600">• Captain: {captain.fullName}</span>}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showAddMembers ? (
            /* Add Members View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Add Members</h3>
                <button
                  onClick={() => {
                    setShowAddMembers(false);
                    setSelectedForAdd([]);
                    setAddSearchTerm('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                value={addSearchTerm}
                onChange={(e) => setAddSearchTerm(e.target.value)}
                placeholder="Search available members..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />

              {/* Available members list */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredAvailableMembers.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    {addSearchTerm ? 'No members match your search' : 'No available members'}
                  </p>
                ) : (
                  filteredAvailableMembers.map(member => (
                    <label
                      key={member.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedForAdd.includes(member.id)
                          ? 'bg-rose-50 border-rose-300'
                          : 'bg-white border-gray-200 hover:border-rose-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedForAdd.includes(member.id)}
                        onChange={() => toggleAddSelection(member.id)}
                        className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                      />
                      <div className="flex-shrink-0">
                        {member.profilePicUrl ? (
                          <img
                            src={member.profilePicUrl}
                            alt={member.fullName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-rose-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{member.fullName}</p>
                        {member.email && (
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>

              {/* Add button */}
              {selectedForAdd.length > 0 && (
                <button
                  onClick={handleAddSelected}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add {selectedForAdd.length} Member{selectedForAdd.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          ) : (
            /* Members List View */
            <div className="space-y-4">
              {/* Add button */}
              <button
                onClick={() => setShowAddMembers(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Members
              </button>

              {members.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No members in this circle</p>
                  <p className="text-sm mt-1">Click "Add Members" to get started</p>
                </div>
              ) : (
                <>
                  {/* Captain section */}
                  {captain && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-gray-600 uppercase">Captain</span>
                      </div>
                      <MemberRow member={captain} isCaptain={true} />
                    </div>
                  )}

                  {/* Regular members */}
                  {regularMembers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-semibold text-gray-600 uppercase">Members</span>
                      </div>
                      <div className="space-y-2">
                        {regularMembers.map(member => (
                          <MemberRow key={member.id} member={member} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showAddMembers && selectedForRemoval.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              onClick={handleRemoveSelected}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove {selectedForRemoval.length} Member{selectedForRemoval.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}