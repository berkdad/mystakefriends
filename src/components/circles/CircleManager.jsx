import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Target, Plus, Trash2, Edit2, Mail, User } from 'lucide-react';
import CircleCard from './CircleCard';
import MemberFilters from './MemberFilters';
import DraggableMember from './DraggableMember';
import EmailCircleModal from './EmailCircleModal';
import AddMembersModal from './AddMembersModal';

export default function CircleManager({ db, stakeId, wardId, wardName }) {
  const [circles, setCircles] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    ageMin: 0,
    ageMax: 120,
    hasChildren: 'all',
    maritalStatus: 'all',
    hasEmail: 'all',
    hasLoggedIn: 'all',
    ethnicity: 'all',
    sortBy: 'name'
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [activeMember, setActiveMember] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load circles and members
  useEffect(() => {
    loadData();
  }, [stakeId, wardId]);

  // Apply filters whenever they change
  useEffect(() => {
    applyFilters();
  }, [availableMembers, filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load members
      const membersQuery = query(collection(db, 'stakes', stakeId, 'wards', wardId, 'members'));
      const membersSnapshot = await getDocs(membersQuery);
      const membersData = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllMembers(membersData);

      // Load circles
      const circlesQuery = query(collection(db, 'stakes', stakeId, 'wards', wardId, 'circles'));
      const circlesSnapshot = await getDocs(circlesQuery);
      const circlesData = circlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCircles(circlesData);

      // Calculate available members (not in any circle)
      const membersInCircles = new Set();
      circlesData.forEach(circle => {
        (circle.memberIds || []).forEach(id => membersInCircles.add(id));
      });

      const available = membersData.filter(m => !membersInCircles.has(m.id));
      setAvailableMembers(available);

      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load circles and members');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...availableMembers];

    // Filter by age (include members without DOB unless age filter is active)
    filtered = filtered.filter(member => {
      if (!member.dob) {
        return filters.ageMin === 0 && filters.ageMax === 120;
      }
      const age = calculateAge(member.dob);
      return age >= filters.ageMin && age <= filters.ageMax;
    });

    // Filter by has children
    if (filters.hasChildren !== 'all') {
      filtered = filtered.filter(member => {
        const hasKids = member.numChildren && parseInt(member.numChildren) > 0;
        return filters.hasChildren === 'yes' ? hasKids : !hasKids;
      });
    }

    // Filter by ethnicity
    if (filters.ethnicity !== 'all') {
      filtered = filtered.filter(member =>
        member.ethnicity && member.ethnicity.toLowerCase() === filters.ethnicity.toLowerCase()
      );
    }

    // Filter by marital status
    if (filters.maritalStatus !== 'all') {
      filtered = filtered.filter(member => member.maritalStatus === filters.maritalStatus);
    }

    // Filter by has email
    if (filters.hasEmail !== 'all') {
      filtered = filtered.filter(member => {
        const hasEmail = member.email && member.email.trim() !== '';
        return filters.hasEmail === 'yes' ? hasEmail : !hasEmail;
      });
    }

    // Filter by has logged in
    if (filters.hasLoggedIn !== 'all') {
      filtered = filtered.filter(member => {
        return filters.hasLoggedIn === 'yes' ? member.hasLoggedIn : !member.hasLoggedIn;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (filters.sortBy === 'name') {
        return (a.fullName || '').localeCompare(b.fullName || '');
      } else if (filters.sortBy === 'age') {
        const ageA = calculateAge(a.dob);
        const ageB = calculateAge(b.dob);
        return ageA - ageB;
      }
      return 0;
    });

    setFilteredMembers(filtered);
  };

  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const createCircle = async () => {
    try {
      const nextNumber = circles.length + 1;
      const newCircle = {
        name: `Circle ${nextNumber}`,
        captainId: null,
        memberIds: [],
        stakeId,
        wardId,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'stakes', stakeId, 'wards', wardId, 'circles'), newCircle);

      setCircles(prev => [...prev, { id: docRef.id, ...newCircle }]);
      setSuccess('Circle created successfully');
    } catch (err) {
      console.error('Error creating circle:', err);
      setError('Failed to create circle');
    }
  };

  const updateCircleName = async (circleId, newName) => {
    try {
      await updateDoc(doc(db, 'stakes', stakeId, 'wards', wardId, 'circles', circleId), {
        name: newName
      });

      setCircles(prev => prev.map(c => c.id === circleId ? { ...c, name: newName } : c));
      setSuccess('Circle name updated');
    } catch (err) {
      console.error('Error updating circle name:', err);
      setError('Failed to update circle name');
    }
  };

  const deleteCircle = async (circleId) => {
    if (!confirm('Are you sure you want to delete this circle? All members will be moved back to available members.')) {
      return;
    }

    try {
      const circle = circles.find(c => c.id === circleId);

      await deleteDoc(doc(db, 'stakes', stakeId, 'wards', wardId, 'circles', circleId));

      // Move members back to available
      const membersToReturn = allMembers.filter(m => (circle.memberIds || []).includes(m.id));
      setAvailableMembers(prev => [...prev, ...membersToReturn]);

      setCircles(prev => prev.filter(c => c.id !== circleId));
      setSuccess('Circle deleted successfully');
    } catch (err) {
      console.error('Error deleting circle:', err);
      setError('Failed to delete circle');
    }
  };

  const addMembersToCircle = async (circleId, memberIds) => {
    try {
      const circle = circles.find(c => c.id === circleId);
      const updatedMemberIds = [...(circle.memberIds || []), ...memberIds];

      await updateDoc(doc(db, 'stakes', stakeId, 'wards', wardId, 'circles', circleId), {
        memberIds: updatedMemberIds
      });

      setCircles(prev => prev.map(c =>
        c.id === circleId ? { ...c, memberIds: updatedMemberIds } : c
      ));

      // Remove from available
      setAvailableMembers(prev => prev.filter(m => !memberIds.includes(m.id)));

      setSuccess(`${memberIds.length} member${memberIds.length > 1 ? 's' : ''} added successfully`);
    } catch (err) {
      console.error('Error adding members:', err);
      setError('Failed to add members');
    }
  };

  const handleDragStart = (event) => {
    const memberId = event.active.id.replace('member-', '');
    const member = allMembers.find(m => m.id === memberId);
    setActiveMember(member);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const memberId = active.id.replace('member-', '');
    const member = allMembers.find(m => m.id === memberId);

    if (!member) return;

    // Determine source and destination
    let sourceCircleId = null;
    let destinationId = over.id;

    // Find source circle
    for (const circle of circles) {
      if ((circle.memberIds || []).includes(memberId)) {
        sourceCircleId = circle.id;
        break;
      }
    }

    // If dropping on another member, find their container
    if (over.id.startsWith('member-')) {
      const overMemberId = over.id.replace('member-', '');

      // Check if in available
      if (availableMembers.some(m => m.id === overMemberId)) {
        destinationId = 'available';
      } else {
        // Find which circle
        for (const circle of circles) {
          if ((circle.memberIds || []).includes(overMemberId)) {
            destinationId = circle.id;
            break;
          }
        }
      }
    }

    // Don't do anything if source and destination are the same
    if ((sourceCircleId === null && destinationId === 'available') ||
        (sourceCircleId === destinationId)) {
      return;
    }

    try {
      // Remove from source
      if (sourceCircleId) {
        const sourceCircle = circles.find(c => c.id === sourceCircleId);
        const updatedMemberIds = (sourceCircle.memberIds || []).filter(id => id !== memberId);
        const updatedCaptainId = sourceCircle.captainId === memberId ? null : sourceCircle.captainId;

        await updateDoc(doc(db, 'stakes', stakeId, 'wards', wardId, 'circles', sourceCircleId), {
          memberIds: updatedMemberIds,
          captainId: updatedCaptainId
        });

        setCircles(prev => prev.map(c =>
          c.id === sourceCircleId
            ? { ...c, memberIds: updatedMemberIds, captainId: updatedCaptainId }
            : c
        ));
      }

      // Add to destination
      if (destinationId === 'available') {
        setAvailableMembers(prev => [...prev, member]);
      } else {
        const destCircle = circles.find(c => c.id === destinationId);
        const updatedMemberIds = [...(destCircle.memberIds || []), memberId];

        await updateDoc(doc(db, 'stakes', stakeId, 'wards', wardId, 'circles', destinationId), {
          memberIds: updatedMemberIds
        });

        setCircles(prev => prev.map(c =>
          c.id === destinationId
            ? { ...c, memberIds: updatedMemberIds }
            : c
        ));

        // Remove from available if it was there
        setAvailableMembers(prev => prev.filter(m => m.id !== memberId));
      }

      setSuccess('Member moved successfully');
      setActiveMember(null);
    } catch (err) {
      console.error('Error moving member:', err);
      setError('Failed to move member');
      loadData(); // Reload to restore correct state
    }
  };

  const setCaptain = async (circleId, memberId) => {
    try {
      await updateDoc(doc(db, 'stakes', stakeId, 'wards', wardId, 'circles', circleId), {
        captainId: memberId
      });

      setCircles(prev => prev.map(c =>
        c.id === circleId ? { ...c, captainId: memberId } : c
      ));

      setSuccess('Captain assigned successfully');
    } catch (err) {
      console.error('Error setting captain:', err);
      setError('Failed to set captain');
    }
  };

  // Generate all draggable IDs
  const allMemberIds = [
    ...filteredMembers.map(m => `member-${m.id}`),
    ...circles.flatMap(c => (c.memberIds || []).map(id => `member-${id}`))
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading circles...</div>
      </div>
    );
  }

  function DraggableMemberOverlay({ member }) {
    return (
      <div className="bg-white border-2 border-rose-400 rounded-lg p-3 shadow-2xl opacity-90">
        <div className="flex items-center gap-2">
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
          <p className="text-sm font-medium text-gray-900">{member.fullName}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button onClick={() => setError('')} className="float-right">×</button>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
          <button onClick={() => setSuccess('')} className="float-right">×</button>
        </div>
      )}

     <DndContext
       sensors={sensors}
       collisionDetection={closestCenter}
       onDragEnd={handleDragEnd}
       onDragStart={handleDragStart}
     >
        <SortableContext items={allMemberIds} strategy={verticalListSortingStrategy}>
          <div className="flex-1 flex gap-6 overflow-y-auto">
            {/* Left sidebar - Available members with filters */}
            <div className="w-80 flex flex-col bg-white rounded-lg shadow-md border border-gray-200 flex-shrink-0">
              <div className="p-4 border-b border-gray-200 bg-rose-50 flex-shrink-0">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-rose-500" />
                  Available Members
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredMembers.length} of {availableMembers.length} shown
                </p>
                {availableMembers.length !== filteredMembers.length && (
                  <p className="text-xs text-amber-600 mt-1">
                    {availableMembers.length - filteredMembers.length} members hidden by filters
                  </p>
                )}
              </div>

              <div className="flex-shrink-0">
                <MemberFilters filters={filters} onFilterChange={setFilters} />
              </div>

              <div className="p-4 space-y-2">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    {availableMembers.length === 0
                      ? 'All members are in circles'
                      : 'No members match filters'}
                  </div>
                ) : (
                  filteredMembers.map(member => (
                    <DraggableMember
                      key={member.id}
                      member={member}
                      showAge={true}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Right side - Circles */}
            <div className="flex-1 flex flex-col">
              <div className="mb-4 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-800">
                  Friendship Circles ({circles.length})
                </h2>
                <button
                  onClick={createCircle}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Circle
                </button>
              </div>

              {circles.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 bg-white rounded-lg shadow-md border-2 border-dashed border-gray-300 p-12">
                  <Target className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Circles Yet</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Create your first friendship circle to get started
                  </p>
                  <button
                    onClick={createCircle}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create First Circle
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                  {circles.map(circle => (
                    <CircleCard
                      key={circle.id}
                      circle={circle}
                      members={allMembers.filter(m => (circle.memberIds || []).includes(m.id))}
                      onUpdateName={(newName) => updateCircleName(circle.id, newName)}
                      onDelete={() => deleteCircle(circle.id)}
                      onSetCaptain={(memberId) => setCaptain(circle.id, memberId)}
                      onEmail={() => {
                        setSelectedCircle(circle);
                        setShowEmailModal(true);
                      }}
                      onAddMembers={() => {
                        setSelectedCircle(circle);
                        setShowAddMembersModal(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </SortableContext>
        <DragOverlay>
          {activeMember && <DraggableMemberOverlay member={activeMember} />}
        </DragOverlay>
      </DndContext>

      {showEmailModal && selectedCircle && (
        <EmailCircleModal
          circle={selectedCircle}
          members={allMembers.filter(m => (selectedCircle.memberIds || []).includes(m.id))}
          onClose={() => {
            setShowEmailModal(false);
            setSelectedCircle(null);
          }}
        />
      )}

      {showAddMembersModal && selectedCircle && (
        <AddMembersModal
          circle={selectedCircle}
          availableMembers={filteredMembers.length > 0 ? filteredMembers : availableMembers}
          onClose={() => {
            setShowAddMembersModal(false);
            setSelectedCircle(null);
          }}
          onAddMembers={(memberIds) => addMembersToCircle(selectedCircle.id, memberIds)}
        />
      )}
    </div>
  );
}