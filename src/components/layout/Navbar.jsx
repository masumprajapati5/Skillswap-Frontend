import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { CreditCard, Coins, MessageCircle, Bell, User, LayoutDashboard, Calendar, Search, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Navbar = ({ unreadCount, pendingSessionsCount, notificationsCount }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="flex justify-between items-center px-6 md:px-12 py-4 bg-white/80 backdrop-blur-md border-b border-[#EFEFEF] sticky top-0 z-[100]">
      <Link to="/" className="flex items-center gap-3 no-underline text-[#37352F] z-[101]">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-xl italic shadow-lg">S</div>
        <span className="font-bold text-[19px] tracking-tight">SkillSwap</span>
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex gap-2 items-center text-sm font-bold text-gray-500">
        <Link to="/explore" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] transition-all group">
          <Search size={18} className="text-black/20 group-hover:text-black transition-colors" />
          <span className="group-hover:text-black transition-colors">Explore</span>
        </Link>

        {isAuthenticated ? (
          user?.role === 'admin' ? (
            <>
              <Link to="/admin" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 transition-all shadow-lg ml-2">
                <LayoutDashboard size={18} />
                <span>Admin</span>
              </Link>
              <button 
                onClick={handleLogout}
                className="ml-2 text-xs font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] transition-all group">
                <LayoutDashboard size={18} className="text-black/20 group-hover:text-black transition-colors" />
                <span className="group-hover:text-black transition-colors">Dashboard</span>
              </Link>

              <Link to="/sessions" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] transition-all group relative">
                <Calendar size={18} className="text-black/20 group-hover:text-black transition-colors" />
                <span className="group-hover:text-black transition-colors">Sessions</span>
                {pendingSessionsCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">{pendingSessionsCount}</span>}
              </Link>

              <Link to="/messages" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] transition-all group relative">
                <MessageCircle size={18} className="text-black/20 group-hover:text-black transition-colors" />
                <span className="group-hover:text-black transition-colors">Inbox</span>
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">{unreadCount}</span>}
              </Link>

              <Link to="/notifications" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] transition-all group relative">
                <Bell size={18} className="text-black/20 group-hover:text-black transition-colors" />
                <span className="group-hover:text-black transition-colors">Notifications</span>
                {notificationsCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">{notificationsCount}</span>}
              </Link>

              <div className="w-[1px] h-6 bg-gray-100 mx-2" />

              <Link to="/wallet" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all group ${user?.credits === 0 ? 'bg-red-50 text-red-500' : 'bg-[#F7F7F5] text-black hover:bg-[#EFEFEF]'}`}>
                <Coins size={18} className={user?.credits === 0 ? 'text-red-400' : 'text-black/30 group-hover:text-black'} />
                <span className="font-bold">{user?.credits || 0}</span>
              </Link>

              <Link to={`/profile/${user?._id}`} className="flex items-center gap-2 ml-2 p-1 pl-4 rounded-xl bg-[#F7F7F5] border border-gray-100 hover:border-gray-300 transition-all group shadow-sm">
                <span className="font-bold text-black group-hover:text-black transition-colors">Profile</span>
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-gray-100">
                  {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.name.charAt(0)}
                </div>
              </Link>
              
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] text-gray-500 hover:text-red-500 transition-all group ml-2"
              >
                <LogOut size={18} className="text-black/20 group-hover:text-red-500 transition-colors" />
                <span className="font-bold transition-colors">Log Out</span>
              </button>
            </>
          )
        ) : (
          <>
            <Link to="/auth" className="hover:text-black transition-colors px-4">Log In</Link>
            <Link to="/auth" className="bg-black text-white px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-xl">Join Now</Link>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="block md:hidden bg-none border-none cursor-pointer z-[101] p-2"
      >
        <div className={`w-6 h-0.5 bg-black mb-1.5 transition-transform duration-300 ${isMenuOpen ? 'rotate-45 translate-y-[8px]' : ''}`}></div>
        <div className={`w-6 h-0.5 bg-black mb-1.5 transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></div>
        <div className={`w-6 h-0.5 bg-black transition-transform duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-[8px]' : ''}`}></div>
      </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center gap-6 sm:gap-8 px-6">
          <Link to="/explore" onClick={() => setIsMenuOpen(false)} className="text-xl sm:text-2xl text-black no-underline font-medium">Explore</Link>
          {isAuthenticated ? (
            user?.role === 'admin' ? (
              <>
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-2xl text-black no-underline font-bold">Admin Panel</Link>
                <button 
                  onClick={handleLogout}
                  className="text-2xl text-red-500 font-bold bg-transparent border-none flex items-center gap-4"
                >
                  <LogOut size={28} />
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="text-xl sm:text-2xl text-black no-underline font-medium">Dashboard</Link>
                <Link to="/sessions" onClick={() => setIsMenuOpen(false)} className="text-xl sm:text-2xl text-black no-underline font-medium relative">
                  Sessions
                  {pendingSessionsCount > 0 && <span className="absolute top-0 -right-5 w-5 h-5 bg-black text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black">{pendingSessionsCount}</span>}
                </Link>
                <Link to="/messages" onClick={() => setIsMenuOpen(false)} className="text-xl sm:text-2xl text-black no-underline font-medium relative">
                  Messages
                  {unreadCount > 0 && <span className="absolute top-0 -right-5 w-5 h-5 bg-black text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black">{unreadCount}</span>}
                </Link>
                <Link to="/notifications" onClick={() => setIsMenuOpen(false)} className="text-xl sm:text-2xl text-black no-underline font-medium relative">
                  Notifications
                  {notificationsCount > 0 && <span className="absolute top-0 -right-5 w-5 h-5 bg-black text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-black">{notificationsCount}</span>}
                </Link>
                <Link to="/wallet" onClick={() => setIsMenuOpen(false)} className="text-xl sm:text-2xl text-black no-underline font-medium flex items-center gap-3">
                  Wallet <span className="text-sm bg-black text-white px-3 py-1 rounded-full font-bold">{user?.credits || 0}</span>
                </Link>
                <Link to={`/profile/${user?._id}`} onClick={() => setIsMenuOpen(false)} className="text-xl sm:text-2xl text-black no-underline font-medium">Profile</Link>
                <button 
                  onClick={handleLogout}
                  className="text-xl sm:text-2xl text-red-500 font-bold bg-transparent border-none mt-4"
                >
                  Log Out
                </button>
              </>
            )
          ) : (
            <>
              <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="text-2xl text-black no-underline">Log In</Link>
              <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="bg-black text-white border border-black px-8 py-3 rounded text-xl active:scale-95">Join Now</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

