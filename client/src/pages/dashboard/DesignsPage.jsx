import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchDesigns,
  fetchDesignById,
  fetchDesignStats,
  createDesign,
  uploadNewVersion,
  updateDesignStatus,
  deleteDesign,
} from '../../features/designs/designSlice';
import {
  fetchComments,
  createComment,
  resolveComment,
  submitReview,
  deleteComment,
} from '../../features/comments/commentSlice';
import { fetchProjects } from '../../features/projects/projectSlice';
import toast from 'react-hot-toast';
import {
  HiOutlinePaintBrush,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowUpTray,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineSparkles,
  HiOutlineChatBubbleLeftRight,
  HiOutlineMapPin,
  HiOutlinePaperAirplane,
  HiOutlineCheck,
} from 'react-icons/hi2';

const API_BASE = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function DesignsPage({ fixedProjectId = null }) {
  const dispatch = useDispatch();
  const {
    designs,
    selectedDesign,
    selectedVersions,
    stats,
    loading,
    detailLoading,
    uploading,
  } = useSelector((state) => state.designs);
  const { comments, submitting: commentSubmitting, loading: commentsLoading } = useSelector(
    (state) => state.comments
  );
  const { projects } = useSelector((state) => state.projects);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [selectedProject, setSelectedProject] = useState(fixedProjectId || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [isNewVersionOpen, setIsNewVersionOpen] = useState(false);
  const [activeVersionNumber, setActiveVersionNumber] = useState(1);

  // Inspector tab & comment state
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'timeline' | 'review'
  const [commentContent, setCommentContent] = useState('');
  const [commentType, setCommentType] = useState('general');
  const [pinningMode, setPinningMode] = useState(false);
  const [pendingPin, setPendingPin] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // New design form
  const [newDesignForm, setNewDesignForm] = useState({
    title: '',
    description: '',
    project: fixedProjectId || '',
    category: 'UI Screen',
    file: null,
    filePreview: null,
  });

  // New version form
  const [newVersionForm, setNewVersionForm] = useState({
    file: null,
    filePreview: null,
    changelog: '',
  });

  const isClient = currentUser?.role === 'client';
  const canUpload = !isClient;

  useEffect(() => {
    dispatch(
      fetchDesigns({
        project: fixedProjectId || selectedProject,
        status: selectedStatus,
        category: selectedCategory,
        search: searchTerm,
      })
    );
    dispatch(fetchDesignStats());
    if (!fixedProjectId) {
      dispatch(fetchProjects({ limit: 100 }));
    }
  }, [dispatch, selectedProject, selectedStatus, selectedCategory, fixedProjectId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        fetchDesigns({
          project: fixedProjectId || selectedProject,
          status: selectedStatus,
          category: selectedCategory,
          search: searchTerm,
        })
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch, selectedProject, selectedStatus, selectedCategory, fixedProjectId]);

  // Fetch comments whenever viewer opens or active version changes
  useEffect(() => {
    if (selectedDesign && isViewerModalOpen) {
      const currentVer =
        selectedVersions.find((v) => v.versionNumber === activeVersionNumber) ||
        selectedVersions[0];
      dispatch(
        fetchComments({
          design: selectedDesign._id,
          version: currentVer?._id,
        })
      );
    }
  }, [dispatch, selectedDesign, activeVersionNumber, isViewerModalOpen, selectedVersions]);

  // Handle open viewer
  const handleOpenViewer = async (design) => {
    const res = await dispatch(fetchDesignById(design._id));
    if (!res.error) {
      setActiveVersionNumber(design.currentVersion || 1);
      setActiveTab('comments');
      setPendingPin(null);
      setPinningMode(false);
      setIsViewerModalOpen(true);
      setIsNewVersionOpen(false);
    } else {
      toast.error('Could not load design details');
    }
  };

  // Submit new design
  const handleSubmitNewDesign = async (e) => {
    e.preventDefault();
    if (!newDesignForm.title.trim() || !newDesignForm.project || !newDesignForm.file) {
      toast.error('Title, Project, and File are required');
      return;
    }

    const data = new FormData();
    data.append('title', newDesignForm.title);
    data.append('description', newDesignForm.description);
    data.append('project', newDesignForm.project);
    data.append('category', newDesignForm.category);
    data.append('file', newDesignForm.file);

    const res = await dispatch(createDesign(data));
    if (!res.error) {
      toast.success('Design uploaded successfully');
      setIsUploadModalOpen(false);
      setNewDesignForm({
        title: '',
        description: '',
        project: fixedProjectId || (projects[0]?._id || ''),
        category: 'UI Screen',
        file: null,
        filePreview: null,
      });
    } else {
      toast.error(res.payload || 'Upload failed');
    }
  };

  // Submit new version
  const handleSubmitNewVersion = async (e) => {
    e.preventDefault();
    if (!newVersionForm.file) {
      toast.error('Please select a file for the new version');
      return;
    }

    const data = new FormData();
    data.append('file', newVersionForm.file);
    data.append('changelog', newVersionForm.changelog);

    const res = await dispatch(
      uploadNewVersion({ id: selectedDesign._id, formData: data })
    );

    if (!res.error) {
      toast.success(`Version ${res.payload.design.currentVersion} uploaded!`);
      setActiveVersionNumber(res.payload.design.currentVersion);
      setIsNewVersionOpen(false);
      setNewVersionForm({ file: null, filePreview: null, changelog: '' });
    } else {
      toast.error(res.payload || 'Failed to upload version');
    }
  };

  // Canvas click to drop pin
  const handleImageClick = (e) => {
    if (!pinningMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPendingPin({ x, y });
    setActiveTab('comments');
    toast.success(`Pin placed at ${x}%, ${y}%. Enter your feedback below to save!`);
  };

  // Post comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      toast.error('Please enter comment text');
      return;
    }
    const currentVer =
      selectedVersions.find((v) => v.versionNumber === activeVersionNumber) ||
      selectedVersions[0];

    const res = await dispatch(
      createComment({
        design: selectedDesign._id,
        version: currentVer?._id,
        content: commentContent,
        type: commentType,
        pinnedPosition: pendingPin || undefined,
      })
    );

    if (!res.error) {
      toast.success('Feedback recorded');
      setCommentContent('');
      setPendingPin(null);
      setPinningMode(false);
    } else {
      toast.error(res.payload || 'Failed to post feedback');
    }
  };

  // Toggle resolve status
  const handleToggleResolve = async (commentId) => {
    const res = await dispatch(resolveComment(commentId));
    if (!res.error) {
      toast.success(res.payload.isResolved ? 'Marked resolved' : 'Comment reopened');
    } else {
      toast.error(res.payload || 'Failed to toggle resolution');
    }
  };

  // Delete comment
  const handleDeleteCommentItem = async (commentId) => {
    const res = await dispatch(deleteComment(commentId));
    if (!res.error) {
      toast.success('Comment removed');
    } else {
      toast.error(res.payload || 'Failed to delete');
    }
  };

  // Submit formal review
  const handleSubmitReview = async (action) => {
    if (!selectedDesign) return;
    setSubmittingReview(true);
    const currentVer =
      selectedVersions.find((v) => v.versionNumber === activeVersionNumber) ||
      selectedVersions[0];

    const res = await dispatch(
      submitReview({
        designId: selectedDesign._id,
        versionId: currentVer?._id,
        action,
        notes: reviewNotes,
      })
    );
    setSubmittingReview(false);

    if (!res.error) {
      toast.success(action === 'approve' ? 'Deliverable approved!' : 'Revisions requested!');
      setReviewNotes('');
      dispatch(fetchDesignById(selectedDesign._id));
      dispatch(
        fetchDesigns({
          project: fixedProjectId || selectedProject,
          status: selectedStatus,
          category: selectedCategory,
        })
      );
    } else {
      toast.error(res.payload || 'Failed to submit review');
    }
  };

  // Update status (Approve / Request Changes)
  const handleSetStatus = async (status) => {
    if (!selectedDesign) return;
    const res = await dispatch(
      updateDesignStatus({ id: selectedDesign._id, status })
    );
    if (!res.error) {
      toast.success(`Design marked as ${status.replace('_', ' ')}`);
    } else {
      toast.error(res.payload || 'Failed to update status');
    }
  };

  // Delete design
  const handleDeleteDesign = async (id) => {
    if (window.confirm('Delete this design and all its iteration history?')) {
      const res = await dispatch(deleteDesign(id));
      if (!res.error) {
        toast.success('Design removed');
        setIsViewerModalOpen(false);
      } else {
        toast.error(res.payload || 'Failed to delete');
      }
    }
  };

  // Active version in inspector
  const activeVersion =
    selectedVersions.find((v) => v.versionNumber === activeVersionNumber) ||
    selectedVersions[0];

  const getStatusPill = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <HiOutlineCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'changes_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-200">
            <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-rose-400" />
            Changes Requested
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HiOutlineClock className="w-3.5 h-3.5 text-amber-600" />
            In Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header (hidden if embedded) ────────────────────── */}
      {!fixedProjectId && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display text-white tracking-tight">
              Design Deliverables & Versioning
            </h1>
            <p className="text-sm text-surface-500 mt-1">
              Browse visual assets, inspect iteration timelines, and submit client design approvals
            </p>
          </div>
          {canUpload && (
            <button
              onClick={() => {
                setNewDesignForm({
                  title: '',
                  description: '',
                  project: projects[0]?._id || '',
                  category: 'UI Screen',
                  file: null,
                  filePreview: null,
                });
                setIsUploadModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <HiOutlineArrowUpTray className="w-5 h-5" />
              Upload Design
            </button>
          )}
        </div>
      )}

      {/* ── Filter Bar ─────────────────────────────────────────── */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search design assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {!fixedProjectId && (
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-xs font-medium text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.code} — {p.title}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-xs font-medium text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="all">All Categories</option>
            <option value="UI Screen">UI Screen</option>
            <option value="Brand Asset">Brand Asset</option>
            <option value="Motion Graphic">Motion Graphic</option>
            <option value="Packaging">Packaging</option>
            <option value="Logo">Logo</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-xs font-medium text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_review">In Review</option>
            <option value="approved">Approved</option>
            <option value="changes_requested">Changes Requested</option>
          </select>
        </div>
      </div>

      {/* ── Designs Grid ───────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111] border border-white/[0.06] rounded-2xl h-72 animate-pulse shadow-sm">
              <div className="h-44 bg-white/[0.04] rounded-t-2xl"></div>
              <div className="p-5 space-y-2">
                <div className="h-4 w-1/3 bg-white/[0.04] rounded"></div>
                <div className="h-5 w-3/4 bg-white/[0.04] rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : designs.length === 0 ? (
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-100 flex items-center justify-center mx-auto mb-4 text-brand-600">
            <HiOutlinePaintBrush className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No designs found</h3>
          <p className="text-sm text-surface-500 max-w-sm mx-auto mb-6">
            {searchTerm ? 'No assets match your search filters.' : 'Upload visual mockups to initiate client review cycles.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((design) => {
            const hasThumb = Boolean(design.thumbnailUrl);
            const thumbSrc = hasThumb
              ? design.thumbnailUrl.startsWith('http')
                ? design.thumbnailUrl
                : `${API_BASE}${design.thumbnailUrl}`
              : null;

            return (
              <div
                key={design._id}
                onClick={() => handleOpenViewer(design)}
                className="group cursor-pointer bg-[#111] border border-white/[0.06] hover:border-brand-300 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[16/10] bg-white/[0.04] overflow-hidden flex items-center justify-center border-b border-white/[0.04]">
                    {thumbSrc ? (
                      <img
                        src={thumbSrc}
                        alt={design.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    {/* Fallback container if no image or if image fails */}
                    <div
                      className="flex-col items-center gap-2 text-surface-400"
                      style={{ display: thumbSrc ? 'none' : 'flex' }}
                    >
                      <HiOutlinePaintBrush className="w-10 h-10 text-brand-500/60" />
                      <span className="text-xs font-medium text-surface-500">
                        {design.category || 'Visual Asset'}
                      </span>
                    </div>

                    {/* Version Badge Overlay */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="bg-surface-900/80 backdrop-blur-md text-white font-mono text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        v{design.currentVersion}
                      </span>
                      <span className="bg-white/95 backdrop-blur-md text-surface-300 text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-white/[0.06] shadow-sm">
                        {design.category}
                      </span>
                    </div>

                    {/* Quick View Button on Hover */}
                    <div className="absolute inset-0 bg-surface-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                      <span className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                        <HiOutlineEye className="w-4 h-4" />
                        Inspect Versions
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20">
                        {design.project?.code || 'HSS'}
                      </span>
                      {getStatusPill(design.status)}
                    </div>

                    <h3 className="font-bold text-white text-base group-hover:text-brand-400 transition-colors line-clamp-1">
                      {design.title}
                    </h3>

                    {design.description && (
                      <p className="text-xs text-surface-500 line-clamp-2 leading-relaxed">
                        {design.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between text-xs text-surface-500">
                  <div className="flex items-center gap-2 truncate">
                    {design.createdBy?.name && (
                      <span className="text-surface-600 text-[11px] font-medium truncate">
                        By {design.createdBy.name}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-surface-400">
                    {new Date(design.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Version Inspector & Preview Modal ──────────────────── */}
      {isViewerModalOpen && selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 lg:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-surface-900 border border-white/10 rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Top Bar */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-surface-950/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold">
                  <HiOutlinePaintBrush className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white font-display">
                      {selectedDesign.title}
                    </h2>
                    <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                      {selectedDesign.project?.code}
                    </span>
                  </div>
                  <p className="text-xs text-surface-400">
                    {selectedDesign.category} • Current Version: v{selectedDesign.currentVersion}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {getStatusPill(selectedDesign.status)}
                <button
                  onClick={() => setIsViewerModalOpen(false)}
                  className="p-1.5 text-surface-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Split Screen Viewer & Timeline Inspector */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
              {/* Left 8 Cols: Asset Preview Canvas with Interactive Pin Annotations */}
              <div className="lg:col-span-8 bg-surface-950 p-6 flex flex-col items-center justify-between min-h-[460px] border-b lg:border-b-0 lg:border-r border-white/5">
                {/* Canvas Toolbar */}
                <div className="w-full flex items-center justify-between pb-3 border-b border-white/5 mb-4 text-xs">
                  <div className="flex items-center gap-2 text-surface-300">
                    <span className="font-mono font-bold text-white">v{activeVersion?.versionNumber}</span>
                    <span>•</span>
                    <span className="truncate max-w-[220px] text-surface-400">{activeVersion?.fileName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Pinning Mode */}
                    {(activeVersion?.fileType?.startsWith('image/') || activeVersion?.fileName?.endsWith('.svg')) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPinningMode(!pinningMode);
                          if (!pinningMode) {
                            toast('Click anywhere on the preview mockup to drop a pin!', { icon: '📍' });
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                          pinningMode
                            ? 'bg-amber-400 text-surface-950 shadow-lg shadow-amber-400/20 font-bold'
                            : pendingPin
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white'
                        }`}
                      >
                        <HiOutlineMapPin className="w-3.5 h-3.5" />
                        {pinningMode ? 'Targeting Pin...' : pendingPin ? `Pin (${pendingPin.x}%, ${pendingPin.y}%)` : 'Pin Feedback'}
                      </button>
                    )}

                    {pendingPin && (
                      <button
                        type="button"
                        onClick={() => setPendingPin(null)}
                        className="text-[11px] text-red-400 hover:text-red-300 underline"
                      >
                        Clear Pin
                      </button>
                    )}

                    <a
                      href={`${API_BASE}${activeVersion?.fileUrl}`}
                      download
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white transition-colors"
                    >
                      <HiOutlineArrowDownTray className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                </div>

                {/* Canvas Body */}
                {activeVersion ? (
                  <div className="w-full flex-1 flex flex-col items-center justify-center">
                    {activeVersion.fileType?.startsWith('image/') || activeVersion.fileName?.endsWith('.svg') ? (
                      <div className="relative max-h-[540px] w-full flex items-center justify-center overflow-auto rounded-xl border border-white/10 shadow-2xl p-2 bg-surface-900/60 select-none">
                        <div className="relative inline-block">
                          <img
                            src={`${API_BASE}${activeVersion.fileUrl}`}
                            alt={activeVersion.fileName}
                            onClick={handleImageClick}
                            className={`max-h-[500px] max-w-full object-contain rounded-lg transition-all ${
                              pinningMode ? 'cursor-crosshair ring-2 ring-amber-400 ring-offset-2 ring-offset-surface-900' : ''
                            }`}
                          />

                          {/* Existing Pinned Feedback Annotations */}
                          {comments
                            .filter((c) => c.pinnedPosition && c.pinnedPosition.x != null)
                            .map((c, idx) => (
                              <button
                                key={c._id}
                                type="button"
                                onClick={() => setActiveTab('comments')}
                                style={{ left: `${c.pinnedPosition.x}%`, top: `${c.pinnedPosition.y}%` }}
                                className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg transition-transform hover:scale-125 z-10 ${
                                  c.isResolved
                                    ? 'bg-emerald-500 text-white opacity-70 ring-2 ring-emerald-300'
                                    : c.type === 'revision_request'
                                    ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-300'
                                    : 'bg-brand-500 text-white ring-2 ring-brand-300'
                                }`}
                                title={`#${idx + 1} - ${c.author?.name}: ${c.content}`}
                              >
                                {idx + 1}
                              </button>
                            ))}

                          {/* Pending Pin Indicator */}
                          {pendingPin && (
                            <div
                              style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                              className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-amber-400 text-surface-950 flex items-center justify-center text-xs font-black ring-4 ring-amber-400/40 animate-bounce z-20 shadow-xl"
                            >
                              📍
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mx-auto text-brand-400">
                          <HiOutlineArrowDownTray className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-bold text-white">{activeVersion.fileName}</h4>
                        <p className="text-xs text-surface-400">
                          {activeVersion.fileType || 'Design Archive'} • {(activeVersion.fileSize / 1024).toFixed(1)} KB
                        </p>
                        <a
                          href={`${API_BASE}${activeVersion.fileUrl}`}
                          download
                          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-semibold hover:bg-brand-600"
                        >
                          <HiOutlineArrowDownTray className="w-4 h-4" />
                          Download Deliverable
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-surface-500 text-sm">No version asset loaded</div>
                )}

                {/* Canvas Footer notice */}
                <div className="w-full pt-3 text-center text-[11px] text-surface-500">
                  {pinningMode ? (
                    <span className="text-amber-300 font-semibold animate-pulse">
                      📍 Click on any UI element to mark an annotation point
                    </span>
                  ) : (
                    <span>Tip: Use 'Pin Feedback' to annotate specific elements directly on this mockup canvas</span>
                  )}
                </div>
              </div>

              {/* Right 4 Cols: Tabbed Inspector (Feedback & Pins, Iterations, Approvals) */}
              <div className="lg:col-span-4 p-5 space-y-4 bg-surface-900/90 flex flex-col justify-between border-l border-white/5">
                <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                  {/* Tabs Header */}
                  <div className="flex rounded-xl bg-surface-950 p-1 border border-white/5">
                    <button
                      onClick={() => setActiveTab('comments')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        activeTab === 'comments'
                          ? 'bg-brand-500 text-white shadow'
                          : 'text-surface-400 hover:text-white'
                      }`}
                    >
                      <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                      Feedback ({comments.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('timeline')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        activeTab === 'timeline'
                          ? 'bg-brand-500 text-white shadow'
                          : 'text-surface-400 hover:text-white'
                      }`}
                    >
                      <HiOutlineClock className="w-3.5 h-3.5" />
                      Iterations ({selectedVersions.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('review')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        activeTab === 'review'
                          ? 'bg-brand-500 text-white shadow'
                          : 'text-surface-400 hover:text-white'
                      }`}
                    >
                      <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                      Approvals
                    </button>
                  </div>

                  {/* TAB 1: Comments & Feedback Stream */}
                  {activeTab === 'comments' && (
                    <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                      {/* Add Comment Box */}
                      <form onSubmit={handlePostComment} className="p-3 bg-surface-950/80 rounded-xl border border-white/5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <select
                            value={commentType}
                            onChange={(e) => setCommentType(e.target.value)}
                            className="bg-surface-900 border border-white/10 rounded-lg px-2.5 py-1 text-[11px] text-surface-200"
                          >
                            <option value="general">💬 General Feedback</option>
                            <option value="revision_request">⚠️ Revision Request</option>
                            <option value="approval">✓ Approval Note</option>
                          </select>

                          {pendingPin && (
                            <span className="text-[10px] text-amber-300 font-mono bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                              📍 ({pendingPin.x}%, {pendingPin.y}%)
                            </span>
                          )}
                        </div>

                        <textarea
                          rows="2"
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          placeholder="Type design feedback, changes needed, or suggestions..."
                          className="w-full px-3 py-2 bg-surface-900 border border-white/10 rounded-lg text-xs text-white placeholder-surface-500 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                        ></textarea>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setPinningMode(!pinningMode)}
                            className="text-[11px] text-surface-400 hover:text-white flex items-center gap-1"
                          >
                            <HiOutlineMapPin className="w-3.5 h-3.5 text-amber-400" />
                            {pendingPin ? 'Repin location' : 'Drop canvas pin'}
                          </button>

                          <button
                            type="submit"
                            disabled={commentSubmitting}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow disabled:opacity-50"
                          >
                            <HiOutlinePaperAirplane className="w-3 h-3" />
                            {commentSubmitting ? 'Posting...' : 'Post Feedback'}
                          </button>
                        </div>
                      </form>

                      {/* Comments List */}
                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[340px]">
                        {commentsLoading && comments.length === 0 ? (
                          <div className="p-6 text-center text-xs text-surface-500">Loading comments...</div>
                        ) : comments.length === 0 ? (
                          <div className="p-8 text-center text-xs text-surface-500">
                            No feedback recorded yet. Be the first to comment on this version!
                          </div>
                        ) : (
                          comments.map((c, idx) => (
                            <div
                              key={c._id}
                              className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                                c.isResolved
                                  ? 'bg-surface-950/40 border-emerald-500/20 opacity-75'
                                  : c.type === 'revision_request'
                                  ? 'bg-rose-500/5 border-rose-500/20'
                                  : c.type === 'approval'
                                  ? 'bg-emerald-500/5 border-emerald-500/20'
                                  : 'bg-surface-950/70 border-white/5'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 font-bold flex items-center justify-center text-[10px]">
                                    {c.author?.name?.slice(0, 1) || 'U'}
                                  </div>
                                  <span className="font-semibold text-white">{c.author?.name}</span>
                                  {c.author?.role && (
                                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface-800 text-surface-400">
                                      {c.author.role}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 text-[10px] text-surface-400">
                                  {c.pinnedPosition && (
                                    <span className="text-amber-400 font-mono font-bold bg-amber-400/10 px-1.5 py-0.5 rounded">
                                      📍 Pin #{idx + 1}
                                    </span>
                                  )}
                                  <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>

                              <p className={`text-surface-200 text-xs ${c.isResolved ? 'line-through text-surface-400' : ''}`}>
                                {c.content}
                              </p>

                              {/* Action Footer */}
                              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => handleToggleResolve(c._id)}
                                  className={`inline-flex items-center gap-1 font-semibold ${
                                    c.isResolved
                                      ? 'text-emerald-400 hover:text-emerald-300'
                                      : 'text-surface-400 hover:text-surface-200'
                                  }`}
                                >
                                  <HiOutlineCheck className="w-3 h-3" />
                                  {c.isResolved ? 'Resolved' : 'Mark Resolved'}
                                </button>

                                {(currentUser?.role === 'admin' || c.author?._id === currentUser?._id) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCommentItem(c._id)}
                                    className="text-red-400/70 hover:text-red-400"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Version Timeline & Upload */}
                  {activeTab === 'timeline' && (
                    <div className="space-y-4 overflow-y-auto max-h-[420px]">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-surface-300 block mb-2">
                          Available Iterations
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {selectedVersions.map((v) => (
                            <button
                              key={v._id}
                              onClick={() => setActiveVersionNumber(v.versionNumber)}
                              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                                activeVersionNumber === v.versionNumber
                                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                                  : 'bg-surface-950 hover:bg-surface-800 text-surface-400 hover:text-white border border-white/5'
                              }`}
                            >
                              v{v.versionNumber}
                            </button>
                          ))}
                        </div>
                      </div>

                      {activeVersion && (
                        <div className="p-4 rounded-xl bg-surface-950/60 border border-white/5 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-white font-mono">
                              Iteration v{activeVersion.versionNumber} Notes
                            </span>
                            <span className="text-[10px] text-surface-400">
                              {new Date(activeVersion.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-surface-300 italic">
                            "{activeVersion.changelog || 'No changelog specified for this iteration.'}"
                          </p>
                          {activeVersion.uploadedBy && (
                            <p className="text-[11px] text-surface-400 pt-1 border-t border-white/5">
                              Uploaded by: <strong className="text-surface-200">{activeVersion.uploadedBy.name}</strong>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Upload New Version Accordion */}
                      {canUpload && (
                        <div className="border-t border-white/5 pt-3">
                          {!isNewVersionOpen ? (
                            <button
                              onClick={() => setIsNewVersionOpen(true)}
                              className="w-full py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                            >
                              <HiOutlineArrowUpTray className="w-4 h-4" />
                              Upload Next Iteration (v{(selectedDesign.currentVersion || 1) + 1})
                            </button>
                          ) : (
                            <form onSubmit={handleSubmitNewVersion} className="space-y-3 bg-surface-950/80 p-4 rounded-xl border border-brand-500/20">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-brand-300">
                                  Upload Iteration v{(selectedDesign.currentVersion || 1) + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setIsNewVersionOpen(false)}
                                  className="text-surface-400 hover:text-white text-xs"
                                >
                                  Cancel
                                </button>
                              </div>

                              <div>
                                <label className="block text-[11px] text-surface-400 mb-1">Select Asset File *</label>
                                <input
                                  type="file"
                                  required
                                  onChange={(e) => setNewVersionForm({ ...newVersionForm, file: e.target.files[0] })}
                                  className="w-full text-xs text-surface-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-500/20 file:text-brand-300"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-surface-400 mb-1">Changelog Notes</label>
                                <textarea
                                  rows="2"
                                  value={newVersionForm.changelog}
                                  onChange={(e) => setNewVersionForm({ ...newVersionForm, changelog: e.target.value })}
                                  placeholder="Summary of client feedback applied..."
                                  className="w-full px-3 py-1.5 bg-surface-900 border border-white/10 rounded-lg text-xs text-white"
                                ></textarea>
                              </div>

                              <button
                                type="submit"
                                disabled={uploading}
                                className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold shadow"
                              >
                                {uploading ? 'Uploading...' : 'Publish Version'}
                              </button>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: Client Approvals & Review Workflow */}
                  {activeTab === 'review' && (
                    <div className="space-y-4 overflow-y-auto max-h-[420px]">
                      {/* Current Status Card */}
                      <div className="p-4 rounded-xl bg-surface-950/60 border border-white/5 space-y-2">
                        <span className="text-[11px] uppercase font-bold tracking-wider text-surface-400 block">
                          Current Deliverable Status
                        </span>
                        <div className="flex items-center gap-2">
                          {getStatusPill(selectedDesign.status)}
                          <span className="text-xs text-surface-300">
                            v{selectedDesign.currentVersion} • Updated {new Date(selectedDesign.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Review Notes */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-surface-300">
                          Review Notes / Approval Remarks
                        </label>
                        <textarea
                          rows="3"
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Provide approval sign-off remarks or describe changes required by the creative team..."
                          className="w-full px-3 py-2 bg-surface-950 border border-white/10 rounded-xl text-xs text-white placeholder-surface-500 focus:ring-1 focus:ring-brand-500"
                        ></textarea>
                      </div>

                      {/* Review Action Buttons */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          disabled={submittingReview}
                          onClick={() => handleSubmitReview('approve')}
                          className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          <HiOutlineCheckCircle className="w-4 h-4" />
                          Approve Deliverable
                        </button>
                        <button
                          type="button"
                          disabled={submittingReview}
                          onClick={() => handleSubmitReview('request_changes')}
                          className="py-2.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                          <HiOutlineExclamationTriangle className="w-4 h-4" />
                          Request Revisions
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-surface-950/40 border border-white/5 text-[11px] text-surface-400 leading-relaxed">
                        <strong className="text-surface-200">Formal Sign-Off Workflow:</strong> Submitting a review marks the deliverable status, adds an immutable audit event in the Studio Activity stream, and notifies team members.
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete button (Admin only) */}
                {currentUser?.role === 'admin' && (
                  <div className="pt-3 border-t border-white/5 flex justify-end">
                    <button
                      onClick={() => handleDeleteDesign(selectedDesign._id)}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                      Delete Entire Design Asset
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload New Design Modal ────────────────────────────── */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
              <h2 className="text-lg font-bold text-white font-display">Upload Design Asset</h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-surface-400 hover:text-surface-300 rounded-lg hover:bg-white/[0.04] transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewDesign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">
                  Design Title *
                </label>
                <input
                  type="text"
                  required
                  value={newDesignForm.title}
                  onChange={(e) => setNewDesignForm({ ...newDesignForm, title: e.target.value })}
                  placeholder="e.g. Mobile Banking Dashboard Mockup"
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Associated Project *
                  </label>
                  <select
                    required
                    disabled={Boolean(fixedProjectId)}
                    value={newDesignForm.project}
                    onChange={(e) => setNewDesignForm({ ...newDesignForm, project: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 disabled:opacity-60"
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.code} — {p.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Discipline / Category
                  </label>
                  <select
                    value={newDesignForm.category}
                    onChange={(e) => setNewDesignForm({ ...newDesignForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="UI Screen">UI Screen</option>
                    <option value="Brand Asset">Brand Asset</option>
                    <option value="Motion Graphic">Motion Graphic</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Logo">Logo</option>
                    <option value="Marketing Graphic">Marketing Graphic</option>
                    <option value="Illustration">Illustration</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* File dropzone */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">
                  Deliverable File (PNG, JPG, SVG, WEBP, PDF, ZIP) *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setNewDesignForm({ ...newDesignForm, file: e.target.files[0] })}
                  className="w-full text-xs text-surface-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/10 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">
                  Design Brief & Specs
                </label>
                <textarea
                  rows="3"
                  value={newDesignForm.description}
                  onChange={(e) => setNewDesignForm({ ...newDesignForm, description: e.target.value })}
                  placeholder="Deliverable specifications, client review prompts..."
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md hover:shadow-glow disabled:opacity-50 transition-all"
                >
                  {uploading ? 'Uploading v1...' : 'Upload & Publish v1'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DesignsPage;
