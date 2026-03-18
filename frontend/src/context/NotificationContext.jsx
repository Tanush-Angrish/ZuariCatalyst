/**
 * NotificationContext.jsx
 *
 * Fully unified Database-Backed Notification System for Zuari Catalyst.
 *
 * - Toasts: Ephemeral, driven by local frontend state for immediate feedback.
 * - Bell: Persistent, user-specific, strictly synced with the backend Database.
 *
 * Interactions:
 * - Single tap -> mark read (API call)
 * - Triple tap -> delete (API call)
 * - Bulk actions -> read all / delete all for user (API calls)
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X, Bell, Trash2 } from 'lucide-react';
import { useAuth } from './AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────
// The backend distributes these automatically now. The frontend `notify()`
// is just used to trigger the local visual toast banner for the current user.

// ─── Context ───────────────────────────────────────────────────────────────
const NotificationContext = createContext(null);
export const useNotifications = () => useContext(NotificationContext);

// ─── Helpers ───────────────────────────────────────────────────────────────
const ICONS = {
  success: (size = 16) => <CheckCircle2 size={size} className="text-green-500 shrink-0" />,
  error:   (size = 16) => <AlertCircle  size={size} className="text-red-500 shrink-0" />,
  info:    (size = 16) => <Info         size={size} className="text-blue-500 shrink-0" />,
  warning: (size = 16) => <AlertCircle  size={size} className="text-amber-500 shrink-0" />,
  mention: (size = 16) => <span style={{ fontSize: size * 0.8 }} className="font-bold text-purple-500 shrink-0">@</span>,
  project: (size = 16) => <Info         size={size} className="text-indigo-500 shrink-0" />,
  idea:    (size = 16) => <Info         size={size} className="text-blue-500 shrink-0" />,
};

const BAR_COLOR = {
  success: 'bg-green-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
  warning: 'bg-amber-500',
  mention: 'bg-purple-500',
  project: 'bg-indigo-500',
  idea:    'bg-blue-500',
};

function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Toast ─────────────────────────────────────────────────────────────────
function Toast({ id, type, title, message, onDismiss }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onDismiss(id), 300);
  }, [id, onDismiss, exiting]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, 4500);
    return () => clearTimeout(timerRef.current);
  }, []); // eslint-disable-line

  return (
    <div
      role="alert"
      onClick={dismiss}
      className={`
        relative flex items-start gap-3 bg-white border border-gray-100 rounded-xl shadow-lg
        px-4 py-3 min-w-[280px] max-w-sm overflow-hidden cursor-pointer select-none
        transition-all duration-300 ease-in-out
        ${exiting ? 'opacity-0 -translate-y-3 scale-95' : 'opacity-100 translate-y-0 scale-100'}
      `}
      title="Click to dismiss"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${BAR_COLOR[type] || BAR_COLOR.info}`} />
      <div className="pl-1 pt-0.5">{(ICONS[type] || ICONS.info)(16)}</div>
      <div className="flex-1 min-w-0">
        {title   && <p className="text-sm font-semibold text-gray-900">{title}</p>}
        {message && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{message}</p>}
      </div>
      <button
        onClick={e => { e.stopPropagation(); dismiss(); }}
        className="p-1 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 -mt-0.5"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Toast Container ────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
  if (typeof document === 'undefined') return null;
  return ReactDOM.createPortal(
    <div className="fixed top-20 right-4 z-[99999] flex flex-col gap-2.5 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="pointer-events-auto"
          style={{ animation: 'toastSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards' }}
        >
          <Toast {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>,
    document.body
  );
}

// ─── Bell Notification Item ─────────────────────────────────────────────────
function BellItem({ notif, onRead, onDelete }) {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  const handleClick = () => {
    tapCountRef.current += 1;

    if (tapCountRef.current === 3) {
      clearTimeout(tapTimerRef.current);
      tapCountRef.current = 0;
      onDelete(notif.id);
      return;
    }

    clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      const count = tapCountRef.current;
      tapCountRef.current = 0;
      if (count >= 1 && !notif.isRead) onRead(notif.id);
    }, 350);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => { if (e.key === 'Enter') handleClick(); }}
      className={`
        group flex items-start gap-3 px-4 py-3 cursor-pointer select-none
        border-b border-gray-50 last:border-0 transition-colors outline-none
        ${!notif.isRead ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-gray-50'}
      `}
      title="Tap to read · Triple-tap to delete"
    >
      <div className="mt-0.5">{(ICONS[notif.type] || ICONS.info)(14)}</div>

      <div className="flex-1 min-w-0">
        <p className={`text-[11px] leading-relaxed line-clamp-2 mt-0.5 ${!notif.isRead ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
          {notif.message}
        </p>
        <p className="text-[10px] text-gray-300 mt-1">{fmtTime(notif.createdAt)}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!notif.isRead && <span className="h-2 w-2 rounded-full bg-blue-500" />}
        <button
          onClick={e => { e.stopPropagation(); onDelete(notif.id); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-300 hover:text-red-400 transition-all"
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── Bell Icon + Dropdown ───────────────────────────────────────────────────
export function NotificationBell() {
  const { bellNotifs, markRead, deleteNotif, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = bellNotifs.filter(n => !n.isRead).length;

  useEffect(() => {
    if (!open) return;
    const handler = e => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[9999] animate-modal-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-gray-500" />
              <span className="text-sm font-bold text-gray-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {bellNotifs.length > 0 && (
                <>
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                    title="Mark all as read"
                  >
                    Mark all read
                  </button>
                  <span className="text-gray-200">·</span>
                  <button
                    onClick={() => { clearAll(); setOpen(false); }}
                    className="text-[10px] text-red-400 hover:text-red-600 font-semibold transition-colors"
                    title="Delete all notifications"
                  >
                    Clear all
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Hint */}
          {bellNotifs.length > 0 && (
            <p className="text-[9px] text-gray-300 px-4 pt-2 pb-0.5 font-medium tracking-wide uppercase">
              Tap to read · Triple-tap to delete
            </p>
          )}

          {/* List */}
          <div className="max-h-[340px] overflow-y-auto">
            {bellNotifs.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Bell className="mx-auto mb-2 text-gray-200" size={28} />
                <p className="text-xs font-medium">You're all caught up!</p>
                <p className="text-[10px] mt-0.5 text-gray-300">Important notifications will appear here</p>
              </div>
            ) : (
              bellNotifs.map(n => (
                <BellItem
                  key={n.id}
                  notif={n}
                  onRead={markRead}
                  onDelete={deleteNotif}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Provider ───────────────────────────────────────────────────────────────
let _nextId = 1;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [bellNotifs, setBellNotifs] = useState([]);

  // Fetch DB notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setBellNotifs([]);
      return;
    }
    try {
      const res = await fetch(`/api/notifications/${user.id}`);
      if (res.ok) {
        setBellNotifs(await res.json());
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, [user]);

  // Polling mechanism
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const dismissToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  /**
   * notify() triggers a LOCAL toast. 
   * It no longer pushes to bellNotifs because backend handles the DB insertion.
   */
  const notify = useCallback(({ type = 'info', title, message, event = '' }) => {
    const id = _nextId++;
    const entry = { id, type, title, message, createdAt: new Date() };
    setToasts(prev => [...prev.slice(-4), entry]);
    
    // Always instantly fetch DB notifications whenever the frontend triggers ANY action
    // to guarantee the bell icon is perfectly in sync with the user's perspective.
    setTimeout(() => fetchNotifications(), 500); 
  }, [fetchNotifications]);

  // Single tap → mark read (DB + Local optimistic update)
  const markRead = useCallback(async (id) => {
    setBellNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Triple tap → delete (DB + Local optimistic update)
  const deleteNotif = useCallback(async (id) => {
    setBellNotifs(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Mark all read (keep in list, DB + Local)
  const markAllRead = useCallback(async () => {
    if (!user) return;
    setBellNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await fetch(`/api/notifications/user/${user.id}/read-all`, { method: 'PUT' });
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // Clear all (DB + Local)
  const clearAll = useCallback(async () => {
    if (!user) return;
    setBellNotifs([]);
    try {
      await fetch(`/api/notifications/user/${user.id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{ 
      notify, 
      bellNotifs, 
      markRead, 
      deleteNotif, 
      markAllRead, 
      clearAll,
      refreshNotifications: fetchNotifications
    }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
}
