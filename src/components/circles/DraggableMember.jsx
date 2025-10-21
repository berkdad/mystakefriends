import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Crown, User, Mail, Phone, Baby, Heart } from 'lucide-react';

export default function DraggableMember({ member, isCaptain = false, onSetCaptain, showAge = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: member.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const calculateAge = (dob) => {
    if (!dob) return null;

    // Parse MM/DD/YYYY format
    let birthDate;
    if (dob.includes('/')) {
      const [month, day, year] = dob.split('/');
      birthDate = new Date(year, month - 1, day);
    } else if (dob.includes('-')) {
      birthDate = new Date(dob);
    } else {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(member.dob);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-3 shadow-sm transition-all ${
        isDragging
          ? 'shadow-2xl scale-105 rotate-3 border-rose-400 bg-rose-50 z-50'
          : 'hover:shadow-md'
      } ${
        isCaptain ? 'border-amber-300 bg-amber-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className={`cursor-grab active:cursor-grabbing pt-1 transition-colors ${
            isDragging ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Left side: Profile picture and info stacked */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* Top row: Picture and name */}
          <div className="flex items-center gap-2">
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

            {/* Name - smaller text */}
            <p className="text-sm font-medium text-gray-900 flex-1">
              {member.fullName}
            </p>
          </div>

          {/* Bottom: Contact info and details */}
          <div className="space-y-0.5 pl-0">
            {member.email && (
              <div className="flex items-start gap-1.5 text-xs text-gray-600 min-w-0">
                <Mail className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span
                  className="truncate flex-1"   // = overflow-hidden + text-ellipsis + whitespace-nowrap
                  title={member.email}
                >
                  {member.email}
                </span>
              </div>
            )}

            {member.phone && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{member.phone}</span>
                <div className="flex items-center gap-1 ml-2">
                  {member.maritalStatus === 'married' && (
                    <Heart className="w-3 h-3 text-rose-500 fill-current" title="Married" />
                  )}
                  {member.maritalStatus === 'widowed' && (
                    <Heart className="w-3 h-3 text-gray-400" title="Widowed" />
                  )}
                  {member.maritalStatus === 'divorced' && (
                    <Heart className="w-3 h-3 text-gray-400" title="Divorced" style={{ opacity: 0.5 }} />
                  )}
                  {member.numChildren && parseInt(member.numChildren) > 0 && (
                    <span className="flex items-center gap-0.5 text-rose-500" title={`${member.numChildren} ${parseInt(member.numChildren) === 1 ? 'child' : 'children'}`}>
                      <Baby className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            )}
            {showAge && (
              <div className="text-xs text-gray-500">
                {age ? `Age: ${age}` : (
                  <span className="text-amber-600 italic">DOB missing</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right side: Captain crown button */}
        <div className="flex flex-col items-end gap-1">
          {/* Set/remove captain button */}
          {onSetCaptain && !isDragging && (
            <button
              onClick={onSetCaptain}
              className={`p-1.5 rounded transition-colors ${
                isCaptain
                  ? 'text-amber-500 hover:text-gray-400 hover:bg-gray-50'
                  : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
              title={isCaptain ? "Remove as captain" : "Set as captain"}
            >
              <Crown className={`w-4 h-4 ${isCaptain ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}