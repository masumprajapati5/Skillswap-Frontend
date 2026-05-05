import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usersAPI, sessionsAPI, skillsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import ProfilePrompt from '../components/ProfilePrompt';

const Dashboard = () => {
  const { user: authUser, setUser: setAuthUser } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userRes, matchesRes] = await Promise.all([
          usersAPI.getMe(),
          skillsAPI.getMatches()
        ]);
        
        setAuthUser(userRes.data);
        setMatches(matchesRes.data.slice(0, 3)); // Only show top 3 matches
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [setAuthUser]);

  if (loading) {
    return (
      <div className="py-20 px-6 max-w-[1000px] mx-auto text-center">
        <p className="text-gray-500 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 max-w-[1000px] mx-auto min-h-screen">
      <div className="mb-12">
        <h1 className="text-[32px] font-bold text-[#37352F] mb-1 tracking-tight">Dashboard</h1>
        <p className="text-[#37352F]/60 font-medium">Welcome back, {authUser?.name}!</p>
      </div>

      <ProfilePrompt user={authUser} />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Credits', value: authUser?.credits || 0, color: (authUser?.credits === 0) ? 'text-red-500' : 'text-[#37352F]' },
          { label: 'Sessions', value: sessions.length },
          { label: 'Rating', value: (authUser?.rating || 0).toFixed(1) },
          { label: 'Matches', value: matches.length },
        ].map((stat, i) => (
          <div key={i} className="bg-[#F7F7F5] p-6 rounded-xl">
            <div className="text-[11px] font-bold text-[#37352F]/40 uppercase tracking-widest mb-2">{stat.label}</div>
            <div className={`text-3xl font-bold ${stat.color || 'text-[#37352F]'}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Zero Credit UX Alert */}
      {authUser?.credits === 0 && (
        <div className="bg-[#EB5757]/5 border border-[#EB5757]/10 p-8 rounded-2xl mb-20 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2 text-[#EB5757]">You're out of credits!</h2>
            <p className="text-gray-600 max-w-[400px] font-medium">Teach your skills to others to earn more credits and unlock new learning sessions.</p>
          </div>
          <Link 
            to="/explore" 
            className="bg-black text-white px-8 py-3.5 rounded-lg font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg whitespace-nowrap"
          >
            Earn Credits Now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-16">
        {/* Smart Matches */}
        <div>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold tracking-tight">Smart Matches</h2>
            <Link to="/explore" className="text-sm font-bold text-black/40 hover:text-black transition-colors">View More</Link>
          </div>
          <div className="flex flex-col gap-4">
            {matches.length > 0 ? matches.map((m) => (
              <div key={m._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-200 transition-all gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F7F7F5] text-[#37352F] rounded-lg flex items-center justify-center font-bold overflow-hidden border border-gray-100">
                    {m.avatar ? (
                      <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      m.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{m.name}</div>
                    <div className="text-sm text-gray-500 font-medium">
                      Offers {m.skillsOffered?.map(s => s.name).join(', ') || 'None'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 justify-between w-full sm:w-auto">
                  <span className="text-sm font-bold bg-[#F7F7F5] px-3 py-1 rounded-full text-black/60">★ {(m.rating || 0).toFixed(1)}</span>
                  <Link to={`/profile/${m._id}`} className="bg-white text-black border border-gray-200 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all active:scale-95 whitespace-nowrap">View Profile</Link>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 bg-[#F7F7F5] rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">No matches found yet. Try adding more skills!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

