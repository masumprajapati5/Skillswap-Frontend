import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { sessionsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket';

const VideoCall = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await sessionsAPI.getById(sessionId);
        setSession(res.data);
        if (res.data.status === 'completed' || res.data.status === 'cancelled') {
          navigate(`/sessions/${sessionId}`);
        }
      } catch (err) {
        console.error('Failed to fetch session', err);
        navigate('/sessions');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId, navigate]);

  // Socket listener for session updates (e.g., other user marks as complete)
  useEffect(() => {
    const handleUpdate = (data) => {
      if (data.sessionId === sessionId && (data.type === 'session_completed' || data.type === 'session_cancelled')) {
        navigate(`/sessions/${sessionId}`);
      }
    };

    socketService.socket?.on('session_update', handleUpdate);
    return () => {
      socketService.socket?.off('session_update', handleUpdate);
    };
  }, [sessionId, navigate]);

  const handleMarkComplete = async () => {
    if (window.confirm('Are you sure you want to mark this session as completed? Both users will be disconnected from the call.')) {
      setActionLoading(true);
      try {
        await sessionsAPI.complete(sessionId);
        navigate(`/sessions/${sessionId}`);
      } catch (err) {
        console.error('Failed to complete session', err);
        alert(err.response?.data?.message || 'Failed to complete session');
      } finally {
        setActionLoading(false);
      }
    }
  };

  useEffect(() => {
    if (loading || !session || !jitsiContainerRef.current) return;

    // Load Jitsi External API script
    const domain = 'meet.jit.si';
    const options = {
      roomName: `SkillSwap_${session._id}`,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: user.name,
        email: user.email || ''
      },
      interfaceConfigOverwrite: {
        // Customize UI
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
          'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
          'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
          'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
          'security'
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        AUTHENTICATION_ENABLE: false,
        MOBILE_APP_PROMO: false,
      },
      configOverwrite: {
        disableDeepLinking: true,
        prejoinPageEnabled: false,
        enableWelcomePage: false,
      },
    };

    // Load the script dynamically
    const script = document.createElement('script');
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => {
      jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      
      jitsiApiRef.current.addEventListeners({
        videoConferenceLeft: () => {
          navigate(`/sessions/${sessionId}`);
        },
      });
    };
    document.body.appendChild(script);

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [loading, session, user, sessionId, navigate]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <p className="font-outfit uppercase tracking-[0.3em] text-[11px] opacity-60">Initializing Secure Call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] w-full bg-black relative overflow-hidden">
      {/* Call Info Overlay */}
      <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center pointer-events-none">
        <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 pointer-events-auto">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-white text-[11px] font-bold uppercase tracking-widest">{session?.title || 'Session'} Call</span>
        </div>

        <div className="flex gap-3 pointer-events-auto">
          <button 
            onClick={handleMarkComplete}
            disabled={actionLoading}
            className="bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-full transition-all shadow-lg flex items-center gap-2"
          >
            {actionLoading ? 'Processing...' : (
              <span className="flex items-center gap-1">
                <Check size={14} /> Mark Completed
              </span>
            )}
          </button>
          <button 
            onClick={() => navigate(`/sessions/${sessionId}`)}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-full transition-all"
          >
            Exit Room
          </button>
        </div>
      </div>

      {/* Jitsi Container */}
      <div ref={jitsiContainerRef} className="w-full h-full" />
    </div>
  );
};

export default VideoCall;
