import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProjects,
  fetchProjectStats,
  createProject,
} from '../../features/projects/projectSlice';
import { fetchClients } from '../../features/clients/clientSlice';
import { fetchUsers } from '../../features/users/userSlice';
import toast from 'react-hot-toast';
import {
  HiOutlineRectangleGroup,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineCurrencyDollar,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineTag,
  HiOutlineBuildingOffice2,
  HiOutlineArrowRight,
} from 'react-icons/hi2';

function ProjectsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects, stats, loading, submitting } = useSelector((state) => state.projects);
  const { clients } = useSelector((state) => state.clients);
  const { users } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const initialForm = {
    title: '',
    code: '',
    description: '',
    client: '',
    leadDesigner: '',
    team: [],
    priority: 'medium',
    category: 'UI/UX Design',
    budget: '',
    startDate: new Date().toISOString().split('T')[0],
    deadline: '',
    tags: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const isAdminOrPM = currentUser?.role === 'admin' || currentUser?.role === 'project_manager';
  const designers = users.filter((u) => u.role === 'designer' || u.role === 'admin');

  useEffect(() => {
    dispatch(fetchProjects({ search: searchTerm, status: selectedStatus, priority: selectedPriority }));
    dispatch(fetchProjectStats());
    dispatch(fetchClients({ limit: 100 }));
    dispatch(fetchUsers({ limit: 100 }));
  }, [dispatch, selectedStatus, selectedPriority]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchProjects({ search: searchTerm, status: selectedStatus, priority: selectedPriority }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch, selectedStatus, selectedPriority]);

  const handleOpenCreateModal = () => {
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.client) {
      toast.error('Project title and client organization are required');
      return;
    }

    const payload = {
      ...formData,
      budget: formData.budget ? Number(formData.budget) : 0,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      leadDesigner: formData.leadDesigner || null,
    };

    const res = await dispatch(createProject(payload));
    if (!res.error) {
      toast.success('Project created successfully');
      setIsModalOpen(false);
    } else {
      toast.error(res.payload || 'Failed to create project');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
            In Progress
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Under Review
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        );
      case 'planning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Planning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/[0.04] text-surface-600 border border-white/[0.06]">
            {status}
          </span>
        );
    }
  };

  const getPriorityPill = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-200">Urgent</span>;
      case 'high':
        return <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">High</span>;
      case 'medium':
        return <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">Medium</span>;
      default:
        return <span className="text-[10px] font-bold uppercase tracking-wider text-surface-600 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">Low</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-white tracking-tight">
            Design Projects
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Track active deliverables, deadlines, design reviews, and studio resources
          </p>
        </div>
        {isAdminOrPM && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <HiOutlinePlus className="w-5 h-5" />
            New Project
          </button>
        )}
      </div>

      {/* ── Metric Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Total Projects</span>
            <span className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600">
              <HiOutlineRectangleGroup className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-white mt-3">{stats.total}</p>
        </div>

        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">In Progress</span>
            <span className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600">
              <HiOutlineClock className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-brand-400 mt-3">{stats.inProgress}</p>
        </div>

        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Under Review</span>
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <HiOutlineCheckCircle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-amber-400 mt-3">{stats.review}</p>
        </div>

        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Completed</span>
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <HiOutlineCheckCircle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-emerald-400 mt-3">{stats.completed}</p>
        </div>
      </div>

      {/* ── Filters & Search Bar ───────────────────────────────── */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search projects by title, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['all', 'in_progress', 'review', 'planning', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                selectedStatus === status
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm font-semibold'
                  : 'text-surface-600 hover:text-white hover:bg-[#0e0e0e] border border-transparent'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Project Cards Grid ─────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111] border border-white/[0.06] rounded-2xl p-6 h-72 animate-pulse">
              <div className="h-6 w-1/3 bg-white/[0.04] rounded mb-4"></div>
              <div className="h-5 w-3/4 bg-white/[0.04] rounded mb-2"></div>
              <div className="h-4 w-full bg-[#0e0e0e] rounded mb-4"></div>
              <div className="h-2 w-full bg-[#0e0e0e] rounded mb-6"></div>
              <div className="h-10 bg-[#0e0e0e] rounded"></div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-100 flex items-center justify-center mx-auto mb-4 text-brand-600">
            <HiOutlineRectangleGroup className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No projects found</h3>
          <p className="text-sm text-surface-500 max-w-sm mx-auto mb-6">
            {searchTerm ? 'No projects match your current filters.' : 'Launch a new design project to start organizing assets and reviews.'}
          </p>
          {isAdminOrPM && !searchTerm && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-500 transition-colors shadow-sm"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project._id}
              onClick={() => navigate(`/dashboard/projects/${project._id}`)}
              className="group cursor-pointer bg-[#111] border border-white/[0.06] hover:border-brand-300 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Top Row: Code, Category, Status */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20">
                      {project.code}
                    </span>
                    {getPriorityPill(project.priority)}
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                {/* Title & Client */}
                <h3 className="font-bold text-white text-base group-hover:text-brand-400 transition-colors line-clamp-1 mb-1">
                  {project.title}
                </h3>
                {project.client && (
                  <p className="text-xs text-surface-500 flex items-center gap-1.5 mb-3">
                    <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
                    <span className="truncate font-medium text-surface-600">{project.client.name}</span>
                  </p>
                )}

                {/* Description */}
                {project.description && (
                  <p className="text-xs text-surface-500 line-clamp-2 mb-4 leading-relaxed">
                    {project.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-[11px] text-surface-500">
                    <span>Progress</span>
                    <span className="font-semibold text-surface-200">{project.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Tags */}
                {project.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.04] text-surface-600 border border-white/[0.06]"
                      >
                        #{tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] text-surface-500 font-medium">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Footer: Lead Designer & Deadline */}
              <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-surface-500">
                <div className="flex items-center gap-2">
                  {project.leadDesigner ? (
                    <div className="flex items-center gap-1.5" title={`Lead Designer: ${project.leadDesigner.name}`}>
                      <div className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-400 font-bold text-[10px] flex items-center justify-center border border-brand-500/20">
                        {project.leadDesigner.name[0]}
                      </div>
                      <span className="text-[11px] text-surface-300 font-medium truncate max-w-[90px]">
                        {project.leadDesigner.name.split(' ')[0]}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-surface-400 italic">Unassigned</span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-[11px] text-surface-500">
                  <HiOutlineCalendar className="w-3.5 h-3.5 text-surface-400" />
                  <span>
                    {project.deadline
                      ? new Date(project.deadline).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'No date'}
                  </span>
                  <HiOutlineArrowRight className="w-3 h-3 ml-1 text-surface-400 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Project Modal ───────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-display">Create Design Project</h2>
                <p className="text-xs text-surface-500 mt-0.5">
                  Set scope, client ownership, milestones, and assigned lead designer
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-surface-400 hover:text-surface-300 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Title & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Mobile Fintech App Redesign"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Project Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Auto (e.g. HSS-105)"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Client & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Client Organization *
                  </label>
                  <select
                    required
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Design Discipline / Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Brand Identity">Brand Identity</option>
                    <option value="3D & Motion">3D & Motion</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Marketing Campaign">Marketing Campaign</option>
                    <option value="Design System">Design System</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Lead Designer & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Lead Designer
                  </label>
                  <select
                    value={formData.leadDesigner}
                    onChange={(e) => setFormData({ ...formData, leadDesigner: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="">-- Assign Lead Designer --</option>
                    {designers.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.role})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Budget, Start Date, Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Budget ($ USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="e.g. 25000"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Target Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">
                  Project Scope & Description
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key milestones, design guidelines, deliverables required..."
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                ></textarea>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Fintech, Mobile, Figma, Dark Mode"
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md hover:shadow-glow disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
