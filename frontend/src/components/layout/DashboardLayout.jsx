import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

export default function DashboardLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Close menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-full flex flex-col bg-gray-50 relative">
      <Navbar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#fdfdfd]">
          <div key={location.pathname} className="w-full max-w-[1600px] animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white flex flex-col transform transition-all duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none pointer-events-none'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b shrink-0">
          <span className="text-xl font-bold text-[#1d3368] pl-2">Navigation</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="hover:bg-gray-100/50"
          >
            <X className="h-6 w-6 text-gray-500" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar isMobile />
        </div>
      </div>
    </div>
  );
}
