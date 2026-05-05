import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const Admin = () => {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('adminActiveTab') || 'Overview';
  });

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);
  const [stats, setStats] = useState({ totalUsers: 0, totalSkills: 0, activeSessions: 0, pendingSessions: 0, completedSessions: 0, totalCredits: 0 });
  const [users, setUsers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [newSkill, setNewSkill] = useState({ name: '', description: '' });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, type: null, id: null, title: '', message: '', name: '' });
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuthStore();

  // Admin guard
  useEffect(() => {
    if (!authUser || authUser.role !== 'admin') {
      navigate('/auth');
    }
  }, [authUser, navigate]);

  // Fetch all data on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, usersRes, skillsRes, sessionsRes, reviewsRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getUsers(),
          adminAPI.getSkills(),
          adminAPI.getSessions(),
          adminAPI.getReviews(),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setSkills(skillsRes.data);
        setSessions(sessionsRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error('Admin data fetch failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Handlers
  const confirmBlockUser = (id, name, isBlocked) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'user',
      id: id,
      title: isBlocked ? 'Unblock User' : 'Block User',
      message: `Are you sure you want to ${isBlocked ? 'unblock' : 'block'} the user "${name}"? ${isBlocked ? 'They will regain access to the platform.' : 'They will be immediately logged out and lose access.'}`,
      isBlockedAction: !isBlocked
    });
  };

  const confirmDeleteSkill = (id, name) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'skill',
      id: id,
      title: 'Delete Skill',
      message: `Are you sure you want to permanently delete the skill "${name}"? This action cannot be undone.`
    });
  };

  const confirmDeleteReview = (id) => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'review',
      id: id,
      title: 'Delete Review',
      message: `Are you sure you want to permanently delete this review? This action cannot be undone.`
    });
  };

  const proceedWithDelete = async () => {
    const { type, id } = deleteConfirmation;
    try {
      if (type === 'user') {
        await adminAPI.blockUser(id);
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isBlocked: !u.isBlocked } : u));
      } else if (type === 'skill') {
        await adminAPI.deleteSkill(id);
        setSkills(prev => prev.filter(s => s._id !== id));
        setStats(prev => ({ ...prev, totalSkills: prev.totalSkills - 1 }));
      } else if (type === 'review') {
        await adminAPI.deleteReview(id);
        setReviews(prev => prev.filter(r => r._id !== id));
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to delete ${type}`);
    } finally {
      setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '', message: '', name: '' });
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await adminAPI.updateRole(id, newRole);
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    try {
      if (editingSkillId) {
        const res = await adminAPI.editSkill(editingSkillId, newSkill);
        setSkills(prev => prev.map(s => s._id === editingSkillId ? res.data : s));
      } else {
        const res = await adminAPI.addSkill(newSkill);
        setSkills(prev => [...prev, res.data]);
        setStats(prev => ({ ...prev, totalSkills: prev.totalSkills + 1 }));
      }
      setShowAddSkill(false);
      setNewSkill({ name: '', description: '' });
      setEditingSkillId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save skill');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Filter helpers
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSkills = skills.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReviews = reviews.filter(r =>
    r.reviewer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reviewee?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSessions = sessions.filter(s =>
    s.requester?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.provider?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const menuItems = [
    { label: 'Overview', id: 'Overview' },
    { label: 'Users', id: 'Users' },
    { label: 'Skills', id: 'Library' },
    { label: 'Sessions', id: 'Sessions' },
    { label: 'Reviews', id: 'Reviews' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="font-['Outfit'] text-[11px] font-medium tracking-[0.3em] text-gray-400 uppercase animate-pulse">Initializing Admin Panel...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen bg-white text-black">

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-[200] flex flex-col items-center justify-center gap-8">
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => { setActiveTab(item.id); setSearchTerm(''); setMobileMenuOpen(false); }}
              className={`text-2xl text-black bg-transparent border-none ${activeTab === item.id ? 'font-bold' : ''}`}
            >
              {item.label}
            </button>
          ))}
          <button 
            onClick={() => { setMobileMenuOpen(false); handleLogout(); }} 
            className="text-2xl text-red-500 font-medium bg-transparent border-none"
          >
            Log Out
          </button>

          {/* Absolute Bottom Footer for Exit Admin */}
          <div className="absolute bottom-0 left-0 w-full border-t border-gray-50 py-8 flex justify-center bg-white pb-12">
            <button
              onClick={() => { setMobileMenuOpen(false); navigate('/'); }}
              className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors font-['Outfit'] text-[15px] font-medium"
            >
              <span className="text-xl leading-none mb-[2px]">←</span>
              Exit Admin
            </button>
          </div>
        </div>
      )}

      {/* ─── Sidebar ─── */}
      <aside className="w-full md:w-[200px] md:min-w-[200px] border-b md:border-b-0 md:border-r border-gray-100 flex flex-col h-auto md:h-screen bg-white md:overflow-y-auto">
        <div className="px-6 md:px-8 py-4 md:pt-10 md:pb-6 flex justify-between items-center relative z-[201]">
          <Link to="/" className="flex items-center gap-3 no-underline text-black">
            <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5 md:w-6 md:h-6">
              <circle cx="10" cy="16" r="5" fill="#000"/>
              <circle cx="22" cy="16" r="5" fill="#000"/>
              <path d="M15 16 Q16 12 17 16" stroke="#000" strokeWidth="2" fill="none"/>
            </svg>
            <span className="font-bold text-lg tracking-tighter">SkillSwap</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="block md:hidden bg-none border-none cursor-pointer p-2"
          >
            <div className={`w-6 h-0.5 bg-black mb-1.5 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-[8px]' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-black mb-1.5 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></div>
            <div className={`w-6 h-0.5 bg-black transition-transform duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-[8px]' : ''}`}></div>
          </button>
        </div>

        <nav className="hidden md:block flex-1 px-4 pt-6">
          <ul className="space-y-0.5">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => { setActiveTab(item.id); setSearchTerm(''); }}
                  className={`w-full text-left px-4 py-2.5 transition-all duration-200 font-['Outfit'] text-[14px] leading-[20px] ${
                    activeTab === item.id
                      ? 'text-black font-bold'
                      : 'text-black font-medium opacity-70 hover:opacity-100'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:block px-8 py-8 border-t border-gray-50">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors font-['Outfit'] text-[14px] leading-[20px] font-medium"
          >
            <span className="text-lg leading-none mb-[2px]">←</span>
            Exit Admin
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0 h-auto md:h-screen overflow-y-auto">

        {/* Tab Title + Search */}
        <div className="px-6 md:px-12 pt-12 md:pt-16 pb-6 md:pb-8 flex flex-col md:flex-row md:items-end justify-between flex-shrink-0 gap-4">
          <h1 className="font-['Outfit'] font-medium text-[28px] md:text-[36px] leading-[32px] md:leading-[40px] text-black tracking-tight">{activeTab === 'Overview' ? 'Dashboard' : activeTab === 'Library' ? 'Skills' : activeTab}</h1>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {(activeTab === 'Users' || activeTab === 'Library' || activeTab === 'Sessions' || activeTab === 'Reviews') && (
              <input
                type="text"
                placeholder={
                  activeTab === 'Users' ? 'SEARCH USERNAME...' : 
                  activeTab === 'Reviews' ? 'SEARCH BY NAME...' : 
                  activeTab === 'Sessions' ? 'SEARCH BY NAME...' :
                  'SEARCH SKILL...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-black bg-white px-5 py-2.5 text-[10px] font-medium tracking-widest outline-none transition-all w-full md:w-64 uppercase placeholder:text-gray-400 rounded-lg"
              />
            )}
          </div>
        </div>

        {/* Content */}
        <main className="px-6 md:px-12 pb-16 pt-4 flex-1">

          {/* ═══════ OVERVIEW ═══════ */}
          {activeTab === 'Overview' && (
            <div className="space-y-10">
              {/* Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Users', value: stats.totalUsers || 0 },
                  { label: 'Total Skills', value: stats.totalSkills || 0 },
                  { label: 'Pending Sessions', value: stats.pendingSessions || 0 },
                  { label: 'Total Credits', value: (stats.totalCredits || 0).toLocaleString() },
                ].map((s, i) => (
                  <div key={i} className="bg-white p-8 border border-black rounded-lg flex flex-col gap-2">
                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-2">{s.label}</p>
                    <p className="text-5xl font-semibold leading-none">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-2xl font-medium mb-6">Recent Activity</h3>
                <div className="flex flex-col">
                  {sessions.slice(0, 5).map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center py-6 border-t border-gray-100 last:border-b">
                      <div className="flex items-center gap-5">
                        <div className="text-xl w-10 h-10 border border-gray-100 rounded-full flex items-center justify-center bg-white">
                          ⇄
                        </div>
                        <div>
                          <div className="font-medium text-[16px]">{s.requester?.name || 'Unknown'} ↔ {s.provider?.name || 'Unknown'}</div>
                          <div className="font-outfit text-[11px] text-gray-400 uppercase tracking-wide mt-1">Status: {s.status}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-outfit text-[10px] text-gray-400 uppercase tracking-tighter">{new Date(s.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <p className="text-gray-400 py-10 text-center border-t border-gray-100">No recent activity found.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══════ USERS ═══════ */}
          {activeTab === 'Users' && (
            <div className="border border-black rounded-lg bg-white overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['User', 'Credits', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? filteredUsers.map(u => (
                    <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" /> : u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-[14px] font-medium">{u.name}</div>
                            <div className="text-[12px] text-gray-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[13px] font-bold ${u.credits === 0 ? 'text-red-500' : 'text-black'}`}>
                          {u.credits || 0}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[12px] text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 flex items-center gap-4">
                        <button
                          onClick={() => confirmBlockUser(u._id, u.name, u.isBlocked)}
                          className={`text-[11px] font-medium transition-colors ${u.isBlocked ? 'text-green-500 hover:text-green-700' : 'text-red-400 hover:text-red-600'}`}
                        >
                          {u.isBlocked ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-300 text-sm">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ═══════ SKILL MANAGEMENT (MERGED) ═══════ */}
          {activeTab === 'Library' && (
            <div className="flex flex-col gap-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-400">Global Skills Library</h3>
              </div>
              <div className="border border-black rounded-lg bg-white overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Skill Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSkills.map(s => (
                      <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                        <td className="px-6 py-4 text-[14px] font-medium">{s.name}</td>
                        <td className="px-6 py-4 text-[12px] text-gray-400 italic">{s.description || '—'}</td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => { setEditingSkillId(s._id); setNewSkill({ name: s.name, description: s.description || '' }); setShowAddSkill(true); }} className="text-blue-500 hover:underline text-[11px] font-bold mr-4">Edit</button>
                          <button onClick={() => confirmDeleteSkill(s._id, s.name)} className="text-red-400 hover:underline text-[11px] font-bold">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {filteredSkills.length === 0 && (
                      <tr><td colSpan={3} className="px-6 py-12 text-center text-gray-300 text-sm">No skills found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════ SESSIONS ═══════ */}
          {activeTab === 'Sessions' && (
            <div className="border border-black rounded-lg bg-white overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Session ID', 'Requester', 'Provider', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.length > 0 ? filteredSessions.map(s => (
                    <tr key={s._id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-5 text-[11px] text-gray-400 font-mono">{s._id}</td>
                      <td className="px-6 py-5 text-[14px] font-medium">{s.requester?.name || '—'}</td>
                      <td className="px-6 py-5 text-[14px] font-medium">{s.provider?.name || '—'}</td>
                      <td className="px-6 py-5">
                        <span className={`text-[9px] font-bold border px-3 py-1 uppercase tracking-[0.15em] inline-block ${
                          s.status === 'completed' ? 'border-emerald-200 text-emerald-500 bg-emerald-50/50' :
                          s.status === 'scheduled' ? 'border-blue-200 text-blue-500 bg-blue-50/50' :
                          s.status === 'pending' ? 'border-gray-200 text-gray-400 bg-gray-50/50' :
                          'border-red-200 text-red-400 bg-red-50/50'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-[12px] text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-300 text-sm">No sessions found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ═══════ REVIEWS ═══════ */}
          {activeTab === 'Reviews' && (
            <div className="border border-black rounded-lg bg-white overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['From', 'To', 'Rating', 'Comment', 'Date'].map(h => (
                      <th key={h} className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.length > 0 ? filteredReviews.map(r => (
                    <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                      <td className="px-6 py-5">
                        <div className="text-[14px] font-medium">{r.reviewer?.name || '—'}</div>
                        <div className="text-[11px] text-gray-400">{r.reviewer?.email}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[14px] font-medium">{r.reviewee?.name || '—'}</div>
                        <div className="text-[11px] text-gray-400">{r.reviewee?.email}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex text-yellow-400 text-xs">
                          {[...Array(5)].map((_, i) => (
                            <span key={i}>{i < r.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[12px] text-gray-600 line-clamp-2 max-w-[250px]">{r.comment || '—'}</div>
                      </td>
                      <td className="px-6 py-5 text-[12px] text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-300 text-sm">No reviews found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </main>
        
        {/* Floating Add Buttons */}
        {activeTab === 'Library' && (
          <button 
            onClick={() => { setEditingSkillId(null); setNewSkill({ name: '', description: '' }); setShowAddSkill(true); }}
            className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-[100] bg-black text-white border border-black px-6 py-3 rounded text-sm hover:bg-white hover:text-black transition-all active:scale-95 shadow-xl font-medium"
          >
            + Add Skill
          </button>
        )}

        {/* Custom Confirmation Modal */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '', message: '', name: '' })}></div>
            <div className="bg-white border border-black rounded-xl p-8 w-full max-w-sm relative z-10 shadow-2xl flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full border-2 border-red-500 text-red-500 flex items-center justify-center mb-6">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </div>
              <h3 className="text-[22px] font-bold font-['Outfit'] mb-3 tracking-tight">{deleteConfirmation.title}</h3>
              <p className="text-[14px] text-gray-500 mb-8 leading-relaxed font-medium">{deleteConfirmation.message}</p>
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setDeleteConfirmation({ isOpen: false, type: null, id: null, title: '', message: '', name: '' })}
                  className="flex-1 px-4 py-3 bg-white text-black font-medium text-sm rounded-lg hover:bg-gray-50 transition-colors border border-black"
                >
                  Cancel
                </button>
                <button 
                  onClick={proceedWithDelete}
                  className={`flex-1 px-4 py-3 text-white font-medium text-sm rounded-lg border transition-colors ${deleteConfirmation.title?.includes('Unblock') ? 'bg-green-500 border-green-500 hover:bg-white hover:text-green-500' : 'bg-red-500 border-red-500 hover:bg-white hover:text-red-500'}`}
                >
                  {deleteConfirmation.title?.includes('Unblock') ? 'Unblock' : deleteConfirmation.type === 'user' ? 'Ban User' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Transparent Overlay to close on outside click */}
        {showAddSkill && (
          <div 
            className="fixed inset-0 z-[290] bg-transparent" 
            onClick={() => { setShowAddSkill(false); }}
          />
        )}

        {/* Add Skill Drawer */}
        <div className={`fixed inset-y-0 right-0 z-[300] w-full md:w-[450px] bg-white border-l border-black shadow-2xl transform transition-transform duration-300 ease-in-out ${showAddSkill ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-full flex flex-col p-8 md:p-12 overflow-y-auto">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-['Outfit'] text-[28px] font-medium tracking-tight">{editingSkillId ? 'Edit Skill' : 'Add New Skill'}</h3>
              <button onClick={() => { setShowAddSkill(false); setEditingSkillId(null); setNewSkill({ name: '', description: '' }); }} className="text-gray-400 hover:text-black border border-transparent hover:border-gray-200 p-1 rounded transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddSkill} className="flex flex-col gap-6 flex-1">
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-widest block mb-2">Skill Name *</label>
                <input required value={newSkill.name} onChange={e => setNewSkill({...newSkill, name: e.target.value})} className="w-full border border-black px-4 py-3 rounded-lg text-sm outline-none bg-white transition-colors" placeholder="e.g. React Native" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-widest block mb-2">Description</label>
                <textarea value={newSkill.description} onChange={e => setNewSkill({...newSkill, description: e.target.value})} className="w-full border border-black px-4 py-3 rounded-lg text-sm outline-none bg-white transition-colors resize-none h-32" placeholder="Short description..." />
              </div>
              
              <div className="mt-auto pt-8">
                <button type="submit" className="bg-black text-white border border-black w-full py-4 rounded-lg text-sm font-medium hover:bg-white hover:text-black transition-all active:scale-95">{editingSkillId ? 'Save Changes' : 'Create Skill'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
