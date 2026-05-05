import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { login, register, loading, isAuthenticated, user, clearError } = useAuthStore();
  const navigate = useNavigate();

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    clearError();
  }, [isLogin, isForgotPassword, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();
    
    // Frontend Validation
    if (!form.email) {
      toast.error('Email field cannot be blank.');
      return;
    }
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('The email format is incorrect.');
      return;
    }

    if (!isLogin && form.name.trim().length < 2) {
      toast.error('Please provide a valid name (min 2 characters).');
      return;
    }
    
    if (!form.password) {
      toast.error('Password field cannot be blank.');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Password is too short (min 6 characters).');
      return;
    }

    let res;
    if (isLogin) {
      res = await login(form.email, form.password);
    } else {
      res = await register(form.name, form.email, form.password);
    }

    if (res.success) {
      if (res.user?.role === 'admin') {
        navigate('/admin');
      } else if (!isLogin) {
        // New user - force profile setup
        navigate('/profile/edit');
      } else {
        // Existing user
        navigate('/dashboard');
      }
    } else {
      toast.error(res.message || 'Authentication failed');
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    toast.dismiss();
    if (!forgotEmail) {
      toast.error('Please enter an email address to recover your password.');
      return;
    }
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail);
      setForgotSuccess(true);
      toast.success('Password reset link sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setForgotLoading(false);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white px-6 py-10">
        <div className="max-w-[400px] w-full flex flex-col gap-10">
          <div className="text-center">
            <h1 className="text-[32px] font-bold text-[#37352F] mb-2 tracking-tight">Recover Password</h1>
            <p className="text-[#37352F]/60 font-medium">We'll send a recovery link to your inbox.</p>
          </div>

          {forgotSuccess ? (
            <div className="bg-[#F7F7F5] p-10 rounded-2xl text-center border border-gray-100 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-black/20 shadow-sm">
                <Mail size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#37352F] mb-2">Check your email</h2>
                <p className="text-sm text-[#37352F]/60 font-medium leading-relaxed">We've sent a link to <strong>{forgotEmail}</strong>.</p>
              </div>
              <button onClick={() => setIsForgotPassword(false)} className="text-sm font-bold text-black underline underline-offset-4 hover:opacity-70 transition-all">Back to Login</button>
            </div>
          ) : (
            <form onSubmit={handleForgotRequest} noValidate className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Email Address</label>
                <input 
                  className="w-full bg-[#F7F7F5] border-transparent px-5 py-3.5 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-black/5 placeholder:text-gray-400 font-medium transition-all" 
                  type="email" 
                  placeholder="you@example.com" 
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)} 
                />
              </div>
              <button 
                type="submit" 
                disabled={forgotLoading}
                className="bg-black text-white px-6 py-4 rounded-xl text-base font-bold hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
              >
                {forgotLoading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setIsForgotPassword(false)} className="text-sm font-bold text-black/40 hover:text-black transition-colors flex items-center justify-center gap-2">
                Already know it? <span className="underline underline-offset-4">Log In</span>
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-white px-6 py-10">
      <div className="max-w-[400px] w-full flex flex-col gap-10">
        
        <div className="text-center">
          <h1 className="text-[32px] font-bold text-[#37352F] mb-2 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-[#37352F]/60 font-medium">
            {isLogin ? 'Sign in to continue swapping expertise.' : 'Join the global network of experts.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          {!isLogin && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Full Name</label>
              <input 
                className="w-full bg-[#F7F7F5] border-transparent px-5 py-3.5 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-black/5 placeholder:text-gray-400 font-medium transition-all" 
                type="text" 
                placeholder="Your name" 
                required
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})} 
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] ml-1">Email</label>
            <input 
              className="w-full bg-[#F7F7F5] border-transparent px-5 py-3.5 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-black/5 placeholder:text-gray-400 font-medium transition-all" 
              type="email" 
              placeholder="you@example.com" 
              required
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})} 
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em]">Password</label>
              {isLogin && (
                <button 
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-[10px] font-black text-black/30 hover:text-black hover:underline transition-all uppercase tracking-widest decoration-1 underline-offset-4"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                className="w-full bg-[#F7F7F5] border-transparent px-5 py-3.5 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-black/5 placeholder:text-gray-400 font-medium transition-all" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/20 hover:text-black transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="bg-black text-white px-6 py-4 rounded-xl text-base font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-xl mt-2" 
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm font-bold text-black/30">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="bg-transparent border-none underline underline-offset-4 text-black cursor-pointer hover:opacity-70 transition-all"
            >
              {isLogin ? 'Sign Up' : 'Log In'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Auth;

