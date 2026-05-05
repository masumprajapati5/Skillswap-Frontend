import { useState, useEffect } from 'react';
import { walletAPI } from '../services/api';
import useAuthStore from '../store/authStore';

const Wallet = () => {
  const { user } = useAuthStore();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const res = await walletAPI.get();
        setWallet(res.data);
        // Sync with global store for navbar
        const { loadUser } = useAuthStore.getState();
        loadUser();
      } catch (err) {
        console.error('Failed to fetch wallet', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-gray-400 font-outfit uppercase tracking-widest text-[11px] animate-pulse">Loading wallet...</p>
      </div>
    );
  }

  const balance = wallet?.balance || 0;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-6 py-12 sm:py-20 max-w-[1200px] mx-auto">
      {/* Header - Centered */}
      <div className="mb-10 sm:mb-16 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">Wallet</h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-[500px] mx-auto font-medium">Your balance and platform currency status.</p>
      </div>

      {/* Main Balance Display - Large and Centered */}
      <div className="w-full max-w-[500px]">
        <div className={`relative overflow-hidden border ${balance === 0 ? 'border-red-500' : 'border-black'} p-16 rounded-[40px] flex flex-col items-center justify-center gap-4 transition-all bg-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]`}>
          {/* Subtle background decoration */}

          <div className="font-outfit text-[10px] sm:text-[11px] text-gray-400 uppercase tracking-[0.3em] mb-2 font-black">TOTAL BALANCE</div>

          <div className={`text-[80px] sm:text-[120px] font-semibold leading-none tracking-tighter ${balance === 0 ? 'text-red-500' : 'text-black'}`}>
            {balance}
          </div>

          <div className="font-outfit text-[13px] text-black/40 mt-4 uppercase tracking-[0.2em] font-bold italic">Skill Credits</div>
        </div>
      </div>

      {/* Action Area / Zero State */}
      <div className="mt-16 w-full max-w-[500px]">
        {balance === 0 ? (
          <div className="p-8 rounded-3xl bg-red-50/50 border border-red-100 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <h2 className="text-lg font-bold text-red-600 mb-2">Insufficient Credits</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">Teach your skills to others to earn more credits and unlock learning opportunities.</p>
            <a href="/explore" className="inline-block bg-black text-white px-10 py-4 rounded-full text-sm font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-xl">
              Earn Credits Now
            </a>
          </div>
        ) : (
          <div className="text-center">
            <a href="/explore" className="inline-block border border-black text-black px-10 py-4 rounded-full text-sm font-bold hover:bg-black hover:text-white transition-all active:scale-95">
              Request a Learning Session
            </a>
          </div>
        )}
      </div>

      {/* Information Footer */}
      <div className="mt-24 max-w-[600px] text-center">
        <div className="inline-block p-1 bg-gray-50 rounded-full mb-6">
          <div className="px-4 py-1 bg-white rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 border border-gray-100">Quick Guide</div>
        </div>
        <p className="text-gray-400 text-[14px] leading-relaxed">
          Credits are the heart of <span className="text-black font-medium">SkillSwap</span>.
          You earn <span className="text-black font-medium">1 credit</span> for every hour you teach,
          and spend <span className="text-black font-medium">1 credit</span> for every hour you learn.
          Keep your balance healthy to stay active in the network.
        </p>
      </div>
    </div>
  );
};

export default Wallet;
