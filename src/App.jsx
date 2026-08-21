import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, addDoc, query, getDocs, updateDoc, deleteDoc, where, writeBatch, getCountFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Heart, Users, Building2, LogOut, Plus, Edit2, Trash2, UserPlus, Target, FileText, Mail, Phone, MapPin, Calendar, User, Baby, Globe, Upload, Download, Filter, Send, Camera, ArrowRightLeft, Bell, Megaphone, ChevronDown, Wrench } from 'lucide-react';
import TransferMemberModal from './components/member/TransferMemberModal';
import * as XLSX from 'xlsx';
import CircleManager from './components/circles/CircleManager';
import MemberDashboard from './components/member/MemberDashboard';
import DropInCircles from './components/member/DropInCircles';
import QuickAddMemberModal from './components/member/QuickAddMemberModal';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivacyPolicy from './components/PrivacyPolicy';
import EmailAdminsModal from './components/EmailAdminsModal';
import EmailAllModal from './components/circles/EmailAllModal';
import NotifyMembersModal from './components/circles/NotifyMembersModal';
import ManageMessagesModal from './components/circles/ManageMessagesModal';
import TestReportsModal from './components/TestReportsModal';
import SetupPassword from './components/SetupPassword';
import { tr, trf, setCurrentLanguage } from './i18n/translations';
import { LanguageContext, LanguageToggle } from './i18n/LanguageContext';

const style = document.createElement('style');
style.textContent = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;
document.head.appendChild(style);


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


// Helper function to calculate age
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

// Main App Component
export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('admin');
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('appLanguage') === 'es' ? 'es' : 'en';
    setCurrentLanguage(saved);
    return saved;
  });

  const applyLanguage = (lang) => {
    localStorage.setItem('appLanguage', lang);
    setCurrentLanguage(lang);
    setLanguageState(lang);
  };

  // User-initiated toggle: apply everywhere and persist on the users doc so
  // the mobile app (and future emails) share the preference.
  const changeLanguage = async (lang) => {
    if (lang !== 'en' && lang !== 'es') return;
    applyLanguage(lang);
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          language: lang,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Could not save language preference:', e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role);
          setUserData(data);
          // The users doc is the source of truth for language; a device-only
          // choice gets uploaded so other clients inherit it.
          if (data.language === 'es' || data.language === 'en') {
            applyLanguage(data.language);
          } else if (localStorage.getItem('appLanguage') === 'es') {
            try {
              await updateDoc(doc(db, 'users', currentUser.uid), { language: 'es' });
            } catch (e) {
              console.error('Could not sync language preference:', e);
            }
          }
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

  // Gender-driven palette: male → blue/slate tokens, otherwise the default rose/amber palette.
  useEffect(() => {
    if (userData?.gender === 'male') {
      document.documentElement.dataset.theme = 'male';
    } else {
      delete document.documentElement.dataset.theme;
    }
  }, [userData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-tertiary-50 flex items-center justify-center">
        <div className="text-primary-600 flex items-center gap-2">
          <Heart className="animate-pulse" />
          <span className="text-lg">{tr('Loading...')}</span>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {/* Keyed by language so every page re-reads its tr() strings on toggle */}
      <Router key={language}>
        <Routes>
          {/* Privacy Policy Route - accessible at /privacy */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/setup-password" element={<SetupPassword />} />

          {/* Main App Route */}
          <Route path="*" element={
            <>
              {loading ? (
                <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-tertiary-50 flex items-center justify-center">
                  <div className="text-primary-600 flex items-center gap-2">
                    <Heart className="animate-pulse" />
                    <span className="text-lg">{tr('Loading...')}</span>
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
                <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-tertiary-50 p-8">
                  <div className="max-w-2xl mx-auto text-center">
                    <Heart className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">{tr('Welcome to My Stake Friends')}</h1>
                    <p className="text-gray-600">{tr('Your dashboard will be available soon.')}</p>
                  </div>
                </div>
              )}
            </>
          } />
        </Routes>
      </Router>
    </LanguageContext.Provider>
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

      setInviteStatus('✓ ' + trf('Invitation sent to {0}', [email]));
      setTimeout(() => setInviteStatus(''), 3000);

      // Reload statuses after sending invite
      loadAdminStatuses();
    } catch (error) {
      console.error('Error inviting admin:', error);
      setInviteStatus('✗ ' + trf('Error: {0}', [error.message]));
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{tr('Current Admins')}</label>
            {adminList.length === 0 ? (
              <p className="text-sm text-gray-500 italic">{tr('No admins assigned yet')}</p>
            ) : loading ? (
              <p className="text-sm text-gray-500 italic">{tr('Loading admin statuses...')}</p>
            ) : (
              <div className="space-y-2">
                {adminList.map((email, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm text-gray-700">{email}</span>
                      {adminStatuses[email] === 'active' ? (
                        <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          {tr('Active')}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                          {tr('Pending')}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {adminStatuses[email] !== 'active' && (
                        <button
                          onClick={() => handleInviteAdmin(email)}
                          disabled={inviting}
                          className="p-1 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                          title={tr('Send invitation')}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveAdmin(email)}
                        className="p-1 text-red-600 hover:text-red-700"
                        title={tr('Remove admin')}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Add New Admin')}</label>
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
                    {tr('Which ward are they a member of? (Optional)')}
                  </label>
                  <select
                    value={selectedWardId}
                    onChange={(e) => setSelectedWardId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">{tr('Select a ward (optional)...')}</option>
                    {wards.map(ward => (
                      <option key={ward.id} value={ward.id}>{ward.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {tr('Stake admins manage all wards. Ward membership is optional.')}
                  </p>
                </div>
              )}

              <button
                onClick={handleAddAdmin}
                disabled={!newAdminEmail}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                {tr('Add to List')}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {tr('Add the email first, then click the')} <Send className="w-3 h-3 inline" /> {tr('icon to send the invitation')}
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {tr('Cancel')}
          </button>
          <button
            onClick={() => onSave(adminList)}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {tr('Save Admins')}
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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Update users collection
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await updateDoc(userDocRef, {
        hasLoggedIn: true,
        lastLoginAt: new Date().toISOString()
      });

      // Also update the member document
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      if (userData?.stakeId && userData?.wardId) {
        // Find member document with this email
        const membersRef = collection(db, 'stakes', userData.stakeId, 'wards', userData.wardId, 'members');
        const memberQuery = query(membersRef, where('email', '==', email));
        const memberSnapshot = await getDocs(memberQuery);

        if (!memberSnapshot.empty) {
          const memberDoc = memberSnapshot.docs[0];
          await updateDoc(memberDoc.ref, {
            hasLoggedIn: true,
            lastLoginAt: new Date().toISOString()
          });
        }
      }

    } catch (err) {
      setError(tr('Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetError('');
    setResetMessage('');
    setResetLoading(true);

    try {
      const actionCodeSettings = {
        url: 'https://mystakefriends.com',
        handleCodeInApp: false
      };

      await sendPasswordResetEmail(auth, resetEmail, actionCodeSettings);
      setResetMessage(tr('Password reset email sent! Please check your inbox.'));
      setResetEmail('');
      // Close modal after 3 seconds
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetMessage('');
      }, 3000);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setResetError(tr('No account found with this email address.'));
      } else if (err.code === 'auth/invalid-email') {
        setResetError(tr('Please enter a valid email address.'));
      } else {
        setResetError(tr('Failed to send reset email. Please try again.'));
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-accent-50 to-tertiary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-primary-200 relative">
        <div className="absolute top-4 right-4">
          <LanguageToggle />
        </div>
        <div className="text-center mb-8 pt-6">
          <Heart className="w-16 h-16 text-primary-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Stake Friends</h1>
          <p className="text-gray-600 italic">{tr('"Hearts Knit in Unity"')}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? tr('Signing in...') : tr('Sign In')}
          </button>

          <div className="text-center">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              {tr('Forgot Password?')}
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">{tr('Reset Password')}</h2>
            <p className="text-sm text-gray-600 mb-4">
              {tr("Enter your email address and we'll send you a link to reset your password.")}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Email')}</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePasswordReset()}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              {resetError && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {resetError}
                </div>
              )}

              {resetMessage && (
                <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg text-sm">
                  {resetMessage}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail('');
                    setResetError('');
                    setResetMessage('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {tr('Cancel')}
                </button>
                <button
                  onClick={handlePasswordReset}
                  disabled={resetLoading || !resetEmail}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {resetLoading ? tr('Sending...') : tr('Send Reset Link')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  const [showEmailAdminsModal, setShowEmailAdminsModal] = useState(false);
  const [showEmailAllMembersModal, setShowEmailAllMembersModal] = useState(false);
  const [showNotifyMembersModal, setShowNotifyMembersModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  // Get current user email
  const currentUserEmail = auth.currentUser?.email?.toLowerCase();
  const isSuperAdmin = currentUserEmail === 'jim@amtoxlab.com' || currentUserEmail === 'berkdad@gmail.com';

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
            ...doc.data(),
            id: doc.id,
            wardId: ward.id,
            wardName: ward.name
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

      alert(trf('Invitation sent to {0}', [member.email]));
      await loadStakeData();
    } catch (error) {
      console.error('Error inviting member:', error);
      alert(trf('Failed to send invitation: {0}', [error.message]));
    }
  };

  const inviteAllMembers = async () => {
    const uninvitedMembers = members.filter(m =>
      m.email &&
      m.email.trim() !== '' &&
      !m.hasLoggedIn
    );

    if (uninvitedMembers.length === 0) {
      alert(tr('No members to invite. All members with emails have already been invited.'));
      return;
    }

    if (!confirm(trf('Send invitations to {0} member(s)?', [uninvitedMembers.length]))) {
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

    alert(trf('Invitations sent!\nSuccess: {0}\nFailed: {1}', [successCount, failCount]));
    loadStakeData();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-tertiary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-primary-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Stake Friends</h1>
                <p className="text-sm text-gray-500">{stakeInfo?.name || tr('Stake Administrator')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">{tr('View Ward:')}</label>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="text-sm font-medium text-gray-800 border border-gray-300 focus:ring-2 focus:ring-primary-500 rounded px-3 py-2"
                >
                  <option value="all">{tr('All Wards')}</option>
                  {wards.map(ward => (
                    <option key={ward.id} value={ward.id}>{ward.name}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(v => !v)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {tr('Actions')}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showActionsMenu ? 'rotate-180' : ''}`} />
                </button>

                {showActionsMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {onSwitchToMember && (
                        <>
                          <button
                            onClick={() => { setShowActionsMenu(false); onSwitchToMember(); }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                          >
                            <Users className="w-4 h-4 text-purple-500" />
                            {tr('My Dashboard')}
                          </button>

                          <div className="my-2 border-t border-gray-100" />
                        </>
                      )}

                      <button
                        onClick={() => { setShowActionsMenu(false); setShowStakeAdminModal(true); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                      >
                        <UserPlus className="w-4 h-4 text-blue-500" />
                        {tr('Stake Admins')}
                      </button>

                      {selectedWard !== 'all' && (
                        <button
                          onClick={() => {
                            setShowActionsMenu(false);
                            setSelectedWardForAdmin(wards.find(w => w.id === selectedWard));
                            setShowWardAdminModal(true);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                        >
                          <UserPlus className="w-4 h-4 text-green-500" />
                          {tr('Ward Admins')}
                        </button>
                      )}

                      <div className="my-2 border-t border-gray-100" />

                      <button
                        onClick={() => { setShowActionsMenu(false); setShowEmailAdminsModal(true); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                      >
                        <Mail className="w-4 h-4 text-primary-500" />
                        {tr('Email All Admins')}
                      </button>

                      <button
                        onClick={() => { setShowActionsMenu(false); setShowEmailAllMembersModal(true); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                      >
                        <Mail className="w-4 h-4 text-orange-500" />
                        {selectedWard !== 'all' ? tr('Email Ward') : tr('Email All Members')}
                      </button>

                      <button
                        onClick={() => { setShowActionsMenu(false); setShowNotifyMembersModal(true); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                      >
                        <Bell className="w-4 h-4 text-blue-500" />
                        {selectedWard !== 'all' ? tr('Notify Ward') : tr('Notify All Members')}
                      </button>

                      <button
                        onClick={() => { setShowActionsMenu(false); setShowMessagesModal(true); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                      >
                        <Megaphone className="w-4 h-4 text-purple-500" />
                        {tr('Announcements')}
                      </button>

                      {isSuperAdmin && (
                        <>
                          <div className="my-2 border-t border-gray-100" />
                          <p className="px-4 py-1 text-xs font-semibold text-gray-400 uppercase flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            {tr('Maintenance')}
                          </p>

                          <button
                            onClick={async () => {
                              setShowActionsMenu(false);
                              try {
                                const findOrphansFunc = httpsCallable(functions, 'findOrphanedData');
                                const result = await findOrphansFunc({
                                  stakeId: userData.stakeId,
                                  wardId: selectedWard === 'all' ? null : selectedWard,
                                  dryRun: true
                                });

                                // Download as JSON file
                                const dataStr = JSON.stringify(result.data, null, 2);
                                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `orphaned-data-${selectedWard}.json`;
                                link.click();
                                URL.revokeObjectURL(url);

                                alert(trf('Found {0} issues. Downloaded results as JSON file.', [result.data.issuesFound]));
                              } catch (error) {
                                console.error('Error:', error);
                                alert(trf('Error: {0}', [error.message]));
                              }
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                          >
                            {tr('Orphan Accts')}
                          </button>

                          <button
                            onClick={async () => {
                              setShowActionsMenu(false);
                              try {
                                // Find duplicates
                                const searchTerm = prompt(tr("Search for specific email (leave blank for all):"), "kalina");

                                const findDupsFunc = httpsCallable(functions, 'findDuplicateAccounts');
                                const findResult = await findDupsFunc({
                                  stakeId: userData.stakeId,
                                  wardId: selectedWard,
                                  searchEmail: searchTerm
                                });

                                // Always download results
                                const dataStr = JSON.stringify(findResult.data, null, 2);
                                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `duplicate-accounts-${selectedWard}.json`;
                                link.click();
                                URL.revokeObjectURL(url);

                                if (findResult.data.duplicatesFound === 0) {
                                  alert(tr('No duplicate accounts found!'));
                                  return;
                                }

                                alert(trf('Found {0} duplicate accounts. Results downloaded.', [findResult.data.duplicatesFound]));

                                if (!confirm(trf('Delete these {0} duplicate user accounts?', [findResult.data.duplicatesFound]))) {
                                  return;
                                }

                                // Clean up duplicates
                                const cleanupFunc = httpsCallable(functions, 'cleanupDuplicateAccounts');
                                const cleanResult = await cleanupFunc({
                                  duplicates: findResult.data.duplicates
                                });

                                alert(trf('Cleaned up {0} duplicate accounts!', [cleanResult.data.cleaned]));
                              } catch (error) {
                                console.error('Error:', error);
                                alert(trf('Error: {0}', [error.message]));
                              }
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                          >
                            {tr('Find Duplicate Accounts')}
                          </button>

                          <button
                            onClick={async () => {
                              setShowActionsMenu(false);
                              try {
                                const searchEmail = prompt(tr("Enter email to search for:"), "Chelseakalina@gmail.com");

                                if (!searchEmail) return;

                                const findAuthFunc = httpsCallable(functions, 'findAuthUsers');
                                const result = await findAuthFunc({ searchEmail });

                                // Download results as JSON
                                const dataStr = JSON.stringify(result.data, null, 2);
                                const dataBlob = new Blob([dataStr], {type: 'application/json'});
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `auth-users-${searchEmail}.json`;
                                link.click();
                                URL.revokeObjectURL(url);

                                alert(trf('Found {0} authentication users. Results downloaded.', [result.data.found]));
                                console.log(result.data);
                              } catch (error) {
                                console.error('Error:', error);
                                alert(trf('Error: {0}', [error.message]));
                              }
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                          >
                            {tr('Search Auth Users')}
                          </button>

                          <button
                            onClick={async () => {
                              setShowActionsMenu(false);
                              try {
                                // Based on the results, delete the iCloud account
                                const cleanupFunc = httpsCallable(functions, 'cleanupAuthDuplicates');

                                if (!confirm(tr('Delete chelseakalina@icloud.com account and keep Gmail account?'))) {
                                  return;
                                }

                                const result = await cleanupFunc({
                                  uidsToDelete: ['jl9eMGKmiFgesF09dEU10nePmFq1'], // iCloud UID
                                  keepEmail: 'chelseakalina@gmail.com',
                                  stakeId: userData.stakeId,
                                  wardId: selectedWard,
                                });

                                console.log(result.data);
                                alert(trf('Cleaned up {0} accounts. Chelsea can now log in with Gmail.', [result.data.cleaned]));
                              } catch (error) {
                                console.error('Error:', error);
                                alert(trf('Error: {0}', [error.message]));
                              }
                            }}
                            className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                          >
                            {tr("Fix Chelsea's Duplicate")}
                          </button>
                        </>
                      )}

                      <div className="my-2 border-t border-gray-100" />

                      <button
                        onClick={() => { setShowActionsMenu(false); handleLogout(); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="w-4 h-4" />
                        {tr('Sign Out')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => setActiveTab('friends')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'friends'
                ? 'bg-primary-500 border-primary-600 text-white'
                : 'bg-white border-primary-100 text-gray-800 hover:border-primary-300'
            }`}
          >
            <Users className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'friends' ? 'text-white' : 'text-primary-500'}`} />
            <h3 className="text-xl font-semibold mb-1">{tr('Friends')}</h3>
            <p className={`text-sm ${activeTab === 'friends' ? 'text-primary-100' : 'text-gray-600'}`}>
              {trf('{0} members', [filteredMembers.length])}
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
            <h3 className="text-xl font-semibold mb-1">{tr('Circles')}</h3>
            <p className={`text-sm ${activeTab === 'circles' ? 'text-green-100' : 'text-gray-600'}`}>
              {trf('{0} active circles', [totalCircles])}
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
            <h3 className="text-xl font-semibold mb-1">{tr('Reports')}</h3>
            <p className={`text-sm ${activeTab === 'reports' ? 'text-amber-100' : 'text-gray-600'}`}>
              {tr('View analytics')}
            </p>
          </button>

          <button
            onClick={() => setActiveTab('dropin')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'dropin'
                ? 'bg-blue-500 border-blue-600 text-white'
                : 'bg-white border-blue-100 text-gray-800 hover:border-blue-300'
            }`}
          >
            <Heart className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'dropin' ? 'text-white' : 'text-blue-500'}`} />
            <h3 className="text-xl font-semibold mb-1">{tr('Drop In')}</h3>
            <p className={`text-sm ${activeTab === 'dropin' ? 'text-blue-100' : 'text-gray-600'}`}>
              {tr('Visit a circle')}
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
              if (confirm(tr('Are you sure you want to delete this member?'))) {
                try {
                  await deleteDoc(doc(db, 'stakes', userData.stakeId, 'wards', member.wardId, 'members', member.id));
                  await loadStakeData();
                } catch (error) {
                  console.error('Error deleting member:', error);
                  alert(trf('Failed to delete member: {0}', [error.message]));
                }
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
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{tr('Select a Ward')}</h3>
            <p className="text-gray-600">{tr('Please select a specific ward from the "Viewing" dropdown to manage circles.')}</p>
          </div>
        )}

        {activeTab === 'dropin' && (
          <DropInCircles
            db={db}
            storage={storage}
            uid={user.uid}
            role={userData.role}
            stakeId={userData.stakeId}
            wardId={userData.wardId}
            email={user.email}
            currentMemberId={user.uid}
            currentMemberName={userData.displayName || userData.name || user.email}
          />
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">{tr('Stake Overview')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{tr('Total Members')}</p>
                <p className="text-3xl font-bold text-primary-600">{members.length}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{tr('Total Wards')}</p>
                <p className="text-3xl font-bold text-green-600">{wards.length}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{tr('Active Users')}</p>
                <p className="text-3xl font-bold text-amber-600">
                  {members.filter(m => m.hasLoggedIn).length}
                </p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{tr('Pending Invites')}</p>
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
          onSave={async () => {
            setShowMemberModal(false);
            await loadStakeData();
          }}
        />
      )}

      {showMemberModal && selectedMember && (
        <MemberModal
          member={selectedMember}
          stakeId={userData.stakeId}
          wardId={selectedMember.wardId}
          callerRole={userData.role}
          wards={wards}
          onClose={() => {
            setShowMemberModal(false);
            setSelectedMember(null);
          }}
          onSave={async () => {
            setShowMemberModal(false);
            setSelectedMember(null);
            await loadStakeData();
          }}
        />
      )}

      {showEmailAdminsModal && (
        <EmailAdminsModal
          stakeId={userData.stakeId}
          stakeName={stakeInfo?.name || tr('Stake')}
          onClose={() => setShowEmailAdminsModal(false)}
        />
      )}

      {/* Email All Members Modal */}
      {showEmailAllMembersModal && (
        <EmailAllModal
          scope={selectedWard !== 'all' ? 'ward' : 'stake'}
          stakeId={userData.stakeId}
          wardId={selectedWard !== 'all' ? selectedWard : undefined}
          stakeName={stakeInfo?.name}
          wardName={selectedWard !== 'all' ? wards.find(w => w.id === selectedWard)?.name : undefined}
          memberCount={filteredMembers.filter(m => m.email && m.email.trim() !== '').length}
          onClose={() => setShowEmailAllMembersModal(false)}
        />
      )}

      {/* Notify Members (in-app push) Modal */}
      {showNotifyMembersModal && (
        <NotifyMembersModal
          scope={selectedWard !== 'all' ? 'ward' : 'stake'}
          stakeId={userData.stakeId}
          wardId={selectedWard !== 'all' ? selectedWard : undefined}
          stakeName={stakeInfo?.name}
          wardName={selectedWard !== 'all' ? wards.find(w => w.id === selectedWard)?.name : undefined}
          onClose={() => setShowNotifyMembersModal(false)}
        />
      )}

      {/* Announcements (in-app banner) Modal */}
      {showMessagesModal && (
        <ManageMessagesModal
          db={db}
          scope={selectedWard !== 'all' ? 'ward' : 'stake'}
          stakeId={userData.stakeId}
          wardId={selectedWard !== 'all' ? selectedWard : undefined}
          wardName={selectedWard !== 'all' ? wards.find(w => w.id === selectedWard)?.name : undefined}
          createdBy={user.uid}
          createdByName={userData.displayName || userData.name || user.email}
          onClose={() => setShowMessagesModal(false)}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedWard !== 'all' && (
        <UploadRosterModal
          stakeId={userData.stakeId}
          wardId={selectedWard}
          onClose={() => setShowUploadModal(false)}
          onComplete={async () => {
            setShowUploadModal(false);
            await loadStakeData();
          }}
        />
      )}
      {/* Stake Admin Modal */}
      {showStakeAdminModal && (
        <ManageAdminsModal
          title={trf('Manage Stake Admins - {0}', [stakeInfo?.name])}
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
          title={trf('Manage Ward Admins - {0}', [selectedWardForAdmin.name])}
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
          onComplete={async () => {
            setShowTransferModal(false);
            setMemberToTransfer(null);
            await loadStakeData();
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
  const [showEmailWardModal, setShowEmailWardModal] = useState(false);
  const [showNotifyWardModal, setShowNotifyWardModal] = useState(false);
  const [showWardMessagesModal, setShowWardMessagesModal] = useState(false);

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
      let wardData = null;
      if (wardDoc.exists()) {
        wardData = { id: wardDoc.id, ...wardDoc.data() };
        setWardInfo(wardData);
      }

      // Load members
      const membersQuery = query(
        collection(db, 'stakes', userData.stakeId, 'wards', userData.wardId, 'members')
      );
      const membersSnapshot = await getDocs(membersQuery);
      setMembers(membersSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        wardId: userData.wardId,
        wardName: wardData?.name
      })));

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

      alert(trf('Invitation sent to {0}', [member.email]));
      await loadWardData(); // or loadStakeData() depending on which dashboard
    } catch (error) {
      console.error('Error inviting member:', error);
      alert(trf('Failed to send invitation: {0}', [error.message]));
    }
  };

  const inviteAllMembers = async () => {
    const uninvitedMembers = members.filter(m =>
      m.email &&
      m.email.trim() !== '' &&
      !m.hasLoggedIn
    );

    if (uninvitedMembers.length === 0) {
      alert(tr('No members to invite. All members with emails have already been invited.'));
      return;
    }

    if (!confirm(trf('Send invitations to {0} member(s)?', [uninvitedMembers.length]))) {
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

    alert(trf('Invitations sent!\nSuccess: {0}\nFailed: {1}', [successCount, failCount]));
    await loadWardData(); // or loadStakeData() depending on which dashboard
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-tertiary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-primary-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">MyStakeFriends</h1>
                <p className="text-sm text-gray-500">{wardInfo?.name || tr('Ward Administrator')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              {/* NEW: Switch to Member View button */}
              <button
                onClick={onSwitchToMember}
                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
              >
                <Users className="w-4 h-4" />
                {tr('My Dashboard')}
              </button>

              <button
                onClick={() => setShowWardAdminModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
              >
                <UserPlus className="w-4 h-4" />
                {tr('Manage Ward Admins')}
              </button>
              <button
                onClick={() => setShowEmailWardModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {tr('Email All')}
              </button>
              <button
                onClick={() => setShowNotifyWardModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {tr('Notify All')}
              </button>
              <button
                onClick={() => setShowWardMessagesModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Megaphone className="w-4 h-4" />
                {tr('Announcements')}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {tr('Sign Out')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => setActiveTab('friends')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'friends'
                ? 'bg-primary-500 border-primary-600 text-white'
                : 'bg-white border-primary-100 text-gray-800 hover:border-primary-300'
            }`}
          >
            <Users className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'friends' ? 'text-white' : 'text-primary-500'}`} />
            <h3 className="text-xl font-semibold mb-1">{tr('Friends')}</h3>
            <p className={`text-sm ${activeTab === 'friends' ? 'text-primary-100' : 'text-gray-600'}`}>
              {trf('{0} members', [members.length])}
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
            <h3 className="text-xl font-semibold mb-1">{tr('Circles')}</h3>
            <p className={`text-sm ${activeTab === 'circles' ? 'text-green-100' : 'text-gray-600'}`}>
              {totalCircles !== 1 ? trf('{0} active circles', [totalCircles]) : trf('{0} active circle', [totalCircles])}
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
            <h3 className="text-xl font-semibold mb-1">{tr('Reports')}</h3>
            <p className={`text-sm ${activeTab === 'reports' ? 'text-amber-100' : 'text-gray-600'}`}>
              {tr('View analytics')}
            </p>
          </button>

          <button
            onClick={() => setActiveTab('dropin')}
            className={`p-6 rounded-xl shadow-md border-2 transition-all ${
              activeTab === 'dropin'
                ? 'bg-blue-500 border-blue-600 text-white'
                : 'bg-white border-blue-100 text-gray-800 hover:border-blue-300'
            }`}
          >
            <Heart className={`w-12 h-12 mx-auto mb-3 ${activeTab === 'dropin' ? 'text-white' : 'text-blue-500'}`} />
            <h3 className="text-xl font-semibold mb-1">{tr('Drop In')}</h3>
            <p className={`text-sm ${activeTab === 'dropin' ? 'text-blue-100' : 'text-gray-600'}`}>
              {tr('Visit a circle')}
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
              if (confirm(tr('Are you sure you want to delete this member?'))) {
                try {
                  await deleteDoc(doc(db, 'stakes', userData.stakeId, 'wards', userData.wardId, 'members', memberId));
                  await loadWardData();
                } catch (error) {
                  console.error('Error deleting member:', error);
                  alert(trf('Failed to delete member: {0}', [error.message]));
                }
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

        {activeTab === 'dropin' && (
          <DropInCircles
            db={db}
            storage={storage}
            uid={user.uid}
            role={userData.role}
            stakeId={userData.stakeId}
            wardId={userData.wardId}
            email={user.email}
            currentMemberId={user.uid}
            currentMemberName={userData.displayName || userData.name || user.email}
          />
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{tr('Reports Coming Soon')}</h3>
            <p className="text-gray-600">{tr('View engagement and activity reports here.')}</p>
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
          onSave={async () => {
            setShowMemberModal(false);
            await loadWardData();
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
          onSave={async () => {
            setShowMemberModal(false);
            setSelectedMember(null);
            await loadWardData();
          }}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadRosterModal
          stakeId={userData.stakeId}
          wardId={userData.wardId}
          onClose={() => setShowUploadModal(false)}
          onComplete={async () => {
            setShowUploadModal(false);
            await loadWardData();
          }}
        />
      )}
      {/* Ward Admin Modal */}
      {showWardAdminModal && (
        <ManageAdminsModal
          title={trf('Manage Ward Admins - {0}', [wardInfo?.name])}
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
            await loadWardData();
          }}
        />
      )}
      {/* Email All Ward Members Modal */}
      {showEmailWardModal && (
        <EmailAllModal
          scope="ward"
          stakeId={userData.stakeId}
          wardId={userData.wardId}
          stakeName={stakeInfo?.name}
          wardName={wardInfo?.name}
          memberCount={members.filter(m => m.email && m.email.trim() !== '').length}
          onClose={() => setShowEmailWardModal(false)}
        />
      )}

      {/* Notify All Ward Members (in-app push) Modal */}
      {showNotifyWardModal && (
        <NotifyMembersModal
          scope="ward"
          stakeId={userData.stakeId}
          wardId={userData.wardId}
          stakeName={stakeInfo?.name}
          wardName={wardInfo?.name}
          onClose={() => setShowNotifyWardModal(false)}
        />
      )}

      {/* Announcements (in-app banner) Modal — ward */}
      {showWardMessagesModal && (
        <ManageMessagesModal
          db={db}
          scope="ward"
          stakeId={userData.stakeId}
          wardId={userData.wardId}
          wardName={wardInfo?.name}
          createdBy={user.uid}
          createdByName={userData.displayName || userData.name || user.email}
          onClose={() => setShowWardMessagesModal(false)}
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
  const [rosterGender, setRosterGender] = useState('female');
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Fields, 3: Confirm
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fieldOptions = [
    { value: 'fullName', label: tr('Full Name') },
    { value: 'email', label: tr('Email') },
    { value: 'phone', label: tr('Phone') },
    { value: 'address', label: tr('Address') },
    { value: 'dob', label: tr('Date of Birth') },
    { value: 'maritalStatus', label: tr('Marital Status') },
    { value: 'numChildren', label: tr('Has Children') },
    { value: 'ethnicity', label: tr('Ethnicity') },
    { value: 'ignore', label: tr('-- Ignore this column --') }
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
        alert(tr('The file appears to be empty'));
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
      alert(tr('Error reading file. Please make sure it\'s a valid CSV or Excel file.'));
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

        memberData.gender = rosterGender;

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
      alert(trf('Successfully imported {0} new members and updated {1} existing members!', [imported, updated]));
      onComplete();
    } catch (error) {
      console.error('Error importing:', error);
      alert(tr('Error importing members. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6">{tr('Upload Member Roster')}</h2>

        {/* Step 1: Upload File */}
        {step === 1 && (
          <div>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-primary-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {isDragging ? tr('Drop file here') : tr('Drag and drop a file here, or click to browse')}
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
                className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 cursor-pointer transition-colors"
              >
                {tr('Choose File')}
              </label>
              {file && <p className="mt-4 text-sm text-gray-600">{trf('Selected: {0}', [file.name])}</p>}
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">{tr('Expected columns:')}</p>
              <p className="text-sm text-blue-700">
                {tr('Full Name, Email, Phone, Address, Date of Birth, Marital Status, Number of Children, Cultural Background')}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Map Fields */}
        {step === 2 && previewData && (
          <div>
            <p className="text-gray-600 mb-4">{tr('Map your CSV columns to our fields:')}</p>

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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
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
                            {tr('Auto-handled - leave as "ignore"')}
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

            <div className="border-t pt-4 mb-6">
              <h4 className="font-medium text-gray-800 mb-2">{tr('These members are:')}</h4>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rosterGender"
                    value="female"
                    checked={rosterGender === 'female'}
                    onChange={() => setRosterGender('female')}
                    className="text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{tr('Female (Relief Society / Young Women)')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rosterGender"
                    value="male"
                    checked={rosterGender === 'male'}
                    onChange={() => setRosterGender('male')}
                    className="text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-gray-700">{tr('Male (Elders / Young Men)')}</span>
                </label>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-800 mb-3">{tr('Preview (first 5 rows):')}</h4>
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
                {tr('Back')}
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {loading ? tr('Importing...') : trf('Import {0} Members', [previewData.allRows.length])}
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
              {tr('Cancel')}
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
    <div className="bg-white rounded-xl shadow-md border border-primary-100">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">{tr('Members')}</h2>
          <div className="flex gap-2">
            {uninvitedCount > 0 && (
              <button
                onClick={onInviteAll}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Send className="w-4 h-4" />
                {trf('Invite All ({0})', [uninvitedCount])}
              </button>
            )}
            {onUploadRoster && (
              <button
                onClick={onUploadRoster}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Upload className="w-4 h-4" />
                {tr('Upload Roster')}
              </button>
            )}
            <button
              onClick={onAddMember}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {tr('Add Member')}
            </button>
          </div>
        </div>
        <input
          type="text"
          placeholder={tr('Search members...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="p-6">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {members.length === 0 ? tr('No members added yet') : tr('No members match your search')}
            </p>
            {members.length === 0 && (
              <button
                onClick={onAddMember}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                {tr('Add your first member')}
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

function MemberCard({ member, showWard, onEdit, onDelete, onInvite, onTransfer }) {
  const [inviting, setInviting] = useState(false);
  const age = calculateAge(member.dob);

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
        : age !== null && age <= 17
        ? (member.gender === 'male' ? 'bg-blue-50 border-blue-300 hover:shadow-md' : 'bg-purple-50 border-purple-300 hover:shadow-md')
        : 'border-gray-200 hover:shadow-md'
    }`}>
      {inviting ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600">{tr('Sending invitation...')}</p>
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
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center border-2 border-primary-200">
                    <User className="w-6 h-6 text-primary-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">{member.fullName || tr('Unnamed')}</h3>
                <div className="flex gap-2 flex-wrap">
                  {member.hasLoggedIn ? (
                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      {tr('Active')}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                      {tr('Pending')}
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
                    title={tr('Send invitation')}
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
                  title={tr('Transfer to another ward')}
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
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Member Modal Component
function MemberModal({ member, stakeId, wardId, onClose, onSave, callerRole, wards }) {
  const [formData, setFormData] = useState({
    fullName: member?.fullName || '',
    email: member?.email || '',
    phone: member?.phone || '',
    address: member?.address || '',
    dob: member?.dob || '',
    maritalStatus: member?.maritalStatus || '',
    numChildren: member?.numChildren || '',
    gender: member?.gender || 'female',
    ethnicity: member?.ethnicity || '',
    hobbies: member?.hobbies || [],
    interests: member?.interests || [],
    hasLoggedIn: member?.hasLoggedIn || false,
    profilePicUrl: member?.profilePicUrl || ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState(member?.profilePicUrl || '');

  // Auth/Role management state (for superAdmin/stakeAdmin editing existing members)
  const canManageAuth = member && member.email && (callerRole === 'superAdmin' || callerRole === 'stakeAdmin');
  const [authInfo, setAuthInfo] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authSaving, setAuthSaving] = useState(false);
  const [authStatus, setAuthStatus] = useState('');
  const [showAuthSection, setShowAuthSection] = useState(false);
  const [authFormData, setAuthFormData] = useState({
    role: '',
    wardId: '',
    stakeId: ''
  });

  // Immediate password reset (no email link)
  const [newPwd, setNewPwd] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwStatus, setPwStatus] = useState('');

  const generatePwd = () => {
    // Readable temp password the admin can speak aloud: Word + 3 digits + !
    const words = ['Maple', 'River', 'Cedar', 'Harbor', 'Summit', 'Willow', 'Canyon', 'Meadow'];
    const w = words[Math.floor(Math.random() * words.length)];
    const n = Math.floor(100 + Math.random() * 900);
    setNewPwd(`${w}${n}!`);
    setPwStatus('');
  };

  const handleSetPassword = async () => {
    if (!member?.email) return;
    if (!newPwd || newPwd.length < 6) {
      setPwStatus('✗ ' + tr('Password must be at least 6 characters.'));
      return;
    }
    setPwSaving(true);
    setPwStatus('');
    try {
      const fn = httpsCallable(functions, 'adminSetUserPassword');
      const res = await fn({ email: member.email, newPassword: newPwd });
      setPwStatus('✓ ' + (res.data?.message || tr('Password updated.')));
    } catch (error) {
      setPwStatus('✗ ' + (error.message || tr('Failed to set password.')));
    } finally {
      setPwSaving(false);
    }
  };

  const loadAuthInfo = async () => {
    if (!canManageAuth) return;
    setAuthLoading(true);
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', member.email)
      );
      const usersSnapshot = await getDocs(usersQuery);
      if (!usersSnapshot.empty) {
        const userData = usersSnapshot.docs[0].data();
        const userId = usersSnapshot.docs[0].id;
        setAuthInfo({ id: userId, ...userData });
        setAuthFormData({
          role: userData.role || 'member',
          wardId: userData.wardId || '',
          stakeId: userData.stakeId || stakeId
        });
      } else {
        setAuthInfo(null);
        setAuthStatus(tr('No auth account found for this email.'));
      }
    } catch (error) {
      console.error('Error loading auth info:', error);
      setAuthStatus(tr('Error loading auth info.'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveAuth = async () => {
    if (!authInfo) return;
    setAuthSaving(true);
    setAuthStatus('');
    try {
      await updateDoc(doc(db, 'users', authInfo.id), {
        role: authFormData.role,
        wardId: authFormData.wardId,
        stakeId: authFormData.stakeId,
        updatedAt: new Date().toISOString()
      });
      setAuthStatus('✓ ' + tr('Auth/role updated successfully!'));
      // Refresh auth info
      setAuthInfo(prev => ({
        ...prev,
        role: authFormData.role,
        wardId: authFormData.wardId,
        stakeId: authFormData.stakeId
      }));
      setTimeout(() => setAuthStatus(''), 3000);
    } catch (error) {
      console.error('Error updating auth:', error);
      setAuthStatus('✗ ' + trf('Error updating auth: {0}', [error.message]));
    } finally {
      setAuthSaving(false);
    }
  };

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
      alert(tr('Please upload an image file'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(tr('Image must be less than 5MB'));
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

      alert(tr('Profile picture uploaded successfully!'));
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(tr('Error uploading picture. Please try again.'));
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

        // Keep the login account's gender in sync so their theme follows.
        if (formData.email && formData.gender !== (member.gender || 'female')) {
          try {
            const usersSnapshot = await getDocs(
              query(collection(db, 'users'), where('email', '==', formData.email.toLowerCase()))
            );
            for (const userDoc of usersSnapshot.docs) {
              await updateDoc(doc(db, 'users', userDoc.id), {
                gender: formData.gender,
                updatedAt: new Date().toISOString()
              });
            }
          } catch (syncError) {
            console.error('Could not sync gender to users doc:', syncError);
          }
        }
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
      alert(tr('Error saving member'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 my-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {member ? tr('Edit Member') : tr('Add New Member')}
        </h2>

        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center mb-6 pb-6 border-b">
          <div className="relative">
            {profilePicPreview ? (
              <img
                src={profilePicPreview}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-primary-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center border-4 border-primary-200">
                <User className="w-12 h-12 text-primary-400" />
              </div>
            )}
            <label
              className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full cursor-pointer hover:bg-primary-600 transition-colors"
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
          {uploading && <p className="text-sm text-gray-500 mt-2">{tr('Uploading...')}</p>}
          <p className="text-xs text-gray-500 mt-2">{tr('Click camera icon to upload')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Full Name *')}</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Email')}</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Phone')}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Address')}</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Date of Birth')}</label>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">{tr('Stored as:')} {formData.dob || 'MM/DD/YYYY'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Marital Status')}</label>
            <select
              value={formData.maritalStatus}
              onChange={(e) => handleChange('maritalStatus', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">{tr('Select...')}</option>
              <option value="single">{tr('Single')}</option>
              <option value="married">{tr('Married')}</option>
              <option value="widowed">{tr('Widowed')}</option>
              <option value="divorced">{tr('Divorced')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Number of Children')}</label>
            <input
              type="number"
              value={formData.numChildren}
              onChange={(e) => handleChange('numChildren', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Gender')}</label>
            <select
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="female">{tr('Female')}</option>
              <option value="male">{tr('Male')}</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{tr('Controls their app theme (rose vs. blue)')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Cultural Background')}</label>
            <input
              type="text"
              value={formData.ethnicity}
              onChange={(e) => handleChange('ethnicity', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={tr('Optional')}
            />
          </div>
        </div>

        {/* Auth/Role Management Section (superAdmin/stakeAdmin only) */}
        {canManageAuth && (
          <div className="mt-6 pt-4 border-t-2 border-purple-200">
            <button
              onClick={() => {
                setShowAuthSection(!showAuthSection);
                if (!showAuthSection && !authInfo) loadAuthInfo();
              }}
              className="flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900 mb-3"
            >
              <span>{showAuthSection ? '▼' : '▶'}</span>
              {tr('Auth / Role Management')}
            </button>

            {showAuthSection && (
              <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                {authLoading ? (
                  <p className="text-sm text-purple-600">{tr('Loading auth info...')}</p>
                ) : !authInfo ? (
                  <p className="text-sm text-gray-600">{trf('No auth account found for {0}. This member has not been invited yet.', [member.email])}</p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mb-2">
                      {tr('Auth UID:')} <span className="font-mono">{authInfo.id}</span>
                      {authInfo.hasLoggedIn ? ' • ' + tr('Has logged in') : ' • ' + tr('Never logged in')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">{tr('Role')}</label>
                        <select
                          value={authFormData.role}
                          onChange={(e) => setAuthFormData(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="member">{tr('Member')}</option>
                          <option value="wardAdmin">{tr('Ward Admin')}</option>
                          <option value="stakeAdmin">{tr('Stake Admin')}</option>
                          {callerRole === 'superAdmin' && <option value="superAdmin">{tr('Super Admin')}</option>}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">{tr('Stake ID')}</label>
                        <input
                          type="text"
                          value={authFormData.stakeId}
                          onChange={(e) => setAuthFormData(prev => ({ ...prev, stakeId: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-purple-700 mb-1">{tr('Ward ID')}</label>
                        {wards && wards.length > 0 ? (
                          <select
                            value={authFormData.wardId}
                            onChange={(e) => setAuthFormData(prev => ({ ...prev, wardId: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="">{tr('-- Select Ward --')}</option>
                            {wards.map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={authFormData.wardId}
                            onChange={(e) => setAuthFormData(prev => ({ ...prev, wardId: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                          />
                        )}
                      </div>
                    </div>
                    {authStatus && (
                      <p className={`text-sm ${authStatus.startsWith('✓') ? 'text-green-700' : 'text-red-700'}`}>
                        {authStatus}
                      </p>
                    )}
                    <button
                      onClick={handleSaveAuth}
                      disabled={authSaving}
                      className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      {authSaving ? tr('Saving...') : tr('Update Auth / Role')}
                    </button>

                    {/* Immediate password reset (no email link) */}
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <p className="text-xs font-semibold text-purple-700 mb-1">
                        {tr('Reset Password')}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {trf("Changes {0}'s password immediately. No email or link is sent. Tell them the new password and have them change it after logging in.", [member.email])}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={newPwd}
                          onChange={(e) => setNewPwd(e.target.value)}
                          placeholder={tr('New password (min 6 chars)')}
                          autoComplete="off"
                          className="flex-1 px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                        />
                        <button
                          type="button"
                          onClick={generatePwd}
                          className="px-3 py-2 text-sm border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          {tr('Generate')}
                        </button>
                        <button
                          type="button"
                          onClick={handleSetPassword}
                          disabled={pwSaving || newPwd.length < 6}
                          className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                          {pwSaving ? tr('Setting...') : tr('Set Password Now')}
                        </button>
                      </div>
                      {pwStatus && (
                        <p className={`text-sm mt-2 ${pwStatus.startsWith('✓') ? 'text-green-700' : 'text-red-700'}`}>
                          {pwStatus}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {tr('Cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !formData.fullName || uploading}
            className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {loading ? tr('Saving...') : tr('Save Member')}
          </button>
        </div>
      </div>
    </div>
  );
}

// SuperAdmin Dashboard Component (keeping original)
function PasswordHelpCard() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const generate = () => {
    const words = ['Maple', 'River', 'Cedar', 'Harbor', 'Summit', 'Willow', 'Canyon', 'Meadow'];
    const w = words[Math.floor(Math.random() * words.length)];
    const n = Math.floor(100 + Math.random() * 900);
    setPwd(`${w}${n}!`);
    setStatus('');
  };

  const submit = async () => {
    if (!email.trim()) {
      setStatus('✗ ' + tr('Enter the member\'s email.'));
      return;
    }
    if (pwd.length < 6) {
      setStatus('✗ ' + tr('Password must be at least 6 characters.'));
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      const fn = httpsCallable(functions, 'adminSetUserPassword');
      const res = await fn({ email: email.trim(), newPassword: pwd });
      setStatus('✓ ' + (res.data?.message || tr('Password updated.')));
    } catch (error) {
      setStatus('✗ ' + (error.message || tr('Failed to set password.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-purple-100 mb-8">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">{tr('Member Login Help')}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {tr("Reset any member's password immediately. No email or link is sent. Tell them the new password and have them change it after logging in.")}
        </p>
      </div>
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={tr('Member email')}
            autoComplete="off"
            className="flex-1 px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            type="text"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder={tr('New password (min 6 chars)')}
            autoComplete="off"
            className="flex-1 px-3 py-2 text-sm border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
          />
          <button
            type="button"
            onClick={generate}
            className="px-3 py-2 text-sm border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            {tr('Generate')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || pwd.length < 6 || !email.trim()}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? tr('Setting...') : tr('Set Password Now')}
          </button>
        </div>
        {status && (
          <p className={`text-sm mt-2 ${status.startsWith('✓') ? 'text-green-700' : 'text-red-700'}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

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
  const [memberStats, setMemberStats] = useState({ total: 0, male: 0 });
  const [viewingStake, setViewingStake] = useState(null);
  const [showTestReportsModal, setShowTestReportsModal] = useState(false);

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
          const wards = await Promise.all(
            wardsSnapshot.docs.map(async (wardDoc) => {
              const membersRef = collection(db, 'stakes', stakeDoc.id, 'wards', wardDoc.id, 'members');
              const [totalSnap, maleSnap] = await Promise.all([
                getCountFromServer(membersRef),
                getCountFromServer(query(membersRef, where('gender', '==', 'male')))
              ]);
              return {
                id: wardDoc.id,
                ...wardDoc.data(),
                memberCount: totalSnap.data().count,
                maleCount: maleSnap.data().count
              };
            })
          );
          return {
            id: stakeDoc.id,
            ...stakeDoc.data(),
            wards
          };
        })
      );

      const total = stakesData.reduce((sum, s) => sum + s.wards.reduce((w, ward) => w + ward.memberCount, 0), 0);
      const male = stakesData.reduce((sum, s) => sum + s.wards.reduce((w, ward) => w + ward.maleCount, 0), 0);
      setMemberStats({ total, male });

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

  // Drill into a stake with the full stake-admin experience (members, circles, etc.)
  if (viewingStake) {
    return (
      <div>
        <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between sticky top-0 z-50">
          <span className="text-sm">{tr('Super Admin — viewing')} <strong>{viewingStake.name}</strong></span>
          <button
            onClick={() => setViewingStake(null)}
            className="text-sm underline hover:text-gray-300"
          >
            {tr('← Back to Super Admin')}
          </button>
        </div>
        <StakeAdminDashboard
          user={user}
          userData={{ stakeId: viewingStake.id, role: 'superAdmin', email: user.email }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-accent-50 to-tertiary-50">
      <header className="bg-white shadow-sm border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 text-primary-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">My Stake Friends</h1>
                <p className="text-sm text-gray-500">{tr('Super Administrator')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <button
                onClick={() => setShowTestReportsModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg hover:from-primary-600 hover:to-accent-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {tr('Test Reports')}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {tr('Sign Out')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-primary-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{tr('Total Stakes')}</p>
                <p className="text-3xl font-bold text-primary-600">{stakes.length}</p>
              </div>
              <Building2 className="w-12 h-12 text-primary-300" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{tr('Total Wards')}</p>
                <p className="text-3xl font-bold text-green-600">
                  {stakes.reduce((sum, stake) => sum + (stake.wards?.length || 0), 0)}
                </p>
              </div>
              <Users className="w-12 h-12 text-green-300" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{tr('Total Members')}</p>
                <p className="text-3xl font-bold text-blue-600">{memberStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {trf('{0} women · {1} men', [memberStats.total - memberStats.male, memberStats.male])}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-300" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{tr('Active Circles')}</p>
                <p className="text-3xl font-bold text-amber-600">{totalCircles}</p>
              </div>
              <Heart className="w-12 h-12 text-amber-300" />
            </div>
          </div>
        </div>

        <PasswordHelpCard />

        <div className="bg-white rounded-xl shadow-md border border-primary-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">{tr('Stakes & Wards')}</h2>
              <button
                onClick={() => setShowStakeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {tr('Add Stake')}
              </button>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">{tr('Loading stakes...')}</div>
            ) : stakes.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">{tr('No stakes created yet')}</p>
                <button
                  onClick={() => setShowStakeModal(true)}
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  {tr('Create your first stake')}
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
                      if (confirm(tr('Are you sure you want to delete this stake?'))) {
                        await deleteDoc(doc(db, 'stakes', stake.id));
                        await loadStakes();
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
                    onViewMembers={() => setViewingStake(stake)}
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
          onSave={async () => {
            setShowStakeModal(false);
            setSelectedStake(null);
            await loadStakes();
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
          onSave={async () => {
            setShowWardModal(false);
            setSelectedStake(null);
            await loadStakes();
          }}
        />
      )}

      {showStakeAdminModal && selectedStake && (
        <ManageAdminsModal
          title={trf('Manage Stake Admins - {0}', [selectedStake.name])}
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
            await loadStakes();
          }}
        />
      )}

      {showTestReportsModal && (
        <TestReportsModal
          stakes={stakes}
          onClose={() => setShowTestReportsModal(false)}
        />
      )}

      {showWardAdminModal && selectedStake && selectedWard && (
        <ManageAdminsModal
          title={trf('Manage Ward Admins - {0}', [selectedWard.name])}
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
            await loadStakes();
          }}
        />
      )}
    </div>
  );
}

function StakeCard({ stake, onAddWard, onEdit, onDelete, onRefresh, onManageAdmins, onManageWardAdmins, onViewMembers }) {
  const [expanded, setExpanded] = useState(false);
  const stakeMemberCount = (stake.wards || []).reduce((sum, w) => sum + (w.memberCount || 0), 0);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-primary-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Building2 className="w-6 h-6 text-primary-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{stake.name}</h3>
            <p className="text-sm text-gray-600">{tr('Code:')} {stake.stakeCode}</p>
            {stake.stakeAdmins && stake.stakeAdmins.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {stake.stakeAdmins.length > 1 ? trf('{0} admins', [stake.stakeAdmins.length]) : trf('{0} admin', [stake.stakeAdmins.length])}
              </p>
            )}
          </div>
          <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">
            {trf('{0} wards', [stake.wards?.length || 0])}
          </span>
          <span className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">
            {trf('{0} members', [stakeMemberCount])}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onViewMembers}
            className="px-3 py-1 text-sm bg-primary-500 text-white hover:bg-primary-600 rounded transition-colors"
          >
            {tr('View Members')}
          </button>
          <button
            onClick={() => onManageAdmins(stake)}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            {tr('Admins')}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 text-sm text-gray-700 hover:bg-primary-100 rounded transition-colors"
          >
            {expanded ? tr('Hide Wards') : tr('Show Wards')}
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-700 hover:bg-primary-100 rounded transition-colors"
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
            <h4 className="font-medium text-gray-700">{tr('Wards')}</h4>
            <button
              onClick={onAddWard}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              <Plus className="w-3 h-3" />
              {tr('Add Ward')}
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
                      <p className="text-xs text-gray-500">
                        {trf('{0} members', [ward.memberCount || 0])}
                        {ward.wardAdmins && ward.wardAdmins.length > 0 &&
                          ' · ' + (ward.wardAdmins.length > 1 ? trf('{0} admins', [ward.wardAdmins.length]) : trf('{0} admin', [ward.wardAdmins.length]))}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onManageWardAdmins(stake, ward)}
                      className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      {tr('Admins')}
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(tr('Are you sure you want to delete this ward? All members, circles, and ward admins will be permanently deleted.'))) {
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
                            alert(trf('Failed to delete ward: {0}', [error.message]));
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
            <p className="text-gray-500 text-sm text-center py-4">{tr('No wards yet')}</p>
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
      alert(tr('Error saving stake'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {stake ? tr('Edit Stake') : tr('Add New Stake')}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Stake Name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Stake Code')}</label>
            <input
              type="text"
              value={stakeCode}
              onChange={(e) => setStakeCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={tr('e.g., VEGAS-WEST')}
            />
          </div>

          {!stake && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tr('Stake Admin Email (Optional)')}
              </label>
              <input
                type="email"
                value={stakeAdminEmail}
                onChange={(e) => setStakeAdminEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="admin@example.com"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {tr('Cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {loading ? tr('Saving...') : tr('Save Stake')}
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
      alert(tr('Error saving ward'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{tr('Add New Ward')}</h2>
        <p className="text-sm text-gray-600 mb-4">{trf('Adding ward to: {0}', [stake.name])}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr('Ward Name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tr('Ward Admin Email (Optional)')}
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
              {tr('Cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? tr('Saving...') : tr('Save Ward')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}