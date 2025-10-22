import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Edit2, Trash2, Mail, Crown, Users, Plus, MoreVertical, Send } from 'lucide-react';
import DraggableMember from './DraggableMember';

export default function CircleCard({ circle, members, onUpdateName, onDelete, onSetCaptain, onEmail, onAddMembers, onInviteToApp }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(circle.name);
  const [showMenu, setShowMenu] = useState(false);
  const {isOver, setNodeRef} = useDroppable({
    id: circle.id,
    data: { type: 'circle' },
  });

  const captain = members.find(m => m.id === circle.captainId);
  const regularMembers = members.filter(m => m.id !== circle.captainId);

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== circle.name) {
      onUpdateName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const menuItems = [
    {
      icon: Plus,
      label: 'Add Members',
      onClick: () => {
        setShowMenu(false);
        onAddMembers();
      },
      color: 'text-green-600',
      hoverColor: 'hover:bg-green-50'
    },
    {
      icon: Edit2,
      label: 'Rename Circle',
      onClick: () => {
        setShowMenu(false);
        setIsEditingName(true);
      },
      color: 'text-gray-600',
      hoverColor: 'hover:bg-gray-50'
    },
    {
      icon: Mail,
      label: 'Email Circle',
      onClick: () => {
        setShowMenu(false);
        onEmail();
      },
      color: 'text-blue-600',
      hoverColor: 'hover:bg-blue-50',
      disabled: members.length === 0
    },
    {
      icon: Send,
      label: 'Invite to App',
      onClick: () => {
        setShowMenu(false);
        onInviteToApp();
      },
      color: 'text-purple-600',
      hoverColor: 'hover:bg-purple-50',
      disabled: members.length === 0
    },
    {
      icon: Trash2,
      label: 'Delete Circle',
      onClick: () => {
        setShowMenu(false);
        onDelete();
      },
      color: 'text-red-600',
      hoverColor: 'hover:bg-red-50'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-md border overflow-hidden flex flex-col transition-all ${isOver ? 'border-rose-400 border-2 bg-rose-50 shadow-xl' : 'border-gray-200'}`}>
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

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-gray-600 hover:bg-white rounded transition-colors"
              title="Circle options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                  {menuItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={item.onClick}
                      disabled={item.disabled}
                      className={`w-full px-4 py-2 text-left flex items-center gap-3 transition-colors ${
                        item.disabled 
                          ? 'opacity-50 cursor-not-allowed' 
                          : `${item.color} ${item.hoverColor}`
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600">
          {members.length} member{members.length !== 1 ? 's' : ''}
          {captain && <span className="ml-2 text-rose-600">• Captain: {captain.fullName}</span>}
        </p>
      </div>

      {/* Drop zone for members */}
      <div ref={setNodeRef} className="flex-1 p-4 min-h-24">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Users className="w-12 h-12 mb-2" />
            <p className="text-sm">Drag members here</p>
            <p className="text-xs mt-1">or use menu to add</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Captain (not inside SortableContext) */}
            {captain && (
               <div className="mb-4">
                 <div className="flex items-center gap-2 mb-2">
                   <Crown className="w-4 h-4 text-amber-500" />
                   <span className="text-xs font-semibold text-gray-600 uppercase">Captain</span>
                 </div>
                 <DraggableMember
                   key={captain.id}
                   member={captain}
                   parentCircleId={circle.id}
                   isCaptain={true}
                   onSetCaptain={() => onSetCaptain(null)}
                 />
               </div>
             )}

            {/* Regular members (sortable list) */}
            {regularMembers.length > 0 && (
              <div>
                {captain && (
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-semibold text-gray-600 uppercase">Members</span>
                  </div>
                )}

                <SortableContext
                  items={regularMembers.map(m => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {regularMembers.map(member => (
                    <DraggableMember
                      key={member.id}
                      member={member}
                      parentCircleId={circle.id}
                      isCaptain={false}
                      onSetCaptain={() => onSetCaptain(member.id)}
                    />
                  ))}
                </SortableContext>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}