import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, addDoc, query, getDocs, updateDoc, deleteDoc, where, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Heart, Users, Building2, LogOut, Plus, Edit2, Trash2, UserPlus, Target, FileText, Mail, Phone, MapPin, Calendar, User, Baby, Globe, Upload, Download, Filter, Send, Camera, ArrowRightLeft } from 'lucide-react';
import TransferMemberModal from './components/member/TransferMemberModal';
import * as XLSX from 'xlsx';
import CircleManager from './components/circles/CircleManager';
import MemberDashboard from './components/member/MemberDashboard';
import QuickAddMemberModal from './components/member/QuickAddMemberModal';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivacyPolicy from './components/PrivacyPolicy';


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBGm_Qvm3DjBSOtTUePB_jKIFtwY_kEHq0",
  authDomain: "mystakefriends.firebaseapp.com",
  projectId: "mystakefriends",
  storageBucket: "mystakefriends.firebasestorage.app",
  messagingSenderId: "18358580651",
  appId: "1:18358580651:web:0f8a9fbbe5850a3c880eee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);


// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('admin');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role);
          setUserData(data);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50 flex items-center justify-center">
        <div className="text-rose-600 flex items-center gap-2">
          <Heart className="animate-pulse" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  return (
      <Router>
        <Routes>
          {/* Privacy Policy Route - accessible at /privacy */}
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Main App Route */}
          <Route path="*" element={
            <>
              {loading ? (
                <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50 flex items-center justify-center">
                  <div className="text-rose-600 flex items-center gap-2">
                    <Heart className="animate-pulse" />
                    <span className="text-lg">Loading...</span>
                  </div>
                </div>
              ) : !user ? (
                <LoginPage />
              ) : userRole === 'superAdmin' ? (
                <SuperAdminDashboard user={user} />
              ) : userRole === 'wardAdmin' ? (
                viewMode === 'member' ? (
                  <MemberDashboard
                    user={user}
                    userData={userData}
                    auth={auth}
                    db={db}
                    storage={storage}
                    isAdmin={true}
                    onSwitchToAdmin={() => setViewMode('admin')}
                  />
                ) : (
                  <WardAdminDashboard
                    user={user}
                    userData={userData}
                    onSwitchToMember={() => setViewMode('member')}
                  />
                )
              ) : userRole === 'stakeAdmin' ? (
                viewMode === 'member' ? (
                  <MemberDashboard
                    user={user}
                    userData={userData}
                    auth={auth}
                    db={db}
                    storage={storage}
                    isAdmin={true}
                    onSwitchToAdmin={() => setViewMode('admin')}
                  />
                ) : (
                  <StakeAdminDashboard
                    user={user}
                    userData={userData}
                    onSwitchToMember={() => setViewMode('member')}
                  />
                )
              ) : userRole === 'member' ? (
                <MemberDashboard user={user} userData={userData} auth={auth} db={db} storage={storage} />
              ) : (
                <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50 p-8">
                  <div className="max-w-2xl mx-auto text-center">
                    <Heart className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">Welcome to My Stake Friends</h1>
                    <p className="text-gray-600">Your dashboard will be available soon.</p>
                  </div>
                </div>
              )}
            </>
          } />
        </Routes>
      </Router>
    );
  }

// Manage Admins Modal Component
function ManageAdminsModal({ title, admins, onClose, onSave, stakeId, wardId, stakeName, wardName, isWardAdmin = false, wards = [] }) {
  const [adminList, setAdminList] = useState([...admins]);
  const [adminStatuses, setAdminStatuses] = useState({});
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Load admin statuses on mount
  useEffect(() => {
    loadAdminStatuses();
  }, [adminList]);

  const loadAdminStatuses = async () => {
    setLoading(true);
    try {
      const statuses = {};

      // Query users collection for each admin email
      for (const email of adminList) {
        console.log('Checking status for:', email);
        const usersQuery = query(
          collection(db, 'users'),
          where('email', '==', email)
        );
        const usersSnapshot = await getDocs(usersQuery);

        console.log('Found user docs:', usersSnapshot.size, 'for email:', email);

        if (!usersSnapshot.empty) {
          const userData = usersSnapshot.docs[0].data();
          console.log('User data:', userData);
          // Only active if they have explicitly logged in
          statuses[email] = userData.hasLoggedIn === true ? 'active' : 'pending';
        } else {
          statuses[email] = 'pending'; // No user account yet
        }
      }

      console.log('Final statuses:', statuses);
      setAdminStatuses(statuses);
    } catch (error) {
      console.error('Error loading admin statuses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = () => {
    if (newAdminEmail && !adminList.includes(newAdminEmail)) {
      setAdminList([...adminList, newAdminEmail]);
      setNewAdminEmail('');
      setSelectedWardId('');
    }
  };

  const handleRemoveAdmin = (email) => {
    setAdminList(adminList.filter(admin => admin !== email));
  };

  const handleInviteAdmin = async (email) => {
    setInviting(true);
    setInviteStatus('');

    try {
      const inviteAdmin = httpsCallable(functions, 'inviteAdmin');
      const payload = {
        email,
        role: isWardAdmin ? 'wardAdmin' : 'stakeAdmin',
        stakeId,
        stakeName,
      };

      if (isWardAdmin) {
        // Ward admin: wardId is their admin responsibility
        payload.wardId = wardId;
        payload.wardName = wardName;
      } else {
        // Stake admin: memberWardId is optional (not all stake admins participate as members)
        if (selectedWardId) {
          payload.memberWardId = selectedWardId;
          const selectedWard = wards.find(w => w.id === selectedWardId);
          payload.wardName = selectedWard?.name;
        }
      }

      const result = await inviteAdmin(payload);

      setInviteStatus(`✓ Invitation sent to ${email}`);
      setTimeout(() => setInviteStatus(''), 3000);

      // Reload statuses after sending invite
      loadAdminStatuses();
    } catch (error) {
      console.error('Error inviting admin:', error);
      setInviteStatus(`✗ Error: ${error.message}`);
      setTimeout(() => setInviteStatus(''), 5000);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>

        {inviteStatus && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            inviteStatus.startsWith('✓')
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {inviteStatus}
          </div>
        )}

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Admins</label>
            {adminList.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No admins assigned yet</p>
            ) : loading ? (
              <p className="text-sm text-gray-500 italic">Loading admin statuses...</p>
            ) : (
              <div className="space-y-2">
                {adminList.map((email, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-gray-700">{email}</span>
                      {adminStatuses[email] === 'active' ? (
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {adminStatuses[email] !== 'active' && (
                        <button
                          onClick={() => handleInviteAdmin(email)}
                          disabled={inviting}
                          className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          title="Send invitation"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveAdmin(email)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title="Remove admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add New Admin</label>
            <div className="space-y-2">
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAddAdmin()}
                placeholder="admin@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              {!isWardAdmin && wards && wards.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Which ward are they a member of? (Optional)
                  </label>
                  <select
                    value={selectedWardId}
                    onChange={(e) => setSelectedWardId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select a ward (optional)...</option>
                    {wards.map(ward => (
                      <option key={ward.id} value={ward.id}>{ward.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Stake admins manage all wards. Ward membership is optional.
                  </p>
                </div>
              )}

              <button
                onClick={handleAddAdmin}
                disabled={!newAdminEmail}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add to List
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Add the email first, then click the <Send className="w-3 h-3 inline" /> icon to send the invitation
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(adminList)}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save Admins
          </button>
        </div>
      </div>
    </div>
  );
}

// Login Page Component
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Update hasLoggedIn to true
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await updateDoc(userDocRef, {
        hasLoggedIn: true,
        lastLoginAt: new Date().toISOString()
      });

    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-rose-200">
        <div className="text-center mb-8">
          <Heart className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Stake Friends</h1>
          <p className="text-gray-600 italic">"Hearts Knit in Unity"</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-rose-500 text-white py-2 rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Stake Admin Dashboard Component
function StakeAdminDashboard({ user, userData, onSwitchToMember }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [selectedWard, setSelectedWard] = useState('all');
  const [wards, setWards] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [stakeInfo, setStakeInfo] = useState(null);
  const [showStakeAdminModal, setShowStakeAdminModal] = useState(false);
  const [showWardAdminModal, setShowWardAdminModal] = useState(false);
  const [selectedWardForAdmin, setSelectedWardForAdmin] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [memberToTransfer, setMemberToTransfer] = useState(null);

  useEffect(() => {
    loadStakeData();
  }, []);

  const loadStakeData = async () => {
    try {
      // Load stake info
      const stakeDoc = await getDoc(doc(db, 'stakes', userData.stakeId));
      if (stakeDoc.exists()) {
        setStakeInfo({ id: stakeDoc.id, ...stakeDoc.data() });
      }

      // Load all wards
      const wardsQuery = query(collection(db, 'stakes', userData.stakeId, 'wards'));
      const wardsSnapshot = await getDocs(wardsQuery);
      const wardsData = wardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWards(wardsData);

      // Load all members from all wards
      const allMembers = [];
      for (const ward of wardsData) {
        const membersQuery = query(
          collection(db, 'stakes', userData.stakeId, 'wards', ward.id, 'members')
        );
        const membersSnapshot = await getDocs(membersQuery);
        membersSnapshot.docs.forEach(doc => {
          allMembers.push({
            id: doc.id,
            wardId: ward.id,
            wardName: ward.name,
            ...doc.data()
          });
        });
      }
      setMembers(allMembers);

      // Count all circles from all wards
      let circleCount = 0;
      for (const ward of wardsData) {
        const circlesQuery = query(
          collection(db, 'stakes', userData.stakeId, 'wards', ward.id, 'circles')
        );
        const circlesSnapshot = await getDocs(circlesQuery);
        circleCount += circlesSnapshot.size;
      }
      setTotalCircles(circleCount);

    } catch (error) {
      console.error('Error loading stake data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = (selectedWard === 'all'
    ? members
    : members.filter(m => m.wardId === selectedWard)
  ).sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

  const handleLogout = async () => {
    await signOut(auth);
  };

  const [totalCircles, setTotalCircles] = useState(0);

  const inviteMember = async (member) => {
    try {
      const inviteMemberFunc = httpsCallable(functions, 'inviteMember');
      const result = await inviteMemberFunc({
        email: member.email,
        memberName: member.fullName,
        memberId: member.id,
        stakeId: userData.stakeId,
        wardId: member.wardId || userData.wardId,
        stakeName: stakeInfo?.name,
        wardName: member.wardName || wardInfo?.name
      });

      alert(`Invitation sent to ${member.email}`);
      loadWardData(); // or loadStakeData() depending on which dashboard
    } catch (error) {
      console.error('Error inviting member:', error);
      alert(`Failed to send invitation: ${error.message}`);
    }
  };

  const inviteAllMembers = async () => {
    const uninvitedMembers = members.filter(m =>
      m.email &&
      m.email.trim() !== '' &&
      !m.hasLoggedIn
    );

    if (uninvitedMembers.length === 0) {
      alert('No members to invite. All members with emails have already been invited.');
      return;
    }

    if (!confirm(`Send invitations to ${uninvitedMembers.length} member(s)?`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const member of uninvitedMembers) {
      try {
        const inviteMemberFunc = httpsCallable(functions, 'inviteMember');
        await inviteMemberFunc({
          email: member.email,
          memberName: member.fullName,
          memberId: member.id,
          stakeId: userData.stakeId,
          wardId: member.wardId || userData.wardId,
          stakeName: stakeInfo?.name,
          wardName: member.wardName || wardInfo?.name
        });
        successCount++;
      } catch (error) {
        console.error(`Error inviting ${member.email}:`, error);
        failCount++;
      }
    }

    alert(`Invitations sent!\nSuccess: ${successCount}\nFailed: ${failCount}`);
    loadStakeData();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Stake Friends</h1>
                <p className="text-sm text-gray-500">{stakeInfo?.name || 'Stake Administrator'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* NEW: Switch to Member View button */}
              <button
                onClick={onSwitchToMember}
                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
              >
                <Users className="w-4 h-4" />
                My Dashboard
              </button>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">View Ward:</label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="text-sm font-medium text-gray-800 border border-gray-300 focus:ring-2 focus:ring-rose-500 rounded px-3 py-2"
                >
                  <option value="all">All Wards</option>
                  {wards.map(ward => (
                    <option key={ward.id} value={ward.id}>{ward.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowStakeAdminModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <UserPlus className="w-4 h-4" />
                Stake Admins
              </button>

              {selectedWard !== 'all' && (
                <button
                  onClick={() => {
                    setSelectedWardForAdmin(wards.find(w => w.id === selectedWard));
                    setShowWardAdminModal(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                >
                  <UserPlus className="w-4 h-4" />
                  Ward Admins
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setActiveTab('friends')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'friends'
                ? 'bg-rose-500 border-rose-600 text-white'
                : 'bg-white border-rose-100 text-gray-800 hover:border-rose-300'
            }`}
          >
            <Users className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'friends' ? 'text-white' : 'text-rose-500'}`} />
            <h3 className="text-xl font-semibold mb-1">Friends</h3>
            <p className={`text-sm ${activeTab === 'friends' ? 'text-rose-100' : 'text-gray-600'}`}>
              {filteredMembers.length} members
            </p>
          </button>

          <button
            onClick={() => setActiveTab('circles')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'circles'
                ? 'bg-green-500 border-green-600 text-white'
                : 'bg-white border-green-100 text-gray-800 hover:border-green-300'
            }`}
          >
            <Target className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'circles' ? 'text-white' : 'text-green-500'}`} />
            <h3 className="text-xl font-semibold mb-1">Circles</h3>
            <p className={`text-sm ${activeTab === 'circles' ? 'text-green-100' : 'text-gray-600'}`}>
              {totalCircles} active circles
            </p>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'reports'
                ? 'bg-amber-500 border-amber-600 text-white'
                : 'bg-white border-amber-100 text-gray-800 hover:border-amber-300'
            }`}
          >
            <FileText className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'reports' ? 'text-white' : 'text-amber-500'}`} />
            <h3 className="text-xl font-semibold mb-1">Reports</h3>
            <p className={`text-sm ${activeTab === 'reports' ? 'text-amber-100' : 'text-gray-600'}`}>
              View analytics
            </p>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'friends' && (
          <FriendsTab
            members={filteredMembers}
            onAddMember={() => setShowMemberModal(true)}
            onUploadRoster={selectedWard !== 'all' ? () => setShowUploadModal(true) : undefined}
            onEditMember={(member) => {
              setSelectedMember(member);
              setShowMemberModal(true);
            }}
            onDeleteMember={async (member) => {
              if (confirm('Are you sure you want to delete this member?')) {
                await deleteDoc(doc(db, 'stakes', userData.stakeId, 'wards', member.wardId, 'members', member.id));
                loadStakeData();
              }
            }}
            onInviteMember={inviteMember}
            onInviteAll={inviteAllMembers}
            onTransfer={(member) => {
              setMemberToTransfer(member);
              setShowTransferModal(true);
            }}
            showWardColumn={selectedWard === 'all'}
          />
        )}

        {activeTab === 'circles' && selectedWard !== 'all' && (
          <CircleManager
            db={db}
            stakeId={userData.stakeId}
            wardId={selectedWard}
            wardName={wards.find(w => w.id === selectedWard)?.name}
          />
        )}

        {activeTab === 'circles' && selectedWard === 'all' && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Select a Ward</h3>
            <p className="text-gray-600">Please select a specific ward from the "Viewing" dropdown to manage circles.</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Stake Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-rose-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Members</p>
                <p className="text-3xl font-bold text-rose-600">{members.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Wards</p>
                <p className="text-3xl font-bold text-green-600">{wards.length}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Active Users</p>
                <p className="text-3xl font-bold text-amber-600">
                  {members.filter(m => m.hasLoggedIn).length}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Pending Invites</p>
                <p className="text-3xl font-bold text-blue-600">
                  {members.filter(m => !m.hasLoggedIn).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Member Modal - Note: This won't work for adding since we need wardId */}
      {showMemberModal && !selectedMember && (
        <QuickAddMemberModal
          stakeId={userData.stakeId}
          wardId={selectedWard !== 'all' ? selectedWard : null}
          wards={selectedWard === 'all' ? wards : undefined}
          db={db}
          onClose={() => setShowMemberModal(false)}
          onSave={() => {
            setShowMemberModal(false);
            loadStakeData();
          }}
        />
      )}

      {showMemberModal && selectedMember && (
        <MemberModal
          member={selectedMember}
          stakeId={userData.stakeId}
          wardId={selectedMember.wardId}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
          }}
          onSave={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
            loadStakeData();
          }}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedWard !== 'all' && (
        <UploadRosterModal
          stakeId={userData.stakeId}
          wardId={selectedWard}
          onClose={() => setShowUploadModal(false)}
          onComplete={() => {
            setShowUploadModal(false);
            loadStakeData();
          }}
        />
      )}
      {/* Stake Admin Modal */}
      {showStakeAdminModal && (
        <ManageAdminsModal
          title={`Manage Stake Admins - ${stakeInfo?.name}`}
          admins={stakeInfo?.stakeAdmins || []}
          stakeId={userData.stakeId}
          stakeName={stakeInfo?.name}
          wards={wards}
          onClose={() => setShowStakeAdminModal(false)}
          onSave={async (newAdmins) => {
            await updateDoc(doc(db, 'stakes', userData.stakeId), {
              stakeAdmins: newAdmins,
              updatedAt: new Date().toISOString()
            });
            setShowStakeAdminModal(false);
            loadStakeData();
          }}
        />
      )}

      {/* Ward Admin Modal */}
      {showWardAdminModal && selectedWardForAdmin && (
        <ManageAdminsModal
          title={`Manage Ward Admins - ${selectedWardForAdmin.name}`}
          admins={selectedWardForAdmin.wardAdmins || []}
          stakeId={userData.stakeId}
          wardId={selectedWardForAdmin.id}
          stakeName={stakeInfo?.name}
          wardName={selectedWardForAdmin.name}
          isWardAdmin={true}
          onClose={() => {
            setShowWardAdminModal(false);
            setSelectedWardForAdmin(null);
          }}
          onSave={async (newAdmins) => {
            await updateDoc(doc(db, 'stakes', userData.stakeId, 'wards', selectedWardForAdmin.id), {
              wardAdmins: newAdmins,
              updatedAt: new Date().toISOString()
            });
            setShowWardAdminModal(false);
            setSelectedWardForAdmin(null);
            loadStakeData();
          }}
        />
      )}

      {showTransferModal && memberToTransfer && (
        <TransferMemberModal
          member={memberToTransfer}
          currentWard={wards.find(w => w.id === memberToTransfer.wardId)}
          wards={wards}
          stakeId={userData.stakeId}
          db={db}
          onClose={() => {
            setShowTransferModal(false);
            setMemberToTransfer(null);
          }}
          onComplete={() => {
            setShowTransferModal(false);
            setMemberToTransfer(null);
            loadStakeData();
          }}
        />
      )}
    </div>
  );
}

// Ward Admin Dashboard Component
function WardAdminDashboard({ user, userData, onSwitchToMember }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [wardInfo, setWardInfo] = useState(null);
  const [totalCircles, setTotalCircles] = useState(0);
  const [showWardAdminModal, setShowWardAdminModal] = useState(false);
  const [stakeInfo, setStakeInfo] = useState(null);

  useEffect(() => {
    loadWardData();
  }, []);

  const loadWardData = async () => {
    try {
      // Load stake info
      const stakeDoc = await getDoc(doc(db, 'stakes', userData.stakeId));
      if (stakeDoc.exists()) {
        setStakeInfo({ id: stakeDoc.id, ...stakeDoc.data() });
      }

      // Load ward info
      const wardDoc = await getDoc(doc(db, 'stakes', userData.stakeId, 'wards', userData.wardId));
      if (wardDoc.exists()) {
        setWardInfo({ id: wardDoc.id, ...wardDoc.data() });
      }

      // Load members
      const membersQuery = query(
        collection(db, 'stakes', userData.stakeId, 'wards', userData.wardId, 'members')
      );
      const membersSnapshot = await getDocs(membersQuery);
      setMembers(membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Load circles count
      const circlesQuery = query(
        collection(db, 'stakes', userData.stakeId, 'wards', userData.wardId, 'circles')
      );
      const circlesSnapshot = await getDocs(circlesQuery);
      setTotalCircles(circlesSnapshot.size);
    } catch (error) {
      console.error('Error loading ward data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const inviteMember = async (member) => {
    try {
      const inviteMemberFunc = httpsCallable(functions, 'inviteMember');
      const result = await inviteMemberFunc({
        email: member.email,
        memberName: member.fullName,
        memberId: member.id,
        stakeId: userData.stakeId,
        wardId: member.wardId || userData.wardId,
        stakeName: stakeInfo?.name,
        wardName: member.wardName || wardInfo?.name
      });

      alert(`Invitation sent to ${member.email}`);
      loadWardData(); // or loadStakeData() depending on which dashboard
    } catch (error) {
      console.error('Error inviting member:', error);
      alert(`Failed to send invitation: ${error.message}`);
    }
  };

  const inviteAllMembers = async () => {
    const uninvitedMembers = members.filter(m =>
      m.email &&
      m.email.trim() !== '' &&
      !m.hasLoggedIn
    );

    if (uninvitedMembers.length === 0) {
      alert('No members to invite. All members with emails have already been invited.');
      return;
    }

    if (!confirm(`Send invitations to ${uninvitedMembers.length} member(s)?`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const member of uninvitedMembers) {
      try {
        const inviteMemberFunc = httpsCallable(functions, 'inviteMember');
        await inviteMemberFunc({
          email: member.email,
          memberName: member.fullName,
          memberId: member.id,
          stakeId: userData.stakeId,
          wardId: member.wardId || userData.wardId,
          stakeName: stakeInfo?.name,
          wardName: member.wardName || wardInfo?.name
        });
        successCount++;
      } catch (error) {
        console.error(`Error inviting ${member.email}:`, error);
        failCount++;
      }
    }

    alert(`Invitations sent!\nSuccess: ${successCount}\nFailed: ${failCount}`);
    loadWardData(); // or loadStakeData() depending on which dashboard
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">MyStakeFriends</h1>
                <p className="text-sm text-gray-500">{wardInfo?.name || 'Ward Administrator'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* NEW: Switch to Member View button */}
              <button
                onClick={onSwitchToMember}
                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
              >
                <Users className="w-4 h-4" />
                My Dashboard
              </button>

              <button
                onClick={() => setShowWardAdminModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <UserPlus className="w-4 h-4" />
                Manage Ward Admins
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setActiveTab('friends')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'friends'
                ? 'bg-rose-500 border-rose-600 text-white'
                : 'bg-white border-rose-100 text-gray-800 hover:border-rose-300'
            }`}
          >
            <Users className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'friends' ? 'text-white' : 'text-rose-500'}`} />
            <h3 className="text-xl font-semibold mb-1">Friends</h3>
            <p className={`text-sm ${activeTab === 'friends' ? 'text-rose-100' : 'text-gray-600'}`}>
              {members.length} members
            </p>
          </button>

          <button
            onClick={() => setActiveTab('circles')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'circles'
                ? 'bg-green-500 border-green-600 text-white'
                : 'bg-white border-green-100 text-gray-800 hover:border-green-300'
            }`}
          >
            <Target className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'circles' ? 'text-white' : 'text-green-500'}`} />
            <h3 className="text-xl font-semibold mb-1">Circles</h3>
            <p className={`text-sm ${activeTab === 'circles' ? 'text-green-100' : 'text-gray-600'}`}>
              {totalCircles} active circle{totalCircles !== 1 ? 's' : ''}
            </p>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'reports'
                ? 'bg-amber-500 border-amber-600 text-white'
                : 'bg-white border-amber-100 text-gray-800 hover:border-amber-300'
            }`}
          >
            <FileText className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'reports' ? 'text-white' : 'text-amber-500'}`} />
            <h3 className="text-xl font-semibold mb-1">Reports</h3>
            <p className={`text-sm ${activeTab === 'reports' ? 'text-amber-100' : 'text-gray-600'}`}>
              View analytics
            </p>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'friends' && (
          <FriendsTab
            members={members.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''))}
            onAddMember={() => setShowMemberModal(true)}
            onUploadRoster={() => setShowUploadModal(true)}
            onEditMember={(member) => {
              setSelectedMember(member);
              setShowMemberModal(true);
            }}
            onDeleteMember={async (memberId) => {
              if (confirm('Are you sure you want to delete this member?')) {
                await deleteDoc(doc(db, 'stakes', userData.stakeId, 'wards', userData.wardId, 'members', memberId));
                loadWardData();
              }
            }}
            onInviteMember={inviteMember}
            onInviteAll={inviteAllMembers}
          />
        )}

        {activeTab === 'circles' && (
          <CircleManager
            db={db}
            stakeId={userData.stakeId}
            wardId={userData.wardId}
            wardName={wardInfo?.name}
          />
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Reports Coming Soon</h3>
            <p className="text-gray-600">View engagement and activity reports here.</p>
          </div>
        )}
      </main>

      {/* Member Modal */}
      {showMemberModal && !selectedMember && (
        <QuickAddMemberModal
          stakeId={userData.stakeId}
          wardId={userData.wardId}
          db={db}
          onClose={() => setShowMemberModal(false)}
          onSave={() => {
            setShowMemberModal(false);
            loadWardData();
          }}
        />
      )}

      {showMemberModal && selectedMember && (
        <MemberModal
          member={selectedMember}
          stakeId={userData.stakeId}
          wardId={userData.wardId}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
          }}
          onSave={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
            loadWardData();
          }}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadRosterModal
          stakeId={userData.stakeId}
          wardId={userData.wardId}
          onClose={() => setShowUploadModal(false)}
          onComplete={() => {
            setShowUploadModal(false);
            loadWardData();
          }}
        />
      )}
      {/* Ward Admin Modal */}
      {showWardAdminModal && (
        <ManageAdminsModal
          title={`Manage Ward Admins - ${wardInfo?.name}`}
          admins={wardInfo?.wardAdmins || []}
          stakeId={userData.stakeId}
          wardId={userData.wardId}
          stakeName={stakeInfo?.name}
          wardName={wardInfo?.name}
          isWardAdmin={true}
          onClose={() => setShowWardAdminModal(false)}
          onSave={async (newAdmins) => {
            await updateDoc(doc(db, 'stakes', userData.stakeId, 'wards', userData.wardId), {
              wardAdmins: newAdmins,
              updatedAt: new Date().toISOString()
            });
            setShowWardAdminModal(false);
            loadWardData();
          }}
        />
      )}
    </div>
  );
}

// Upload Roster Modal Component
function UploadRosterModal({ stakeId, wardId, onClose, onComplete }) {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Fields, 3: Confirm
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fieldOptions = [
    { value: 'fullName', label: 'Full Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'address', label: 'Address' },
    { value: 'dob', label: 'Date of Birth' },
    { value: 'maritalStatus', label: 'Marital Status' },
    { value: 'numChildren', label: 'Has Children' },
    { value: 'ethnicity', label: 'Ethnicity' },
    { value: 'ignore', label: '-- Ignore this column --' }
  ];

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      processFile(uploadedFile);
    }
  };

  const processFile = async (uploadedFile) => {
    setFile(uploadedFile);
    setLoading(true);
    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      // Get ALL columns by reading the header row directly
      const range = XLSX.utils.decode_range(firstSheet['!ref']);
      const headerRow = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_col(col) + (range.s.r + 1);
        const cell = firstSheet[cellAddress];
        if (cell && cell.v) {
          headerRow.push(cell.v);
        }
      }

      // Now parse with defval to ensure all columns are included
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
        raw: false,
        dateNF: 'yyyy-mm-dd',
        defval: ''
      });

      if (jsonData.length === 0) {
        alert('The file appears to be empty');
        return;
      }

      // Use the headers we extracted from the first row
      const headers = headerRow.length > 0 ? headerRow : Object.keys(jsonData[0]);

      console.log('Headers found:', headers);
      console.log('First row data:', jsonData[0]);

      // Auto-map fields based on common names
      const autoMapping = {};
      headers.forEach(header => {
        const lower = header.toLowerCase().trim();

        // LCR specific mappings
        if (lower.includes('preferred name')) autoMapping[header] = 'fullName';
        else if (lower.includes('individual e-mail') || lower === 'email') autoMapping[header] = 'email';
        else if (lower.includes('individual phone') || lower === 'phone') autoMapping[header] = 'phone';
        else if (lower.includes('address - street')) autoMapping[header] = 'address';
        else if (lower.includes('birth date')) autoMapping[header] = 'dob';
        // Generic mappings
        else if (lower.includes('email') || lower.includes('mail')) autoMapping[header] = 'email';
        else if (lower.includes('phone') || lower.includes('cell') || lower.includes('mobile')) autoMapping[header] = 'phone';
        else if (lower.includes('name') || lower.includes('full')) autoMapping[header] = 'fullName';
        else if (lower.includes('address') || lower.includes('street')) autoMapping[header] = 'address';
        else if (lower.includes('birth') || lower.includes('dob') || lower.includes('birthday')) autoMapping[header] = 'dob';
        else if (lower.includes('ethnic') || lower.includes('culture') || lower.includes('background')) autoMapping[header] = 'ethnicity';
        // Ignore LCR columns we handle specially
        else if (lower.includes('is married') || lower.includes('is divorced') ||
                 lower.includes('is widowed') || lower.includes('is single') ||
                 lower.includes('has children') || lower.includes('child') ||
                 lower.includes('unit') ||
                 lower.includes('city') || lower.includes('postal') || lower.includes('state')) {
          autoMapping[header] = 'ignore';
        }
        else autoMapping[header] = 'ignore';
      });

      console.log('Auto-mapping result:', autoMapping);

      setFieldMapping(autoMapping);
      setPreviewData({ headers, rows: jsonData.slice(0, 5), allRows: jsonData });
      setStep(2);
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please make sure it\'s a valid CSV or Excel file.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert Excel date serial to YYYY-MM-DD
  const convertExcelDate = (value) => {
    if (!value) return '';

    // If it's a string, try to parse it
    if (typeof value === 'string') {
      const trimmed = value.trim();

      // Handle formats like "28-May-82" or "26-Dec-76"
      const match = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/);
      if (match) {
        const day = match[1];
        const monthStr = match[2];
        const yearShort = parseInt(match[3]);

        // Convert 2-digit year to 4-digit (assume 1900s if >= 50, 2000s if < 50)
        const year = yearShort >= 50 ? 1900 + yearShort : 2000 + yearShort;

        // Convert month name to number
        const months = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
          'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
          'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        };
        const month = months[monthStr.toLowerCase()];

        if (month) {
          return `${month}/${day.padStart(2, '0')}/${year}`;
        }
      }

      // Handle other date formats
      if (trimmed.includes('-') || trimmed.includes('/')) {
        try {
          const parsed = new Date(trimmed);
          if (!isNaN(parsed.getTime())) {
            const year = parsed.getFullYear();
            const month = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = String(parsed.getDate()).padStart(2, '0');
            return `${month}/${day}/${year}`;
          }
        } catch (e) {
          console.error('Error parsing date:', trimmed, e);
        }
      }
    }

    // If it's a number (Excel serial date)
    if (typeof value === 'number') {
      if (value > 1 && value < 73050) {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 86400000);

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${month}/${day}/${year}`;
      }
    }

    return String(value);
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      // First, get all existing members to check for duplicates
      const existingMembersQuery = query(
        collection(db, 'stakes', stakeId, 'wards', wardId, 'members')
      );
      const existingSnapshot = await getDocs(existingMembersQuery);
      const existingByEmail = {};
      const existingByNameDOB = {};

      existingSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.email) {
          existingByEmail[data.email.toLowerCase()] = doc.id;
        }
        if (data.fullName && data.dob) {
          const key = `${data.fullName.toLowerCase()}_${data.dob}`;
          existingByNameDOB[key] = doc.id;
        }
      });

      const batch = writeBatch(db);
      let imported = 0;
      let updated = 0;

      previewData.allRows.forEach(row => {
        const memberData = {};

        // Map regular fields
        Object.keys(fieldMapping).forEach(csvField => {
          const ourField = fieldMapping[csvField];
          if (ourField !== 'ignore' && row[csvField]) {
            let value = String(row[csvField]).trim();

            // Special handling for date fields
            if (ourField === 'dob') {
              value = convertExcelDate(row[csvField]);
            }

            memberData[ourField] = value;
          }
        });

        // Determine marital status from Yes/No columns
        if (!memberData.maritalStatus) {
          if (row['Is Married'] === 'Yes') memberData.maritalStatus = 'married';
          else if (row['Is Divorced'] === 'Yes') memberData.maritalStatus = 'divorced';
          else if (row['Is Widowed'] === 'Yes') memberData.maritalStatus = 'widowed';
          else if (row['Is Single'] === 'Yes') memberData.maritalStatus = 'single';
        }

        // Convert Has Children to numChildren
        if (!memberData.numChildren && row['Has Children'] === 'Yes') {
          memberData.numChildren = '1';
        }

        if (memberData.fullName) {
          // Try to find existing member by email first
          const email = memberData.email?.toLowerCase();
          let existingId = email ? existingByEmail[email] : null;

          // If no email match, try name + DOB
          if (!existingId && memberData.dob) {
            const namedobKey = `${memberData.fullName.toLowerCase()}_${memberData.dob}`;
            existingId = existingByNameDOB[namedobKey];
          }

          if (existingId) {
            // Update existing member
            const docRef = doc(db, 'stakes', stakeId, 'wards', wardId, 'members', existingId);
            batch.update(docRef, {
              ...memberData,
              updatedAt: new Date().toISOString()
            });
            updated++;
          } else {
            // Create new member
            const docRef = doc(collection(db, 'stakes', stakeId, 'wards', wardId, 'members'));
            batch.set(docRef, {
              ...memberData,
              hasLoggedIn: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            imported++;
          }
        }
      });

      await batch.commit();
      alert(`Successfully imported ${imported} new members and updated ${updated} existing members!`);
      onComplete();
    } catch (error) {
      console.error('Error importing:', error);
      alert('Error importing members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Upload Member Roster</h2>

        {/* Step 1: Upload File */}
        {step === 1 && (
          <div>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-rose-500 bg-rose-50'
                  : 'border-gray-300 hover:border-rose-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {isDragging ? 'Drop file here' : 'Drag and drop a file here, or click to browse'}
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="fileUpload"
              />
              <label
                htmlFor="fileUpload"
                className="inline-block px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 cursor-pointer transition-colors"
              >
                Choose File
              </label>
              {file && <p className="mt-4 text-sm text-gray-600">Selected: {file.name}</p>}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">Expected columns:</p>
              <p className="text-sm text-blue-700">
                Full Name, Email, Phone, Address, Date of Birth, Marital Status, Number of Children, Cultural Background
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Map Fields */}
        {step === 2 && previewData && (
          <div>
            <p className="text-gray-600 mb-4">Map your CSV columns to our fields:</p>

            <div className="space-y-3 mb-6">
              {previewData.headers.map(header => (
                <div key={header} className="flex items-center gap-4">
                  <div className="w-1/3 font-medium text-gray-700">{header}</div>
                  <div className="w-1/3">
                    <select
                      value={fieldMapping[header] || 'ignore'}
                      onChange={(e) => setFieldMapping(prev => ({
                        ...prev,
                        [header]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
                    >
                      {fieldOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-1/3 text-sm text-gray-600">
                    {(() => {
                      const headerLower = header.toLowerCase();
                      const isMaritalColumn = headerLower.includes('is married') ||
                                             headerLower.includes('is divorced') ||
                                             headerLower.includes('is single') ||
                                             headerLower.includes('is widowed');
                      const isChildrenColumn = headerLower.includes('has children');

                      if (isMaritalColumn || isChildrenColumn) {
                        return (
                          <span className="italic text-blue-600">
                            Auto-handled - leave as "ignore"
                          </span>
                        );
                      }

                      return (
                        <span className="truncate">
                          {fieldMapping[header] === 'dob' && previewData.rows[0][header]
                            ? convertExcelDate(previewData.rows[0][header])
                            : previewData.rows[0][header]}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">Preview (first 5 rows):</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {previewData.headers.map(header => (
                        <th key={header} className="px-4 py-2 text-left text-gray-700">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.rows.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        {previewData.headers.map(header => {
                          const mappedField = fieldMapping[header];
                          let displayValue = row[header];

                          // If this field is mapped to 'dob', show the converted date
                          if (mappedField === 'dob' && displayValue) {
                            displayValue = convertExcelDate(displayValue);
                          }

                          return (
                            <td key={header} className="px-4 py-2 text-gray-600">{displayValue}</td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Importing...' : `Import ${previewData.allRows.length} Members`}
              </button>
            </div>
          </div>
        )}

        {!loading && step === 1 && (
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Friends Tab Component
function FriendsTab({ members, onAddMember, onUploadRoster, onEditMember, onDeleteMember, onInviteMember, onInviteAll, onTransfer, showWardColumn = false }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members
    .filter(member =>
      member.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.wardName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

  const uninvitedCount = members.filter(m => m.email && m.email.trim() !== '' && !m.hasLoggedIn).length;

  return (
    <div className="bg-white rounded-xl shadow-md border border-rose-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Members</h2>
          <div className="flex gap-2">
            {uninvitedCount > 0 && (
              <button
                onClick={onInviteAll}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Send className="w-4 h-4" />
                Invite All ({uninvitedCount})
              </button>
            )}
            {onUploadRoster && (
              <button
                onClick={onUploadRoster}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Roster
              </button>
            )}
            <button
              onClick={onAddMember}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Member
            </button>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
      </div>

      <div className="p-6">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {members.length === 0 ? 'No members added yet' : 'No members match your search'}
            </p>
            {members.length === 0 && (
              <button
                onClick={onAddMember}
                className="text-rose-500 hover:text-rose-600 font-medium"
              >
                Add your first member
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                showWard={showWardColumn}
                onEdit={() => onEditMember(member)}
                onDelete={() => onDeleteMember(member)}
                onInvite={onInviteMember ? () => onInviteMember(member) : undefined}
                onTransfer={onTransfer ? () => onTransfer(member) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Member Card Component
// Member Card Component
function MemberCard({ member, showWard, onEdit, onDelete, onInvite, onTransfer }) {
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    setInviting(true);
    try {
      await onInvite();
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      inviting
        ? 'border-gray-300 bg-gray-50'
        : 'border-gray-200 hover:shadow-md'
    }`}>
      {inviting ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600">Sending invitation...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="relative">
                {member.profilePicUrl ? (
                  <img
                    src={member.profilePicUrl}
                    alt={member.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-rose-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center border-2 border-rose-200">
                    <User className="w-6 h-6 text-rose-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">{member.fullName || 'Unnamed'}</h3>
                <div className="flex gap-2 flex-wrap">
                  {member.hasLoggedIn ? (
                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                      Pending
                    </span>
                  )}
                  {showWard && member.wardName && (
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {member.wardName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <div className="flex gap-1">
                {onInvite && !member.hasLoggedIn && member.email && (
                  <button
                    onClick={handleInvite}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Send invitation"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onEdit}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {onTransfer && (
                <button
                  onClick={onTransfer}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="Transfer to another ward"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1 text-sm text-gray-600">
            {member.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{member.email}</span>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{member.phone}</span>
                <div className="flex items-center gap-1 ml-auto">
                  {member.maritalStatus === 'married' && (
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" title="Married" />
                  )}
                  {member.maritalStatus === 'widowed' && (
                    <Heart className="w-3.5 h-3.5 text-gray-400" title="Widowed" />
                  )}
                  {member.maritalStatus === 'divorced' && (
                    <Heart className="w-3.5 h-3.5 text-gray-400" title="Divorced" style={{ opacity: 0.5 }} />
                  )}
                  {member.numChildren && parseInt(member.numChildren) > 0 && (
                    <span className="flex items-center gap-0.5 text-rose-500" title={`${member.numChildren} ${parseInt(member.numChildren) === 1 ? 'child' : 'children'}`}>
                      <Baby className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Member Modal Component
function MemberModal({ member, stakeId, wardId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    fullName: member?.fullName || '',
    email: member?.email || '',
    phone: member?.phone || '',
    address: member?.address || '',
    dob: member?.dob || '',
    maritalStatus: member?.maritalStatus || '',
    numChildren: member?.numChildren || '',
    ethnicity: member?.ethnicity || '',
    hobbies: member?.hobbies || [],
    interests: member?.interests || [],
    hasLoggedIn: member?.hasLoggedIn || false,
    profilePicUrl: member?.profilePicUrl || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState(member?.profilePicUrl || '');

  const handleChange = (field, value) => {
    // Convert date picker format (YYYY-MM-DD) to MM/DD/YYYY
    if (field === 'dob' && value && value.includes('-') && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = value.split('-');
      value = `${month}/${day}/${year}`;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Use member ID if editing, or generate temp ID for preview
      const memberId = member?.id || 'temp_' + Date.now();
      const storageRef = ref(storage, `profilePics/${memberId}`);

      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      setFormData(prev => ({ ...prev, profilePicUrl: downloadUrl }));
      setProfilePicPreview(downloadUrl);

      alert('Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Error uploading picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (member) {
        await updateDoc(doc(db, 'stakes', stakeId, 'wards', wardId, 'members', member.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        const docRef = await addDoc(collection(db, 'stakes', stakeId, 'wards', wardId, 'members'), {
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // If there's a temp profile pic, re-upload with actual member ID
        if (profilePicPreview && profilePicPreview.includes('temp_')) {
          // Fetch the temp image and re-upload with correct ID
          const response = await fetch(profilePicPreview);
          const blob = await response.blob();
          const storageRef = ref(storage, `profilePics/${docRef.id}`);
          await uploadBytes(storageRef, blob);
          const downloadUrl = await getDownloadURL(storageRef);

          // Update with correct URL
          await updateDoc(doc(db, 'stakes', stakeId, 'wards', wardId, 'members', docRef.id), {
            profilePicUrl: downloadUrl
          });
        }
      }
      onSave();
    } catch (error) {
      console.error('Error saving member:', error);
      alert('Error saving member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {member ? 'Edit Member' : 'Add New Member'}
        </h2>

        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center mb-6 pb-6 border-b">
          <div className="relative">
            {profilePicPreview ? (
              <img
                src={profilePicPreview}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-rose-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center border-4 border-rose-200">
                <User className="w-12 h-12 text-rose-400" />
              </div>
            )}
            <label
              className="absolute bottom-0 right-0 bg-rose-500 text-white p-2 rounded-full cursor-pointer hover:bg-rose-600 transition-colors"
              onClick={() => console.log('Label clicked')}
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  console.log('Input onChange fired', e.target.files);
                  handleProfilePicUpload(e);
                }}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
          <p className="text-xs text-gray-500 mt-2">Click camera icon to upload</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={
                formData.dob && formData.dob.includes('/')
                  ? (() => {
                      const [month, day, year] = formData.dob.split('/');
                      return `${year}-${month}-${day}`;
                    })()
                  : formData.dob
              }
              onChange={(e) => handleChange('dob', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Stored as: {formData.dob || 'MM/DD/YYYY'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
            <select
              value={formData.maritalStatus}
              onChange={(e) => handleChange('maritalStatus', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="widowed">Widowed</option>
              <option value="divorced">Divorced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Children</label>
            <input
              type="number"
              value={formData.numChildren}
              onChange={(e) => handleChange('numChildren', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cultural Background</label>
            <input
              type="text"
              value={formData.ethnicity}
              onChange={(e) => handleChange('ethnicity', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="Optional"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !formData.fullName || uploading}
            className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Member'}
          </button>
        </div>
      </div>
    </div>
  );
}

// SuperAdmin Dashboard Component (keeping original)
function SuperAdminDashboard({ user }) {
  const [stakes, setStakes] = useState([]);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);
  const [showStakeAdminModal, setShowStakeAdminModal] = useState(false);
  const [showWardAdminModal, setShowWardAdminModal] = useState(false);
  const [selectedStake, setSelectedStake] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalCircles, setTotalCircles] = useState(0);

  useEffect(() => {
    loadStakes();
  }, []);

  const loadStakes = async () => {
    try {
      const stakesQuery = query(collection(db, 'stakes'));
      const stakesSnapshot = await getDocs(stakesQuery);
      const stakesData = await Promise.all(
        stakesSnapshot.docs.map(async (stakeDoc) => {
          const wardsQuery = query(collection(db, 'stakes', stakeDoc.id, 'wards'));
          const wardsSnapshot = await getDocs(wardsQuery);
          return {
            id: stakeDoc.id,
            ...stakeDoc.data(),
            wards: wardsSnapshot.docs.map(wardDoc => ({
              id: wardDoc.id,
              ...wardDoc.data()
            }))
          };
        })
      );

      // Count all circles across all stakes and wards
      let circleCount = 0;
      for (const stake of stakesData) {
        for (const ward of stake.wards) {
          const circlesQuery = query(
            collection(db, 'stakes', stake.id, 'wards', ward.id, 'circles')
          );
          const circlesSnapshot = await getDocs(circlesQuery);
          circleCount += circlesSnapshot.size;
        }
      }
      setTotalCircles(circleCount);

      setStakes(stakesData);
    } catch (error) {
      console.error('Error loading stakes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-green-50">
      <header className="bg-white shadow-sm border-b border-rose-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-rose-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Stake Friends</h1>
                <p className="text-sm text-gray-500">Super Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-rose-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Stakes</p>
                <p className="text-3xl font-bold text-rose-600">{stakes.length}</p>
              </div>
              <Building2 className="w-12 h-12 text-rose-300" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Wards</p>
                <p className="text-3xl font-bold text-green-600">
                  {stakes.reduce((sum, stake) => sum + (stake.wards?.length || 0), 0)}
                </p>
              </div>
              <Users className="w-12 h-12 text-green-300" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Circles</p>
                <p className="text-3xl font-bold text-amber-600">{totalCircles}</p>
              </div>
              <Heart className="w-12 h-12 text-amber-300" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-rose-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">Stakes & Wards</h2>
              <button
                onClick={() => setShowStakeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Stake
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading stakes...</div>
            ) : stakes.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No stakes created yet</p>
                <button
                  onClick={() => setShowStakeModal(true)}
                  className="text-rose-500 hover:text-rose-600 font-medium"
                >
                  Create your first stake
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {stakes.map((stake) => (
                  <StakeCard
                    key={stake.id}
                    stake={stake}
                    onAddWard={() => {
                      setSelectedStake(stake);
                      setShowWardModal(true);
                    }}
                    onEdit={() => {
                      setSelectedStake(stake);
                      setShowStakeModal(true);
                    }}
                    onDelete={async () => {
                      if (confirm('Are you sure you want to delete this stake?')) {
                        await deleteDoc(doc(db, 'stakes', stake.id));
                        loadStakes();
                      }
                    }}
                    onRefresh={loadStakes}
                    onManageAdmins={(stake) => {
                      setSelectedStake(stake);
                      setShowStakeAdminModal(true);
                    }}
                    onManageWardAdmins={(stake, ward) => {
                      setSelectedStake(stake);
                      setSelectedWard(ward);
                      setShowWardAdminModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showStakeModal && (
        <StakeModal
          stake={selectedStake}
          onClose={() => {
            setShowStakeModal(false);
            setSelectedStake(null);
          }}
          onSave={() => {
            setShowStakeModal(false);
            setSelectedStake(null);
            loadStakes();
          }}
        />
      )}

      {showWardModal && (
        <WardModal
          stake={selectedStake}
          onClose={() => {
            setShowWardModal(false);
            setSelectedStake(null);
          }}
          onSave={() => {
            setShowWardModal(false);
            setSelectedStake(null);
            loadStakes();
          }}
        />
      )}

      {showStakeAdminModal && selectedStake && (
        <ManageAdminsModal
          title={`Manage Stake Admins - ${selectedStake.name}`}
          admins={selectedStake.stakeAdmins || []}
          stakeId={selectedStake.id}
          stakeName={selectedStake.name}
          onClose={() => {
            setShowStakeAdminModal(false);
            setSelectedStake(null);
          }}
          onSave={async (newAdmins) => {
            await updateDoc(doc(db, 'stakes', selectedStake.id), {
              stakeAdmins: newAdmins,
              updatedAt: new Date().toISOString()
            });
            setShowStakeAdminModal(false);
            setSelectedStake(null);
            loadStakes();
          }}
        />
      )}

      {showWardAdminModal && selectedStake && selectedWard && (
        <ManageAdminsModal
          title={`Manage Ward Admins - ${selectedWard.name}`}
          admins={selectedWard.wardAdmins || []}
          stakeId={selectedStake.id}
          wardId={selectedWard.id}
          stakeName={selectedStake.name}
          wardName={selectedWard.name}
          isWardAdmin={true}
          onClose={() => {
            setShowWardAdminModal(false);
            setSelectedStake(null);
            setSelectedWard(null);
          }}
          onSave={async (newAdmins) => {
            await updateDoc(doc(db, 'stakes', selectedStake.id, 'wards', selectedWard.id), {
              wardAdmins: newAdmins,
              updatedAt: new Date().toISOString()
            });
            setShowWardAdminModal(false);
            setSelectedStake(null);
            setSelectedWard(null);
            loadStakes();
          }}
        />
      )}
    </div>
  );
}

function StakeCard({ stake, onAddWard, onEdit, onDelete, onRefresh, onManageAdmins, onManageWardAdmins }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-rose-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Building2 className="w-6 h-6 text-rose-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{stake.name}</h3>
            <p className="text-sm text-gray-600">Code: {stake.stakeCode}</p>
            {stake.stakeAdmins && stake.stakeAdmins.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {stake.stakeAdmins.length} admin{stake.stakeAdmins.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">
            {stake.wards?.length || 0} wards
          </span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onManageAdmins(stake)}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            Admins
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 text-sm text-gray-700 hover:bg-rose-100 rounded transition-colors"
          >
            {expanded ? 'Hide' : 'Show'} Wards
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-700 hover:bg-rose-100 rounded transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-700">Wards</h4>
            <button
              onClick={onAddWard}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Ward
            </button>
          </div>

          {stake.wards && stake.wards.length > 0 ? (
            <div className="space-y-2">
              {stake.wards.map((ward) => (
                <div key={ward.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1">
                    <Users className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <span className="text-gray-800">{ward.name}</span>
                      {ward.wardAdmins && ward.wardAdmins.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {ward.wardAdmins.length} admin{ward.wardAdmins.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onManageWardAdmins(stake, ward)}
                      className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      Admins
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this ward? All members, circles, and ward admins will be permanently deleted.')) {
                          try {
                            // Delete ward admin users
                            const usersRef = collection(db, 'users');
                            const wardAdminsQuery = query(usersRef,
                              where('role', '==', 'wardAdmin'),
                              where('wardId', '==', ward.id)
                            );
                            const wardAdminsSnapshot = await getDocs(wardAdminsQuery);
                            const adminDeletes = wardAdminsSnapshot.docs.map(doc => deleteDoc(doc.ref));
                            await Promise.all(adminDeletes);

                            // Delete all members
                            const membersRef = collection(db, 'stakes', stake.id, 'wards', ward.id, 'members');
                            const membersSnapshot = await getDocs(membersRef);
                            const memberDeletes = membersSnapshot.docs.map(doc => deleteDoc(doc.ref));
                            await Promise.all(memberDeletes);

                            // Delete all circles
                            const circlesRef = collection(db, 'stakes', stake.id, 'wards', ward.id, 'circles');
                            const circlesSnapshot = await getDocs(circlesRef);
                            const circleDeletes = circlesSnapshot.docs.map(doc => deleteDoc(doc.ref));
                            await Promise.all(circleDeletes);

                            // Finally delete the ward itself
                            await deleteDoc(doc(db, 'stakes', stake.id, 'wards', ward.id));

                            onRefresh();
                          } catch (error) {
                            console.error('Error deleting ward:', error);
                            alert('Failed to delete ward: ' + error.message);
                          }
                        }
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">No wards yet</p>
          )}
        </div>
      )}
    </div>
  );
}

function StakeModal({ stake, onClose, onSave }) {
  const [name, setName] = useState(stake?.name || '');
  const [stakeCode, setStakeCode] = useState(stake?.stakeCode || '');
  const [stakeAdminEmail, setStakeAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    try {
      if (stake) {
        await updateDoc(doc(db, 'stakes', stake.id), {
          name,
          stakeCode,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'stakes'), {
          name,
          stakeCode,
          stakeAdmins: stakeAdminEmail ? [stakeAdminEmail] : [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      onSave();
    } catch (error) {
      console.error('Error saving stake:', error);
      alert('Error saving stake');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {stake ? 'Edit Stake' : 'Add New Stake'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stake Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stake Code</label>
            <input
              type="text"
              value={stakeCode}
              onChange={(e) => setStakeCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              placeholder="e.g., VEGAS-WEST"
            />
          </div>

          {!stake && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stake Admin Email (Optional)
              </label>
              <input
                type="email"
                value={stakeAdminEmail}
                onChange={(e) => setStakeAdminEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Stake'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WardModal({ stake, onClose, onSave }) {
  const [name, setName] = useState('');
  const [wardAdminEmail, setWardAdminEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);

    try {
      await addDoc(collection(db, 'stakes', stake.id, 'wards'), {
        name,
        wardAdmins: wardAdminEmail ? [wardAdminEmail] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      onSave();
    } catch (error) {
      console.error('Error saving ward:', error);
      alert('Error saving ward');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Ward</h2>
        <p className="text-sm text-gray-600 mb-4">Adding ward to: {stake.name}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ward Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ward Admin Email (Optional)
            </label>
            <input
              type="email"
              value={wardAdminEmail}
              onChange={(e) => setWardAdminEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="admin@example.com"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Ward'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}