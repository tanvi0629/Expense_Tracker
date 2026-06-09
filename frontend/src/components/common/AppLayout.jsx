// src/components/common/AppLayout.jsx
import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import AIAssistant from './AIAssistant'
import { SpendlyLogo, SpendlyIcon } from './SpendlyLogo'
import api from '../../services/api'
import { differenceInDays } from 'date-fns'
import {
  LayoutDashboard, Receipt, TrendingUp, RefreshCw,
  Target, Bell, Sun, Moon, LogOut, Menu,
  Settings, Mail, BarChart2
} from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/expenses',   icon: Receipt,         label: 'Expenses'       },
  { to: '/income',     icon: TrendingUp,      label: 'Income'         },
  { to: '/recurring',  icon: RefreshCw,       label: 'Recurring'      },
  { to: '/goals',      icon: Target,          label: 'Goals'          },
  { to: '/alerts',     icon: Bell,            label: 'Spending Alerts' },
  { to: '/heatmap',    icon: BarChart2,       label: 'Heatmap'        },
]

const settingsItems = [
  { to: '/settings/currency', icon: Settings, label: 'Currency'      },
  { to: '/settings/reports',  icon: Mail,     label: 'Email Reports' },
]

async function countUnread(readIds) {
  let count = 0
  try {
    const [alertRes, recurRes] = await Promise.all([
      api.get('/alerts'),
      api.get('/recurring'),
    ])
    const alerts = alertRes.data.alerts || []
    count += alerts.filter(a =>
      (a.level === 'exceeded' || a.level === 'critical') &&
      !readIds.has(`budget-exceeded-${a.category}`) &&
      !readIds.has(`budget-critical-${a.category}`)
    ).length

    const recurring = recurRes.data.recurring || []
    const now = new Date()
    count += recurring.filter(r => {
      if (!r.is_active) return false
      const days = differenceInDays(new Date(r.next_due_date), now)
      return days <= 1 &&
        !readIds.has(`recurring-due-${r.id}`) &&
        !readIds.has(`recurring-tomorrow-${r.id}`)
    }).length
  } catch (_) {}
  return count
}

export default function AppLayout() {
  const { user, dbUser, logout } = useAuth()
  const { isDark, toggle }       = useTheme()
  const navigate                 = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const readIds = new Set(JSON.parse(localStorage.getItem('read_notifications') || '[]'))
    countUnread(readIds).then(setNotifCount)
    const interval = setInterval(() => {
      countUnread(readIds).then(setNotifCount)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => { await logout(); navigate('/login') }

  const avatarUrl   = user?.photoURL || null
  const displayName = dbUser?.name || user?.displayName || user?.email?.split('@')[0] || 'User'
  const initials    = displayName.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()

  const NavItem = ({ to, icon: Icon, label, badge }) => (
    <NavLink
      to={to}
      onClick={() => setMobileOpen(false)}
      className={({ isActive }) => clsx(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
      )}
    >
      <div className="relative flex-shrink-0">
        <Icon size={18} />
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      {label}
    </NavLink>
  )

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <SpendlyLogo size="md" />
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => <NavItem key={item.to} {...item} />)}
          <NavItem to="/notifications" icon={Bell} label="Notifications" badge={notifCount} />

          <div className="pt-4 pb-1">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Settings</p>
          </div>
          {settingsItems.map(item => <NavItem key={item.to} {...item} />)}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-2">
          <div className="flex items-center gap-3 px-2 py-2">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
              : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg,#534AB7,#22C55E)' }}>
                  {initials}
                </div>
              )
            }
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || user?.phoneNumber || ''}</p>
            </div>
          </div>
          <button onClick={toggle} className="btn-ghost w-full flex items-center gap-2 text-sm">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={handleLogout}
            className="btn-ghost w-full flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <button onClick={() => setMobileOpen(true)} className="btn-ghost p-2"><Menu size={20} /></button>
          <SpendlyLogo size="sm" />
          <div className="flex items-center gap-1">
            <NavLink to="/notifications" className="relative btn-ghost p-2">
              <Bell size={18} />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </NavLink>
            <button onClick={toggle} className="btn-ghost p-2">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <AIAssistant />
    </div>
  )
}
