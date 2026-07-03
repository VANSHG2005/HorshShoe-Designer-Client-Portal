import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { HorseShoeEmblem } from '../../components/HorseShoeLogo';
import {
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
} from 'react-icons/hi2';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      toast.success(`Welcome back, ${result.payload.user.name}!`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-600/12 rounded-full blur-[120px] animate-pulse-soft" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-500/8 rounded-full blur-[120px] animate-pulse-soft"
            style={{ animationDelay: '1s' }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-900/10 rounded-full blur-[150px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center p-1.5 group-hover:border-brand-500/30 transition-all duration-300">
              <HorseShoeEmblem className="w-full h-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                The Horse Shoe
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-surface-500 mt-0.5">
                Studio
              </span>
            </div>
          </Link>

          {/* Center quote/feature */}
          <div className="max-w-md">
            <h2 className="text-5xl font-display font-bold text-white leading-[0.95] tracking-tight mb-5">
              Design
              <br />
              <span className="font-script text-brand-400 font-normal text-[1.2em]">better,</span>
              <br />
              <span className="text-white">together.</span>
            </h2>
            <p className="text-surface-500 text-base leading-relaxed">
              Your all-in-one platform for managing design projects, collaborating with clients, and
              delivering stunning work on time.
            </p>
          </div>

          {/* Testimonial */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6">
            <p className="text-surface-400 text-sm leading-relaxed mb-4 italic">
              "HorseShoe Studio transformed how we handle client approvals. What used to take days of
              back-and-forth emails now happens in real-time."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold text-sm ring-2 ring-brand-500/20">
                S
              </div>
              <div>
                <p className="text-white text-sm font-medium">Sarah Mitchell</p>
                <p className="text-surface-600 text-xs">Lead Designer, Creative Co.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0a0a]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center p-1.5">
              <HorseShoeEmblem className="w-full h-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                The Horse Shoe
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-surface-500 mt-0.5">
                Studio
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">Welcome back</h1>
            <p className="text-surface-500 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-600" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full pl-12 pr-4 py-3 bg-black border border-white/[0.08] rounded-xl text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-400 mb-2">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-600" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3 bg-black border border-white/[0.08] rounded-xl text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/40 transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-600 hover:text-surface-400 transition-colors duration-200"
                >
                  {showPassword ? (
                    <HiOutlineEyeSlash className="w-5 h-5" />
                  ) : (
                    <HiOutlineEye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/20 bg-black text-brand-500 focus:ring-brand-500/30"
                />
                <span className="text-surface-500">Remember me</span>
              </label>
              <button
                type="button"
                className="text-brand-400 hover:text-brand-300 transition-colors duration-200"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-surface-600 uppercase tracking-wider font-mono">Demo Accounts</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Quick login buttons for demo */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { role: 'Admin', email: 'admin@horseshoe.studio', color: 'bg-brand-600 hover:bg-brand-500' },
              { role: 'Designer', email: 'designer@horseshoe.studio', color: 'bg-purple-600 hover:bg-purple-500' },
              { role: 'Client', email: 'client@horseshoe.studio', color: 'bg-amber-600 hover:bg-amber-500' },
            ].map((demo) => (
              <button
                key={demo.role}
                type="button"
                className={`py-2.5 rounded-xl text-white text-sm font-medium ${demo.color} opacity-70 hover:opacity-100 transition-all duration-200`}
                onClick={() => {
                  setEmail(demo.email);
                  setPassword('password123');
                }}
              >
                {demo.role}
              </button>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-center text-surface-600 text-xs mt-8">
            Accounts are created by your administrator.
            <br />
            Contact your admin if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
