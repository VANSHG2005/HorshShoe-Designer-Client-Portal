import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchActivities } from '../../features/activity/activitySlice';
import { fetchProjects } from '../../features/projects/projectSlice';
import {
  HiOutlineClipboardDocumentList,
  HiOutlineFolderPlus,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowUpTray,
  HiOutlineFunnel,
  HiOutlineArrowPath,
  HiOutlineClock,
  HiOutlineUser,
} from 'react-icons/hi2';

function ActivityPage() {
  const dispatch = useDispatch();
  const { activities, pagination, loading } = useSelector((state) => state.activity);
  const { projects } = useSelector((state) => state.projects);

  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchActivities({
        action: selectedAction !== 'all' ? selectedAction : undefined,
        project: selectedProject !== 'all' ? selectedProject : undefined,
        page: currentPage,
        limit: 15,
      })
    );
  }, [dispatch, selectedAction, selectedProject, currentPage]);

  const handleRefresh = () => {
    dispatch(
      fetchActivities({
        action: selectedAction !== 'all' ? selectedAction : undefined,
        project: selectedProject !== 'all' ? selectedProject : undefined,
        page: currentPage,
        limit: 15,
      })
    );
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'approved_design':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <HiOutlineCheckCircle className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'requested_changes':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <HiOutlineExclamationTriangle className="w-3.5 h-3.5" />
            Changes Requested
          </span>
        );
      case 'uploaded_design':
      case 'uploaded_version':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <HiOutlineArrowUpTray className="w-3.5 h-3.5" />
            Deliverable Upload
          </span>
        );
      case 'posted_comment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
            Feedback / Comment
          </span>
        );
      case 'created_project':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <HiOutlineFolderPlus className="w-3.5 h-3.5" />
            Project Created
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-500/10 text-surface-400 border border-surface-500/20">
            <HiOutlineClipboardDocumentList className="w-3.5 h-3.5" />
            {action?.replace('_', ' ') || 'Action'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-white tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <HiOutlineClipboardDocumentList className="w-6 h-6" />
            </span>
            Studio Activity & Audit Trail
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Real-time feed of design uploads, stakeholder approvals, reviews, and client deliverables
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111] border border-white/[0.06] text-surface-300 hover:text-white hover:border-white/[0.08] shadow-sm text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <HiOutlineArrowPath className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          Refresh Log
        </button>
      </div>

      {/* ── Filters Bar ──────────────────────────────────────── */}
      <div className="p-4 bg-[#111] border border-white/[0.06] rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-surface-400 text-xs font-semibold uppercase tracking-wider">
            <HiOutlineFunnel className="w-4 h-4" />
            Filters:
          </div>

          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-xs font-medium text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">All Action Types</option>
            <option value="approved_design">Approved Design</option>
            <option value="requested_changes">Changes Requested</option>
            <option value="uploaded_design">Deliverable Uploads</option>
            <option value="posted_comment">Comments & Feedback</option>
            <option value="created_project">Project Creation</option>
          </select>

          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-xs font-medium text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 max-w-xs truncate"
          >
            <option value="all">All Associated Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.code} - {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-surface-400 self-end md:self-auto font-medium">
          Showing {activities.length} of {pagination.total || 0} events
        </div>
      </div>

      {/* ── Activity Timeline ────────────────────────────────── */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl shadow-sm overflow-hidden">
        {loading && activities.length === 0 ? (
          <div className="p-12 text-center text-surface-400 text-sm">
            <HiOutlineArrowPath className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-600" />
            Loading studio activity stream...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto text-surface-400 mb-3">
              <HiOutlineClipboardDocumentList className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-surface-200 font-display">No events recorded</h3>
            <p className="text-xs text-surface-400 mt-1">
              Actions taken by team members or clients will populate here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {activities.map((act) => (
              <div
                key={act._id}
                className="p-4 sm:p-5 hover:bg-white/[0.03] transition-colors flex items-start gap-4"
              >
                {/* User avatar */}
                <div className="relative flex-shrink-0">
                  {act.user?.avatarUrl ? (
                    <img
                      src={act.user.avatarUrl}
                      alt={act.user.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/[0.06]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-400 font-bold flex items-center justify-center text-sm border border-brand-500/20">
                      {act.user?.name?.slice(0, 2).toUpperCase() || <HiOutlineUser className="w-5 h-5" />}
                    </div>
                  )}
                </div>

                {/* Event body */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {act.user?.name || 'System / Stakeholder'}
                      </span>
                      {act.user?.role && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/[0.04] text-surface-600">
                          {act.user.role.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-surface-400 font-mono">
                      <HiOutlineClock className="w-3.5 h-3.5" />
                      {new Date(act.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <p className="text-sm text-surface-300 mt-1 font-medium">
                    {act.details}
                  </p>

                  {/* Badges & Tags */}
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    {getActionBadge(act.action)}

                    {act.project && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-white/[0.04] text-surface-300 border border-white/[0.06]">
                        <span className="font-mono text-brand-600">{act.project.code}</span>
                        <span>•</span>
                        <span className="truncate max-w-[180px]">{act.project.title}</span>
                      </span>
                    )}

                    {act.design && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Asset: {act.design.title}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination Footer ────────────────────────────────── */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-[#0e0e0e] border-t border-white/[0.06] flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="px-3 py-1.5 rounded-xl border border-white/[0.06] bg-[#111] text-xs font-semibold text-surface-300 hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-surface-500 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages || loading}
              className="px-3 py-1.5 rounded-xl border border-white/[0.06] bg-[#111] text-xs font-semibold text-surface-300 hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityPage;
