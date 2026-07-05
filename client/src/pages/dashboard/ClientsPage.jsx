import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchClients,
  fetchClientStats,
  createClient,
  updateClient,
  deleteClient,
} from '../../features/clients/clientSlice';
import toast from 'react-hot-toast';
import {
  HiOutlineUserGroup,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineBuildingOffice2,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineGlobeAlt,
  HiOutlineMapPin,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';

function ClientsPage() {
  const dispatch = useDispatch();
  const { clients, stats, loading, submitting } = useSelector((state) => state.clients);
  const { user } = useSelector((state) => state.auth);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientToDelete, setClientToDelete] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    status: 'active',
    address: { street: '', city: '', state: '', zipCode: '', country: '' },
    contactPerson: { name: '', email: '', phone: '', role: '' },
    notes: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const isAdminOrPM = user?.role === 'admin' || user?.role === 'project_manager';

  useEffect(() => {
    dispatch(fetchClients({ search: searchTerm, status: selectedStatus }));
    dispatch(fetchClientStats());
  }, [dispatch, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchClients({ search: searchTerm, status: selectedStatus }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch, selectedStatus]);

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      company: client.company || '',
      email: client.email || '',
      phone: client.phone || '',
      website: client.website || '',
      status: client.status || 'active',
      address: {
        street: client.address?.street || '',
        city: client.address?.city || '',
        state: client.address?.state || '',
        zipCode: client.address?.zipCode || '',
        country: client.address?.country || '',
      },
      contactPerson: {
        name: client.contactPerson?.name || '',
        email: client.contactPerson?.email || '',
        phone: client.contactPerson?.phone || '',
        role: client.contactPerson?.role || '',
      },
      notes: client.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Client name and email are required');
      return;
    }

    if (editingClient) {
      const res = await dispatch(updateClient({ id: editingClient._id, data: formData }));
      if (!res.error) {
        toast.success('Client updated successfully');
        setIsModalOpen(false);
      } else {
        toast.error(res.payload || 'Failed to update client');
      }
    } else {
      const res = await dispatch(createClient(formData));
      if (!res.error) {
        toast.success('Client created successfully');
        setIsModalOpen(false);
      } else {
        toast.error(res.payload || 'Failed to create client');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    const res = await dispatch(deleteClient(clientToDelete._id));
    if (!res.error) {
      toast.success('Client deleted successfully');
      setClientToDelete(null);
    } else {
      toast.error(res.payload || 'Failed to delete client');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active
          </span>
        );
      case 'lead':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Lead
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/[0.04] text-surface-600 border border-white/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-surface-400"></span>
            Inactive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
            {status}
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
            Client Directory
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Manage partner organizations, primary contacts, and client deliverables
          </p>
        </div>
        {isAdminOrPM && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Add New Client
          </button>
        )}
      </div>

      {/* ── Metric Cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Total Accounts</span>
            <span className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600">
              <HiOutlineBuildingOffice2 className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-white mt-3">{stats.total}</p>
        </div>

        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Active</span>
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <HiOutlineCheckCircle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-emerald-400 mt-3">{stats.active}</p>
        </div>

        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Pipeline Leads</span>
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <HiOutlineClock className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-amber-400 mt-3">{stats.lead}</p>
        </div>

        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">Inactive</span>
            <span className="p-2.5 rounded-xl bg-white/[0.04] text-surface-600">
              <HiOutlineExclamationCircle className="w-5 h-5" />
            </span>
          </div>
          <p className="text-3xl font-black font-display text-surface-600 mt-3">{stats.inactive}</p>
        </div>
      </div>

      {/* ── Filters & Search Bar ───────────────────────────────── */}
      <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search by company or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-surface-200 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'active', 'lead', 'inactive'].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all whitespace-nowrap ${
                selectedStatus === status
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-sm font-semibold'
                  : 'text-surface-600 hover:text-white hover:bg-[#0e0e0e] border border-transparent'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Client Cards Grid ──────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111] border border-white/[0.06] rounded-2xl p-6 h-64 animate-pulse shadow-sm">
              <div className="h-6 w-2/3 bg-white/[0.04] rounded mb-4"></div>
              <div className="h-4 w-1/2 bg-white/[0.04] rounded mb-2"></div>
              <div className="h-4 w-3/4 bg-[#0e0e0e] rounded mb-6"></div>
              <div className="h-10 bg-[#0e0e0e] rounded"></div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-100 flex items-center justify-center mx-auto mb-4 text-brand-600">
            <HiOutlineBuildingOffice2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No clients found</h3>
          <p className="text-sm text-surface-500 max-w-sm mx-auto mb-6">
            {searchTerm ? 'No client accounts match your search query.' : 'Get started by creating your first client organization.'}
          </p>
          {isAdminOrPM && !searchTerm && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-500 transition-colors shadow-sm"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Add Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => (
            <div
              key={client._id}
              className="group bg-[#111] border border-white/[0.06] hover:border-brand-300 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header: Company & Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold font-display text-base">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-brand-400 transition-colors">
                        {client.name}
                      </h3>
                      {client.company && (
                        <p className="text-xs text-surface-500 truncate max-w-[180px]">{client.company}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(client.status)}
                </div>

                {/* Info List */}
                <div className="space-y-2 py-3 border-y border-white/[0.04] text-xs text-surface-600">
                  <div className="flex items-center gap-2.5 truncate">
                    <HiOutlineEnvelope className="w-4 h-4 text-surface-400 flex-shrink-0" />
                    <a href={`mailto:${client.email}`} className="hover:text-brand-400 truncate">
                      {client.email}
                    </a>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2.5 truncate">
                      <HiOutlinePhone className="w-4 h-4 text-surface-400 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.website && (
                    <div className="flex items-center gap-2.5 truncate">
                      <HiOutlineGlobeAlt className="w-4 h-4 text-surface-400 flex-shrink-0" />
                      <a
                        href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-brand-400 truncate underline decoration-brand-300"
                      >
                        {client.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {client.address?.city && (
                    <div className="flex items-center gap-2.5 truncate">
                      <HiOutlineMapPin className="w-4 h-4 text-surface-400 flex-shrink-0" />
                      <span>
                        {client.address.city}
                        {client.address.state ? `, ${client.address.state}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Contact Person */}
                {client.contactPerson?.name && (
                  <div className="mt-3 p-2.5 rounded-xl bg-[#0e0e0e] border border-white/[0.04]">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 block mb-1">
                      Primary Contact
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-surface-200">
                        {client.contactPerson.name}
                      </span>
                      {client.contactPerson.role && (
                        <span className="text-[11px] text-surface-500">
                          {client.contactPerson.role}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              {isAdminOrPM && (
                <div className="mt-4 pt-3 flex items-center justify-end gap-2 border-t border-white/[0.04]">
                  <button
                    onClick={() => handleOpenEditModal(client)}
                    className="p-2 text-surface-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors text-xs inline-flex items-center gap-1.5"
                    title="Edit Client"
                  >
                    <HiOutlinePencilSquare className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setClientToDelete(client)}
                      className="p-2 text-surface-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs inline-flex items-center gap-1.5"
                      title="Delete Client"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  {editingClient ? 'Edit Client Account' : 'New Client Organization'}
                </h2>
                <p className="text-xs text-surface-500 mt-0.5">
                  Enter details to register client credentials and contact points
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
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Client / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Acme Studio"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Legal Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Acme Corporation LLC"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="billing@acme.com"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1-555-0199"
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="active">Active</option>
                    <option value="lead">Lead</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://acme.com"
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Primary Contact Person Box */}
              <div className="p-4 rounded-xl bg-[#0e0e0e] border border-white/[0.06] space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                  Primary Contact Person
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={formData.contactPerson.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPerson: { ...formData.contactPerson, name: e.target.value },
                      })
                    }
                    placeholder="Contact Name"
                    className="px-3 py-1.5 bg-[#111] border border-white/[0.06] rounded-lg text-xs text-white placeholder-surface-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={formData.contactPerson.role}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPerson: { ...formData.contactPerson, role: e.target.value },
                      })
                    }
                    placeholder="Title / Role (e.g. Marketing Lead)"
                    className="px-3 py-1.5 bg-[#111] border border-white/[0.06] rounded-lg text-xs text-white placeholder-surface-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <input
                    type="email"
                    value={formData.contactPerson.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPerson: { ...formData.contactPerson, email: e.target.value },
                      })
                    }
                    placeholder="Direct Email"
                    className="px-3 py-1.5 bg-[#111] border border-white/[0.06] rounded-lg text-xs text-white placeholder-surface-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={formData.contactPerson.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contactPerson: { ...formData.contactPerson, phone: e.target.value },
                      })
                    }
                    placeholder="Direct Phone"
                    className="px-3 py-1.5 bg-[#111] border border-white/[0.06] rounded-lg text-xs text-white placeholder-surface-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-surface-300 mb-1">
                  Notes & Deliverables Requirements
                </label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Design guidelines, budget considerations, brand kit details..."
                  className="w-full px-3.5 py-2 bg-[#0e0e0e] border border-white/[0.06] rounded-xl text-sm text-white placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                ></textarea>
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
                  {submitting ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────── */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111] border border-white/[0.06] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
              <HiOutlineTrash className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Delete Client Account</h3>
              <p className="text-xs text-surface-500 mt-1">
                Are you sure you want to delete <span className="text-white font-semibold">{clientToDelete.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-surface-600 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientsPage;
