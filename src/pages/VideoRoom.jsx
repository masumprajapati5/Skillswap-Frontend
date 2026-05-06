import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket';

const VideoRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await sessionsAPI.getById(id);
        setSession(res.data);
        if (res.data.status === 'completed' || res.data.status === 'cancelled') {
          navigate(`/sessions/${id}`);
        }
      } catch (err) {
        console.error('Failed to load session', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id, navigate]);

  const handleMarkComplete = async () => {
    if (window.confirm('Are you sure you want to mark this session as completed? Both users will be disconnected from the call.')) {
      setActionLoading(true);
      try {
        await sessionsAPI.complete(id);
        if (apiRef.current) apiRef.current.dispose();
        navigate(`/sessions/${id}`);
      } catch (err) {
        console.error('Failed to complete session', err);
        alert(err.response?.data?.message || 'Failed to complete session');
      } finally {
        setActionLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!loading && session && jitsiContainerRef.current) {
      const scriptId = 'jitsi-external-api';
      
      const initJitsi = () => {
        const domain = 'meet.jit.si';
        const options = {
          roomName: `SkillSwap_Session_${id}`,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: user?.name || 'SkillSwap User',
            email: user?.email || ''
          },
          configOverwrite: {
            startWithAudioMuted: false,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
            enableWelcomePage: false,
            enableUserRolesBasedOnToken: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security'
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            AUTHENTICATION_ENABLE: false,
            MOBILE_APP_PROMO: false,
          }
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        apiRef.current = api;

        api.addEventListeners({
          readyToClose: () => navigate(`/sessions/${id}`),
          videoConferenceLeft: () => navigate(`/sessions/${id}`)
        });
      };

      if (!window.JitsiMeetExternalAPI) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = initJitsi;
        document.body.appendChild(script);
      } else {
        initJitsi();
      }

      // Real-time listener for "Mark as Completed"
      const handleUpdate = (data) => {
        if (data.sessionId === id && (data.type === 'session_completed' || data.type === 'session_cancelled')) {
          if (apiRef.current) apiRef.current.dispose();
          navigate(`/sessions/${id}`);
        }
      };
      socketService.socket?.on('session_update', handleUpdate);

      // Security: Force camera/mic off on tab close
      const handleBeforeUnload = () => {
        if (apiRef.current) apiRef.current.dispose();
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        socketService.socket?.off('session_update', handleUpdate);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (apiRef.current) {
          apiRef.current.dispose();
          apiRef.current = null;
        }
      };
    }
  }, [loading, session, id, user, navigate]);

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white gap-4 sm:gap-6 px-4">
      <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
      <div className="font-medium tracking-widest text-[10px] sm:text-xs uppercase opacity-50">Establishing Secure Line...</div>
    </div>
  );

  if (!session) return (
    <div className="h-screen bg-black flex items-center justify-center text-white font-medium px-4 text-center">
      Session connection failed.
    </div>
  );

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden relative">
      {/* Integrated Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-3 sm:p-6 z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center pointer-events-none gap-2 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-4 bg-black/40 backdrop-blur-xl px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-white/10 pointer-events-auto max-w-full overflow-hidden">
          <div className="bg-red-500 w-2 h-2 rounded-full animate-pulse flex-shrink-0" />
          <div className="text-xs sm:text-sm font-bold tracking-tight truncate">{session.title}</div>
          <div className="h-4 w-px bg-white/20 mx-1 sm:mx-2 hidden sm:block" />
          <div className="text-[9px] sm:text-[11px] font-bold uppercase tracking-widest opacity-50 hidden sm:block">Live Session</div>
        </div>
        
        <div className="flex gap-2 sm:gap-3 pointer-events-auto w-full sm:w-auto">
          <button 
            onClick={handleMarkComplete}
            disabled={actionLoading}
            className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all shadow-2xl active:scale-95 flex-1 sm:flex-initial"
          >
            {actionLoading ? 'Saving...' : 'Mark Completed'}
          </button>
          <button 
            onClick={() => navigate(`/sessions/${id}`)}
            className="bg-white text-black px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all shadow-2xl active:scale-95 flex-1 sm:flex-initial"
          >
            Exit Room
          </button>
        </div>
      </div>

      {/* Jitsi Container */}
      <div ref={jitsiContainerRef} className="flex-1 w-full h-full bg-[#1a1a1a]" />

      {/* Subtle Branding */}
      <div className="absolute bottom-4 right-4 sm:right-6 pointer-events-none z-20">
        <div className="flex items-center gap-2 opacity-30">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">SkillSwap</span>
          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full" />
          <span className="text-[9px] sm:text-[10px] font-medium opacity-50">v1.2.0-SECURE</span>
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
