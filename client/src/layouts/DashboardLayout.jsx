import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  addRealtimeNotification,
} from '../features/notifications/notificationSlice';
import { connectSocket, disconnectSocket } from '../services/socket';
import toast from 'react-hot-toast';
import HorseShoeLogo from '../components/HorseShoeLogo';
import {
  HiOutlineSparkles,
  HiOutlineHome,
  HiOutlineRectangleGroup,
  HiOutlineUserGroup,
  HiOutlinePaintBrush,
  HiOutlineClipboardDocumentList,
  HiOutlineChartBarSquare,
  HiOutlineBell,
  HiOutlineUser,
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineCog6Tooth,
  HiOutlineUsers,
  HiOutlineFolderOpen,
  HiOutlineCheck,
  HiOutlineTrash,
} from 'react-icons/hi2';

// ── Sidebar Navigation Config ────────────────────────────────

const getNavItems = (role) => {
  const common = [
    { label: 'Dashboard', path: '/dashboard', icon: HiOutlineHome },
    { label: 'Projects', path: '/dashboard/projects', icon: HiOutlineRectangleGroup },
  ];

  const adminItems = [
    ...common,
    { label: 'Designs', path: '/dashboard/designs', icon: HiOutlinePaintBrush },
    { label: 'Tasks', path: '/dashboard/tasks', icon: HiOutlineClipboardDocumentList },
    { label: 'Clients', path: '/dashboard/clients', icon: HiOutlineUserGroup },
    { label: 'Users', path: '/dashboard/users', icon: HiOutlineUsers },
    { label: 'Activity Log', path: '/dashboard/activity', icon: HiOutlineClipboardDocumentList },
    { label: 'Analytics', path: '/dashboard/analytics', icon: HiOutlineChartBarSquare },
  ];

  const designerItems = [
    ...common,
    { label: 'My Designs', path: '/dashboard/designs', icon: HiOutlinePaintBrush },
    { label: 'My Tasks', path: '/dashboard/tasks', icon: HiOutlineClipboardDocumentList },
    { label: 'Activity Log', path: '/dashboard/activity', icon: HiOutlineClipboardDocumentList },
    { label: 'My Workload', path: '/dashboard/workload', icon: HiOutlineChartBarSquare },
  ];

  const clientItems = [
    { label: 'My Projects', path: '/dashboard', icon: HiOutlineFolderOpen },
    { label: 'Design Reviews', path: '/dashboard/designs', icon: HiOutlinePaintBrush },
    { label: 'Activity Log', path: '/dashboard/activity', icon: HiOutlineClipboardDocumentList },
  ];

  switch (role) {
    case 'admin': return adminItems;
    case 'designer': return designerItems;
    case 'client': return clientItems;
    case 'project_manager': return adminItems;
    default: return common;
  }
};

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const navItems = getNavItems(user?.role);

  // Close notification panel on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Connect Socket.IO & listen for notifications
  useEffect(() => {
    if (user?._id) {
      dispatch(fetchNotifications({ limit: 20 }));
      const s = connectSocket(user._id);

      s.on('notification:new', (notification) => {
        dispatch(addRealtimeNotification(notification));
        toast.custom(
          (t) => (
            <div
              onClick={() => {
                toast.dismiss(t.id);
                if (notification.link) navigate(notification.link);
              }}
              className={`${t.visible ? 'animate-bounce-in' : 'opacity-0'
                } max-w-sm w-full bg-[#141414] shadow-2xl rounded-2xl border border-white/[0.06] p-4 cursor-pointer hover:bg-[#1c1c1c] transition-all flex items-start gap-3 pointer-events-auto`}
            >
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center flex-shrink-0 font-bold text-base">
                🔔
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {notification.title}
                </p>
                <p className="text-[11px] text-surface-500 line-clamp-2 mt-0.5">
                  {notification.message}
                </p>
              </div>
            </div>
          ),
          { duration: 5000, position: 'top-right' }
        );
      });

      return () => {
        s.off('notification:new');
      };
    }
  }, [user, dispatch, navigate]);

  const handleLogout = async () => {
    try {
      disconnectSocket();
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      dispatch(markNotificationAsRead(notif._id));
    }
    setNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsAsRead());
    toast.success('All marked as read');
  };

  const handleDeleteNotif = (e, id) => {
    e.stopPropagation();
    dispatch(deleteNotification(id));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-brand-500/10 text-brand-400 border border-brand-500/20';
      case 'designer': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'client': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'project_manager': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      default: return 'bg-surface-800 text-surface-400';
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  return (
    <div className="h-screen bg-[#050505] flex overflow-hidden">
      {/* ── Sidebar ── */}
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static top-0 left-0 z-50 h-full w-[260px] bg-[#0a0a0a] border-r border-white/[0.04]
          flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.04]">
          <HorseShoeLogo size="sm" theme="dark" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-white/[0.05] text-surface-500"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-brand-500/20">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${getRoleColor(user?.role)}`}>
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 z-30 bg-[#0a0a0a] border-b border-white/[0.04]">
          <div className="flex items-center justify-between px-6 py-3.5">
            {/* Left — mobile toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/[0.05] text-surface-500"
            >
              <HiOutlineBars3 className="w-5 h-5" />
            </button>

            {/* Center — search */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search projects, tasks, designs..."
                  className="w-full pl-4 pr-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-surface-300 placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all duration-200"
                />
              </div>
            </div>

            {/* Right — actions */}
            <div className="flex items-center gap-2 relative" ref={notifRef}>
              {/* Notifications Bell */}
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative p-2.5 rounded-xl transition-all duration-200 ${notifOpen ? 'bg-white/[0.06] text-brand-400' : 'hover:bg-white/[0.04] text-surface-500'
                  }`}
                aria-label="View notifications"
              >
                <HiOutlineBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#0a0a0a] animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Live Notifications Dropdown Drawer */}
              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-[#111] border border-white/[0.06] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                  <div className="p-3.5 border-b border-white/[0.04] flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-display text-white uppercase tracking-wider">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                          {unreadCount} unread
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
                      >
                        <HiOutlineCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-white/[0.04]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs text-surface-600">
                        <HiOutlineBell className="w-7 h-7 mx-auto mb-2 text-surface-700 opacity-60" />
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 text-xs transition-colors cursor-pointer flex items-start gap-3 hover:bg-white/[0.03] ${!n.isRead ? 'bg-brand-500/[0.03]' : ''
                            }`}
                        >
                          <div className="pt-0.5">
                            {!n.isRead ? (
                              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 block ring-2 ring-brand-500/20" />
                            ) : (
                              <span className="w-2.5 h-2.5 rounded-full bg-surface-700 block" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`font-semibold truncate ${!n.isRead ? 'text-white' : 'text-surface-500'}`}>
                                {n.title}
                              </span>
                              <span className="text-[10px] text-surface-600 font-mono flex-shrink-0">
                                {new Date(n.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-surface-500 text-[11px] line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                          </div>

                          <button
                            onClick={(e) => handleDeleteNotif(e, n._id)}
                            className="text-surface-700 hover:text-brand-400 p-1 opacity-0 hover:opacity-100 transition-opacity"
                            title="Delete notification"
                          >
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2 border-t border-white/[0.04] bg-white/[0.02] text-center">
                    <NavLink
                      to="/dashboard/activity"
                      onClick={() => setNotifOpen(false)}
                      className="text-[11px] font-semibold text-surface-500 hover:text-white"
                    >
                      View Full Activity Audit Trail &rarr;
                    </NavLink>
                  </div>
                </div>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl hover:bg-brand-500/10 text-surface-500 hover:text-brand-400 transition-colors duration-200"
                title="Logout"
              >
                <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
