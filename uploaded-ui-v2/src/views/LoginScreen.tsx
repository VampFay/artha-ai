import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Loader2, ArrowRight, Activity, Sparkles, CheckCircle2, ArrowUpRight, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const NOISE_SVG_URL = 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")';

const LiveVideoLoop = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number, y: number, z: number, vx: number, vy: number, symbol: string }[] = [];
    const currencies = ['$', '€', '£', '¥', '₹', '₽', '₩', '฿', '₪'];
    const mouse = { x: -1000, y: -1000, isActive: false };

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        init();
      }
    };

    const init = () => {
      particles = [];
      const num = Math.floor((canvas.width * canvas.height) / 12000); 
      for (let i = 0; i < num; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 1.2) * 0.4,
          symbol: currencies[Math.floor(Math.random() * currencies.length)]
        });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.isActive = true;
    };

    const handleMouseLeave = () => {
      mouse.isActive = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);
    resize();

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 10, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx * p.z;
        p.y += p.vy * p.z;
        
        // Mouse repulsion
        if (mouse.isActive) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            p.x += (dx / dist) * 1.5;
            p.y += (dy / dist) * 1.5;
          }
        }

        if (p.y < -50) {
          p.y = canvas.height + 50;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -50) p.x = canvas.width + 50;
        if (p.x > canvas.width + 50) p.x = -50;
      });

      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 180) {
            const opacity = (1 - dist / 180) * 0.35;
            const heightRatio = particles[i].y / canvas.height;
            const r = Math.floor(245 * (1 - heightRatio) + 16 * heightRatio);
            const g = Math.floor(158 * (1 - heightRatio) + 185 * heightRatio);
            const b = Math.floor(11 * (1 - heightRatio) + 129 * heightRatio);
            
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
        
        // Draw connection to mouse
        if (mouse.isActive) {
          const dx = particles[i].x - mouse.x;
          const dy = particles[i].y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 250) {
            const opacity = (1 - dist / 250) * 0.5;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(245, 158, 11, ${opacity})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      particles.forEach(p => {
        ctx.font = `${Math.floor(12 + p.z * 5)}px monospace`;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + p.z * 0.35})`;
        ctx.fillText(p.symbol, p.x, p.y);
      });
      
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/40 via-transparent to-[#0a0a0a]/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,10,0.8)_100%)] pointer-events-none" />
    </div>
  );
});

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      if ((email === 'test@finsight.ai' || email === 'test@vantage.ai') && password === 'test1234') {
        onLogin({ id: '1', name: 'Demo User', email, role: 'user' });
      } else if ((email === 'admin@finsight.ai' || email === 'admin@vantage.ai') && password === 'admin1234') {
        onLogin({ id: '2', name: 'Admin User', email, role: 'admin' });
      } else {
        setError('Invalid credentials. Use demo accounts provided below.');
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex w-full bg-black text-white font-sans overflow-hidden">
      
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 lg:p-20 relative">
        <LiveVideoLoop />
        
        {/* Noise overlay restricted to left panel */}
        <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: NOISE_SVG_URL }} />

        {/* Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron to-saffron-light flex items-center justify-center font-bold text-[#111] text-xl font-sans shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            A
          </div>
          <span className="font-mono text-2xl tracking-widest uppercase text-white">Artha</span>
        </div>

        {/* Center Dynamic Content */}
        <div className="relative z-10 w-full max-w-xl mx-auto my-auto pt-8">
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="login-content"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-5xl xl:text-7xl font-light tracking-tighter text-white mb-10 leading-[1.05]">
                  Master your wealth. <br />
                  <span className="font-mono text-saffron tracking-tight">Without the noise.</span>
                </h1>

                <div className="grid grid-cols-2 gap-5">
                  {/* Card 1 */}
                  <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Live Net Worth</p>
                        <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="text-3xl font-mono text-white tracking-tighter">₹1.42 Cr</h3>
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mt-3 bg-emerald-400/10 w-fit px-2.5 py-1 rounded-full border border-emerald-400/20">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>+12.4% YTD</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Tax Harvested</p>
                        <ShieldCheck className="w-4 h-4 text-saffron group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="text-3xl font-mono text-white tracking-tighter">₹42.5K</h3>
                      <div className="flex items-center gap-1.5 text-saffron text-xs font-bold mt-3">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fully Optimized</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 (Chart) */}
                  <div className="col-span-2 bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group relative">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500 overflow-hidden">
                      <div className="relative z-10 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2">Portfolio Trajectory</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-sans font-medium text-white tracking-tight">Alpha</span>
                            <span className="text-sm font-mono text-emerald-400">+4.2%</span>
                          </div>
                        </div>
                        <Sparkles className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors duration-500" />
                      </div>
                      
                      {/* SVG Chart */}
                      <div className="absolute bottom-0 left-0 right-0 h-28 opacity-40 group-hover:opacity-70 transition-opacity duration-500">
                        <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full">
                          <defs>
                            <linearGradient id="chart-grad-1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M0,80 Q50,70 100,75 T200,50 T300,60 T400,20"
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="1.5"
                          />
                          <path
                            d="M0,80 Q50,70 100,75 T200,50 T300,60 T400,20 L400,100 L0,100 Z"
                            fill="url(#chart-grad-1)"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register-content"
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-5xl xl:text-7xl font-light tracking-tighter text-white mb-10 leading-[1.05]">
                  Institutional logic. <br />
                  <span className="font-mono text-saffron tracking-tight">For personal wealth.</span>
                </h1>

                <div className="grid grid-cols-2 gap-5">
                  {/* Alt Card 1 */}
                  <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Global Integration</p>
                        <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="text-3xl font-mono text-white tracking-tighter leading-tight">12,000+</h3>
                      <p className="text-stone-400 text-xs mt-3 font-medium">Supported Institutions</p>
                    </div>
                  </div>

                  {/* Alt Card 2 */}
                  <div className="bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500">
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Data Security</p>
                        <ShieldCheck className="w-4 h-4 text-saffron group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <h3 className="text-3xl font-mono text-white tracking-tighter leading-tight">SOC2</h3>
                      <p className="text-stone-400 text-xs mt-3 font-medium">Bank-grade encryption</p>
                    </div>
                  </div>

                  {/* Alt Card 3 */}
                  <div className="col-span-2 bg-gradient-to-b from-white/[0.05] to-transparent p-[1px] rounded-3xl overflow-hidden group relative">
                    <div className="bg-black/40 backdrop-blur-xl rounded-[23px] p-6 h-full border border-white/[0.05] group-hover:bg-black/20 transition-all duration-500">
                      <div className="relative z-10 flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2">Automated Optimization</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-sans font-medium text-white tracking-tight">Always On</span>
                            <span className="text-sm font-mono text-saffron">24/7</span>
                          </div>
                        </div>
                        <Sparkles className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors duration-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-center pt-6 mt-8 border-t border-white/5">
          <p className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">Institutional Grade Infrastructure</p>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-stone-400">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* Right Panel (Auth Form) */}
      <div className="w-full lg:w-[480px] xl:w-[560px] flex-shrink-0 bg-[#050505] border-l border-white/5 z-10 flex flex-col justify-center px-8 lg:px-16 relative">
        {/* Subtle right panel noise */}
        <div className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: NOISE_SVG_URL }} />

        <div className="lg:hidden flex items-center gap-3 mb-16 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron to-saffron-light flex items-center justify-center font-bold text-[#111] text-xl font-sans shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            A
          </div>
          <span className="font-mono text-2xl tracking-widest uppercase text-white">Artha</span>
        </div>

        <div className="w-full max-w-md mx-auto relative z-10">
          <AnimatePresence mode="wait">
            <motion.div 
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: mode === 'login' ? 20 : -20, filter: 'blur(4px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-12">
                <h2 className="text-4xl font-light tracking-tight mb-3 text-white">
                  {mode === 'login' ? 'Welcome back.' : 'Join Artha.'}
                </h2>
                <p className="text-stone-400 font-medium text-sm">
                  {mode === 'login' 
                    ? 'Sign in to access your intelligence dashboard.' 
                    : 'Create an account to unify your wealth.'}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-8 overflow-hidden"
                  >
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500 ml-1">Legal Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron transition-all shadow-inner"
                    />
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500 ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron transition-all shadow-inner"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-stone-500">Security Key</label>
                    {mode === 'login' && <span className="text-[10px] font-bold tracking-wider text-saffron uppercase cursor-pointer hover:text-saffron-light transition-colors">Forgot?</span>}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-saffron focus:border-saffron transition-all tracking-widest shadow-inner pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-8 bg-white text-[#111] py-4 px-6 rounded-xl font-bold tracking-widest uppercase text-xs transition-transform active:scale-[0.98] hover:bg-stone-200 flex items-center justify-center group h-14 shadow-[0_0_20px_rgba(255,255,255,0.1)] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#111]" />
                  ) : (
                    <span className="flex items-center gap-3 relative z-10">
                      {mode === 'login' ? 'Authenticate' : 'Initialize Account'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#111]" />
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError('');
                  }}
                  className="text-[11px] font-bold tracking-wider text-stone-400 uppercase hover:text-white transition-colors"
                >
                  {mode === 'login' ? "New to Artha? Apply for Access" : "Existing Member? Sign In"}
                </button>
              </div>

              {/* Demo Accounts */}
              {mode === 'login' && (
                <div className="mt-12 pt-8 border-t border-white/5">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-stone-500 mb-4 ml-1">Demo Credentials</p>
                  <div className="space-y-3">
                    <div 
                      className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] cursor-pointer transition-colors border border-white/5 group"
                      onClick={() => { setEmail('test@finsight.ai'); setPassword('test1234'); }}
                    >
                      <span className="text-sm font-medium text-stone-400 group-hover:text-white transition-colors">test@finsight.ai</span>
                      <span className="text-xs font-mono text-stone-500 bg-black px-2 py-1 rounded border border-white/10 group-hover:border-white/20 transition-colors">test1234</span>
                    </div>
                    <div 
                      className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] cursor-pointer transition-colors border border-white/5 group"
                      onClick={() => { setEmail('admin@finsight.ai'); setPassword('admin1234'); }}
                    >
                      <span className="text-sm font-medium text-stone-400 group-hover:text-white transition-colors">admin@finsight.ai</span>
                      <span className="text-xs font-mono text-stone-500 bg-black px-2 py-1 rounded border border-white/10 group-hover:border-white/20 transition-colors">admin1234</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}