import React, { useState } from 'react';
import { X, Plus, Search } from 'lucide-react';

export default function AddMembersModal({ circle, availableMembers, onClose, onAddMembers }) {
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = availableMembers.filter(member =>
    member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleMember = (memberId) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAdd = () => {
    if (selectedMemberIds.length > 0) {
      onAddMembers(selectedMemberIds);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Add Members to {circle.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedMemberIds.length} selected • {availableMembers.length} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'No members match your search' : 'No available members'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map(member => (
                <label
                  key={member.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedMemberIds.includes(member.id)
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-white border-gray-200 hover:border-rose-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(member.id)}
                    onChange={() => toggleMember(member.id)}
                    className="w-4 h-4 text-rose-500 border-gray-300 rounded focus:ring-rose-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{member.fullName}</p>
                    {member.email && (
                      <p className="text-sm text-gray-600 truncate">{member.email}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedMemberIds.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add {selectedMemberIds.length > 0 && `(${selectedMemberIds.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}