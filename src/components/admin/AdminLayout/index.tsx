import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { cn } from '@/utils/format';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/admin',
    end: true,
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: 'Migration Pairs',
    to: '/admin/migration-pairs',
    end: false,
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  {
    label: 'Plans',
    to: '/admin/plans',
    end: false,
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    label: 'Audit & Logs',
    to: '/admin/audit',
    end: false,
    icon: (
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export const AdminLayout: React.FC = () => (
  <div className="min-h-screen bg-bg">
    <Navbar variant="admin" />
    <div className="flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-[calc(100vh-64px)] bg-white border-r border-border flex-shrink-0 sticky top-16 self-start">
        <nav className="p-3 space-y-0.5 flex-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-light'
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden w-full fixed bottom-0 z-40 bg-white border-t border-border flex">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
                isActive ? 'text-blue-700' : 'text-text-tertiary'
              )
            }
          >
            {item.icon}
            <span className="truncate">{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </div>

      {/* Page content */}
      <main className="flex-1 p-6 pb-20 md:pb-6 min-w-0">
        <Outlet />
      </main>
    </div>
  </div>
);
