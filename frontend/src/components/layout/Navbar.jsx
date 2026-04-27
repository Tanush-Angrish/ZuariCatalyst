import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { NotificationBell } from '../../context/NotificationContext';
import EmployeeGamificationBar from './EmployeeGamificationBar';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogoClick = (e) => {
    // Refresh the page if logged in per user request
    if (user) {
      e.preventDefault();
      window.location.reload();
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

      {user?.role === 'Employee' && (
        <EmployeeGamificationBar userId={user.id} />
      )}

      <div className="flex items-center gap-2 shrink-0">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end text-sm md:flex">
              <span className="font-semibold text-brand-black">{user.name}</span>
              <span className="text-xs text-brand-blue">{user.role}</span>
            </div>
            {/* Notification Bell */}
            <NotificationBell />
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
