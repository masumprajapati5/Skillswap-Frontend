import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sessionsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket';

const Sessions = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState('upcoming');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await sessionsAPI.getAll();
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      fetchSessions();
    };

    socketService.socket?.on('session_update', handleUpdate);
    return () => {
      socketService.socket?.off('session_update', handleUpdate);
    };
  }, []);

  const filtered = sessions.filter(s => {
    if (tab === 'upcoming') return s.status === 'scheduled';
    if (tab === 'pending') return s.status === 'pending';
    if (tab === 'past') return s.status === 'completed' || s.status === 'cancelled' || s.status === 'declined';
    return true;
  });

  if (loading) {
    return <div className="py-16 sm:py-24 text-center text-gray-500 animate-pulse">Loading sessions...</div>;
  }

  return (
    <div className="responsive-container-narrow" style={{ paddingTop: 'clamp(2rem, 4vw, 5rem)', paddingBottom: 'clamp(2rem, 4vw, 5rem)' }}>
      <div className="mb-8 sm:mb-14">
        <h1 className="text-heading-md mb-2 tracking-tight">Sessions</h1>
        <p className="text-gray-500 text-base sm:text-lg">Track and manage your upcoming and past skill swaps.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 sm:gap-8 border-b border-gray-100 mb-6 sm:mb-10 overflow-x-auto pb-px scrollbar-hide">
        {['upcoming', 'pending', 'past'].map(t => (
          <button 
            key={t} 
            onClick={() => setTab(t)}
            className={`bg-transparent border-none py-3 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-widest cursor-pointer relative whitespace-nowrap transition-colors tap-target ${tab === t ? 'text-black' : 'text-gray-400'}`}
          >
            {t}
            {tab === t && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
          </button>
        ))}
      </div>

      {/* Session List */}
      <div className="flex flex-col">
        {filtered.map((s) => {
          const partner = s.requester?._id === user?._id ? s.recipient : s.requester;
          return (
            <div key={s._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 sm:py-10 border-t border-gray-100 first:border-0 gap-4 sm:gap-6 group">
              <div className="flex gap-4 sm:gap-6 items-center w-full sm:w-auto min-w-0">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-black text-white rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                  {partner?.avatar ? <img src={partner.avatar} className="w-full h-full object-cover" /> : partner?.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-base sm:text-xl font-semibold mb-0.5 sm:mb-1 truncate">{s.title || 'Skill Swap Session'}</div>
                  <div className="font-outfit text-xs sm:text-sm text-gray-500 truncate">
                    with {partner?.name} · {new Date(s.scheduledDate).toLocaleDateString()} at {s.scheduledTime || 'TBD'} · {s.duration || 60}min
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-6 justify-between w-full sm:w-auto flex-wrap">
                <span className={`text-[10px] sm:text-[11px] font-bold border px-2 sm:px-3 py-1 rounded tracking-widest uppercase ${
                  s.status === 'scheduled' ? 'border-green-500 text-green-500' : 
                  s.status === 'completed' ? 'border-black bg-black text-white' : 'border-black text-black'
                }`}>
                   {s.status}
                </span>
                <div className="flex gap-2 sm:gap-3">
                  {s.status === 'scheduled' && (
                    <Link to={`/video-room/${s._id}`} className="bg-black text-white border border-black px-4 sm:px-6 py-2 sm:py-2.5 rounded text-[12px] sm:text-[13px] font-bold hover:bg-white hover:text-black transition-all shadow-lg active:scale-95 whitespace-nowrap">
                      Join Call
                    </Link>
                  )}
                  <Link to={`/sessions/${s._id}`} className="bg-white border border-gray-200 text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded text-[12px] sm:text-[13px] font-medium hover:border-black transition-all shadow-sm whitespace-nowrap">
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 sm:py-24 border-t border-gray-100">
          <p className="text-lg sm:text-xl text-gray-400 font-medium">No {tab} sessions found.</p>
        </div>
      )}
    </div>
  );
};

export default Sessions;
