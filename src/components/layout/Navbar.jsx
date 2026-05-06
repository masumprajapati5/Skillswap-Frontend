import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CreditCard, Coins, MessageCircle, Bell, User, LayoutDashboard, Calendar, Search, LogOut, X, Menu } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Navbar = ({ unreadCount, pendingSessionsCount, notificationsCount }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  // Close menu on route change / resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    window.location.href = '/';
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      {/* ─── Top Navbar Bar ─── */}
      <nav className="flex justify-between items-center px-4 sm:px-6 lg:px-12 py-3 sm:py-4 bg-white/80 backdrop-blur-md border-b border-[#EFEFEF] sticky top-0 z-[100]">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 no-underline text-[#37352F] flex-shrink-0" onClick={closeMenu}>
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-lg sm:text-xl italic shadow-lg">S</div>
          <span className="font-bold text-base sm:text-[19px] tracking-tight">SkillSwap</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex gap-1 xl:gap-2 items-center text-sm font-bold text-gray-500">
          <Link to="/explore" className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] transition-all group">
            <Search size={18} className="text-black/20 group-hover:text-black transition-colors" />
            <span className="group-hover:text-black transition-colors">Explore</span>
          </Link>

          {isAuthenticated ? (
            user?.role === 'admin' ? (
              <>
                <Link to="/admin" className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 transition-all shadow-lg ml-2">
                  <LayoutDashboard size={18} />
                  <span>Admin</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="ml-2 text-xs font-bold text-red-500 hover:bg-red-50 px-3 xl:px-4 py-2 rounded-xl transition-all"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] transition-all group">
                  <LayoutDashboard size={18} className="text-black/20 group-hover:text-black transition-colors" />
                  <span className="group-hover:text-black transition-colors">Dashboard</span>
                </Link>

                <Link to="/sessions" className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] transition-all group relative">
                  <Calendar size={18} className="text-black/20 group-hover:text-black transition-colors" />
                  <span className="group-hover:text-black transition-colors">Sessions</span>
                  {pendingSessionsCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">{pendingSessionsCount}</span>}
                </Link>

                <Link to="/messages" className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] transition-all group relative">
                  <MessageCircle size={18} className="text-black/20 group-hover:text-black transition-colors" />
                  <span className="group-hover:text-black transition-colors">Inbox</span>
                  {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">{unreadCount}</span>}
                </Link>

                <Link to="/notifications" className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] transition-all group relative">
                  <Bell size={18} className="text-black/20 group-hover:text-black transition-colors" />
                  <span className="group-hover:text-black transition-colors hidden xl:inline">Notifications</span>
                  {notificationsCount > 0 && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-black text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">{notificationsCount}</span>}
                </Link>

                <div className="w-[1px] h-6 bg-gray-100 mx-1 xl:mx-2" />

                <Link to="/wallet" className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl transition-all group ${user?.credits === 0 ? 'bg-red-50 text-red-500' : 'bg-[#F7F7F5] text-black hover:bg-[#EFEFEF]'}`}>
                  <Coins size={18} className={user?.credits === 0 ? 'text-red-400' : 'text-black/30 group-hover:text-black'} />
                  <span className="font-bold">{user?.credits || 0}</span>
                </Link>

                <Link to={`/profile/${user?._id}`} className="flex items-center gap-2 ml-1 xl:ml-2 p-1 pl-3 xl:pl-4 rounded-xl bg-[#F7F7F5] border border-gray-100 hover:border-gray-300 transition-all group shadow-sm">
                  <span className="font-bold text-black group-hover:text-black transition-colors hidden xl:inline">Profile</span>
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden border border-gray-100">
                    {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.name.charAt(0)}
                  </div>
                </Link>
                
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 xl:px-4 py-2 rounded-xl bg-transparent hover:bg-[#F7F7F5] text-gray-500 hover:text-red-500 transition-all group ml-1 xl:ml-2"
                >
                  <LogOut size={18} className="text-black/20 group-hover:text-red-500 transition-colors" />
                  <span className="font-bold transition-colors hidden xl:inline">Log Out</span>
                </button>
              </>
            )
          ) : (
            <>
              <Link to="/auth" className="hover:text-black transition-colors px-3 xl:px-4">Log In</Link>
              <Link to="/auth" className="bg-black text-white px-5 xl:px-6 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-xl">Join Now</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex lg:hidden items-center justify-center w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer z-[201] relative"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X size={24} strokeWidth={2.5} className="text-black" />
          ) : (
            <Menu size={24} strokeWidth={2.5} className="text-black" />
          )}
        </button>
      </nav>

      {/* ─── Full-Screen Mobile Menu Overlay ─── */}
      <div 
        className={`fixed inset-0 z-[200] bg-white lg:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
        style={{ paddingTop: '60px' }}
      >
        {/* Scrollable content area for small screens */}
        <div className="h-full overflow-y-auto flex flex-col items-center justify-start px-6 py-8 sm:py-12 gap-1">

          {/* Navigation Links */}
          <div className="flex flex-col items-center gap-1 w-full max-w-[280px]">
            <Link 
              to="/explore" 
              onClick={closeMenu} 
              className="w-full text-center py-3 text-lg text-black no-underline font-medium rounded-xl hover:bg-[#F7F7F5] transition-all"
            >
              Explore
            </Link>

            {isAuthenticated ? (
              user?.role === 'admin' ? (
                <>
                  <Link to="/admin" onClick={closeMenu} className="w-full text-center py-3 text-lg text-black no-underline font-bold rounded-xl hover:bg-[#F7F7F5] transition-all">
                    Admin Panel
                  </Link>

                  <div className="w-full h-px bg-gray-100 my-3" />

                  <button 
                    onClick={handleLogout}
                    className="w-full text-center py-3 text-lg text-red-500 font-medium bg-transparent border-none rounded-xl hover:bg-red-50 transition-all cursor-pointer"
                  >
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/dashboard" onClick={closeMenu} className="w-full text-center py-3 text-lg text-black no-underline font-medium rounded-xl hover:bg-[#F7F7F5] transition-all">
                    Dashboard
                  </Link>

                  <Link to="/sessions" onClick={closeMenu} className="w-full text-center py-3 text-lg text-black no-underline font-medium rounded-xl hover:bg-[#F7F7F5] transition-all relative flex items-center justify-center gap-2">
                    Sessions
                    {pendingSessionsCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-black text-white text-[10px] rounded-full font-black">
                        {pendingSessionsCount}
                      </span>
                    )}
                  </Link>

                  <Link to="/messages" onClick={closeMenu} className="w-full text-center py-3 text-lg text-black no-underline font-medium rounded-xl hover:bg-[#F7F7F5] transition-all flex items-center justify-center gap-2">
                    Messages
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-black text-white text-[10px] rounded-full font-black">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link to="/notifications" onClick={closeMenu} className="w-full text-center py-3 text-lg text-black no-underline font-medium rounded-xl hover:bg-[#F7F7F5] transition-all flex items-center justify-center gap-2">
                    Notifications
                    {notificationsCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-black text-white text-[10px] rounded-full font-black">
                        {notificationsCount}
                      </span>
                    )}
                  </Link>

                  <Link to={`/profile/${user?._id}`} onClick={closeMenu} className="w-full text-center py-3 text-lg text-black no-underline font-medium rounded-xl hover:bg-[#F7F7F5] transition-all">
                    Profile
                  </Link>

                  {/* Divider */}
                  <div className="w-full h-px bg-gray-100 my-3" />

                  {/* Wallet Card */}
                  <Link 
                    to="/wallet" 
                    onClick={closeMenu} 
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border no-underline transition-all ${
                      user?.credits === 0 
                        ? 'border-red-200 bg-red-50/50 text-red-500' 
                        : 'border-gray-100 bg-[#F7F7F5] text-black'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Coins size={18} className={user?.credits === 0 ? 'text-red-400' : 'text-black/40'} />
                      <span className="font-medium text-sm">Wallet Balance</span>
                    </div>
                    <span className="font-black text-lg">{user?.credits || 0}</span>
                  </Link>

                  {/* Divider */}
                  <div className="w-full h-px bg-gray-100 my-3" />

                  {/* Log Out */}
                  <button 
                    onClick={handleLogout}
                    className="w-full text-center py-3 text-lg text-red-500 font-medium bg-transparent border-none rounded-xl hover:bg-red-50 transition-all cursor-pointer"
                  >
                    Log Out
                  </button>
                </>
              )
            ) : (
              <>
                <div className="w-full h-px bg-gray-100 my-4" />

                <Link to="/auth" onClick={closeMenu} className="w-full text-center py-3 text-lg text-black no-underline font-medium rounded-xl hover:bg-[#F7F7F5] transition-all">
                  Log In
                </Link>

                <Link 
                  to="/auth" 
                  onClick={closeMenu} 
                  className="w-full text-center bg-black text-white py-3.5 rounded-xl text-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg mt-2 no-underline"
                >
                  Join Now — It's Free
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
