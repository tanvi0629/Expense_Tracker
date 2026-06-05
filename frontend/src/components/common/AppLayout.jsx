// src/components/common/AppLayout.jsx
import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import AIAssistant from './AIAssistant'
import {
  LayoutDashboard,
  Receipt,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  TrendingUp,
  User,
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/expenses',  icon: Receipt,         label: 'Expenses'  },
  { to: '/income',    icon: TrendingUp,      label: 'Income'    },
  { to: '/recurring',          icon: RotateCcw,       label: 'Recurring'  },
  { to: '/settings/currency',  icon: Settings,        label: 'Currency'   },

]

export default function AppLayout() {
  const { user, dbUser, logout } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const avatarUrl = user?.photoURL || null
  const displayName = dbUser?.name || user?.displayName || user?.email?.split('@')[0] || 'User'
  const initials = displayName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="font-display text-xl font-bold text-slate-900 dark:text-white">Spendly</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-2">
          <div className="flex items-center gap-3 px-2 py-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || user?.phoneNumber || ''}</p>
            </div>
          </div>

          <button onClick={toggle} className="btn-ghost w-full flex items-center gap-2 text-sm">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>

          <button
            onClick={handleLogout}
            className="btn-ghost w-full flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <button onClick={() => setMobileOpen(true)} className="btn-ghost p-2">
            <Menu size={20} />
          </button>
          <span className="font-display font-bold text-slate-900 dark:text-white">Spendly</span>
          <button onClick={toggle} className="btn-ghost p-2">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* AI Assistant — floats on all pages */}
      <AIAssistant />
    </div>
  )
}