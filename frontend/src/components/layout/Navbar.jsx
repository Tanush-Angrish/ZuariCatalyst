import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          {/* Hexagon Idea Icon for Logo */}
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-brand-blue">Zuari Hive</span>
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
