// DropInCircles — self-contained admin panel to browse circles in scope,
// drop in / leave, and participate (chat / events) in a dropped-into circle.
//
// Mount it from StakeAdminDashboard / WardAdminDashboard, e.g. as a tab or
// modal:
//
//   <DropInCircles
//     db={db} storage={storage}
//     uid={user.uid}
//     role={userData.role}
//     stakeId={userData.stakeId}
//     wardId={userData.wardId}
//     currentMemberId={user.uid}
//     currentMemberName={userData.displayName || userData.name || user.email}
//   />
//
// currentMemberId/Name are the acting identity stamped on anything the admin
// posts while dropped in; that content persists after they leave.

import { useEffect, useState } from 'react';
import { Hand, LogIn, LogOut, MessageSquare, Calendar, RefreshCw } from 'lucide-react';
import {
  roleCanDropIn,
  resolveScope,
  getCirclesInScopeDetailed,
  getActiveDropIn,
  dropIntoCircle,
  leaveCircleDropIn,
  getCircleMembers,
  circleCountLabel,
} from '../../services/dropInService';
import CircleChatView from './CircleChatView';
import CircleEventsView from './CircleEventsView';
import { tr, trf } from '../../i18n/translations';

export default function DropInCircles({
  db,
  storage,
  uid,
  role,
  stakeId,
  wardId,
  email,
  currentMemberId,
  currentMemberName,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [circles, setCircles] = useState([]);
  const [active, setActive] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [scope, setScope] = useState('none');

  // Opened circle for participation
  const [openCircle, setOpenCircle] = useState(null);
  const [openMembers, setOpenMembers] = useState([]);
  const [openTab, setOpenTab] = useState('chat');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resolved = await resolveScope(db, { role, stakeId, wardId, email });
      setScope(resolved);
      const list = await getCirclesInScopeDetailed(db, { scope: resolved, stakeId, wardId });
      const act = await getActiveDropIn(db, uid);
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setCircles(list);
      setActive(act);
    } catch (e) {
      setError(trf('Could not load circles: {0}', [e.message]));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!roleCanDropIn(role) && !email) return;
    load();
  }, [role, stakeId, wardId, uid, email]);

  const isActive = (c) =>
    active &&
    active.circleId === c.id &&
    active.wardId === c.wardId &&
    active.stakeId === c.stakeId;

  const handleDropIn = async (c) => {
    setBusyId(c.id);
    try {
      await dropIntoCircle(c);
      await load();
    } catch (e) {
      alert(trf('Could not drop in: {0}', [e.message]));
    } finally {
      setBusyId(null);
    }
  };

  const handleLeave = async (c) => {
    setBusyId(c.id);
    try {
      await leaveCircleDropIn(c);
      if (openCircle && openCircle.id === c.id) setOpenCircle(null);
      await load();
    } catch (e) {
      alert(trf('Could not leave: {0}', [e.message]));
    } finally {
      setBusyId(null);
    }
  };

  const handleOpen = async (c) => {
    try {
      const members = await getCircleMembers(db, c);
      setOpenMembers(members);
      setOpenCircle(c);
      setOpenTab('chat');
    } catch (e) {
      alert(trf('Could not open circle: {0}', [e.message]));
    }
  };

  if (!loading && scope === 'none') {
    return (
      <div className="p-6 text-gray-600">
        {tr('Dropping in is available to stake and ward leadership.')}
      </div>
    );
  }

  // Participation view for an opened circle
  if (openCircle) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setOpenCircle(null)}
              className="text-sm text-primary-600 hover:underline"
            >
              ← {tr('Back to circles')}
            </button>
            <h2 className="text-xl font-bold text-gray-800 mt-1">
              {openCircle.name}
            </h2>
            <p className="text-sm text-gray-500">
              {tr("You're dropped in. Anything you post stays here.")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOpenTab('chat')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                openTab === 'chat'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> {tr('Chat')}
            </button>
            <button
              onClick={() => setOpenTab('events')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                openTab === 'events'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" /> {tr('Activities')}
            </button>
          </div>
        </div>

        {openTab === 'chat' ? (
          <CircleChatView
            db={db}
            storage={storage}
            stakeId={openCircle.stakeId}
            wardId={openCircle.wardId}
            circleId={openCircle.id}
            currentMemberId={currentMemberId}
            currentMemberName={currentMemberName}
            circleMembers={openMembers}
          />
        ) : (
          <CircleEventsView
            db={db}
            storage={storage}
            stakeId={openCircle.stakeId}
            wardId={openCircle.wardId}
            circleId={openCircle.id}
            currentMemberId={currentMemberId}
            currentMemberName={currentMemberName}
            circleMembers={openMembers}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {scope === 'ward'
            ? tr('Circles in your ward. Drop in to one at a time to say hello and participate.')
            : tr('Circles in your stake. Drop in to one at a time to say hello and participate.')}
        </p>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" /> {tr('Refresh')}
        </button>
      </div>

      {loading && <div className="p-6 text-gray-500">{tr('Loading circles…')}</div>}
      {error && <div className="p-6 text-red-600">{error}</div>}

      {!loading && !error && circles.length === 0 && (
        <div className="p-6 text-gray-500">{tr('No circles found.')}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {circles.map((c) => {
          const memberCount = (c.memberIds || []).length;
          const visitorCount = (c.visitingAdmins || []).length;
          const activeHere = isActive(c);
          const busy = busyId === c.id;
          return (
            <div
              key={`${c.wardId}-${c.id}`}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{c.name}</h3>
                {activeHere && (
                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    {tr('Dropped in')}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-700 mt-1">{c.wardName}</p>
              <p className="text-sm text-gray-700">
                {c.captainName ? trf('Captain: {0}', [c.captainName]) : tr('No captain assigned')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {circleCountLabel(memberCount, visitorCount)}
              </p>

              {(c.memberNames || []).length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-gray-500 mb-1">{tr('Members')}</p>
                  <div className="grid grid-cols-3 gap-x-3 gap-y-0.5">
                    {c.memberNames.map((n, i) => (
                      <span
                        key={i}
                        className="text-xs text-gray-500 truncate"
                        title={n}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-3">
                {activeHere ? (
                  <>
                    <button
                      disabled={busy}
                      onClick={() => handleOpen(c)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg"
                    >
                      <LogIn className="w-4 h-4" /> {tr('Open')}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => handleLeave(c)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" /> {busy ? tr('Leaving…') : tr('Leave')}
                    </button>
                  </>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => handleDropIn(c)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    <Hand className="w-4 h-4" /> {busy ? tr('Dropping in…') : tr('Drop in')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
