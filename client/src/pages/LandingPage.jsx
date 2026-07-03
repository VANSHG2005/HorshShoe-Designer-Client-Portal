import { Link } from 'react-router-dom';
import {
  HiOutlineUserGroup,
  HiOutlineCloudArrowUp,
  HiOutlineChatBubbleLeftRight,
  HiOutlineChartBarSquare,
  HiOutlineShieldCheck,
  HiArrowRight,
  HiOutlineBolt,
} from 'react-icons/hi2';
import { HorseShoeEmblem } from '../components/HorseShoeLogo';

const features = [
  {
    icon: HiOutlineUserGroup,
    title: 'Team Management',
    description: 'Manage designers, clients, and projects all in one platform with role-based access control.',
  },
  {
    icon: HiOutlineCloudArrowUp,
    title: 'Design Versioning',
    description: 'Upload, track, and manage design iterations with full version history and file previews.',
  },
  {
    icon: HiOutlineChatBubbleLeftRight,
    title: 'Client Feedback',
    description: 'Streamlined approval workflow with threaded comments and approval/revision tracking.',
  },
  {
    icon: HiOutlineChartBarSquare,
    title: 'Analytics Dashboard',
    description: 'Real-time insights into project progress, designer workload, and approval metrics.',
  },
  {
    icon: HiOutlineBolt,
    title: 'Real-time Updates',
    description: 'Instant notifications for comments, uploads, approvals, and deadline reminders.',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Enterprise Security',
    description: 'JWT authentication, refresh token rotation, RBAC, and comprehensive audit logging.',
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Film grain overlay */}
      <div className="grain-overlay" />

      {/* Animated background glow orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[700px] h-[700px] bg-brand-600/8 rounded-full blur-[180px] animate-pulse-soft" />
        <div className="absolute bottom-[-10%] right-[15%] w-[600px] h-[600px] bg-brand-500/6 rounded-full blur-[180px] animate-pulse-soft" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[900px] h-[900px] bg-brand-900/10 rounded-full blur-[200px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 lg:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-5 py-2.5 text-sm font-medium text-surface-400 hover:text-white transition-colors duration-300"
          >
            Sign In
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition-all duration-300 shadow-glow hover:shadow-glow-lg"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Decorative editorial line */}
      <div className="editorial-line max-w-7xl mx-auto" />

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 lg:px-12 pt-24 pb-32">
        <div className="max-w-5xl animate-fade-in">
          {/* Tagline badge */}
          <div className="inline-flex items-center gap-3 mb-10">
            <span className="w-8 h-px bg-brand-500" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-brand-400">
              Strategy • Craft • Lucky
            </span>
          </div>

          {/* Headline — editorial dramatic */}
          <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-display font-bold leading-[0.9] tracking-tight mb-8">
            Where
            <br />
            <span className="font-script text-brand-400 font-normal text-[1.1em] inline-block -mt-2">Design</span>
            <br />
            <span className="text-white">Meets</span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-brand-500 to-brand-300">
              Collaboration
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-surface-400 max-w-xl leading-relaxed mb-12">
            Manage projects, upload design versions, gather client feedback,
            and track approvals — all in one beautiful, real-time platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-5">
            <Link
              to="/login"
              className="group inline-flex items-center gap-3 px-8 py-4 text-base font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-2xl transition-all duration-300 shadow-glow hover:shadow-glow-lg"
            >
              Start Managing
              <HiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-3 px-8 py-4 text-base font-medium text-surface-400 hover:text-white border border-white/10 hover:border-white/20 rounded-2xl transition-all duration-300"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Hero Visual — Floating UI Preview */}
        <div className="relative mt-24 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl shadow-2xl">
            {/* Mock Dashboard Header */}
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-400/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-lg bg-white/[0.03] text-surface-600 text-xs font-mono">
                  horseshoe-studio.app/dashboard
                </div>
              </div>
            </div>
            {/* Mock Dashboard Content */}
            <div className="p-8 grid grid-cols-4 gap-4">
              {/* KPI Cards */}
              {[
                { label: 'Active Projects', value: '24', change: '+12%', color: 'from-brand-500 to-brand-600' },
                { label: 'Pending Approvals', value: '8', change: '-3%', color: 'from-amber-500 to-orange-500' },
                { label: 'Active Designers', value: '12', change: '+5%', color: 'from-emerald-500 to-teal-500' },
                { label: 'Completion Rate', value: '94%', change: '+2%', color: 'from-purple-500 to-pink-500' },
              ].map((kpi, i) => (
                <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-5">
                  <p className="text-xs text-surface-500 mb-2">{kpi.label}</p>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-white">{kpi.value}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gradient-to-r ${kpi.color} text-white`}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
              ))}
              {/* Mock Chart Area */}
              <div className="col-span-2 rounded-xl bg-white/[0.03] border border-white/[0.04] p-5 h-48">
                <p className="text-xs text-surface-500 mb-4">Projects by Status</p>
                <div className="flex items-end gap-3 h-28">
                  {[60, 85, 45, 70, 30, 90, 55].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-brand-600/60 to-brand-400/20" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              {/* Mock Recent Activity */}
              <div className="col-span-2 rounded-xl bg-white/[0.03] border border-white/[0.04] p-5 h-48">
                <p className="text-xs text-surface-500 mb-4">Recent Activity</p>
                <div className="space-y-3">
                  {[
                    { text: 'Sarah uploaded Design V3', time: '2 min ago', dot: 'bg-brand-400' },
                    { text: 'Client approved Homepage', time: '15 min ago', dot: 'bg-emerald-400' },
                    { text: 'New comment on Logo V2', time: '1 hour ago', dot: 'bg-amber-400' },
                    { text: 'Task "Hero Section" completed', time: '2 hours ago', dot: 'bg-emerald-400' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                      <span className="text-sm text-surface-400 flex-1">{item.text}</span>
                      <span className="text-xs text-surface-600">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Glow behind the card */}
          <div className="absolute -inset-8 bg-gradient-to-r from-brand-600/10 via-brand-900/5 to-brand-500/10 rounded-3xl blur-3xl -z-10" />
        </div>
      </section>

      {/* Scrolling marquee divider */}
      <div className="relative z-10 py-6 overflow-hidden border-y border-white/[0.04]">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 text-sm font-mono uppercase tracking-[0.3em] text-surface-700 flex items-center gap-8">
              <span>Branding</span>
              <span className="text-brand-500/40">✦</span>
              <span>UI/UX</span>
              <span className="text-brand-500/40">✦</span>
              <span>Strategy</span>
              <span className="text-brand-500/40">✦</span>
              <span>Visual Identity</span>
              <span className="text-brand-500/40">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-8 lg:px-12 py-28">
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-brand-500" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-brand-400">
              Platform Features
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold leading-[0.95] tracking-tight mb-5">
            Everything to
            <br />
            <span className="gradient-text">ship great design</span>
          </h2>
          <p className="text-surface-500 text-lg max-w-xl leading-relaxed">
            A complete platform built for design studios that care about workflow, collaboration, and client satisfaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04] rounded-2xl overflow-hidden border border-white/[0.04]">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-8 bg-[#0a0a0a] hover:bg-[#111] transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-5 group-hover:bg-brand-500/20 group-hover:border-brand-500/30 transition-all duration-300">
                <feature.icon className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-surface-500 text-sm leading-relaxed">{feature.description}</p>

              {/* Hover reveal line */}
              <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-brand-500/0 via-brand-500/40 to-brand-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="editorial-line max-w-7xl mx-auto" />
      <footer className="relative z-10 py-10 px-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center p-1.5">
              <HorseShoeEmblem className="w-full h-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-none">
                The Horse Shoe
              </span>
              <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-surface-600 mt-0.5">
                Strategy • Craft • Lucky
              </span>
            </div>
          </div>
          <p className="text-xs text-surface-600">
            © {new Date().getFullYear()} The Horse Shoe Studio. Built for design teams.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
