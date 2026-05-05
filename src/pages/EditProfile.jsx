import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, File, Plus, X, Upload, Save, MapPin } from 'lucide-react';
import { usersAPI, skillsAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const STEPS = ['Basic Info', 'Skills', 'Availability', 'Portfolio', 'Preview'];

const EditProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user: authUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allSkills, setAllSkills] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({
    name: '', bio: '', city: '', country: '',
    skillsOffered: [], skillsWanted: [],
    availability: [], portfolio: []
  });
  const [customSkill, setCustomSkill] = useState({ offered: '', wanted: '' });
  const [creatingSkill, setCreatingSkill] = useState(false);

  const hasLoaded = useRef(false);
  const storageKey = authUser ? `editProfileForm_${authUser._id}` : null;
  const stepKey = authUser ? `editProfileStep_${authUser._id}` : null;

  useEffect(() => {
    if (!authUser || hasLoaded.current) return;

    const fetchData = async () => {
      try {
        const [userRes, skillsRes] = await Promise.all([
          usersAPI.getMe(),
          skillsAPI.getAll()
        ]);
        
        const userData = userRes.data;
        const serverForm = {
          name: userData.name || '',
          bio: userData.bio || '',
          city: userData.location?.city || '',
          country: userData.location?.country || '',
          skillsOffered: userData.skillsOffered?.map(s => s._id || s) || [],
          skillsWanted: userData.skillsWanted?.map(s => s._id || s) || [],
          availability: userData.availability || [],
          portfolio: userData.portfolio || []
        };

        if (storageKey) {
          const savedForm = localStorage.getItem(storageKey);
          if (savedForm) {
            const draft = JSON.parse(savedForm);
            // Only merge if the draft actually has some meaningful content
            if (draft.name || draft.bio || draft.skillsOffered?.length > 0) {
              setForm({ ...serverForm, ...draft });
            } else {
              setForm(serverForm);
            }
          } else {
            setForm(serverForm);
          }
        } else {
          setForm(serverForm);
        }

        if (stepKey) {
          const savedStep = localStorage.getItem(stepKey);
          if (savedStep) setStep(parseInt(savedStep));
        }

        setAllSkills(skillsRes.data);
        hasLoaded.current = true;
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Cleanup old generic keys if they exist
    localStorage.removeItem('editProfileForm');
    localStorage.removeItem('editProfileStep');
  }, [storageKey, stepKey, authUser]);

  // Save state to localStorage on change - ONLY if we have data and finished loading
  useEffect(() => {
    if (!loading && storageKey && stepKey && form.name) {
      localStorage.setItem(storageKey, JSON.stringify(form));
      localStorage.setItem(stepKey, step.toString());
    }
  }, [form, step, loading, storageKey, stepKey]);

  const validateStep = (currentStep) => {
    switch (currentStep) {
      case 0: // Basic Info
        if (!form.name.trim()) return 'Please enter your full name.';
        if (form.bio.trim().length < 20) return 'Bio should be at least 20 characters.';
        if (!form.city.trim() || !form.country.trim()) return 'Please provide your city and country.';
        return null;
      case 1: // Skills
        if (form.skillsOffered.length === 0) return 'Please select at least one skill you can offer.';
        return null;
      case 2: // Availability
        if (form.availability.length === 0) return 'Please select at least one time slot when you are available.';
        return null;
      default:
        return null;
    }
  };

  const handleStepChange = (targetStep) => {
    if (targetStep > step) {
      const error = validateStep(step);
      if (error) {
        alert(error);
        return;
      }
    }
    setStep(targetStep);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Sanitize portfolio - ensure it's a real array of objects, not a string
    let cleanPortfolio = form.portfolio;
    if (typeof cleanPortfolio === 'string') {
      try {
        cleanPortfolio = JSON.parse(cleanPortfolio);
      } catch (e) {
        cleanPortfolio = [];
      }
    }
    if (!Array.isArray(cleanPortfolio)) cleanPortfolio = [];

    // Sanitize skills to ensure only IDs are sent
    const cleanSkillsOffered = form.skillsOffered.map(s => typeof s === 'object' ? s._id : s).filter(Boolean);
    const cleanSkillsWanted = form.skillsWanted.map(s => typeof s === 'object' ? s._id : s).filter(Boolean);

    try {
      await usersAPI.updateMe({
        name: form.name,
        bio: form.bio,
        location: { city: form.city, country: form.country },
        skillsOffered: cleanSkillsOffered,
        skillsWanted: cleanSkillsWanted,
        portfolio: cleanPortfolio,
        availability: form.availability
      });
      
      // Clear localStorage on successful save
      if (storageKey) localStorage.removeItem(storageKey);
      if (stepKey) localStorage.removeItem(stepKey);
      
      navigate(`/profile/${authUser._id}`);
    } catch (err) {
      console.error('Save failed', err);
      console.error('Save failed details:', err.response?.data || err.message);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skillId, type) => {
    const field = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
    const current = form[field];
    const updated = current.includes(skillId) 
      ? current.filter(id => id !== skillId) 
      : [...current, skillId];
    setForm({ ...form, [field]: updated });
  };

  const handleCreateCustomSkill = async (type) => {
    const name = type === 'offered' ? customSkill.offered : customSkill.wanted;
    if (!name.trim()) return;

    setCreatingSkill(true);
    try {
      const res = await skillsAPI.create({ name: name.trim() });
      const newSkill = res.data;
      
      // Update local skills list so it shows up
      if (!allSkills.find(s => s._id === newSkill._id)) {
        setAllSkills([...allSkills, newSkill]);
      }

      // Add to user's selection
      const field = type === 'offered' ? 'skillsOffered' : 'skillsWanted';
      if (!form[field].includes(newSkill._id)) {
        setForm(prev => ({
          ...prev,
          [field]: [...prev[field], newSkill._id]
        }));
      }

      // Clear input
      setCustomSkill(prev => ({ ...prev, [type]: '' }));
    } catch (err) {
      console.error('Failed to create skill', err);
      alert('Failed to add custom skill.');
    } finally {
      setCreatingSkill(false);
    }
  };

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;
    
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const oversized = Array.from(files).filter(f => f.size > MAX_SIZE);
    
    if (oversized.length > 0) {
      alert(`Some files are too large: ${oversized.map(f => f.name).join(', ')}. Max size is 10MB.`);
      return;
    }

    setSaving(true);
    try {
      const uploadPromises = Array.from(files).map(file => usersAPI.uploadFile(file));
      const results = await Promise.all(uploadPromises);
      
      const newItems = results.map(res => res.data);

      setForm(prev => ({
        ...prev,
        portfolio: [...prev.portfolio, ...newItems]
      }));
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload files. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => {
    setDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removePortfolioItem = (index) => {
    setForm(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <p className="text-gray-500 animate-pulse">Loading profile data...</p>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-20 px-6 max-w-[800px] mx-auto min-h-screen">
      <div className="mb-10 sm:mb-14 text-center sm:text-left">
        <h1 className="text-[32px] sm:text-4xl font-bold mb-2 tracking-tight">Edit Profile</h1>
        <p className="text-gray-500 text-base sm:text-lg">Complete your profile to start swapping skills.</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-6 overflow-x-auto mb-14 border-b border-gray-100 pb-px scrollbar-hide">
        {STEPS.map((s, i) => (
          <div 
            key={i} 
            onClick={() => handleStepChange(i)}
            className={`py-4 text-[11px] font-bold uppercase tracking-[0.1em] cursor-pointer relative whitespace-nowrap transition-colors ${step === i ? 'text-black' : 'text-gray-400'}`}
          >
            {s}
            {step === i && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
          </div>
        ))}
      </div>

      <div className="min-h-[400px]">
        {step === 0 && (
          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-2">
              <label className="font-outfit text-[11px] text-gray-500 uppercase tracking-widest">FULL NAME</label>
              <input 
                className="w-full bg-white border border-black text-black px-5 py-3.5 rounded outline-none focus:border-2 placeholder:text-gray-400 font-medium" 
                placeholder="Your name" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-outfit text-[11px] text-gray-500 uppercase tracking-widest">BIO</label>
              <textarea 
                className="w-full bg-white border border-black text-black px-5 py-3.5 rounded outline-none focus:border-2 placeholder:text-gray-400 min-h-[140px] leading-relaxed" 
                placeholder="Tell others about yourself..." 
                value={form.bio} 
                onChange={e => setForm({...form, bio: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex flex-col gap-2">
                <label className="font-outfit text-[11px] text-gray-500 uppercase tracking-widest">CITY</label>
                <input 
                  className="w-full bg-white border border-black text-black px-5 py-3.5 rounded outline-none focus:border-2 placeholder:text-gray-400" 
                  placeholder="e.g. Bangalore" 
                  value={form.city} 
                  onChange={e => setForm({...form, city: e.target.value})} 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-outfit text-[11px] text-gray-500 uppercase tracking-widest">COUNTRY</label>
                <input 
                  className="w-full bg-white border border-black text-black px-5 py-3.5 rounded outline-none focus:border-2 placeholder:text-gray-400" 
                  placeholder="e.g. India" 
                  value={form.country} 
                  onChange={e => setForm({...form, country: e.target.value})} 
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-14">
            <div>
              <h3 className="text-xl font-semibold mb-6 border-b border-gray-100 pb-3">Skills You Offer</h3>
              <div className="flex gap-3 flex-wrap">
                {allSkills.map(s => (
                  <button 
                    key={s._id} 
                    onClick={() => toggleSkill(s._id, 'offered')}
                    className={`px-5 py-2.5 rounded border border-black text-sm transition-all cursor-pointer font-medium ${form.skillsOffered.includes(s._id) ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex gap-3 max-w-[450px]">
                <input 
                  className="flex-1 bg-white border border-black text-black px-4 py-2.5 rounded text-sm outline-none placeholder:text-gray-400 font-medium"
                  placeholder="Can't find your skill? Type and add it..."
                  value={customSkill.offered}
                  onChange={e => setCustomSkill({...customSkill, offered: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCustomSkill('offered')}
                />
                <button 
                  type="button"
                  disabled={creatingSkill}
                  onClick={() => handleCreateCustomSkill('offered')}
                  className="bg-black text-white px-5 py-2.5 rounded text-sm font-bold hover:bg-gray-800 disabled:bg-gray-400 whitespace-nowrap transition-all"
                >
                  {creatingSkill ? 'Adding...' : 'Add Skill'}
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-6 border-b border-gray-100 pb-3">Skills You Want to Learn</h3>
              <div className="flex gap-3 flex-wrap">
                {allSkills.map(s => (
                  <button 
                    key={s._id} 
                    onClick={() => toggleSkill(s._id, 'wanted')}
                    className={`px-5 py-2.5 rounded border border-black text-sm transition-all cursor-pointer font-medium ${form.skillsWanted.includes(s._id) ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex gap-3 max-w-[450px]">
                <input 
                  className="flex-1 bg-white border border-black text-black px-4 py-2.5 rounded text-sm outline-none placeholder:text-gray-400 font-medium"
                  placeholder="Type a skill you want to learn..."
                  value={customSkill.wanted}
                  onChange={e => setCustomSkill({...customSkill, wanted: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && handleCreateCustomSkill('wanted')}
                />
                <button 
                  type="button"
                  disabled={creatingSkill}
                  onClick={() => handleCreateCustomSkill('wanted')}
                  className="bg-black text-white px-5 py-2.5 rounded text-sm font-bold hover:bg-gray-800 disabled:bg-gray-400 whitespace-nowrap transition-all"
                >
                  {creatingSkill ? 'Adding...' : 'Add Skill'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full">
            <h3 className="text-xl font-semibold mb-2">Your Availability</h3>
            <p className="text-gray-500 mb-10 text-sm">Select the time slots when you are typically free for sessions.</p>
            <div className="flex flex-col gap-8">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="flex flex-col sm:grid sm:grid-cols-[100px_1fr] items-start sm:items-center gap-4 border-b border-gray-50 pb-6 sm:border-0 sm:pb-0">
                  <div className="font-outfit text-sm font-bold uppercase tracking-widest text-gray-400">{day}</div>
                  <div className="flex gap-2 sm:gap-3 flex-wrap">
                    {['Morning', 'Afternoon', 'Evening'].map(time => (
                      <button 
                        key={time} 
                        onClick={() => {
                          const key = `${day}_${time}`;
                          const arr = form.availability.includes(key) ? form.availability.filter(x => x !== key) : [...form.availability, key];
                          setForm({...form, availability: arr});
                        }}
                        className={`flex-1 sm:flex-initial px-4 py-2.5 rounded border border-gray-200 text-[11px] font-bold transition-all cursor-pointer uppercase tracking-wider ${form.availability.includes(`${day}_${time}`) ? 'bg-black border-black text-white' : 'bg-white text-black hover:border-black'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-10">
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={(e) => handleFileSelect(e.target.files)}
              accept="image/*,.pdf"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`text-center py-20 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${dragging ? 'bg-black border-black text-white' : 'border-gray-200 bg-gray-50 hover:border-black text-black'}`}
            >
              <div className={`text-gray-200 mb-6 transition-transform ${dragging ? 'scale-125' : 'scale-100'}`}>
                <Folder size={56} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Portfolio / Work Samples</h3>
              <p className="mb-8 max-w-[300px] mx-auto leading-relaxed text-sm">Drag & drop files or click here to upload your work showcases.</p>
              <p className="font-outfit text-[10px] uppercase tracking-widest opacity-60">PNG, JPG, PDF — MAX 10MB</p>
            </div>

            {form.portfolio.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {form.portfolio.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="text-gray-400">
                        <File size={24} />
                      </div>
                      <div className="truncate text-sm font-medium">{item.name}</div>
                    </div>
                    <button 
                      onClick={() => removePortfolioItem(idx)}
                      className="text-red-500 hover:text-red-700 p-2 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="border border-black p-10 rounded-2xl bg-white shadow-xl flex flex-col gap-8">
            <div>
              <h3 className="text-3xl font-semibold mb-4">{form.name || 'Your Name'}</h3>
              <p className="text-lg text-gray-700 leading-relaxed italic">"{form.bio || 'Your bio will appear here.'}"</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 border-t border-gray-100 pt-8">
              <div>
                <div className="font-outfit text-[11px] text-gray-400 uppercase tracking-widest mb-4">SKILLS OFFERED</div>
                <div className="flex gap-2 flex-wrap">
                  {form.skillsOffered.length > 0 ? form.skillsOffered.map(id => {
                    const skill = allSkills.find(s => s._id === id);
                    return <span key={id} className="text-[11px] font-bold border border-black px-3 py-1 rounded tracking-widest uppercase bg-black text-white">{skill?.name}</span>;
                  }) : <span className="text-sm text-gray-400 italic">None selected</span>}
                </div>
              </div>
              <div>
                <div className="font-outfit text-[11px] text-gray-400 uppercase tracking-widest mb-4">SKILLS WANTED</div>
                <div className="flex gap-2 flex-wrap">
                  {form.skillsWanted.length > 0 ? form.skillsWanted.map(id => {
                    const skill = allSkills.find(s => s._id === id);
                    return <span key={id} className="text-[11px] font-bold border border-gray-300 text-gray-400 px-3 py-1 rounded tracking-widest uppercase">{skill?.name}</span>;
                  }) : <span className="text-sm text-gray-400 italic">None selected</span>}
                </div>
              </div>
            </div>
            {form.portfolio.length > 0 && (
              <div className="border-t border-gray-100 pt-8">
                <div className="font-outfit text-[11px] text-gray-400 uppercase tracking-widest mb-4">PORTFOLIO ({form.portfolio.length})</div>
                <div className="flex gap-3 flex-wrap">
                  {form.portfolio.map((item, idx) => (
                    <div key={idx} className="text-sm font-medium border border-gray-100 px-4 py-2 rounded-lg bg-gray-50">
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-20 flex justify-between items-center border-t border-gray-100 pt-10">
        <button 
          className="px-8 py-3 rounded border border-gray-100 text-black font-semibold hover:border-black disabled:opacity-30 disabled:cursor-not-allowed transition-all" 
          onClick={() => setStep(Math.max(0, step - 1))} 
          disabled={step === 0}
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button 
            className="bg-black text-white px-10 py-3 rounded border border-black font-semibold hover:bg-white hover:text-black transition-all active:scale-95 shadow-lg" 
            onClick={() => handleStepChange(step + 1)}
          >
            Next Step
          </button>
        ) : (
          <button 
            disabled={saving}
            onClick={handleSave}
            className="bg-black text-white px-12 py-4 rounded border border-black font-semibold hover:bg-white hover:text-black transition-all active:scale-95 shadow-2xl disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        )}
      </div>
    </div>
  );
};

export default EditProfile;
