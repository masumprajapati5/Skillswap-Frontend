import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Monitor, Video, Coffee, Sparkles, Star, Clock } from 'lucide-react';
import { sessionsAPI, reviewsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket';

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    scheduledDate: '',
    scheduledTime: '',
    meetingType: 'online',
    location: '',
    notes: ''
  });

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [hasReviewed, setHasReviewed] = useState(false);

  const fetchSession = async () => {
    try {
      const [sessionRes, reviewsRes] = await Promise.all([
        sessionsAPI.getById(id),
        reviewsAPI.getBySession(id)
      ]);
      
      setSession(sessionRes.data);
      
      // Check if user has already reviewed
      const myReview = reviewsRes.data.find(r => r.reviewer?._id === currentUser?._id || r.reviewer === currentUser?._id);
      if (myReview) {
        setHasReviewed(true);
      }

      setEditForm({
        title: sessionRes.data.title || '',
        scheduledDate: sessionRes.data.scheduledDate || '',
        scheduledTime: sessionRes.data.scheduledTime || '',
        meetingType: sessionRes.data.meetingType || 'online',
        location: sessionRes.data.location || '',
        notes: sessionRes.data.notes || ''
      });
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [id, currentUser?._id]);

  useEffect(() => {
    const handleUpdate = (data) => {
      if (data.sessionId === id) {
        fetchSession();
      }
    };

    socketService.socket?.on('session_update', handleUpdate);
    return () => {
      socketService.socket?.off('session_update', handleUpdate);
    };
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await reviewsAPI.create({
        sessionId: id,
        reviewee: partner._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      setHasReviewed(true);
      setShowReviewForm(false);
      // Refresh user data to sync credits/stats
      const { loadUser } = useAuthStore.getState();
      loadUser();
      alert('Thank you for your review!');
      // Clear any saved draft for this partner in the request form
      localStorage.removeItem(`requestSwap_${partner?._id}`);
    } catch (err) {
      console.error('Review failed', err);
      alert('Failed to submit review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await sessionsAPI.update(id, editForm);
      setSession(res.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed', err);
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      let res;
      if (action === 'accept') res = await sessionsAPI.accept(id);
      else if (action === 'complete') res = await sessionsAPI.complete(id);
      else if (action === 'cancel') res = await sessionsAPI.cancel(id);
      else if (action === 'decline') res = await sessionsAPI.decline(id);
      
      setSession(res.data);
      // Refresh global user state to update credits in navbar
      if (action === 'complete') {
        const { loadUser } = useAuthStore.getState();
        loadUser();
        // Clear any saved draft for this partner in the request form
        localStorage.removeItem(`requestSwap_${partner?._id}`);
      }
    } catch (err) {
      console.error(`Action ${action} failed`, err);
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="py-16 sm:py-24 text-center text-gray-500 animate-pulse">Loading session details...</div>;
  }

  if (!session) {
    return (
      <div className="py-16 sm:py-24 text-center px-6">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Session not found</h2>
        <Link to="/sessions" className="text-black underline">Back to Sessions</Link>
      </div>
    );
  }

  const isRequester = session.requester?._id === currentUser?._id;
  const partner = isRequester ? session.provider : session.requester;
  const role = isRequester ? 'LEARNING' : 'TEACHING';

  return (
    <div className="responsive-container" style={{ maxWidth: '1100px', paddingTop: 'clamp(2rem, 4vw, 5rem)', paddingBottom: 'clamp(2rem, 4vw, 5rem)' }}>
      <div className="mb-8 sm:mb-14">
        <div className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest mb-3 sm:mb-4">SESSION #{session._id.slice(-6)}</div>
        <h1 className="text-heading-lg mb-3 sm:mb-4">{session.title || 'Skill Swap Session'}</h1>
        <div className="flex gap-3 sm:gap-4 items-center flex-wrap">
          <span className={`text-[10px] sm:text-[11px] font-bold border px-2 sm:px-3 py-1 rounded tracking-widest uppercase ${
            session.status === 'scheduled' ? 'border-green-500 text-green-500' : 
            session.status === 'completed' ? 'border-black bg-black text-white' : 'border-black text-black'
          }`}>
            {session.status}
          </span>
          <span className="font-outfit text-xs sm:text-sm text-gray-500 tracking-wide">{session.duration || 60} minutes · 1:1 Session</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_350px] gap-6 sm:gap-10">
        {/* Main content */}
        <div className="flex flex-col gap-6 sm:gap-10">
          {/* Session Overview or Edit Form */}
          {!isEditing ? (
            <div className="border border-black p-5 sm:p-8 md:p-10 rounded-xl bg-white shadow-sm">
              <div className="flex justify-between items-center mb-6 sm:mb-10 text-center gap-4">
                <div className="flex flex-col items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold border-4 border-gray-50 overflow-hidden flex-shrink-0">
                    {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" alt="" /> : currentUser?.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-base sm:text-lg">You</div>
                    <div className="font-outfit text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest mt-1">{role}</div>
                  </div>
                </div>
                <div className="text-2xl sm:text-4xl text-gray-200 font-light hidden sm:block flex-shrink-0 px-2 sm:px-4">⇄</div>
                <div className="flex flex-col items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black text-white rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold border-4 border-gray-50 overflow-hidden flex-shrink-0">
                    {partner?.avatar ? <img src={partner.avatar} className="w-full h-full object-cover" alt="" /> : partner?.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-base sm:text-lg truncate max-w-[120px] sm:max-w-none">{partner?.name}</div>
                    <div className="font-outfit text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest mt-1">{role === 'TEACHING' ? 'LEARNING' : 'TEACHING'}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 border-t border-gray-100 pt-6 sm:pt-8">
                <div>
                  <div className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">DATE & TIME</div>
                  <div className="text-base sm:text-lg font-medium">
                    {session.scheduledDate ? new Date(session.scheduledDate).toLocaleDateString() : 'To Be Decided'} at {session.scheduledTime || 'To Be Decided'}
                  </div>
                </div>
                <div>
                  <div className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">CREDITS</div>
                  <div className="text-base sm:text-lg font-medium">10 credits</div>
                </div>
                <div>
                  <div className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">MEETING TYPE</div>
                  <div className="text-base sm:text-lg font-medium flex items-center gap-2">
                    {session.meetingType === 'offline' ? (
                      <span className="flex items-center gap-1"><MapPin size={14} /> In-person</span>
                    ) : (
                      <span className="flex items-center gap-1"><Monitor size={14} /> Online</span>
                    )}
                  </div>
                  {session.meetingType === 'offline' && session.location && (
                    <div className="text-sm text-gray-500 mt-1">{session.location}</div>
                  )}
                </div>
              </div>
              {session.notes && (
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-100">
                  <div className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest mb-2">NOTES</div>
                  <p className="text-gray-600 italic leading-relaxed text-sm sm:text-base">"{session.notes}"</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="border border-black p-5 sm:p-8 md:p-10 rounded-xl bg-white shadow-sm flex flex-col gap-4 sm:gap-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">Edit Session Details</h3>
              <div className="flex flex-col gap-2">
                <label className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest">TITLE</label>
                <input 
                  className="w-full border border-black p-3 rounded"
                  value={editForm.title}
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest">DATE</label>
                  <input 
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-black p-3 rounded"
                    value={editForm.scheduledDate}
                    onChange={e => setEditForm({...editForm, scheduledDate: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest">TIME</label>
                  <input 
                    type="time"
                    className="w-full border border-black p-3 rounded"
                    value={editForm.scheduledTime}
                    onChange={e => setEditForm({...editForm, scheduledTime: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest">MEETING TYPE</label>
                  <select 
                    className="w-full border border-black p-3 rounded h-full"
                    value={editForm.meetingType}
                    onChange={e => setEditForm({...editForm, meetingType: e.target.value})}
                  >
                    <option value="online">Online (Video Call)</option>
                    <option value="offline">Offline (In-person)</option>
                  </select>
                </div>
                {editForm.meetingType === 'offline' && (
                  <div className="flex flex-col gap-2">
                    <label className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest">LOCATION</label>
                    <input 
                      className="w-full border border-black p-3 rounded h-full"
                      value={editForm.location}
                      onChange={e => setEditForm({...editForm, location: e.target.value})}
                      placeholder="Enter meeting location"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest">NOTES</label>
                <textarea 
                  className="w-full border border-black p-3 rounded min-h-[80px] sm:min-h-[100px]"
                  value={editForm.notes}
                  onChange={e => setEditForm({...editForm, notes: e.target.value})}
                />
              </div>
              <div className="flex gap-3 sm:gap-4 mt-2 sm:mt-4">
                <button type="submit" disabled={actionLoading} className="flex-1 bg-black text-white p-3 rounded font-medium hover:bg-gray-800 text-sm sm:text-base">Save Changes</button>
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 border border-black p-3 rounded font-medium hover:bg-gray-50 text-sm sm:text-base">Cancel</button>
              </div>
            </form>
          )}

          {/* Video Room or Offline Meeting Details */}
          {session.status === 'scheduled' && session.meetingType === 'online' && (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 border border-black rounded-2xl bg-gray-50/30 text-center">
              <div className="text-gray-200 mb-4 sm:mb-6">
                <Video size={36} className="sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Video Session</h3>
              <p className="text-gray-500 mb-6 sm:mb-8 max-w-[350px] text-sm sm:text-base">The video room will open 5 minutes before the session starts. Please be on time!</p>
              <button 
                onClick={() => navigate(`/video-room/${id}`)}
                className="bg-black text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-xl active:scale-95 text-sm sm:text-base w-full sm:w-auto"
              >
                Join Video Session
              </button>
            </div>
          )}

          {session.status === 'scheduled' && session.meetingType === 'offline' && (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 border border-black rounded-2xl bg-gray-50/30 text-center">
              <div className="text-gray-200 mb-4 sm:mb-6">
                <Coffee size={36} className="sm:w-12 sm:h-12" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">In-person Session</h3>
              <p className="text-gray-500 mb-2 max-w-[350px] text-sm sm:text-base">You are meeting offline for this session.</p>
              <p className="text-base sm:text-lg font-medium">Location: {session.location || 'To be decided'}</p>
            </div>
          )}
          {session.status === 'completed' && (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 border border-black rounded-2xl bg-gray-50/50 text-center">
              <div className="text-gray-200 mb-4 sm:mb-6">
                <Sparkles size={40} className="sm:w-14 sm:h-14" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Session Completed!</h3>
              <p className="text-gray-600 max-w-[450px] leading-relaxed mb-4 sm:mb-6 font-medium text-sm sm:text-base">
                {isRequester 
                  ? `Hope you learned something amazing today! 10 credits have been transferred from your account to ${partner?.name}.`
                  : `Fantastic teaching! You've successfully earned 10 credits. Your knowledge is making the community stronger.`
                }
              </p>
              {!hasReviewed && !showReviewForm && (
                <button 
                  onClick={() => setShowReviewForm(true)}
                  className="bg-black text-white px-8 sm:px-10 py-3 sm:py-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-xl active:scale-95 text-sm sm:text-base w-full sm:w-auto"
                >
                  Share Your Feedback
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6 sm:gap-8">
          <div className="border border-black p-5 sm:p-8 rounded-xl bg-white lg:sticky lg:top-28">
            <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 border-b border-gray-100 pb-3">Session Actions</h3>
            <div className="flex flex-col gap-2 sm:gap-3">
              {isRequester && session.status !== 'completed' && session.status !== 'cancelled' && (
                <button 
                  onClick={() => setIsEditing(!isEditing)} 
                  className="w-full border border-black text-black px-4 py-2.5 sm:py-3 rounded text-sm font-medium hover:bg-black hover:text-white transition-all mb-2 sm:mb-4"
                >
                  {isEditing ? 'View Details' : 'Edit Session'}
                </button>
              )}
              {session.status !== 'completed' && session.status !== 'cancelled' && (
                <Link 
                  to="/messages"
                  className="w-full bg-white border border-black text-black px-4 py-2.5 sm:py-3 rounded text-sm font-medium hover:bg-black hover:text-white transition-all text-center mb-1 sm:mb-2"
                >
                  Chat with Partner
                </Link>
              )}
              {isRequester && session.status === 'pending' && (
                <button onClick={() => handleAction('cancel')} disabled={actionLoading} className="w-full bg-white border border-red-500 text-red-500 px-4 py-2.5 sm:py-3 rounded text-sm font-medium hover:bg-red-50 transition-all">Cancel Request</button>
              )}
              {!isRequester && session.status === 'pending' && (
                <>
                  <button onClick={() => handleAction('accept')} disabled={actionLoading} className="w-full bg-black text-white border border-black px-4 py-2.5 sm:py-3 rounded text-sm font-medium hover:bg-white hover:text-black transition-all">Accept Session</button>
                  <button onClick={() => handleAction('decline')} disabled={actionLoading} className="w-full bg-white border border-red-500 text-red-500 px-4 py-2.5 sm:py-3 rounded text-sm font-medium hover:bg-red-50 transition-all">Decline Request</button>
                </>
              )}
              {session.status === 'scheduled' && (
                <>
                  <button onClick={() => handleAction('complete')} disabled={actionLoading} className="w-full bg-black text-white border border-black px-4 py-2.5 sm:py-3 rounded text-sm font-medium hover:bg-white hover:text-black transition-all">Mark as Completed</button>
                  <button onClick={() => handleAction('cancel')} disabled={actionLoading} className="w-full bg-transparent border border-gray-100 text-red-500 px-4 py-2.5 sm:py-3 rounded text-sm font-medium hover:bg-red-50 hover:border-red-200 transition-all">Cancel Session</button>
                </>
              )}
              {session.status === 'completed' && !hasReviewed && !showReviewForm && (
                <button 
                  onClick={() => setShowReviewForm(true)}
                  className="w-full bg-black text-white px-4 py-2.5 sm:py-3 rounded text-sm font-medium hover:bg-gray-800 transition-all mt-2 sm:mt-4"
                >
                  Leave a Review
                </button>
              )}
              {session.status === 'completed' && hasReviewed && (
                <p className="text-center text-gray-500 text-sm mt-2 sm:mt-4 italic">You have reviewed this session.</p>
              )}

              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mt-4 sm:mt-8 pt-4 sm:pt-8 border-t border-gray-100 flex flex-col gap-3 sm:gap-4">
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-gray-400">Rate your experience</h4>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({...reviewForm, rating: star})}
                        className={`text-xl sm:text-2xl transition-all tap-target ${reviewForm.rating >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                      >
                        <Star size={20} className="sm:w-6 sm:h-6" fill={reviewForm.rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <textarea 
                    className="w-full border border-black p-3 rounded text-sm min-h-[80px] sm:min-h-[100px]"
                    placeholder="Tell us how the session went..."
                    value={reviewForm.comment}
                    onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={actionLoading} className="flex-1 bg-black text-white p-2 rounded text-sm font-medium">Submit</button>
                    <button type="button" onClick={() => setShowReviewForm(false)} className="flex-1 border border-black p-2 rounded text-sm font-medium">Cancel</button>
                  </div>
                </form>
              )}
              {session.status === 'cancelled' && (
                <div className="text-center">
                  <p className="text-red-500 font-medium text-sm sm:text-base">{isRequester ? 'You have cancelled this request.' : `${session.requester?.name} has cancelled this request.`}</p>
                </div>
              )}
              {session.status === 'declined' && (
                <div className="text-center">
                  <p className="text-gray-500 font-medium text-sm sm:text-base">{isRequester ? `${partner?.name} has declined your request.` : 'You have declined this request.'}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 border-b border-gray-100 pb-3">Partner Profile</h3>
              <div className="flex gap-3 sm:gap-4 items-center mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black text-white rounded-full flex items-center justify-center font-bold overflow-hidden flex-shrink-0">
                  {partner?.avatar ? <img src={partner.avatar} className="w-full h-full object-cover" alt="" /> : partner?.name?.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm sm:text-base truncate">{partner?.name}</div>
                  <div className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                    <Star size={10} className="fill-current" /> {(partner?.rating || 0).toFixed(1)}
                  </div>
                </div>
              </div>
              <p className="text-[12px] sm:text-[13px] text-gray-500 leading-relaxed italic">"{partner?.bio || 'No bio available.'}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
