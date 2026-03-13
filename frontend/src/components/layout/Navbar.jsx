import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { LogOut, Lightbulb, Menu } from 'lucide-react';

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
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
        <Link to="/" className="flex items-center gap-2">
          {/* Idea Bulb Icon for Logo */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue text-white shadow-sm">
            <Lightbulb size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-brand-blue">Zuari Catalyst</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end text-sm md:flex">
              <span className="font-semibold text-brand-black">{user.name}</span>
              <span className="text-xs text-brand-blue">{user.role}</span>
            </div>
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
