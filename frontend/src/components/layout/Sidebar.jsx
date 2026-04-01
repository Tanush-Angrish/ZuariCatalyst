import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, PlusCircle, LayoutList, UserCog, Settings, Wrench, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar({ isMobile }) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getLinks = () => {
    const common = [
      { name: 'Community Hub', path: '/community-hub', icon: Users },
      { name: 'Projects', path: '/dashboard/projects', icon: LayoutList },
      { name: 'Leaderboard', path: '/dashboard/leaderboard', icon: Trophy },
    ];

    if (!user) return common;

    switch (user.role) {
      case 'Superadmin':
      case 'Central Team':
        return [
          { name: 'Review Queue', path: '/dashboard', icon: LayoutList },
          { name: 'User Management', path: '/settings/users', icon: UserCog },
          { name: 'Template Access', path: '/settings/access', icon: Settings },
          { name: 'Template Config', path: '/settings/templates', icon: Wrench },
          ...common
        ];
      case 'Org Admin':
        return [
          { name: 'Assigned Ideas', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Team Ideas', path: '/dashboard/team-ideas', icon: Users },
          ...common
        ];
      case 'Employee':
        return [
          { name: 'Submit Idea', path: '/dashboard', icon: PlusCircle },
          { name: 'My Ideas', path: '/dashboard/my-ideas', icon: LayoutDashboard },
          ...common
        ];
      default:
        return common;
    }
  };

  const links = getLinks();

  return (
    <aside
      className={cn(
        "bg-white relative transition-all duration-300 ease-in-out flex flex-col",
        isMobile ? "w-full min-h-full border-r-0" : "border-r h-full hidden md:flex",
        !isMobile && isCollapsed ? "w-[72px] items-center px-2 py-4" : "w-72 p-4"
      )}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* Collapse Toggle Button */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -right-3 top-6 bg-white border border-gray-200 shadow-sm rounded-full p-1 z-10 transition-all duration-200 text-gray-500 hover:text-brand-blue hover:bg-blue-50",
            isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
          )}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      <div className={cn("flex flex-col gap-2 w-full", isCollapsed && "items-center")}>
        <div className={cn("py-2 text-xs font-semibold uppercase text-gray-400 tracking-wider transition-opacity duration-200", isCollapsed && "opacity-0 hidden")}>
          Menu
        </div>

        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === '/dashboard'}
              title={isCollapsed ? link.name : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-lg transition-colors overflow-hidden shrink-0",
                  isCollapsed ? "justify-center p-3 w-12 h-12" : "gap-3 px-3 py-2 w-full",
                  isActive
                    ? "bg-blue-50 text-brand-blue"
                    : "text-gray-600 hover:bg-gray-50 hover:text-brand-black"
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{link.name}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* AI Branding */}
      <div className={cn("mt-auto pt-6 transition-all duration-300 w-full", isCollapsed ? "px-0" : "px-3")}>
        <div className={cn("rounded-xl bg-gradient-to-br from-brand-blue/5 to-purple-50 border border-brand-blue/10 overflow-hidden transition-all duration-300 flex items-center justify-center", isCollapsed ? "p-3 aspect-square" : "p-3")}>
          {isCollapsed ? (
            <span className="h-2 w-2 rounded-full bg-brand-blue animate-pulse shrink-0" title="AI Smart Insights Active" />
          ) : (
            <div>
              <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest flex items-center gap-1.5 mb-1 whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-blue animate-pulse shrink-0" />
                Smart Insights
              </p>
              <p className="text-[11px] text-gray-500 font-medium leading-tight">
                Powered by AI for faster decision making.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
