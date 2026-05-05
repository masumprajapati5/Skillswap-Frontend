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
    return <div className="py-24 text-center text-gray-500 animate-pulse">Loading sessions...</div>;
  }

  return (
    <div className="py-20 px-6 max-w-[1000px] mx-auto">
      <div className="mb-14">
        <h1 className="text-4xl font-medium mb-2">Sessions</h1>
        <p className="text-gray-500 text-lg">Track and manage your upcoming and past skill swaps.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-100 mb-10 overflow-x-auto pb-px">
        {['upcoming', 'pending', 'past'].map(t => (
          <button 
            key={t} 
            onClick={() => setTab(t)}
            className={`bg-transparent border-none py-4 text-sm font-semibold uppercase tracking-widest cursor-pointer relative whitespace-nowrap transition-colors ${tab === t ? 'text-black' : 'text-gray-400'}`}
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
            <div key={s._id} className="flex flex-col lg:flex-row justify-between items-start lg:items-center py-8 sm:py-10 border-t border-gray-100 first:border-0 gap-6 lg:gap-0 group">
              <div className="flex gap-4 sm:gap-6 items-center w-full lg:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                  {partner?.avatar ? <img src={partner.avatar} className="w-full h-full object-cover" /> : partner?.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-lg sm:text-xl font-bold mb-1 tracking-tight">{s.title || 'Skill Swap Session'}</div>
                  <div className="font-outfit text-[12px] sm:text-sm text-gray-500 font-medium leading-relaxed">
                    with {partner?.name} · {new Date(s.scheduledDate).toLocaleDateString()} at {s.scheduledTime || 'TBD'}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
                <span className={`text-[9px] sm:text-[11px] font-black border px-3 py-1.5 rounded tracking-widest uppercase inline-block ${
                  s.status === 'scheduled' ? 'border-green-500 text-green-500' : 
                  s.status === 'completed' ? 'border-black bg-black text-white' : 'border-black text-black'
                }`}>
                   {s.status}
                </span>
                <div className="flex gap-3 w-full sm:w-auto">
                  {s.status === 'scheduled' && (
                    <Link to={`/video-room/${s._id}`} className="flex-1 sm:flex-initial text-center bg-black text-white border border-black px-6 py-2.5 rounded text-xs font-bold hover:bg-white hover:text-black transition-all shadow-lg active:scale-95 uppercase tracking-widest">
                      Join
                    </Link>
                  )}
                  <Link to={`/sessions/${s._id}`} className="flex-1 sm:flex-initial text-center bg-white border border-gray-200 text-black px-6 py-2.5 rounded text-xs font-bold hover:border-black transition-all shadow-sm uppercase tracking-widest">
                    Details
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-24 border-t border-gray-100">
          <p className="text-xl text-gray-400 font-medium">No {tab} sessions found.</p>
        </div>
      )}
    </div>
  );
};

export default Sessions;

