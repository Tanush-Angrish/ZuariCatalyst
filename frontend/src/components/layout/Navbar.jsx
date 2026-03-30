import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Home } from 'lucide-react';
import { NotificationBell } from '../../context/NotificationContext';
import EmployeeGamificationBar from './EmployeeGamificationBar';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogoClick = (e) => {
    // Only intercept if we are already logged in to prevent blocking normal landing page logic if logged out
    if (user) {
      e.preventDefault();
      setShowConfirm(true);
    }
  };

  const cancelNavigation = () => {
    setShowConfirm(false);
  };

  const confirmNavigation = () => {
    setShowConfirm(false);
    navigate('/');
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

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={cancelNavigation}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-modal-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="p-3.5 bg-[#F4F6FB] text-brand-blue border border-brand-blue/10 rounded-full shadow-sm">
                  <Home size={28} />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-center text-gray-900 mb-2 leading-tight">
                Return to Home?
              </h2>
              <p className="text-sm font-medium text-center text-gray-500 mb-8 leading-relaxed">
                Are you sure you want to navigate away from your dashboard to the home page?
              </p>
              
              <div className="flex justify-end items-center gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={cancelNavigation} 
                  className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-semibold shadow-sm w-24"
                >
                  No
                </Button>
                <Button 
                  onClick={confirmNavigation} 
                  className="bg-brand-blue hover:bg-[#4a3ddb] text-white font-semibold shadow-sm w-24"
                >
                  Yes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
