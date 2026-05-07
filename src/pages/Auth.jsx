import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!form.email.trim() || !form.password.trim()) {
      toast.error("Please fill out all required fields.");
      setLoading(false);
      return;
    }

    if (!isLogin && !form.name.trim()) {
      toast.error("Please enter your full name.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const result = isLogin 
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);

      if (result.success) {
        if (result.user.role === 'admin') {
          navigate('/admin');
        } else {
          // If just registered, go to profile edit to set up skills
          navigate(isLogin ? '/dashboard' : '/profile/edit');
        }
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!forgotPasswordEmail.trim()) {
      toast.error("Please enter your email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setForgotPasswordLoading(true);

    try {
      await authAPI.forgotPassword(forgotPasswordEmail);
      toast.success("Password reset link sent! Check your email inbox.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send reset link.");
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-white px-4 sm:px-6 py-8 sm:py-10 font-outfit">
        <div className="max-w-[400px] w-full flex flex-col gap-8 sm:gap-10">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Forgot Password</h1>
            <p className="text-gray-500 text-sm sm:text-base">We'll send a reset link to your email address.</p>
          </div>

          <form onSubmit={handleForgotPasswordSubmit} noValidate className="flex flex-col gap-5 sm:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest font-black">EMAIL ADDRESS</label>
              <input
                type="email"
                placeholder="you@email.com"
                required
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none focus:border-2 placeholder:text-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={forgotPasswordLoading}
              className="bg-black text-white border border-black px-4 py-3 sm:py-4 rounded text-base hover:bg-white hover:text-black transition-all active:scale-95 font-bold flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {forgotPasswordLoading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
              {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="text-center text-sm text-gray-500 hover:text-black transition-colors font-medium bg-transparent border-none"
            >
              Back to <span className="underline">Login</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-white px-4 sm:px-6 py-8 sm:py-10 font-outfit">
      <div className="max-w-[400px] w-full flex flex-col gap-8 sm:gap-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">{isLogin ? 'Welcome back' : 'Join SkillSwap'}</h1>
          <p className="text-gray-500 text-sm sm:text-base">{isLogin ? 'Log in to your account.' : 'Create your account to start swapping skills.'}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 sm:gap-6">
          {!isLogin && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest font-black">FULL NAME</label>
              <input 
                type="text" 
                placeholder="Your full name" 
                required 
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none focus:border-2 placeholder:text-gray-400" 
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest font-black">EMAIL</label>
            <input 
              type="email" 
              placeholder="you@email.com" 
              required 
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none focus:border-2 placeholder:text-gray-400" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest font-black">PASSWORD</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required 
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white border border-black text-black px-4 sm:px-5 py-3 sm:py-3.5 rounded outline-none focus:border-2 placeholder:text-gray-400" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
            {isLogin && (
              <button 
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="self-end mt-1 text-xs text-gray-500 hover:text-black transition-colors font-medium bg-transparent border-none"
              >
                Forgot password?
              </button>
            )}
          </div>

          <button 
            disabled={loading} 
            type="submit"
            className="bg-black text-white border border-black px-4 py-3 sm:py-4 rounded text-base hover:bg-white hover:text-black transition-all active:scale-95 font-bold flex items-center justify-center gap-3 mt-2 disabled:opacity-50"
          >
            {loading && <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
            {loading ? (isLogin ? 'Logging in...' : 'Creating...') : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account?" : 'Already a member?'}{' '}
          <button className="text-black underline font-medium bg-transparent border-none cursor-pointer" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
