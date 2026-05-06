import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';
import { usersAPI, sessionsAPI, skillsAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const RequestSwap = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const storageKey = `requestSwap_${id}`;
  
  const [form, setForm] = useState({
    title: '',
    skillWanted: '',
    skillOffered: '',
    date: '',
    time: '',
    duration: 60,
    meetingType: 'online',
    location: '',
    notes: ''
  });
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setHasDraft(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (form.title || form.notes) {
      localStorage.setItem(storageKey, JSON.stringify(form));
    }
  }, [form, storageKey]);

  const handleRestoreDraft = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setForm(JSON.parse(saved));
      setHasDraft(false);
    }
  };

  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const res = await usersAPI.getUser(id);
        setPartner(res.data);
      } catch (err) {
        console.error('Failed to fetch partner', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPartner();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.skillWanted || !form.skillOffered || !form.date || !form.time) {
      alert('Please fill out all required fields.');
      return;
    }

    const selectedDate = new Date(`${form.date}T${form.time}`);
    if (selectedDate <= new Date()) {
      alert('Session date and time must be in the future.');
      return;
    }

    if (currentUser.credits < 10) {
      alert('You need at least 10 credits to request a swap. Your current balance is ' + currentUser.credits);
      return;
    }

    setSubmitting(true);
    try {
      const res = await sessionsAPI.create({
        recipient: id,
        title: form.title,
        skillOffered: form.skillOffered,
        skillWanted: form.skillWanted,
        scheduledDate: form.date,
        scheduledTime: form.time,
        duration: form.duration,
        meetingType: form.meetingType,
        location: form.meetingType === 'offline' ? form.location : '',
        notes: form.notes
      });
      localStorage.removeItem(storageKey);
      navigate(`/sessions/${res.data._id}`);
    } catch (err) {
      console.error('Request failed', err);
      alert(err.response?.data?.message || 'Failed to send request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !currentUser) return <div className="py-16 sm:py-24 text-center text-gray-500 animate-pulse text-sm">Loading swap form...</div>;
  if (!partner) return <div className="py-16 sm:py-24 text-center">User not found</div>;

  return (
    <div className="responsive-container" style={{ maxWidth: '800px', paddingTop: 'clamp(2rem, 4vw, 5rem)', paddingBottom: 'clamp(2rem, 4vw, 5rem)' }}>
      {hasDraft && (
        <div className="mb-8 sm:mb-10 bg-gray-50 border border-black/5 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <PenLine className="text-gray-400 flex-shrink-0" size={20} />
            <p className="text-[12px] sm:text-[13px] font-medium text-gray-600">You have a previous draft for this partner.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleRestoreDraft}
              className="bg-black text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-gray-800 transition-all"
            >
              Restore
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem(storageKey);
                setHasDraft(false);
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-all"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 sm:mb-14 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-heading-md mb-2 tracking-tight">Request Skill Swap</h1>
          <p className="text-gray-500 text-sm sm:text-base">Propose a knowledge exchange with {partner.name}.</p>
        </div>
        <button 
          type="button" 
          onClick={() => {
            if (window.confirm('Clear all fields and start fresh?')) {
              setForm({
                title: '', skillWanted: '', skillOffered: '', date: '', time: '',
                duration: 60, meetingType: 'online', location: '', notes: ''
              });
              localStorage.removeItem(storageKey);
            }
          }}
          className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-all pb-1 border-b border-transparent hover:border-black"
        >
          Reset Form
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-10">
        <div className="flex flex-col gap-2">
          <label className="font-outfit text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest">SESSION TITLE</label>
          <input 
            required
            className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none focus:border-2 placeholder:text-gray-400 font-medium" 
            placeholder="e.g. React Hook Fundamentals" 
            value={form.title}
            onChange={e => setForm({...form, title: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
          <div className="flex flex-col gap-2">
            <label className="font-outfit text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest">SKILL YOU WANT TO LEARN</label>
            <select 
              required
              className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none font-medium"
              value={form.skillWanted}
              onChange={e => setForm({...form, skillWanted: e.target.value})}
            >
              <option value="">Select a skill</option>
              {partner.skillsOffered?.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-outfit text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest">SKILL YOU CAN TEACH</label>
            <select 
              required
              className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none font-medium"
              value={form.skillOffered}
              onChange={e => setForm({...form, skillOffered: e.target.value})}
            >
              <option value="">Select a skill</option>
              {currentUser?.skillsOffered?.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
          <div className="flex flex-col gap-2">
            <label className="font-outfit text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest">DATE</label>
            <input 
              required
              type="date"
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none font-medium" 
              value={form.date}
              onChange={e => setForm({...form, date: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-outfit text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest">TIME</label>
            <input 
              required
              type="time"
              min={form.date === new Date().toISOString().split('T')[0] ? new Date().toTimeString().slice(0, 5) : null}
              className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none font-medium" 
              value={form.time}
              onChange={e => setForm({...form, time: e.target.value})}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-outfit text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest">DURATION (MIN)</label>
            <select 
              className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none font-medium"
              value={form.duration}
              onChange={e => setForm({...form, duration: e.target.value})}
            >
              <option value="30">30 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">120 min</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
          <div className="flex flex-col gap-2">
            <label className="font-outfit text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest">MEETING TYPE</label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 sm:p-4 border border-black rounded flex-1 hover:bg-gray-50 tap-target">
                <input 
                  type="radio" 
                  name="meetingType" 
                  value="online" 
                  checked={form.meetingType === 'online'} 
                  onChange={e => setForm({...form, meetingType: e.target.value})}
                  className="accent-black w-4 h-4"
                />
                <span className="font-medium text-sm">Online (Video Call)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-3 sm:p-4 border border-black rounded flex-1 hover:bg-gray-50 tap-target">
                <input 
                  type="radio" 
                  name="meetingType" 
                  value="offline" 
                  checked={form.meetingType === 'offline'} 
                  onChange={e => setForm({...form, meetingType: e.target.value})}
                  className="accent-black w-4 h-4"
                />
                <span className="font-medium text-sm">Offline (In-person)</span>
              </label>
            </div>
          </div>
          
          {form.meetingType === 'offline' && (
            <div className="flex flex-col gap-2">
              <label className="font-outfit text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest">LOCATION</label>
              <input 
                required
                className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none focus:border-2 placeholder:text-gray-400 font-medium" 
                placeholder="e.g. Starbucks Downtown, Central Library..." 
                value={form.location}
                onChange={e => setForm({...form, location: e.target.value})}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-outfit text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest">NOTES FOR {partner.name.split(' ')[0].toUpperCase()}</label>
          <textarea 
            className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none focus:border-2 placeholder:text-gray-400 min-h-[100px] sm:min-h-[120px]" 
            placeholder="Introduce yourself and what you'd like to cover..." 
            value={form.notes}
            onChange={e => setForm({...form, notes: e.target.value})}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-between items-center border-t border-gray-100 pt-6 sm:pt-10 gap-4">
          <Link to={`/profile/${id}`} className="text-gray-400 hover:text-black transition-colors font-medium text-sm sm:text-base">Cancel</Link>
          <button 
            disabled={submitting}
            type="submit"
            className="bg-black text-white px-8 sm:px-12 py-3 sm:py-4 rounded border border-black font-semibold hover:bg-white hover:text-black transition-all active:scale-95 shadow-2xl disabled:opacity-50 w-full sm:w-auto text-sm sm:text-base"
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestSwap;
