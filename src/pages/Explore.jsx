import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Sparkles, Star, Search, Filter, MapPin, CreditCard } from 'lucide-react';
import { usersAPI, skillsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import ProfilePrompt from '../components/ProfilePrompt';

const Explore = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'rating');
  const [filters, setFilters] = useState({
    minRating: Number(searchParams.get('minRating')) || 0,
    hasCredits: searchParams.get('hasCredits') === 'true'
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (activeCategory !== 'All') params.set('category', activeCategory);
    if (sortBy !== 'rating') params.set('sortBy', sortBy);
    if (filters.minRating > 0) params.set('minRating', filters.minRating.toString());
    if (filters.hasCredits) params.set('hasCredits', 'true');
    setSearchParams(params, { replace: true });
  }, [search, activeCategory, sortBy, filters, setSearchParams]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [showSmartMatches, setShowSmartMatches] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const userRes = await usersAPI.getMe().catch(() => ({ data: null }));
        if (userRes?.data) setCurrentUser(userRes.data);
      } catch (err) {
        console.error('Failed to fetch initial data', err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        let results = [];

        if (showSmartMatches) {
          const res = await skillsAPI.getMatches();
          results = res.data;
          
          if (search.trim()) {
            results = results.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
          }
        } else {
          const res = await usersAPI.searchUsers(search);
          results = res.data;
        }

        // Apply advanced filters
        if (filters.minRating > 0) {
          results = results.filter(u => u.rating >= filters.minRating);
        }
        if (filters.hasCredits) {
          results = results.filter(u => u.credits > 0);
        }

        // Sort results
        results.sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : (b.swaps || 0) - (a.swaps || 0));

        setUsers(results);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      if (!isMatching) fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [search, showSmartMatches, sortBy, filters, isMatching]);

  const handleSmartMatchClick = () => {
    if (!currentUser) {
      alert('Please log in to use Smart Matches');
      return;
    }

    if (showSmartMatches) {
      setShowSmartMatches(false);
    } else {
      setIsMatching(true);
      setShowSmartMatches(true);
      setTimeout(() => {
        setIsMatching(false);
      }, 2000);
    }
  };

  return (
    <div className="py-8 sm:py-12 px-6 max-w-[1200px] mx-auto min-h-screen">
      <div className="mb-8 sm:mb-12 text-center sm:text-left">
        <h1 className="text-[28px] sm:text-[32px] font-bold text-[#37352F] mb-1 tracking-tight">Explore Experts</h1>
        <p className="text-sm sm:text-base text-[#37352F]/60 font-medium">Discover new expertise across the global network.</p>
      </div>

      <ProfilePrompt user={currentUser} />

      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar - Filters */}
        <aside className="w-full md:w-64 flex-shrink-0 flex flex-col sm:flex-row md:flex-col gap-6 sm:gap-10">
          
          {/* Sorting Sidebar */}
          <div className="flex-1">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-black/40 mb-3 sm:mb-4">Sort By</h3>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              className="w-full bg-[#F7F7F5] border-transparent px-4 py-2.5 rounded-lg text-sm outline-none cursor-pointer font-bold hover:bg-[#EFEFEF] transition-all"
            >
              <option value="rating">Highest Rating</option>
              <option value="swaps">Most Successful Swaps</option>
            </select>
          </div>

          {/* Advanced Filters Sidebar */}
          <div className="flex-1 flex flex-col gap-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-black/40 mb-1 hidden sm:block">Filters</h3>
            
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase text-black/30 tracking-tight">Minimum Rating</label>
              <select 
                value={filters.minRating} 
                onChange={e => setFilters({...filters, minRating: Number(e.target.value)})}
                className="w-full bg-[#F7F7F5] border-transparent px-4 py-2.5 rounded-lg text-sm outline-none font-bold hover:bg-[#EFEFEF] transition-all"
              >
                <option value="0">Any Rating</option>
                <option value="4">4.0+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.8">4.8+ Stars</option>
              </select>
            </div>

            <div className="flex items-center gap-3 py-2 group cursor-pointer">
              <input 
                type="checkbox" 
                id="hasCredits"
                checked={filters.hasCredits}
                onChange={e => setFilters({...filters, hasCredits: e.target.checked})}
                className="w-5 h-5 rounded-md border-gray-200 accent-black cursor-pointer"
              />
              <label htmlFor="hasCredits" className="text-sm font-bold text-[#37352F]/70 group-hover:text-black cursor-pointer select-none">Only with Credits</label>
            </div>

            {(filters.minRating > 0 || filters.hasCredits) && (
              <button 
                onClick={() => setFilters({ minRating: 0, hasCredits: false })}
                className="text-left text-xs font-bold uppercase tracking-tighter text-red-500 hover:underline"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Smart Matches Hero Banner */}
          <div className="mb-10 group">
            <button 
              onClick={handleSmartMatchClick}
              className={`w-full text-left p-8 rounded-2xl border transition-all duration-500 flex flex-col sm:flex-row justify-between items-center gap-6 ${showSmartMatches ? 'border-black bg-black text-white shadow-2xl scale-[1.01]' : 'border-gray-100 bg-[#F7F7F5]/50 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-12 ${showSmartMatches ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                  <Sparkles size={24} className={showSmartMatches ? 'text-white' : 'text-black'} />
                </div>
                <div>
                  <h3 className={`text-xl font-bold tracking-tight ${showSmartMatches ? 'text-white' : 'text-black'}`}>
                    {showSmartMatches ? 'Smart Matches' : 'Smart Match AI'}
                  </h3>
                  <p className={`text-sm font-medium ${showSmartMatches ? 'text-gray-400' : 'text-gray-500'}`}>
                    {showSmartMatches ? 'Experts selected based on your profile.' : 'Find experts who match your learning goals.'}
                  </p>
                </div>
              </div>
              <div className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${showSmartMatches ? 'bg-white text-black' : 'bg-black text-white'}`}>
                {showSmartMatches ? 'Show All' : 'Run Match'}
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-10 relative group">
            <input 
              className="w-full bg-[#F7F7F5] border-transparent px-6 py-4 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-black/5 placeholder:text-gray-400 text-lg font-medium transition-all" 
              placeholder="Search experts by name or skill..."
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors">
              <Search size={22} />
            </div>
          </div>

          {/* Results Grid */}
          <div className="flex flex-col gap-4 min-h-[500px] relative">
            {isMatching ? (
              <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center text-center py-20 rounded-2xl">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-black rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-gray-200 animate-pulse">
                    <Sparkles size={28} />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1 tracking-tight">Finding Matches</h3>
                <p className="text-gray-500 text-sm font-medium">Analyzing skills and requirements...</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col gap-6">
                {[1,2,3].map(i => (
                  <div key={i} className="h-40 bg-[#F7F7F5] rounded-2xl animate-pulse border border-gray-100"></div>
                ))}
              </div>
            ) : users.length > 0 ? (
              <div className="flex flex-col gap-6">
                {users.map((u) => (
                  <Link 
                    key={u._id} 
                    to={`/profile/${u._id}`}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-gray-300 transition-all gap-8 group no-underline text-[#37352F]"
                  >
                    <div className="flex flex-col gap-4 flex-1">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-[#F7F7F5] text-[#37352F] rounded-2xl flex items-center justify-center font-bold overflow-hidden border border-gray-100">
                          {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xl sm:text-2xl font-bold group-hover:underline tracking-tight">{u.name}</div>
                          <div className="text-[11px] sm:text-sm text-gray-500 font-bold flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                             <span className="flex items-center gap-1 text-black/60 bg-[#F7F7F5] px-2 py-0.5 rounded-md">
                               <Star size={12} className="fill-current" /> {u.rating.toFixed(1)}
                             </span>
                             <span className="text-black/30 hidden sm:inline">·</span>
                             <span>{u.credits} credits</span>
                             <span className="text-black/30 hidden sm:inline">·</span>
                             <span className="flex items-center gap-1"><MapPin size={12} /> {u.location?.city || 'Remote'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-4 mt-2">
                        <div className="flex gap-4 items-center">
                          <span className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Offers</span>
                          <div className="flex gap-2 flex-wrap">
                            {u.skillsOffered?.map(skill => (
                              <span key={skill._id} className="text-[11px] font-bold bg-[#F7F7F5] border border-gray-100 px-3 py-1 rounded-lg tracking-tight uppercase text-black/80 group-hover:bg-black group-hover:text-white transition-all">
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto">
                      <div className="bg-black text-white px-8 py-3.5 rounded-lg font-bold hover:opacity-90 transition-all active:scale-95 inline-block text-center w-full shadow-lg text-sm">
                        View Profile
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-[#F7F7F5] rounded-3xl border border-dashed border-gray-200">
                <p className="text-xl text-gray-400 font-bold tracking-tight">No experts found matching your criteria.</p>
                <button onClick={() => {setSearch(''); setShowSmartMatches(false); setFilters({minRating: 0, hasCredits: false})}} className="mt-4 text-black underline font-bold text-sm">Reset all filters</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Explore;

