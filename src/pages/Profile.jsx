import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, FileText, Image as ImageIcon, MessageSquare, Trash2 } from 'lucide-react';
import { usersAPI, reviewsAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [userRes, reviewsRes] = await Promise.all([
          usersAPI.getUser(id),
          reviewsAPI.getForUser(id)
        ]);
        setUser(userRes.data);
        setReviews(reviewsRes.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-500 animate-pulse">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-2xl font-semibold mb-4">User not found</h2>
        <Link to="/explore" className="text-black underline">Back to Explore</Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?._id === user._id;

  const handleDeletePortfolioItem = async (e, itemIndex) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to remove this showcase from your portfolio?')) return;
    
    setDeletingId(itemIndex);
    try {
      const updatedPortfolio = user.portfolio.filter((_, i) => i !== itemIndex);
      await usersAPI.updateMe({ portfolio: updatedPortfolio });
      setUser({ ...user, portfolio: updatedPortfolio });
    } catch (err) {
      console.error('Failed to delete portfolio item', err);
      alert('Failed to remove item. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="py-12 px-6 max-w-[1000px] mx-auto min-h-screen">
      {/* Header / Intro */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-10 mb-16">
        <div className="w-32 h-32 md:w-40 md:h-40 bg-[#F7F7F5] rounded-3xl flex items-center justify-center text-4xl font-bold text-[#37352F] overflow-hidden border border-gray-100 flex-shrink-0">
          {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-4">
            <div>
              <h1 className="text-[40px] font-bold text-[#37352F] tracking-tight mb-1">{user.name}</h1>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 font-medium text-sm">
                <MapPin size={14} />
                <span>{user.location?.city || 'Location not set'}, {user.location?.country || ''}</span>
              </div>
            </div>
            {isOwnProfile ? (
              <Link to="/profile/edit" className="bg-white text-black border border-gray-200 px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm">Edit Profile</Link>
            ) : isAuthenticated ? (
              <div className="flex gap-3 w-full sm:w-auto">
                <Link to={`/request-swap/${user._id}`} className="bg-black text-white px-8 py-3 rounded-lg text-sm font-bold hover:opacity-90 transition-all active:scale-95 flex-1 sm:flex-initial text-center shadow-lg">Request Swap</Link>
              </div>
            ) : null}
          </div>
          <p className="text-lg text-[#37352F]/80 leading-relaxed mb-8 max-w-[700px]">{user.bio || 'No bio provided yet.'}</p>
          <div className="flex gap-10 flex-wrap justify-center md:justify-start">
            {[
              { label: 'Rating', value: <span className="flex items-center gap-1"><Star size={14} className="fill-current" /> {(user.rating || 0).toFixed(1)}</span> },
              { label: 'Credits', value: user.credits || 0 },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-[11px] font-bold text-black/30 uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-20">
        {/* Skills Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Skills Offered */}
          <div className="bg-[#F7F7F5]/50 p-8 rounded-2xl border border-gray-100">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30 mb-6">Skills Offered</h3>
            <div className="flex flex-wrap gap-3">
              {user.skillsOffered?.length > 0 ? user.skillsOffered.map((s, i) => (
                <div key={i} className="bg-white px-4 py-2 rounded-lg border border-gray-100 font-bold text-sm shadow-sm">
                  {s.name}
                </div>
              )) : <p className="text-gray-400 text-sm italic font-medium">No skills offered yet.</p>}
            </div>
          </div>

          {/* Skills Wanted */}
          <div className="bg-[#F7F7F5]/50 p-8 rounded-2xl border border-gray-100">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/30 mb-6">Skills Wanted</h3>
            <div className="flex flex-wrap gap-3">
              {user.skillsWanted?.length > 0 ? user.skillsWanted.map((s, i) => (
                <div key={i} className="bg-white px-4 py-2 rounded-lg border border-gray-100 font-bold text-sm text-gray-500 shadow-sm">
                  {s.name}
                </div>
              )) : <p className="text-gray-400 text-sm italic font-medium">No skills wanted yet.</p>}
            </div>
          </div>
        </div>

        {/* Portfolio Section */}
        {user.portfolio?.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-10 tracking-tight">Portfolio & Showcases</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {user.portfolio.map((item, i) => (
                <a 
                  key={i} 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-500 no-underline text-[#37352F] flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-[#F7F7F5] rounded-xl flex items-center justify-center text-[#37352F] group-hover:bg-black group-hover:text-white transition-all">
                    {item.type?.includes('pdf') ? <FileText size={20} /> : <ImageIcon size={20} />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-bold text-sm truncate">{item.name}</div>
                    <div className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em] mt-1">View Project</div>
                  </div>
                  
                  {isOwnProfile && (
                    <button 
                      onClick={(e) => { e.preventDefault(); handleDeletePortfolioItem(e, i); }}
                      disabled={deletingId === i}
                      className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 disabled:opacity-50 shadow-sm"
                      title="Remove from portfolio"
                    >
                      {deletingId === i ? <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={14} />}
                    </button>
                  )}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div>
          <h2 className="text-xl font-bold mb-10 tracking-tight">Reviews ({reviews.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.length > 0 ? reviews.map((r, i) => (
              <div key={i} className="bg-white border border-gray-100 p-8 rounded-2xl shadow-sm hover:border-gray-200 transition-all">
                <div className="flex justify-between items-center mb-6">
                  <div className="font-bold text-lg">{r.reviewer?.name || 'Anonymous'}</div>
                  <div className="text-orange-400 flex gap-0.5">
                    {[...Array(r.rating)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
                  </div>
                </div>
                <p className="text-[#37352F]/70 italic mb-6 leading-relaxed font-medium">"{r.comment}"</p>
                <div className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em]">{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
            )) : (
              <div className="col-span-full text-center py-12 bg-[#F7F7F5] rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium italic">No reviews yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

