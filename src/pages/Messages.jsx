import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, Smile, MoreHorizontal, MessageCircle, ArrowLeft, Trash2, Check, X } from 'lucide-react';
import { conversationsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const Messages = () => {
  const { id: urlChatId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(urlChatId || null); 
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // WhatsApp-like features state
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showOptionsId, setShowOptionsId] = useState(null);
  const [showReactId, setShowReactId] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleOnlineUpdate = (users) => {
      setOnlineUsers(users);
    };
    socketService.onOnlineUsersUpdate(handleOnlineUpdate);
    socketService.requestOnlineUsers(); // Fetch immediately on mount
    return () => socketService.offOnlineUsersUpdate(handleOnlineUpdate);
  }, []);

  useEffect(() => {
    if (urlChatId && urlChatId !== activeChat) {
      setActiveChat(urlChatId);
    }
  }, [urlChatId, activeChat]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await conversationsAPI.getAll();
        setConversations(res.data);
      } catch (err) {
        console.error('Failed to fetch conversations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeChat) {
      const fetchMessages = async () => {
        setMsgsLoading(true);
        try {
          const res = await conversationsAPI.getMessages(activeChat);
          setMessages(res.data);
          scrollToBottom();
          // Trigger navbar refresh after messages are marked as read
          window.dispatchEvent(new CustomEvent('refresh_unread_count'));
        } catch (err) {
          console.error('Failed to fetch messages', err);
        } finally {
          setMsgsLoading(false);
        }
      };
      fetchMessages();
      socketService.joinConversation(activeChat);
      return () => socketService.leaveConversation(activeChat);
    }
  }, [activeChat]);

  useEffect(() => {
    const playSound = () => {
      const audio = new Audio('/notification tone.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio blocked:', e));
    };

    const handleReceiveMessage = (data) => {
      const isForActiveChat = data.conversationId === activeChat;
      const isMine = data.sender?._id?.toString() === currentUser?._id?.toString();
      
      // Ignore messages sent by me (prevents duplicate rendering if socket leaks)
      if (isMine) return;

      setConversations(prev => prev.map(c => 
        c._id === data.conversationId 
          ? { 
              ...c, 
              lastMessage: { text: data.text, createdAt: data.createdAt }, 
              unreadCount: isForActiveChat ? 0 : (c.unreadCount || 0) + 1 
            } 
          : c
      ));

      if (isForActiveChat) {
        setMessages(prev => [...prev, data]);
        scrollToBottom();
        // Trigger navbar refresh since a new unread message arrived (or was read if on page)
        window.dispatchEvent(new CustomEvent('refresh_unread_count'));
      } else {
        playSound();
      }
    };

    const handleMessageUpdate = (data) => {
      setMessages(prev => prev.map(m => m._id === data._id ? { ...m, ...data } : m));
    };

    const handleMessageDelete = (data) => {
      setMessages(prev => prev.map(m => m._id === data._id ? { ...m, isDeleted: true, text: 'This message was deleted' } : m));
    };

    const handleMessageReact = (data) => {
      setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, reactions: data.reactions } : m));
    };

    const socket = socketService.getSocket();
    if (socket) {
      socket.on('receive_message', handleReceiveMessage);
      socket.on('message_updated', handleMessageUpdate);
      socket.on('message_deleted', handleMessageDelete);
      socket.on('message_reacted', handleMessageReact);
    }

    return () => {
      if (socket) {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('message_updated', handleMessageUpdate);
        socket.off('message_deleted', handleMessageDelete);
        socket.off('message_reacted', handleMessageReact);
      }
    };
  }, [activeChat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeChat) return;
    
    const text = newMsg;
    setNewMsg('');

    try {
      const res = await conversationsAPI.sendMessage(activeChat, { text });
      setMessages([...messages, res.data]);
      scrollToBottom();
      setConversations(prev => prev.map(c => 
        c._id === activeChat ? { ...c, lastMessage: { text, createdAt: new Date() } } : c
      ));
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleEdit = async (messageId) => {
    if (!editValue.trim()) return;
    try {
      const res = await conversationsAPI.editMessage(activeChat, messageId, editValue);
      setMessages(messages.map(m => m._id === messageId ? res.data : m));
      setEditingId(null);
    } catch (err) {
      console.error('Edit failed', err);
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await conversationsAPI.deleteMessage(activeChat, messageId);
      setMessages(messages.map(m => m._id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted' } : m));
      setShowOptionsId(null);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      const res = await conversationsAPI.reactToMessage(activeChat, messageId, emoji);
      setMessages(messages.map(m => m._id === messageId ? res.data : m));
      setShowReactId(null);
    } catch (err) {
      console.error('Reaction failed', err);
    }
  };

  const handleSelectChat = (chatId) => {
    if (chatId) navigate(`/messages/${chatId}`);
    else navigate('/messages');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionsId && !event.target.closest('.options-menu') && !event.target.closest('.options-trigger')) {
        setShowOptionsId(null);
      }
      if (showReactId && !event.target.closest('.react-menu') && !event.target.closest('.react-trigger')) {
        setShowReactId(null);
      }
    };

    if (showOptionsId || showReactId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptionsId, showReactId]);

  const getPartner = (c) => c.participants.find(p => p._id !== currentUser?._id);

  const activeConversation = conversations.find(c => c._id === activeChat);
  const partner = activeConversation ? getPartner(activeConversation) : null;

  const filteredConversations = conversations.reduce((acc, current) => {
    const p = getPartner(current);
    if (!p) return acc;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return acc;
    const existing = acc.find(c => getPartner(c)?._id === p._id);
    if (!existing) acc.push(current);
    else if (new Date(current.updatedAt) > new Date(existing.updatedAt)) {
      return acc.map(c => getPartner(c)?._id === p._id ? current : c);
    }
    return acc;
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] h-[calc(100vh-64px)] overflow-hidden bg-white">
      {/* Sidebar */}
      <div className={`flex flex-col border-r border-[#EFEFEF] bg-[#F7F7F5] h-full overflow-hidden ${activeChat !== null ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6">
          <h2 className="text-[20px] font-bold text-[#37352F] mb-6 tracking-tight">Messages</h2>
          <div className="relative group">
            <input 
              className="w-full bg-[#EFEFEF] border-transparent px-4 py-2.5 rounded-lg outline-none focus:bg-white focus:ring-4 focus:ring-black/5 placeholder:text-gray-400 text-sm font-medium transition-all" 
              placeholder="Search chats..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 px-2 pb-6">
          {loading ? (
            <div className="p-10 text-center text-gray-400 font-medium">Loading chats...</div>
          ) : filteredConversations.length > 0 ? filteredConversations.map(c => {
            const p = getPartner(c);
            return (
              <div 
                key={c._id} 
                onClick={() => handleSelectChat(c._id)}
                className={`p-4 rounded-xl cursor-pointer transition-all mb-1 ${activeChat === c._id ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-[#EFEFEF]'}`}
              >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-white border border-gray-100 rounded-xl flex items-center justify-center font-bold flex-shrink-0 overflow-hidden shadow-sm">
                    {p?.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" /> : p?.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="font-bold text-[14px] text-[#37352F] flex items-center gap-2">
                        {p?.name}
                        {onlineUsers.includes(p?._id) && <span className="w-2 h-2 bg-green-500 rounded-full border-2 border-white"></span>}
                      </div>
                      <span className="text-[10px] font-bold text-black/20 uppercase tracking-widest">
                        {c.lastMessage ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className={`text-[13px] truncate flex justify-between items-center gap-2 ${c.unreadCount > 0 ? 'text-black font-bold' : 'text-[#37352F]/50'}`}>
                      <span className="truncate font-medium">{c.lastMessage?.text || 'No messages yet'}</span>
                      {c.unreadCount > 0 && (
                        <span className="bg-black text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-10 text-center text-gray-400 font-medium">No conversations yet.</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex flex-col bg-white h-full overflow-hidden ${activeChat === null ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="p-4 px-8 border-b border-[#EFEFEF] flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex gap-4 items-center">
                <button onClick={() => navigate('/messages')} className="md:hidden text-gray-500 p-2">
                  <ArrowLeft size={24} />
                </button>
                <div className="w-10 h-10 bg-[#F7F7F5] border border-gray-100 rounded-xl flex items-center justify-center font-bold relative shadow-sm">
                  {partner?.avatar ? <img src={partner.avatar} className="w-full h-full object-cover rounded-xl" /> : partner?.name?.charAt(0)}
                  {onlineUsers.includes(partner?._id) && <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full z-10"></div>}
                </div>
                <div>
                  <div className="font-bold text-[#37352F] flex items-center gap-2 tracking-tight">
                    {partner?.name}
                    {onlineUsers.includes(partner?._id) && <span className="text-[10px] font-black uppercase tracking-widest text-green-500 bg-green-50 px-2 py-0.5 rounded-md">Online</span>}
                  </div>
                  <div className="text-[10px] font-bold text-black/20 uppercase tracking-widest mt-0.5">
                    {onlineUsers.includes(partner?._id) ? 'Active Now' : 'Offline'}
                  </div>
                </div>
              </div>
              <Link to={`/profile/${partner?._id}`} className="bg-white border border-gray-200 px-5 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm">Profile</Link>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-8 bg-white">
              {msgsLoading ? (
                <div className="flex flex-col gap-6 items-center py-20">
                  <div className="w-8 h-8 border-4 border-gray-100 border-t-black rounded-full animate-spin"></div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Syncing...</div>
                </div>
              ) : messages.map((m) => {
                const isMine = m.sender?._id === currentUser?._id;
                return (
                  <div key={m._id} className={`flex flex-col group max-w-[80%] ${isMine ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div className="relative flex items-center gap-3">
                      {/* Reaction Picker Trigger (on hover) */}
                      {!m.isDeleted && (
                        <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${isMine ? 'order-first' : 'order-last'}`}>
                          <button onClick={() => setShowReactId(showReactId === m._id ? null : m._id)} className="text-gray-300 hover:text-black transition-all p-1.5 react-trigger bg-gray-50 rounded-lg">
                            <Smile size={16} />
                          </button>
                          {isMine && (
                            <button onClick={() => setShowOptionsId(showOptionsId === m._id ? null : m._id)} className="text-gray-300 hover:text-black transition-all p-1.5 options-trigger bg-gray-50 rounded-lg">
                              <MoreHorizontal size={16} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Reaction Floating Menu */}
                      {showReactId === m._id && (
                        <div className={`absolute bottom-full mb-3 bg-white border border-gray-100 shadow-2xl rounded-2xl p-2 flex gap-2 z-20 animate-in fade-in slide-in-from-bottom-2 duration-300 react-menu ${isMine ? 'right-0' : 'left-0'}`}>
                          {REACTION_EMOJIS.map(e => (
                            <button key={e} onClick={() => handleReact(m._id, e)} className="hover:scale-125 transition-transform text-xl p-1">{e}</button>
                          ))}
                        </div>
                      )}

                      {/* Options Menu */}
                      {showOptionsId === m._id && (
                        <div className={`absolute bottom-full mb-3 bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden z-20 flex flex-col min-w-[140px] options-menu ${isMine ? 'right-0' : 'left-0'}`}>
                          <button onClick={() => { setEditingId(m._id); setEditValue(m.text); setShowOptionsId(null); }} className="px-4 py-3 text-left text-xs font-bold hover:bg-gray-50 transition-all uppercase tracking-widest text-[#37352F]">Edit</button>
                          <button onClick={() => handleDelete(m._id)} className="px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 transition-all border-t border-gray-50 uppercase tracking-widest">Delete</button>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`relative p-4 px-6 rounded-2xl text-[15px] leading-relaxed shadow-sm ${isMine ? 'bg-black text-white rounded-br-none' : 'bg-[#F7F7F5] text-[#37352F] rounded-bl-none'} ${m.isDeleted ? 'italic opacity-50' : ''}`}>
                        {editingId === m._id ? (
                          <div className="flex flex-col gap-4 min-w-[240px]">
                            <textarea 
                              className="w-full bg-white/10 text-white border border-white/20 p-3 rounded-lg outline-none focus:border-white/50 min-h-[80px] font-medium"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              autoFocus
                            />
                            <div className="flex gap-3 justify-end">
                              <button onClick={() => setEditingId(null)} className="text-[10px] uppercase font-black tracking-widest opacity-60 hover:opacity-100">Cancel</button>
                              <button onClick={() => handleEdit(m._id)} className="text-[10px] uppercase font-black tracking-widest bg-white text-black px-4 py-1.5 rounded-md shadow-sm">Save Changes</button>
                            </div>
                          </div>
                        ) : (
                          <div className="font-medium">
                            {m.text}
                            {m.isEdited && !m.isDeleted && <span className="text-[10px] font-bold opacity-30 ml-2 uppercase tracking-widest">(edited)</span>}
                          </div>
                        )}

                        {/* Reactions Display */}
                        {m.reactions?.length > 0 && (
                          <div className={`absolute -bottom-4 flex gap-1.5 flex-wrap ${isMine ? 'right-0' : 'left-0'}`}>
                            {Array.from(new Set(m.reactions.map(r => r.emoji))).map((emoji, i) => (
                              <div key={i} className="bg-white border border-gray-100 shadow-md rounded-lg px-2 py-1 text-[13px] flex items-center gap-1.5 animate-in zoom-in duration-300">
                                <span>{emoji}</span>
                                <span className="text-[10px] font-black text-black/40">{m.reactions.filter(r => r.emoji === emoji).length}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`text-[9px] font-bold text-black/20 mt-3 uppercase tracking-[0.2em] px-1 ${isMine ? 'text-right' : 'text-left'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 px-10 border-t border-[#EFEFEF] bg-white">
              <form onSubmit={handleSend} className="flex gap-4 items-center max-w-[1000px] mx-auto w-full group">
                <div className="flex-1 relative">
                  <input 
                    className="w-full bg-[#F7F7F5] border-transparent px-6 py-4 rounded-2xl outline-none focus:bg-white focus:ring-8 focus:ring-black/5 transition-all text-[15px] font-medium" 
                    placeholder="Message your partner..." 
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)} 
                  />
                </div>
                <button type="submit" className="bg-black text-white rounded-2xl w-14 h-14 flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform active:scale-95 shadow-2xl">
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#37352F]/20 gap-8 bg-white">
             <div className="bg-[#F7F7F5] p-10 rounded-3xl animate-pulse">
               <MessageCircle size={80} />
             </div>
             <div className="text-center">
               <p className="text-2xl font-bold tracking-tight text-[#37352F]">Your Inbox</p>
               <p className="text-sm font-medium mt-2">Select a conversation to start swapping expertise.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
