import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, ChevronDown, LayoutDashboard, UserCog, Users } from 'lucide-react';
import { NotificationBell } from '../../context/NotificationContext';
import EmployeeGamificationBar from './EmployeeGamificationBar';
import { api } from '../../services/api';

// ─── Inline UserAvatar ────────────────────────────────────────────────────────
function UserAvatar({ user, size = 8 }) {
  const sizeClass = `h-${size} w-${size}`;
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (user?.profilePhotoUrl) {
    return (
      <img
        src={api.getFileUrl(user.profilePhotoUrl)}
        alt={user.name}
        className={`${sizeClass} rounded-full object-cover border-2 border-gray-100 shadow-sm`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-brand-blue to-blue-400 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}

// ─── Role display helper ──────────────────────────────────────────────────────
const ROLE_DISPLAY = {
  'Employee': 'Employee View',
  'Org Admin': 'Org Admin View',
  'Superadmin': 'Central Team View',
};
const ROLE_ICONS = {
  'Employee': LayoutDashboard,
  'Org Admin': UserCog,
  'Superadmin': Users,
};

export default function Navbar({ onMenuToggle }) {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const roleMenuRef = useRef(null);

  const handleLogoClick = (e) => {
    if (user) {
      e.preventDefault();
      window.location.reload();
    }
  };

  // Close role menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setRoleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const hasMultipleRoles = roles.length > 1;
  const currentRoleLabel = ROLE_DISPLAY[user?.role] || user?.role;

  const handleRoleSwitch = async (role) => {
    if (role === user?.role || switching) return;
    setSwitching(true);
    setRoleMenuOpen(false);
    try {
      await switchRole(role);
      // Navigate to the new dashboard root after role switch
      navigate('/dashboard');
    } catch (err) {
      console.error('Role switch failed:', err);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b bg-white px-6 md:px-10 shadow-md gap-6">
      <div className="flex items-center gap-4 shrink-0">
        {user && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-6 w-6" />
          </Button>
        )}

        {/* Brand: Zuari Logo | Catalyst */}
        <Link to="/" onClick={handleLogoClick} className="flex items-center gap-3">
          <img
            src="https://www.zuariindustries.in/assets/web/img/logo/zuari_logo.png"
            alt="Zuari Industries"
            className="h-7 object-contain shrink-0"
          />
          <div className="h-7 w-px bg-gray-200 shrink-0" />
          <span
            className="text-[22px] font-extrabold tracking-tight text-[#1d3368] leading-none"
            style={{ fontFamily: 'var(--fd)' }}
          >
            Catalyst
          </span>
        </Link>
      </div>

      {/* Gamification bar — only for active Employee view */}
      {user?.role === 'Employee' && (
        <EmployeeGamificationBar userId={user.id} />
      )}

      <div className="flex items-center gap-2 shrink-0">
        {user ? (
          <div className="flex items-center gap-3">

            {/* ── Role Toggle (multi-role users only) ── */}
            {hasMultipleRoles && (
              <div className="relative" ref={roleMenuRef}>
                <button
                  onClick={() => setRoleMenuOpen(o => !o)}
                  disabled={switching}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-blue/30 bg-brand-blue/5 text-brand-blue text-xs font-semibold hover:bg-brand-blue/10 transition-colors"
                >
                  {switching
                    ? <span className="h-3 w-3 rounded-full border-2 border-brand-blue border-t-transparent animate-spin" />
                    : null
                  }
                  <span>{switching ? 'Switching...' : currentRoleLabel}</span>
                  <ChevronDown size={12} className={`transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {roleMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-50 animate-modal-in">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Switch View</p>
                    {roles.map(role => {
                      const Icon = ROLE_ICONS[role] || LayoutDashboard;
                      const isActive = role === user.role;
                      return (
                        <button
                          key={role}
                          onClick={() => handleRoleSwitch(role)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-brand-blue/5 text-brand-blue'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon size={15} className={isActive ? 'text-brand-blue' : 'text-gray-400'} />
                          {ROLE_DISPLAY[role] || role}
                          {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-blue" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── User Name + Avatar (click → Profile) ── */}
            <Link
              to="/dashboard/profile"
              className="hidden md:flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              title="View Profile"
            >
              <div className="flex flex-col items-end text-sm">
                <span className="font-semibold text-brand-black leading-tight">{user.name}</span>
                <span className="text-xs text-gray-400 leading-tight">{user.employeeId ? `ID: ${user.employeeId}` : (user.role === 'Superadmin' ? 'Central Team' : user.role)}</span>
              </div>
              <UserAvatar user={user} size={9} />
            </Link>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Logout */}
            <Button variant="ghost" size="icon" onClick={logout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Link to="/">
            <Button>Login</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
