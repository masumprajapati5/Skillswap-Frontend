import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-[#EFEFEF] py-20 px-6 md:px-12 mt-20">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 no-underline text-[#37352F] mb-6">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-black text-xl italic">S</div>
              <span className="font-bold text-[19px] tracking-tight">SkillSwap</span>
            </Link>
            <p className="text-[#37352F]/50 text-sm font-medium leading-relaxed">
              The professional network for direct skill exchange. Build your expertise through collaboration.
            </p>
          </div>
          
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20 mb-6">Platform</h4>
            <ul className="flex flex-col gap-4 text-sm font-bold text-[#37352F]/60">
              <li><Link to="/explore" className="hover:text-black transition-colors">Explore Experts</Link></li>
              <li><Link to="/dashboard" className="hover:text-black transition-colors">Dashboard</Link></li>
              <li><Link to="/auth" className="hover:text-black transition-colors">Sign Up</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20 mb-6">Support</h4>
            <ul className="flex flex-col gap-4 text-sm font-bold text-[#37352F]/60">
              <li><Link to="/help" className="hover:text-black transition-colors">Help Center</Link></li>
              <li><Link to="/terms" className="hover:text-black transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-black/20 mb-6">Connect</h4>
            <div className="flex gap-4">
              {['Twitter', 'LinkedIn', 'Github'].map(s => (
                <a key={s} href="#" className="text-[#37352F]/30 hover:text-black transition-colors">
                  <span className="text-xs font-bold">{s}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#EFEFEF] flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] font-bold text-black/20 uppercase tracking-widest">
            © {new Date().getFullYear()} SkillSwap Inc.
          </p>
          <div className="flex gap-8">
             <span className="text-[10px] font-bold text-black/10 uppercase tracking-tighter italic">Zen Editorial Theme v2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
