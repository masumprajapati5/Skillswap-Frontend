import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Calendar, Bell, ChevronRight, Check } from 'lucide-react';
import { notificationsAPI } from '../services/api';
import socketService from '../services/socket';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Automatically mark all as read when opening activity center
    const markAllRead = async () => {
      try {
        await notificationsAPI.markAllRead();
        window.dispatchEvent(new Event('refresh_notifications_count'));
      } catch (err) {
        console.error('Failed to mark all notifications as read', err);
      }
    };
    markAllRead();

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
    };

    socketService.socket?.on('notification_received', handleNewNotification);

    return () => {
      socketService.socket?.off('notification_received', handleNewNotification);
    };
  }, []);

  const handleCategoryClick = async (type) => {
    // Mark all notifications of this type as read in one go
    try {
      const typeNotifs = notifications.filter(n => {
        if (type === 'system') return n.type === 'system' && n.content.includes('credits');
        return n.type === type;
      });
      
      const hasUnread = typeNotifs.some(n => !n.isRead);
      
      if (hasUnread) {
        await notificationsAPI.markCategoryRead(type);
        setNotifications(prev => prev.map(n => {
          const isSameType = type === 'system' ? (n.type === 'system' && n.content.includes('credits')) : (n.type === type);
          return isSameType ? { ...n, isRead: true } : n;
        }));
        
        // Notify App.jsx to refresh badge
        window.dispatchEvent(new Event('refresh_notifications_count'));
      }
    } catch (err) {
      console.error('Failed to mark category as read', err);
    }

    if (type === 'message') navigate('/messages');
    else if (type === 'session_request') navigate('/sessions');
    else if (type === 'system') navigate('/wallet');
  };

  const getLatest = (type) => {
    return notifications.find(n => n.type === type);
  };

  const getUnreadCount = (type) => {
    if (type === 'message') {
      // Count unique unread chats (conversations)
      const unreadChats = new Set(
        notifications
          .filter(n => n.type === 'message' && !n.isRead)
          .map(n => n.reference?.toString())
      );
      return unreadChats.size;
    }
    return notifications.filter(n => n.type === type && !n.isRead).length;
  };

  if (loading) {
    return (
      <div className="py-20 px-6 max-w-[1000px] mx-auto text-center">
        <p className="text-gray-400 font-outfit uppercase tracking-widest text-[11px]">Loading Activity Center...</p>
      </div>
    );
  }

  const categories = [
    { 
      id: 'message', 
      title: 'Messages', 
      icon: <MessageCircle size={24} />, 
      desc: 'View your latest conversations.'
    },
    { 
      id: 'session_request', 
      title: 'Sessions', 
      icon: <Calendar size={24} />, 
      desc: 'Check swap status and updates.'
    }
  ];

  return (
    <div className="py-20 px-6 max-w-[800px] mx-auto min-h-[70vh]">
      <div className="mb-16">
        <h1 className="text-4xl font-medium mb-3 tracking-tight">Notifications</h1>
        <p className="text-gray-500 text-lg">Grouped activity and platform updates.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map(cat => {
          const latest = getLatest(cat.id);
          const count = getUnreadCount(cat.id);
          
          return (
            <div 
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className="group cursor-pointer border border-gray-100 p-8 rounded-3xl transition-all hover:border-black bg-white flex flex-col justify-between min-h-[300px]"
            >
              <div>
                <div className="flex justify-between items-start mb-10">
                  <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">
                    {cat.icon}
                  </div>
                  {count > 0 && (
                    <div className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-widest">
                      {count} NEW
                    </div>
                  )}
                </div>
                
                <h3 className="text-2xl font-medium mb-3 tracking-tight">{cat.title}</h3>
                <p className="text-[13px] text-gray-400 leading-relaxed font-normal">
                  {cat.desc}
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-50">
                {latest ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-2">Latest Update</p>
                    <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed">
                      {latest.content}
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-200">No activity yet</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
