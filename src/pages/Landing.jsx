import { Link } from 'react-router-dom';
import { Monitor, Palette, BarChart, ArrowRight, CheckCircle2, Users, Sparkles, Zap } from 'lucide-react';

const POPULAR_SKILLS = [
  { name: 'Engineering', desc: 'React, Node.js, Systems Design', icon: <Monitor size={24} /> },
  { name: 'Design', desc: 'UI/UX, Branding, User Research', icon: <Palette size={24} /> },
  { name: 'Business', desc: 'Strategy, Product, Marketing', icon: <BarChart size={24} /> },
];

const Landing = () => {
  return (
    <div className="bg-white min-h-screen">
      {/* ── HERO SECTION ── */}
      <section className="pt-20 pb-32 px-6 max-w-[1100px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-[32px] sm:text-[44px] md:text-[64px] font-bold leading-[1.15] text-black mb-6 tracking-tight">
              Exchange skills.<br className="hidden sm:block"/>
              Grow together.
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-[500px] mx-auto lg:mx-0 font-medium leading-relaxed">
              The workspace for your professional growth. Join the global peer-to-peer network where knowledge is the only currency.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-5 mb-8">
              <Link to="/auth" className="bg-black text-white px-10 py-4 rounded-xl text-lg font-bold hover:opacity-90 transition-all active:scale-95 shadow-xl w-full sm:w-auto whitespace-nowrap">
                Get SkillSwap Free
              </Link>
              <Link to="/explore" className="text-black px-10 py-4 rounded-xl text-lg font-bold hover:bg-[#F7F7F5] transition-all w-full sm:w-auto border border-transparent hover:border-gray-200 whitespace-nowrap">
                Explore the Network
              </Link>
            </div>
            
            <p className="text-sm text-gray-400 font-medium">Free for everyone. No credit card required.</p>
          </div>

          <div className="flex-1 relative w-full max-w-[550px]">
            <img 
              src="/landing_notion.png" 
              alt="SkillSwap Workspace" 
              className="w-full object-contain animate-in fade-in slide-in-from-right-10 duration-1000"
            />
          </div>
        </div>
      </section>

      {/* ── LOGO CLOUD / TRUSTED BY ── */}
      <section className="py-12 border-b border-gray-100 overflow-hidden">
        <div className="max-w-[1100px] mx-auto px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400 mb-8">Empowering learners and teachers worldwide</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            {/* Minimalist text-based logos or icons */}
            <span className="text-2xl font-black italic">LEARN.</span>
            <span className="text-2xl font-black">GROW.</span>
            <span className="text-2xl font-black">SWAP.</span>
            <span className="text-2xl font-black italic">SHARE.</span>
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ── */}
      <section className="py-24 px-6 max-w-[1100px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Everything you need to grow.</h2>
          <p className="text-lg text-gray-500 font-medium">Consolidate your learning journey in one clean workspace.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition-all group flex flex-col h-full">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-black group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Global Peer Network</h3>
            <p className="text-gray-600 leading-relaxed font-medium">Connect with experts directly. No middlemen, just authentic peer-to-peer knowledge exchange.</p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition-all group flex flex-col h-full">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-black group-hover:scale-110 transition-transform">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Matching</h3>
            <p className="text-gray-600 leading-relaxed font-medium">Our AI analyzes your skills and needs to find the perfect partners for your next learning session.</p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition-all group flex flex-col h-full">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-black group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Credit System</h3>
            <p className="text-gray-500 leading-relaxed font-medium">Earn credits by teaching and spend them on learning. A simple, balanced ecosystem for growth.</p>
          </div>
        </div>
      </section>

      {/* ── SKILLS SECTION ── */}
      <section className="py-24 px-6 bg-[#F6F6F3]">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="max-w-[500px]">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-6 tracking-tight">Explore the most<br className="hidden sm:block"/>in-demand domains.</h2>
              <p className="text-base sm:text-lg text-gray-600 font-medium leading-relaxed">Join thousands of others mastering these fields today. From technical engineering to creative arts.</p>
            </div>
            <Link to="/explore" className="text-black font-bold flex items-center gap-2 group hover:underline">
              See all skills <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {POPULAR_SKILLS.map((skill, i) => (
              <Link 
                key={i} 
                to="/explore" 
                className="p-10 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl hover:border-gray-300 transition-all duration-500 group no-underline text-[#37352F] flex flex-col items-start"
              >
                <div className="mb-6 text-black/20 group-hover:text-black transition-colors">
                  {skill.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{skill.name}</h3>
                <p className="text-gray-500 mb-8 font-medium leading-relaxed">{skill.desc}</p>
                <div className="mt-auto text-[11px] font-black uppercase tracking-[0.2em] text-black/30 group-hover:text-black transition-all flex items-center gap-2">
                  Explore domain
                  <ArrowRight size={14} className="-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 text-center max-w-[800px] mx-auto">
        <h2 className="text-[32px] sm:text-[40px] md:text-[60px] font-bold leading-tight mb-8 tracking-tight">
          Ready to start your journey?
        </h2>
        <p className="text-lg sm:text-xl text-gray-500 mb-12 font-medium">Join the network today and unlock a world of knowledge.</p>
        <Link to="/auth" className="bg-black text-white px-12 py-4 rounded-xl text-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-2xl inline-block mb-4">
          Get SkillSwap Free
        </Link>
        <div>
          <Link to="/explore" className="text-gray-400 hover:text-black font-bold transition-colors">Or explore the network first</Link>
        </div>
      </section>
    </div>
  );
};

export default Landing;
