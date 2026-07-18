import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  fetchDashboardStats,
  fetchDashboardCharts,
} from '../../features/dashboard/dashboardSlice';
import {
  HiOutlineRectangleGroup,
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineArrowUpTray,
  HiOutlineSparkles,
  HiOutlineEye,
  HiOutlineArrowPath,
  HiOutlineFolderPlus,
  HiOutlinePaintBrush,
} from 'react-icons/hi2';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function DashboardHome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);
  const { kpis, pendingReviewDesigns, recentActivity, charts, loading, chartsLoading } =
    useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchDashboardCharts());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchDashboardStats());
    dispatch(fetchDashboardCharts());
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // KPI cards definition
  const kpiCards = [
    {
      label: 'Active Projects',
      value: kpis?.activeProjects ?? '—',
      subtext: `${kpis?.completedProjects ?? 0} completed`,
      icon: HiOutlineRectangleGroup,
      color: 'from-brand-500 to-brand-600',
      bgLight: 'bg-brand-500/10',
      textColor: 'text-brand-400',
      borderColor: 'border-brand-500/20',
    },
    {
      label: 'Pending Approvals',
      value: kpis?.pendingApprovals ?? '—',
      subtext: `${kpis?.approvedDesigns ?? 0} approved to date`,
      icon: HiOutlineCheckCircle,
      color: 'from-purple-500 to-indigo-600',
      bgLight: 'bg-purple-500/10',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
      highlight: (kpis?.pendingApprovals || 0) > 0,
    },
    {
      label: 'Open Tasks',
      value: kpis?.openTasks ?? '—',
      subtext: `${kpis?.completedTasks ?? 0} finished tasks`,
      icon: HiOutlineClipboardDocumentList,
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-500/10',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
    },
    {
      label: user?.role === 'client' ? 'Total Deliverables' : 'Active Stakeholders',
      value:
        user?.role === 'client'
          ? kpis?.totalDesigns ?? '—'
          : (kpis?.clientCount ?? 0) + (kpis?.teamCount ?? 0) || '—',
      subtext:
        user?.role === 'client'
          ? `${kpis?.changesRequestedDesigns ?? 0} revisions requested`
          : `${kpis?.clientCount ?? 0} clients, ${kpis?.teamCount ?? 0} designers`,
      icon: HiOutlineUserGroup,
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-500/10',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
    },
  ];

  const getStatusPill = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <HiOutlineExclamationTriangle className="w-3.5 h-3.5" />
            Revisions
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HiOutlineClock className="w-3.5 h-3.5" />
            Review Needed
          </span>
        );
    }
  };

  // Dark tooltip style for charts
  const darkTooltipStyle = {
    backgroundColor: '#141414',
    borderRadius: '12px',
    color: '#e5e5e5',
    fontSize: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold font-display text-white tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/20">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-sm text-surface-500 mt-1">
            Studio operational analytics, active deliverables, and real-time client approval queues
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-surface-500 hover:text-white hover:bg-white/[0.06] transition-colors shadow-sm"
            title="Refresh Metrics"
          >
            <HiOutlineArrowPath className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
          </button>

          {user?.role !== 'client' && (
            <button
              onClick={() => navigate('/dashboard/projects')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all"
            >
              <HiOutlineFolderPlus className="w-4 h-4" />
              New Project
            </button>
          )}

          <button
            onClick={() => navigate('/dashboard/designs')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-surface-300 text-xs font-semibold border border-white/[0.06] transition-all"
          >
            <HiOutlinePaintBrush className="w-4 h-4" />
            Deliverables
          </button>
        </div>
      </div>

      {/* ── KPI Cards Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className="glass-card p-5 hover:shadow-card-hover transition-all duration-300 group relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">
                  {card.label}
                </p>
                <p className="text-3xl font-black font-display text-white">
                  {card.value}
                </p>
                <p className="text-xs text-surface-600 mt-2 font-medium">
                  {card.subtext}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-2xl ${card.bgLight} border ${card.borderColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
              >
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>

            {card.highlight && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
            )}
          </div>
        ))}
      </div>

      {/* ── Interactive Charts Row ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Projects by Status (Donut Chart) */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold font-display text-white">
                Projects Pipeline Status
              </h3>
              <span className="text-xs text-surface-600 font-medium">
                {kpis?.totalProjects || 0} Total Projects
              </span>
            </div>
            <p className="text-xs text-surface-500 mb-6">
              Distribution of active client engagements across studio stages
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {charts.projectsByStatus?.some((p) => p.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.projectsByStatus.filter((p) => p.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {charts.projectsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} projects`, name]}
                    contentStyle={darkTooltipStyle}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#737373' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-surface-600">
                No active projects to display
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Deliverables Approval Health & Workload */}
        <div className="lg:col-span-7 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold font-display text-white">
                {user?.role === 'designer' ? 'Task Velocity by Priority' : 'Designer Workload Distribution'}
              </h3>
              <span className="text-xs text-surface-600 font-medium">
                Active Resource Allocation
              </span>
            </div>
            <p className="text-xs text-surface-500 mb-6">
              {user?.role === 'designer'
                ? 'Tasks assigned to you grouped by urgency level'
                : 'Tasks distribution across team members across Kanban states'}
            </p>
          </div>

          <div className="h-64 w-full">
            {user?.role === 'designer' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.tasksByPriority} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="priority" tick={{ fontSize: 11, fill: '#525252' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#525252' }} allowDecimals={false} />
                  <Tooltip contentStyle={darkTooltipStyle} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {charts.tasksByPriority?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : charts.designerWorkload?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.designerWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#525252' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#525252' }} allowDecimals={false} />
                  <Tooltip contentStyle={darkTooltipStyle} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#737373' }} />
                  <Bar dataKey="todo" stackId="a" fill="#404040" name="To Do" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="in_progress" stackId="a" fill="#0EA5E9" name="In Progress" />
                  <Bar dataKey="review" stackId="a" fill="#F59E0B" name="Review" />
                  <Bar dataKey="done" stackId="a" fill="#10B981" name="Done" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-surface-600">
                No team task data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Actionable Queues: Approvals & Live Activity ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Pending Deliverables Requiring Action */}
        <div className="lg:col-span-7 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <HiOutlineClock className="w-4 h-4" />
                </span>
                Pending Client Approvals Queue
              </h3>
              <Link
                to="/dashboard/designs"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                View All Deliverables &rarr;
              </Link>
            </div>
            <p className="text-xs text-surface-500 mb-4">
              Visual deliverables waiting for stakeholder review or requested revisions
            </p>

            {pendingReviewDesigns?.length === 0 ? (
              <div className="py-12 text-center text-surface-500">
                <HiOutlineCheckCircle className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-semibold text-white">All deliverables signed off!</p>
                <p className="text-xs text-surface-600 mt-0.5">
                  No design assets currently pending review
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingReviewDesigns?.map((d) => (
                  <div
                    key={d._id}
                    onClick={() => navigate('/dashboard/designs')}
                    className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 overflow-hidden border border-white/[0.06]">
                        {d.thumbnailUrl ? (
                          <img
                            src={`${API_BASE}${d.thumbnailUrl}`}
                            alt={d.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const fallback = e.target.nextElementSibling;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-full h-full flex items-center justify-center text-surface-600"
                          style={{ display: d.thumbnailUrl ? 'none' : 'flex' }}
                        >
                          <HiOutlinePaintBrush className="w-5 h-5 text-brand-400" />
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {d.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-surface-400">
                            v{d.currentVersion}
                          </span>
                        </div>
                        <p className="text-[11px] text-surface-500 truncate mt-0.5">
                          {d.project?.code} • {d.project?.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getStatusPill(d.status)}
                      <button
                        type="button"
                        className="p-2 rounded-lg bg-white/[0.04] group-hover:bg-brand-500/10 text-surface-500 group-hover:text-brand-400 transition-colors"
                        title="Review Asset"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.04] flex justify-between items-center text-xs text-surface-600">
            <span>Tip: Click any deliverable to open the canvas inspector</span>
            <Link to="/dashboard/designs" className="font-semibold text-brand-400 hover:underline">
              Submit review &rarr;
            </Link>
          </div>
        </div>

        {/* Right 5 Cols: Live Studio Activity Stream */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <HiOutlineSparkles className="w-4 h-4" />
                </span>
                Studio Audit Trail
              </h3>
              <Link
                to="/dashboard/activity"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300"
              >
                Full Log &rarr;
              </Link>
            </div>
            <p className="text-xs text-surface-500 mb-4">
              Real-time feed of comments, uploads, and sign-offs
            </p>

            {recentActivity?.length === 0 ? (
              <div className="py-12 text-center text-xs text-surface-600">
                No recent activity recorded
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {recentActivity?.map((act) => (
                  <div key={act._id} className="py-3 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-400 font-bold flex items-center justify-center text-xs flex-shrink-0 border border-brand-500/20">
                      {act.user?.name?.slice(0, 2).toUpperCase() || 'U'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-surface-300 font-medium leading-snug">
                        {act.details}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-surface-600">
                        <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {act.project && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-brand-400 truncate max-w-[120px]">
                              {act.project.code}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.04] text-center">
            <Link
              to="/dashboard/activity"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300"
            >
              Explore Complete Studio History &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
