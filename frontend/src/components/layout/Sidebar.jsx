import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, PlusCircle, LayoutList, UserCog, Settings, Wrench, Trophy } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar({ isMobile }) {
  const { user } = useAuth();

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
    <aside className={cn(
      "border-r bg-white p-4",
      isMobile ? "w-full" : "w-72 min-h-[calc(100vh-4rem)] hidden md:block"
    )}>
      <div className="flex flex-col gap-2">
        <div className="py-2 text-xs font-semibold uppercase text-gray-400 tracking-wider">
          Menu
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === '/dashboard'}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-brand-blue"
                    : "text-gray-600 hover:bg-gray-50 hover:text-brand-black"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {link.name}
            </NavLink>
          );
        })}
      </div>

      {/* AI Branding */}
      <div className="mt-auto pt-6 px-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-brand-blue/5 to-purple-50 border border-brand-blue/10">
          <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-blue animate-pulse" />
            Smart Insights
          </p>
          <p className="text-[11px] text-gray-500 font-medium leading-tight">
            Powered by Gemini AI for faster decision making.
          </p>
        </div>
      </div>
    </aside>
  );
}
