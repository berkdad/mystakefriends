import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Heart, LogOut, User, Calendar, MessageSquare, Users, Edit2 } from 'lucide-react';
import MemberProfileModal from './MemberProfileModal';
import EditMyProfileModal from './EditMyProfileModal';
import CircleChatView from './CircleChatView';
import CircleEventsView from './CircleEventsView';

export default function MemberDashboard({ user, userData, auth, db, storage, isAdmin = false, onSwitchToAdmin }) {
  const [activeTab, setActiveTab] = useState('circle');
  const [circleData, setCircleData] = useState(null);
  const [circleMembers, setCircleMembers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [myMemberProfile, setMyMemberProfile] = useState(null);

  // Debug logging
  console.log('MemberDashboard - isAdmin:', isAdmin);
  console.log('MemberDashboard - onSwitchToAdmin:', onSwitchToAdmin);
  console.log('MemberDashboard - userRole:', userData?.role);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('=== MEMBER DASHBOARD DEBUG START ===');
      console.log('User email:', user.email);
      console.log('User UID:', user.uid);
      console.log('userData:', userData);
      console.log('userData.stakeId:', userData.stakeId);
      console.log('userData.wardId:', userData.wardId);

      if (!userData.wardId) {
        console.log('No wardId found for user. Searching all wards for member profile...');

        // Search all wards for this user's member profile
        const wardsSnapshot = await getDocs(collection(db, 'stakes', userData.stakeId, 'wards'));
        console.log('Total wards found:', wardsSnapshot.size);

        for (const wardDoc of wardsSnapshot.docs) {
          console.log(`Searching ward: ${wardDoc.id} (${wardDoc.data().name})`);
          const membersQuery = query(
            collection(db, 'stakes', userData.stakeId, 'wards', wardDoc.id, 'members'),
            where('email', '==', user.email)
          );
          const membersSnapshot = await getDocs(membersQuery);
          console.log(`  Members found with email ${user.email}:`, membersSnapshot.size);

          if (!membersSnapshot.empty) {
            const foundMember = membersSnapshot.docs[0];
            console.log('  FOUND MEMBER!', foundMember.id, foundMember.data());

            // Found the member! Update userData.wardId for this session AND in Firestore
            userData.wardId = wardDoc.id;
            console.log(`Found member profile in ward: ${wardDoc.id}, updating user document...`);

            // Permanently update the user's document so we don't have to search again
            try {
              const userDocRef = doc(db, 'users', user.uid);
              await updateDoc(userDocRef, {
                wardId: wardDoc.id,
                memberWardId: wardDoc.id,
                updatedAt: new Date().toISOString()
              });
              console.log('User document updated successfully');
            } catch (updateError) {
              console.error('Error updating user document:', updateError);
            }

            break;
          }
        }

        if (!userData.wardId) {
          console.log('Member profile not found in any ward.');
          console.log('=== MEMBER DASHBOARD DEBUG END (NO WARD) ===');
          setLoading(false);
          return;
        }
      }

      console.log('Using wardId:', userData.wardId);

      // Find member's profile document
      const membersQuery = query(
        collection(db, 'stakes', userData.stakeId, 'wards', userData.wardId, 'members'),
        where('email', '==', user.email)
      );
      const membersSnapshot = await getDocs(membersQuery);
      console.log('Member profile search results:', membersSnapshot.size);

      if (membersSnapshot.empty) {
        console.error('Member profile not found in ward:', userData.wardId);
        console.log('=== MEMBER DASHBOARD DEBUG END (NO MEMBER) ===');
        setLoading(false);
        return;
      }

      const memberDoc = membersSnapshot.docs[0];
      const memberProfile = { id: memberDoc.id, ...memberDoc.data() };
      console.log('Member profile loaded:', memberDoc.id, memberProfile);
      setMyMemberProfile(memberProfile);

      // Find the circle this member belongs to
      const circlesQuery = query(
        collection(db, 'stakes', userData.stakeId, 'wards', userData.wardId, 'circles')
      );
      const circlesSnapshot = await getDocs(circlesQuery);
      console.log('Total circles in ward:', circlesSnapshot.size);

      let myCircle = null;
      circlesSnapshot.docs.forEach(circleDoc => {
        const circleData = circleDoc.data();
        console.log(`Circle "${circleData.name}" (${circleDoc.id}):`, circleData.memberIds);
        console.log(`  Does it include member ${memberDoc.id}?`, (circleData.memberIds || []).includes(memberDoc.id));

        if ((circleData.memberIds || []).includes(memberDoc.id)) {
          myCircle = { id: circleDoc.id, ...circleData };
          console.log('  ✓ FOUND MY CIRCLE!');
        }
      });

      if (!myCircle) {
        console.log('❌ Member not assigned to any circle yet');
        console.log('Member ID:', memberDoc.id);
        console.log('All circles checked, none contain this member ID');
        console.log('=== MEMBER DASHBOARD DEBUG END (NO CIRCLE) ===');
        setLoading(false);
        return;
      }

      console.log('✓ Circle found:', myCircle.name);
      console.log('=== MEMBER DASHBOARD DEBUG END (SUCCESS) ===');

      setCircleData(myCircle);

      // Load all members in the circle
      const allMembersQuery = query(
        collection(db, 'stakes', userData.stakeId, 'wards', userData.wardId, 'members')
      );
      const allMembersSnapshot = await getDocs(allMembersQuery);
      const allMembers = allMembersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const circleMembersList = allMembers.filter(m =>
        (myCircle.memberIds || []).includes(m.id)
      );
      setCircleMembers(circleMembersList);

      // Load recent chats (last 5)
      const chatsQuery = query(
        collection(db, 'stakes', userData.stakeId, 'wards', userData.wardId, 'circles', myCircle.id, 'chats'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const chatsSnapshot = await getDocs(chatsQuery);
      setRecentChats(chatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load upcoming events (future events only)
      const now = new Date().toISOString();
      const eventsQuery = query(
        collection(db, 'stakes', userData.stakeId, 'wards', userData.wardId, 'circles', myCircle.id, 'events'),
        where('eventDate', '>=', now),
        orderBy('eventDate', 'asc'),
        limit(5)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      setUpcomingEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50 flex items-center justify-center">
        <div className="text-rose-600 flex items-center gap-2">
          <Heart className="animate-pulse" />
          <span className="text-lg">Loading your circle...</span>
        </div>
      </div>
    );
  }

  if (!userData.wardId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50">
        <header className="bg-white shadow-sm border-b border-rose-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-rose-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">My Stake Friends</h1>
                  <p className="text-sm text-gray-500">Welcome, {user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin && onSwitchToAdmin && (
                  <button
                    onClick={onSwitchToAdmin}
                    className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
                  >
                    <Users className="w-4 h-4" />
                    Back to Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Not Set Up as a Member Yet</h2>
            <p className="text-gray-600 mb-4">
              To view your member dashboard, you need to be added as a member to a specific ward first.
            </p>
            <p className="text-sm text-gray-500">
              As a {userData.role === 'stakeAdmin' ? 'Stake' : 'Ward'} Administrator, you can switch back to your admin view using the button above,
              or ask another administrator to add you as a member to a ward so you can participate in a circle.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!circleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50">
        <header className="bg-white shadow-sm border-b border-rose-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-8 h-8 text-rose-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">My Stake Friends</h1>
                  <p className="text-sm text-gray-500">Welcome, {myMemberProfile?.fullName || user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin && onSwitchToAdmin && (
                  <button
                    onClick={onSwitchToAdmin}
                    className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
                  >
                    <Users className="w-4 h-4" />
                    Back to Admin
                  </button>
                )}
                <button
                  onClick={() => setShowEditProfileModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                >
                  <Edit2 className="w-4 h-4" />
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Not in a Circle Yet</h2>
            <p className="text-gray-600 mb-6">
              You haven't been assigned to a friendship circle yet. Please contact your ward administrator.
            </p>
            <button
              onClick={() => setShowEditProfileModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
              Complete Your Profile
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Get your profile ready so your circle members can get to know you!
            </p>
          </div>
        </main>
        {showEditProfileModal && myMemberProfile && (
          <EditMyProfileModal
            member={myMemberProfile}
            stakeId={userData.stakeId}
            wardId={userData.wardId}
            db={db}
            storage={storage}
            onClose={() => setShowEditProfileModal(false)}
            onSave={() => {
              setShowEditProfileModal(false);
              loadDashboardData();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50">
      <header className="bg-white shadow-sm border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Stake Friends</h1>
                <p className="text-sm text-gray-500">{circleData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && onSwitchToAdmin && (
                <button
                  onClick={onSwitchToAdmin}
                  className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
                >
                  <Users className="w-4 h-4" />
                  Back to Admin
                </button>
              )}
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
              >
                <Edit2 className="w-4 h-4" />
                My Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setActiveTab('circle')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'circle'
                ? 'bg-rose-500 border-rose-600 text-white'
                : 'bg-white border-rose-100 text-gray-800 hover:border-rose-300'
            }`}
          >
            <Users className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'circle' ? 'text-white' : 'text-rose-500'}`} />
            <h3 className="text-xl font-semibold mb-1">My Circle</h3>
            <p className={`text-sm ${activeTab === 'circle' ? 'text-rose-100' : 'text-gray-600'}`}>
              {circleMembers.length} members
            </p>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'chat'
                ? 'bg-blue-500 border-blue-600 text-white'
                : 'bg-white border-blue-100 text-gray-800 hover:border-blue-300'
            }`}
          >
            <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'chat' ? 'text-white' : 'text-blue-500'}`} />
            <h3 className="text-xl font-semibold mb-1">Chat</h3>
            <p className={`text-sm ${activeTab === 'chat' ? 'text-blue-100' : 'text-gray-600'}`}>
              {recentChats.length} recent
            </p>
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'events'
                ? 'bg-green-500 border-green-600 text-white'
                : 'bg-white border-green-100 text-gray-800 hover:border-green-300'
            }`}
          >
            <Calendar className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'events' ? 'text-white' : 'text-green-500'}`} />
            <h3 className="text-xl font-semibold mb-1">Events</h3>
            <p className={`text-sm ${activeTab === 'events' ? 'text-green-100' : 'text-gray-600'}`}>
              {upcomingEvents.length} upcoming
            </p>
          </button>
        </div>

        {activeTab === 'circle' && (
          <div className="bg-white rounded-xl shadow-md border border-rose-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Circle Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {circleMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => {
                    setSelectedMember(member);
                    setShowProfileModal(true);
                  }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all text-left hover:border-rose-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    {member.profilePicUrl ? (
                      <img
                        src={member.profilePicUrl}
                        alt={member.fullName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-rose-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center border-2 border-rose-200">
                        <User className="w-8 h-8 text-rose-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{member.fullName}</h3>
                      {member.preferredName && member.preferredName !== member.fullName && (
                        <p className="text-sm text-gray-500 italic truncate">"{member.preferredName}"</p>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {member.aboutMe || 'Click to view profile'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <CircleChatView
            db={db}
            storage={storage}
            stakeId={userData.stakeId}
            wardId={userData.wardId}
            circleId={circleData.id}
            currentMemberId={myMemberProfile.id}
            currentMemberName={myMemberProfile.fullName}
            circleMembers={circleMembers}
          />
        )}

        {activeTab === 'events' && (
          <CircleEventsView
            db={db}
            storage={storage}
            stakeId={userData.stakeId}
            wardId={userData.wardId}
            circleId={circleData.id}
            currentMemberId={myMemberProfile.id}
            currentMemberName={myMemberProfile.fullName}
            circleMembers={circleMembers}
          />
        )}
      </main>

      {showProfileModal && selectedMember && (
        <MemberProfileModal
          member={selectedMember}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedMember(null);
          }}
        />
      )}

      {showEditProfileModal && myMemberProfile && (
        <EditMyProfileModal
          member={myMemberProfile}
          stakeId={userData.stakeId}
          wardId={userData.wardId}
          db={db}
          storage={storage}
          onClose={() => setShowEditProfileModal(false)}
          onSave={() => {
            setShowEditProfileModal(false);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}