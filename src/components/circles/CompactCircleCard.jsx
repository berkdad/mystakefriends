import React from 'react';
import { Users, Crown, ChevronRight, PlayCircle, PauseCircle } from 'lucide-react';

export default function CompactCircleCard({ circle, members, captain, onClick }) {
  const isEditMode = circle.mode === 'edit';
  const isLiveMode = circle.mode === 'live';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border-2 p-3 cursor-pointer transition-colors hover:shadow-md ${
        isEditMode
          ? 'border-yellow-400 hover:border-yellow-500 hover:bg-yellow-50'
          : isLiveMode
          ? 'border-green-500 hover:border-green-600 hover:bg-green-50'
          : 'border-gray-200 hover:border-rose-300 hover:bg-rose-50'
      }`}
    >
      <div className="flex items-center justify-between">
        {/* Left side: Circle info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mode indicator */}
          <div className={`flex-shrink-0 p-1.5 rounded-lg ${
            isEditMode
              ? 'bg-yellow-100'
              : isLiveMode
              ? 'bg-green-100'
              : 'bg-rose-100'
          }`}>
            {isEditMode ? (
              <PauseCircle className="w-4 h-4 text-yellow-600" />
            ) : isLiveMode ? (
              <PlayCircle className="w-4 h-4 text-green-600" />
            ) : (
              <Users className="w-4 h-4 text-rose-500" />
            )}
          </div>

          {/* Circle name */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{circle.name}</h3>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
              {captain && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <Crown className="w-3 h-3" />
                    {captain.fullName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Chevron */}
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </div>
    </div>
  );
}