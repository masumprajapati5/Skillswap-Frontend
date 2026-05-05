import { Link } from 'react-router-dom';

const ProfilePrompt = ({ user }) => {
  if (!user) return null;

  const isIncomplete = !user.bio || !user.skillsOffered?.length || !user.skillsWanted?.length;

  if (!isIncomplete) return null;

  return (
    <div className="bg-black text-white p-8 rounded-2xl mb-14 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl animate-fade-in relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex-1">
        <h3 className="text-xl font-medium mb-2">Complete your profile to unlock full potential ✨</h3>
        <p className="text-gray-400 text-sm leading-relaxed max-w-[500px]">
          Adding your bio and skills helps our AI find better matches for you and builds trust in the community.
        </p>
      </div>
      
      <Link 
        to="/profile/edit" 
        className="bg-white text-black px-8 py-3 rounded text-sm font-semibold hover:bg-gray-100 transition-all active:scale-95 whitespace-nowrap shadow-lg"
      >
        Complete Profile
      </Link>
    </div>
  );
};

export default ProfilePrompt;
