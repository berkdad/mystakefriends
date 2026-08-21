import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Edit2, Trash2, Mail, Crown, Users, Plus, MoreVertical, Send, PlayCircle, PauseCircle, ChevronDown, ChevronUp } from 'lucide-react';
import DraggableMember from './DraggableMember';
import { tr, trf } from '../../i18n/translations';

export default function CircleCard({
  circle,
  members,
  onUpdateName,
  onDelete,
  onSetCaptain,
  onEmail,
  onAddMembers,
  onInviteToApp,
  onToggleMode,
  onResendInvite,
  isCollapsed = false,
  onToggleCollapse,
}) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(circle.name);
  const [showMenu, setShowMenu] = useState(false);
  const {isOver, setNodeRef} = useDroppable({
    id: circle.id,
    data: { type: 'circle' },
  });

  const captain = members.find(m => m.id === circle.captainId);
  // Sort regular members alphabetically by fullName
  const regularMembers = members
    .filter(m => m.id !== circle.captainId)
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== circle.name) {
      onUpdateName(editedName.trim());
    }
    setIsEditingName(false);
  };

  const menuItems = [
    {
      icon: Plus,
      label: tr('Add Members'),
      onClick: () => {
        setShowMenu(false);
        onAddMembers();
      },
      color: 'text-green-600',
      hoverColor: 'hover:bg-green-50'
    },
    {
      icon: Edit2,
      label: tr('Rename Circle'),
      onClick: () => {
        setShowMenu(false);
        setIsEditingName(true);
      },
      color: 'text-gray-600',
      hoverColor: 'hover:bg-gray-50'
    },
    {
      icon: Mail,
      label: tr('Email Circle'),
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
      label: tr('Invite to App'),
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
      label: tr('Delete Circle'),
      onClick: () => {
        setShowMenu(false);
        onDelete();
      },
      color: 'text-red-600',
      hoverColor: 'hover:bg-red-50'
    }
  ];

  const isEditMode = circle.mode === 'edit';
  const isLiveMode = circle.mode === 'live';

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 overflow-hidden break-inside-avoid mb-4 transition-all ${
      isCollapsed ? '' : 'flex flex-col'
    } ${
      isOver
        ? 'border-primary-400 bg-primary-50 shadow-xl'
        : isEditMode
        ? 'border-yellow-400'
        : isLiveMode
        ? 'border-green-500'
        : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-4 flex-shrink-0 ${
        isCollapsed ? '' : 'border-b border-gray-200'
      } ${
        isEditMode
          ? 'bg-gradient-to-r from-yellow-100 to-yellow-200'
          : isLiveMode
          ? 'bg-gradient-to-r from-green-100 to-green-200'
          : 'bg-gradient-to-r from-primary-50 to-accent-50'
      }`}>
        <div className="flex items-center justify-between mb-2">
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveName}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
              className="flex-1 px-2 py-1 border border-primary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
          ) : (
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              {circle.name}
            </h3>
          )}

          <div className="flex items-center gap-1">
            {/* Collapse toggle button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className="p-1.5 text-gray-600 hover:bg-white rounded transition-colors"
                title={isCollapsed ? tr('Expand circle') : tr('Collapse circle')}
              >
                {isCollapsed ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Mode Toggle Button */}
            <button
              onClick={onToggleMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                isEditMode
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : isLiveMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-white hover:bg-gray-500'
              }`}
              title={isEditMode ? tr('Click to go Live and send notifications') : tr('Click to Edit mode')}
            >
              {isEditMode ? (
                <>
                  <PauseCircle className="w-4 h-4" />
                  <span>{tr('Edit Mode')}</span>
                </>
              ) : isLiveMode ? (
                <>
                  <PlayCircle className="w-4 h-4" />
                  <span>{tr('Live')}</span>
                </>
              ) : (
                <span>{tr('Unknown')}</span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-600 hover:bg-white rounded transition-colors"
                title={tr('Circle options')}
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
        </div>

        <p className="text-sm text-gray-600">
          {members.length !== 1 ? trf('{0} members', [members.length]) : trf('{0} member', [members.length])}
          {captain && <span className="ml-2 text-primary-600">{trf('• Captain: {0}', [captain.fullName])}</span>}
        </p>
      </div>

      {/* Drop zone for members - only show when not collapsed */}
      {!isCollapsed && (
        <div ref={setNodeRef} className="flex-1 p-4 min-h-24">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Users className="w-12 h-12 mb-2" />
              <p className="text-sm">{tr('Drag members here')}</p>
              <p className="text-xs mt-1">{tr('or use menu to add')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Captain (not inside SortableContext) */}
              {captain && (
                 <div className="mb-4">
                   <div className="flex items-center gap-2 mb-2">
                     <Crown className="w-4 h-4 text-amber-500" />
                     <span className="text-xs font-semibold text-gray-600 uppercase">{tr('Captain')}</span>
                   </div>
                   <DraggableMember
                     key={captain.id}
                     member={captain}
                     parentCircleId={circle.id}
                     isCaptain={true}
                     onSetCaptain={() => onSetCaptain(null)}
                     onResendInvite={() => onResendInvite(captain.id)}
                   />
                 </div>
               )}

              {/* Regular members (sortable list) */}
              {regularMembers.length > 0 && (
                <div>
                  {captain && (
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-600 uppercase">{tr('Members')}</span>
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
                        onResendInvite={() => onResendInvite(member.id)}
                      />
                    ))}
                  </SortableContext>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}