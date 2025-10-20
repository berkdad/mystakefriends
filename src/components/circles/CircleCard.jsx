import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Edit2, Trash2, Mail, Crown, Users, Plus } from 'lucide-react';
import DraggableMember from './DraggableMember';

export default function CircleCard({ circle, members, onUpdateName, onDelete, onSetCaptain, onEmail, onAddMembers }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(circle.name);
  const { setNodeRef } = useDroppable({ id: circle.id });

  const captain = members.find(m => m.id === circle.captainId);
  const regularMembers = members.filter(m => m.id !== circle.captainId);

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== circle.name) {
      onUpdateName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const memberIds = members.map(m => `member-${m.id}`);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveName}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
              className="flex-1 px-2 py-1 border border-rose-300 rounded focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              autoFocus
            />
          ) : (
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-500" />
              {circle.name}
            </h3>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={onAddMembers}
              className="p-1.5 text-green-600 hover:bg-white rounded transition-colors"
              title="Add members"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEditingName(!isEditingName)}
              className="p-1.5 text-gray-600 hover:bg-white rounded transition-colors"
              title="Rename circle"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onEmail}
              className="p-1.5 text-blue-600 hover:bg-white rounded transition-colors"
              title="Email circle members"
              disabled={members.length === 0}
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-red-600 hover:bg-white rounded transition-colors"
              title="Delete circle"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          {members.length} member{members.length !== 1 ? 's' : ''}
          {captain && <span className="ml-2 text-rose-600">• Captain: {captain.fullName}</span>}
        </p>
      </div>

      {/* Drop zone for members */}
      <div ref={setNodeRef} className="flex-1 p-4">
        <SortableContext items={memberIds} strategy={verticalListSortingStrategy}>
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Users className="w-12 h-12 mb-2" />
              <p className="text-sm">Drag members here</p>
              <p className="text-xs mt-1">or click + to add</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Captain section */}
              {captain && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase">Captain</span>
                  </div>
                  <DraggableMember
                    member={captain}
                    isCaptain={true}
                    onSetCaptain={() => onSetCaptain(null)}
                  />
                </div>
              )}

              {/* Regular members */}
              {regularMembers.length > 0 && (
                <div>
                  {captain && (
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-600 uppercase">Members</span>
                    </div>
                  )}
                  {regularMembers.map(member => (
                    <DraggableMember
                      key={member.id}
                      member={member}
                      isCaptain={false}
                      onSetCaptain={() => onSetCaptain(member.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}