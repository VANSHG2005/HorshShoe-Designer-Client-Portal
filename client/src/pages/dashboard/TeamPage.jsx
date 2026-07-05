import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchUsers,
  fetchUserStats,
  createUser,
  updateUser,
  deleteUser,
} from '../../features/users/userSlice';
import { fetchClients } from '../../features/clients/clientSlice';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineCurrencyDollar,
  HiOutlineBriefcase,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineShieldCheck,
  HiOutlinePaintBrush,
  HiOutlineBuildingOffice2,
  HiOutlineCheckBadge,
} from 'react-icons/hi2';

function TeamPage() {
  const dispatch = useDispatch();
  const { users, stats, loading, submitting } = useSelector((state) => state.users);
  const { clients } = useSelector((state) => state.clients);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form state
  const initialForm = {
    name: '',
    email: '',
    password: '',
    role: 'designer',
    phone: '',
    specializations: '',
    bio: '',
    clientCompany: '',
    hourlyRate: '',
    isActive: true,
  };
  const [formData, setFormData] = useState(initialForm);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    dispatch(fetchUsers({ search: searchTerm, role: selectedRole }));
    dispatch(fetchUserStats());
    dispatch(fetchClients({ limit: 100 }));
  }, [dispatch, selectedRole]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchUsers({ search: searchTerm, role: selectedRole }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch, selectedRole]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (targetUser) => {
    setEditingUser(targetUser);
    setFormData({
      name: targetUser.name || '',
      email: targetUser.email || '',
      password: '',
      role: targetUser.role || 'designer',
      phone: targetUser.phone || '',
      specializations: targetUser.specializations?.join(', ') || '',
      bio: targetUser.bio || '',
      clientCompany: targetUser.clientCompany?._id || targetUser.clientCompany || '',
      hourlyRate: targetUser.hourlyRate || '',
      isActive: targetUser.isActive !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const payload = {
      ...formData,
      specializations: formData.specializations
        ? formData.specializations.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : 0,
      clientCompany: formData.clientCompany || null,
    };

    if (editingUser) {
      delete payload.password; // Don't overwrite password during edit
      const res = await dispatch(updateUser({ id: editingUser._id, data: payload }));
      if (!res.error) {
        toast.success('User updated successfully');
        setIsModalOpen(false);
      } else {
        toast.error(res.payload || 'Failed to update user');
      }
    } else {
      const res = await dispatch(createUser(payload));
      if (!res.error) {
        toast.success('Team member created successfully');
        setIsModalOpen(false);
      } else {
        toast.error(res.payload || 'Failed to create user');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const res = await dispatch(deleteUser(userToDelete._id));
    if (!res.error) {
      toast.success('User removed successfully');
      setUserToDelete(null);
    } else {
      toast.error(res.payload || 'Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-200">
            <HiOutlineShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            Admin
          </span>
        );
      case 'designer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <HiOutlinePaintBrush className="w-3.5 h-3.5 text-brand-600" />
            Designer
          </span>
        );
      case 'client':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-emerald-600" />
            Client
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-display text-white tracking-tight">
            Team & User Management
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Manage agency designers, admins, and client portal stakeholders
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Add Team Member
          </button>
        )}
      </div>

      {/* ── Metric Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Total Users</span>
            <span className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600">
              <HiOutlineUserGroup className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-white mt-3">{stats.totalUsers}</p>
        </div>

        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Designers</span>
            <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
              <HiOutlinePaintBrush className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-purple-400 mt-3">{stats.totalDesigners}</p>
        </div>

        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Client Users</span>
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <HiOutlineBuildingOffice2 className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-emerald-400 mt-3">{stats.totalClients}</p>
        </div>

        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Active Status</span>
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <HiOutlineCheckBadge className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-amber-400 mt-3">{stats.totalActive}</p>
        </div>
      </div>

      {/* ── Filters & Search Bar ───────────────────────────────── */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { label: 'All Roles', value: 'all' },
            { label: 'Designers', value: 'designer' },
            { label: 'Clients', value: 'client' },
            { label: 'Admins', value: 'admin' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedRole(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                selectedRole === tab.value
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm font-semibold'
                  : 'text-surface-600 hover:text-white hover:bg-[#0e0e0e] border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── User Cards Grid ────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111] border border-white/[0.06] rounded-2xl p-6 h-64 animate-pulse shadow-sm">
              <div className="h-12 w-12 bg-white/[0.04] rounded-xl mb-4"></div>
              <div className="h-5 w-2/3 bg-white/[0.04] rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-[#0e0e0e] rounded mb-4"></div>
              <div className="h-10 bg-[#0e0e0e] rounded"></div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-100 flex items-center justify-center mx-auto mb-4 text-brand-600">
            <HiOutlineUserGroup className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No users found</h3>
          <p className="text-sm text-surface-500 max-w-sm mx-auto mb-6">
            {searchTerm ? 'No team members match your search criteria.' : 'Create an account to invite colleagues or clients.'}
          </p>
          {isAdmin && !searchTerm && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-500 transition-colors shadow-sm"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Add Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((item) => (
            <div
              key={item._id}
              className="group bg-[#111] border border-white/[0.06] hover:border-brand-300 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name, Role */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold font-display text-base flex items-center justify-center shadow-sm">
                      {item.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-white text-base group-hover:text-brand-400 transition-colors">
                          {item.name}
                        </h3>
                        {!item.isActive && (
                          <span className="w-2 h-2 rounded-full bg-red-500" title="Inactive"></span>
                        )}
                      </div>
                      <div className="mt-1">{getRoleBadge(item.role)}</div>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 py-3 border-y border-white/[0.04] text-xs text-surface-600">
                  <div className="flex items-center gap-2 truncate">
                    <HiOutlineEnvelope className="w-4 h-4 text-surface-400 flex-shrink-0" />
                    <a href={`mailto:${item.email}`} className="hover:text-brand-400 truncate">
                      {item.email}
                    </a>
                  </div>
                  {item.phone && (
                    <div className="flex items-center gap-2 truncate">
                      <HiOutlinePhone className="w-4 h-4 text-surface-400 flex-shrink-0" />
                      <span>{item.phone}</span>
                    </div>
                  )}
                  {item.clientCompany && (
                    <div className="flex items-center gap-2 truncate text-emerald-400">
                      <HiOutlineBuildingOffice2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span className="font-medium truncate">{item.clientCompany.name}</span>
                    </div>
                  )}
                  {item.hourlyRate > 0 && (
                    <div className="flex items-center gap-2 truncate text-surface-500">
                      <HiOutlineCurrencyDollar className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      <span>${item.hourlyRate} / hour billable</span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {item.bio && (
                  <p className="text-xs text-surface-500 mt-3 line-clamp-2 italic">
                    "{item.bio}"
                  </p>
                )}

                {/* Specializations / Skills Tags */}
                {item.specializations?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.specializations.map((spec, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white/[0.04] text-surface-600 border border-white/[0.06]"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Actions Footer */}
              {isAdmin && (
                <div className="mt-4 pt-3 flex items-center justify-end gap-2 border-t border-white/[0.04]">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 text-surface-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors text-xs inline-flex items-center gap-1.5"
                    title="Edit User"
                  >
                    <HiOutlinePencilSquare className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  {currentUser?._id !== item._id && (
                    <button
                      onClick={() => setUserToDelete(item)}
                      className="p-2 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs inline-flex items-center gap-1.5"
                      title="Remove User"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Team Member Modal ───────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  {editingUser ? 'Edit Team Member' : 'Add New Team Member'}
                </h2>
                <p className="text-xs text-surface-500 mt-0.5">
                  Assign roles, permissions, and skill profiles
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Sarah Mitchell"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="designer@horseshoe.studio"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Platform Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="designer">Designer (Creative Pipeline)</option>
                    <option value="client">Client (Portal Reviewer)</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1-555-0201"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Conditional: If Client -> Select Company */}
              {formData.role === 'client' && (
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Affiliated Client Company
                  </label>
                  <select
                    value={formData.clientCompany}
                    onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="">-- Select Client Organization --</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional: If Designer -> Skills & Hourly Rate */}
              {formData.role === 'designer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-surface-300 mb-1">
                      Hourly Rate ($ / hr)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      placeholder="e.g. 95"
                      className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-surface-300 mb-1">
                      Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.specializations}
                      onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                      placeholder="UI/UX, 3D, Figma, Branding"
                      className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>
              )}

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">
                  Professional Bio
                </label>
                <textarea
                  rows="3"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Summary of experience, design focus, and background..."
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                ></textarea>
              </div>

              {/* Active status checkbox if editing */}
              {editingUser && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-400 bg-[#0e0e0e] border-white/[0.08] focus:ring-brand-500"
                  />
                  <label htmlFor="isActive" className="text-xs text-surface-300 font-medium cursor-pointer">
                    Account is active and permitted to log in
                  </label>
                </div>
              )}

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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Saving...' : editingUser ? 'Update Member' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────── */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
              <HiOutlineTrash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Remove Team Member</h3>
              <p className="text-xs text-surface-500 mt-1">
                Are you sure you want to remove <span className="text-white font-semibold">{userToDelete.name}</span> ({userToDelete.email})?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamPage;
