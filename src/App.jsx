import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { conversationsAPI, sessionsAPI, notificationsAPI } from './services/api';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Sessions from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import Messages from './pages/Messages';
import Wallet from './pages/Wallet';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';
import RequestSwap from './pages/RequestSwap';
import VideoRoom from './pages/VideoRoom';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

import socketService from './services/socket';
import ProtectedRoute from './components/auth/ProtectedRoute';
import toast, { Toaster } from 'react-hot-toast';

function App() {
  const location = useLocation();
  const { user, loadUser } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingSessionsCount, setPendingSessionsCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);

  const knownPaths = [
    '/', '/auth', '/dashboard', '/explore', '/profile', '/sessions', 
    '/request-swap', '/messages', '/wallet', '/notifications', 
    '/admin', '/video-room', '/reset-password'
  ];

  const isNotFound = !knownPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

  const hideNavbar = isNotFound || ['/admin', '/auth', '/reset-password', '/video-room'].some(p => location.pathname.startsWith(p));
  const hideFooter = isNotFound || ['/messages', '/auth', '/video-room', '/admin', '/reset-password'].some(p => location.pathname.startsWith(p));
  const hidePadding = isNotFound || ['/', '/auth', '/messages', '/video-room', '/admin', '/reset-password'].some(p => location.pathname.startsWith(p));

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    if (user) {
      socketService.connect(user._id);
      
      const fetchUnread = async () => {
        try {
          const res = await conversationsAPI.getUnreadCount();
          setUnreadCount(res.data.count);
        } catch (err) {
          console.error('Failed to fetch unread count', err);
        }
      };

      const fetchPendingSessions = async () => {
        try {
          const res = await sessionsAPI.getPendingCount();
          setPendingSessionsCount(res.data.count);
        } catch (err) {
          console.error('Failed to fetch pending sessions count', err);
        }
      };

      const fetchNotificationsCount = async () => {
        try {
          const res = await notificationsAPI.getAll();
          setNotificationsCount(res.data.unreadCount); // Use the backend provided unreadCount
        } catch (err) {
          console.error('Failed to fetch notifications count', err);
        }
      };

      fetchUnread();
      fetchPendingSessions();
      fetchNotificationsCount();
      
      const playNotificationSound = () => {
        try {
          const audio = new Audio('/notification tone.mp3');
          audio.volume = 0.5;
          audio.play().catch(e => console.log('Autoplay blocked or audio failed:', e));
        } catch (err) {
          console.error('Error playing sound:', err);
        }
      };
      
      const handleMsg = (data) => {
        // Ignore messages sent by current user
        if (data.sender?._id?.toString() === user?._id?.toString()) return;
        
        // Use locationRef to avoid stale closures
        if (locationRef.current.pathname !== `/messages/${data.conversationId}`) {
          fetchUnread();
          playNotificationSound();
        }
      };

      const handleNotification = (notification) => {
        // Ignore notifications meant for other users
        const targetUserId = notification.user?._id || notification.user;
        if (targetUserId?.toString() !== user?._id?.toString()) return;
        
        playNotificationSound();
        fetchNotificationsCount();
      };

      const handleSessionUpdate = () => {
        fetchPendingSessions();
        fetchNotificationsCount();
        playNotificationSound();
      };

      const handleSessionReminder = (data) => {
        toast.success(data.message, {
          icon: '⏰',
          duration: 10000,
        });
        playNotificationSound();
        fetchNotificationsCount();
      };

      socketService.onMessageReceived(handleMsg);
      socketService.socket?.on('session_update', handleSessionUpdate);
      socketService.socket?.on('notification_received', handleNotification);
      socketService.socket?.on('session_reminder', handleSessionReminder);
      
      window.addEventListener('refresh_notifications_count', fetchNotificationsCount);
      window.addEventListener('refresh_unread_count', fetchUnread);
      
      return () => {
        socketService.offMessageReceived(handleMsg);
        socketService.socket?.off('session_update', handleSessionUpdate);
        socketService.socket?.off('notification_received', handleNotification);
        socketService.socket?.off('session_reminder', handleSessionReminder);
        window.removeEventListener('refresh_notifications_count', fetchNotificationsCount);
        window.removeEventListener('refresh_unread_count', fetchUnread);
      };
    } else {
      socketService.disconnect();
    }
  }, [user]);

  // Handle count clearing on navigation (Less aggressive now, relies on database state)
  useEffect(() => {
    if (location.pathname.startsWith('/notifications')) {
      setNotificationsCount(0);
    }
  }, [location.pathname]);
;

  return (
    <div className="app-container">
      <Toaster 
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#000000',
            color: '#ffffff',
            borderRadius: '0px',
            padding: '16px 24px',
            fontSize: '12px',
            fontWeight: '600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontFamily: '"Outfit", sans-serif',
            border: '1px solid #000000',
            boxShadow: '10px 10px 0px rgba(0,0,0,0.1)'
          },
          success: {
            icon: '●',
          },
          error: {
            icon: '✕',
          },
        }}
      />
      {!hideNavbar && (
        <Navbar 
          unreadCount={unreadCount} 
          pendingSessionsCount={pendingSessionsCount} 
          notificationsCount={notificationsCount}
        />
      )}
      
      <div>
        
          <Routes key={location.pathname} location={location}>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={
              <ProtectedRoute guestOnly>
                <Auth />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/explore" element={<Explore />} />
            <Route path="/profile/:id" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/profile/edit" element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            } />
            <Route path="/sessions" element={
              <ProtectedRoute>
                <Sessions />
              </ProtectedRoute>
            } />
            <Route path="/sessions/:id" element={
              <ProtectedRoute>
                <SessionDetail />
              </ProtectedRoute>
            } />
            <Route path="/request-swap/:id" element={
              <ProtectedRoute>
                <RequestSwap />
              </ProtectedRoute>
            } />
            <Route path="/messages/:id?" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            } />
            <Route path="/video-room/:id" element={
              <ProtectedRoute>
                <VideoRoom />
              </ProtectedRoute>
            } />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
      </div>

      {!hideFooter && <Footer />}
    </div>
  );
}

export default App;
