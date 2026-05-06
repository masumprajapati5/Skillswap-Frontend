import { Link } from 'react-router-dom';
import { Monitor, Palette, BarChart, ArrowRight, CheckCircle2, Users, Sparkles, Zap } from 'lucide-react';

const POPULAR_SKILLS = [
  { name: 'Engineering', desc: 'React, Node.js, Systems Design', icon: <Monitor size={24} /> },
  { name: 'Design', desc: 'UI/UX, Branding, User Research', icon: <Palette size={24} /> },
  { name: 'Business', desc: 'Strategy, Product, Marketing', icon: <BarChart size={24} /> },
];

const Landing = () => {
  return (
    <div className="bg-white min-h-screen overflow-x-hidden">
      {/* ── HERO SECTION ── */}
      <section className="section-padding-y" style={{ paddingTop: 'clamp(3rem, 6vw, 5rem)', paddingBottom: 'clamp(4rem, 8vw, 8rem)' }}>
        <div className="responsive-container" style={{ maxWidth: '1100px' }}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 sm:gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-hero text-black mb-4 sm:mb-6">
                Exchange skills.<br/>
                Grow together.
              </h1>
              <p className="text-body-lg text-gray-600 mb-8 sm:mb-10 max-w-[500px] mx-auto lg:mx-0 font-medium leading-relaxed">
                The workspace for your professional growth. Join the global peer-to-peer network where knowledge is the only currency.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-3 sm:gap-5 mb-6 sm:mb-8">
                <Link to="/auth" className="bg-black text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:opacity-90 transition-all active:scale-95 shadow-xl w-full sm:w-auto whitespace-nowrap text-center">
                  Get SkillSwap Free
                </Link>
                <Link to="/explore" className="text-black px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-[#F7F7F5] transition-all w-full sm:w-auto border border-transparent hover:border-gray-200 whitespace-nowrap text-center">
                  Explore the Network
                </Link>
              </div>
              
              <p className="text-sm text-gray-400 font-medium">Free for everyone. No credit card required.</p>
            </div>

            <div className="flex-1 relative w-full max-w-[450px] lg:max-w-[550px]">
              <img 
                src="/landing_notion.png" 
                alt="SkillSwap Workspace" 
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGO CLOUD / TRUSTED BY ── */}
      <section className="py-8 sm:py-12 border-b border-gray-100 overflow-hidden">
        <div className="responsive-container text-center" style={{ maxWidth: '1100px' }}>
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gray-400 mb-6 sm:mb-8">Empowering learners and teachers worldwide</p>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
            <span className="text-lg sm:text-2xl font-black italic">LEARN.</span>
            <span className="text-lg sm:text-2xl font-black">GROW.</span>
            <span className="text-lg sm:text-2xl font-black">SWAP.</span>
            <span className="text-lg sm:text-2xl font-black italic">SHARE.</span>
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ── */}
      <section className="section-padding-y">
        <div className="responsive-container" style={{ maxWidth: '1100px' }}>
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-heading-lg mb-3 sm:mb-4 tracking-tight">Everything you need to grow.</h2>
            <p className="text-body-lg text-gray-500 font-medium">Consolidate your learning journey in one clean workspace.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition-all group flex flex-col h-full">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 sm:mb-6 text-black group-hover:scale-110 transition-transform">
                <Users size={22} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Global Peer Network</h3>
              <p className="text-gray-600 leading-relaxed font-medium text-sm sm:text-base">Connect with experts directly. No middlemen, just authentic peer-to-peer knowledge exchange.</p>
            </div>

            {/* Card 2 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition-all group flex flex-col h-full">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 sm:mb-6 text-black group-hover:scale-110 transition-transform">
                <Sparkles size={22} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Smart Matching</h3>
              <p className="text-gray-600 leading-relaxed font-medium text-sm sm:text-base">Our AI analyzes your skills and needs to find the perfect partners for your next learning session.</p>
            </div>

            {/* Card 3 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-300 transition-all group flex flex-col h-full sm:col-span-2 lg:col-span-1">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-4 sm:mb-6 text-black group-hover:scale-110 transition-transform">
                <Zap size={22} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">Instant Credit System</h3>
              <p className="text-gray-500 leading-relaxed font-medium text-sm sm:text-base">Earn credits by teaching and spend them on learning. A simple, balanced ecosystem for growth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SKILLS SECTION ── */}
      <section className="section-padding-y bg-[#F6F6F3]">
        <div className="responsive-container" style={{ maxWidth: '1100px' }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 sm:mb-16 gap-4 sm:gap-6">
            <div className="max-w-[500px]">
              <h2 className="text-heading-lg mb-4 sm:mb-6 tracking-tight">Explore the most<br className="hidden sm:block"/>in-demand domains.</h2>
              <p className="text-body-lg text-gray-600 font-medium leading-relaxed">Join thousands of others mastering these fields today. From technical engineering to creative arts.</p>
            </div>
            <Link to="/explore" className="text-black font-bold flex items-center gap-2 group hover:underline text-sm sm:text-base">
              See all skills <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {POPULAR_SKILLS.map((skill, i) => (
              <Link 
                key={i} 
                to="/explore" 
                className="p-6 sm:p-8 md:p-10 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-2xl hover:border-gray-300 transition-all duration-500 group no-underline text-[#37352F] flex flex-col items-start"
              >
                <div className="mb-4 sm:mb-6 text-black/20 group-hover:text-black transition-colors">
                  {skill.icon}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{skill.name}</h3>
                <p className="text-gray-500 mb-6 sm:mb-8 font-medium leading-relaxed text-sm sm:text-base">{skill.desc}</p>
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
      <section className="section-padding-y text-center" style={{ paddingTop: 'clamp(4rem, 8vw, 8rem)', paddingBottom: 'clamp(4rem, 8vw, 8rem)' }}>
        <div className="responsive-container" style={{ maxWidth: '800px' }}>
          <h2 className="text-display mb-6 sm:mb-8 tracking-tight">
            Ready to start your journey?
          </h2>
          <p className="text-body-lg text-gray-500 mb-8 sm:mb-12 font-medium">Join the network today and unlock a world of knowledge.</p>
          <Link to="/auth" className="bg-black text-white px-8 sm:px-12 py-3.5 sm:py-4 rounded-xl text-lg sm:text-xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-2xl inline-block mb-4">
            Get SkillSwap Free
          </Link>
          <div>
            <Link to="/explore" className="text-gray-400 hover:text-black font-bold transition-colors text-sm sm:text-base">Or explore the network first</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
