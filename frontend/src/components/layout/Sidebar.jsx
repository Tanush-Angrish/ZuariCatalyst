import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, PlusCircle, LayoutList, UserCog, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Sidebar() {
  const { user } = useAuth();

  const getLinks = () => {
    const common = [
      { name: 'Projects', path: '/dashboard/projects', icon: Users },
    ];

    if (!user) return common;

    switch (user.role) {
      case 'Superadmin':
        return [
          { name: 'Review Queue', path: '/dashboard', icon: LayoutList },
          { name: 'User Management', path: '/dashboard/users', icon: UserCog },
          { name: 'Template Access', path: '/dashboard/template-access', icon: Settings },
          ...common
        ];
      case 'Org Admin':
        return [
          { name: 'Assigned Ideas', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Team Ideas', path: '/dashboard/team', icon: Users },
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
    <aside className="w-64 border-r bg-white min-h-[calc(100vh-4rem)] p-4 hidden md:block">
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
    </aside>
  );
}
