// src/components/notifications/NotificationCenter.jsx
import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import {
  Bell, BellOff, X, Check, CheckCheck, AlertTriangle,
  Calendar, TrendingUp, RefreshCw, Wallet, Target,
  ChevronRight, Loader2, Filter
} from 'lucide-react'
import { formatDistanceToNow, format, differenceInDays } from 'date-fns'
import clsx from 'clsx'
import toast from 'react-hot-toast'

// ── Notification types ────────────────────────────────────────────────────
const TYPES = {
  budget_exceeded:  { icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-200 dark:border-red-800',     label: 'Budget Alert'   },
  budget_warning:   { icon: AlertTriangle, color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', label: 'Budget Warning' },
  recurring_due:    { icon: RefreshCw,     color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-200 dark:border-blue-800',   label: 'Due Today'      },
  recurring_soon:   { icon: Calendar,      color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20',border: 'border-purple-200 dark:border-purple-800',label: 'Coming Soon'   },
  goal_milestone:   { icon: Target,        color: 'text-brand-500',  bg: 'bg-brand-50 dark:bg-brand-900/20', border: 'border-brand-200 dark:border-brand-800', label: 'Goal Update'    },
  goal_completed:   { icon: Target,        color: 'text-brand-500',  bg: 'bg-brand-50 dark:bg-brand-900/20', border: 'border-brand-200 dark:border-brand-800', label: 'Goal Reached!'  },
  income_reminder:  { icon: TrendingUp,    color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', label: 'Income'         },
  monthly_summary:  { icon: Wallet,        color: 'text-slate-500',  bg: 'bg-slate-50 dark:bg-slate-800',    border: 'border-slate-200 dark:border-slate-700', label: 'Summary'        },
}

// ── Generate notifications from app data ──────────────────────────────────
async function generateNotifications() {
  const notifications = []
  const now = new Date()

  try {
    // 1. Spending alerts — budget warnings
    try {
      const { data: alertData } = await api.get('/alerts')
      for (const alert of alertData.alerts || []) {
        if (alert.level === 'exceeded') {
          notifications.push({
            id:      `budget-exceeded-${alert.category}`,
            type:    'budget_exceeded',
            title:   `${alert.category} budget exceeded!`,
            message: `You've spent ₹${Math.round(alert.spent).toLocaleString()} of your ₹${Math.round(alert.budget).toLocaleString()} ${alert.category} budget (${alert.percent}%).`,
            time:    new Date(),
            read:    false,
            priority: 1,
          })
        } else if (alert.level === 'critical') {
          notifications.push({
            id:      `budget-critical-${alert.category}`,
            type:    'budget_warning',
            title:   `${alert.category} budget at ${alert.percent}%`,
            message: `Only ₹${Math.round(alert.remaining).toLocaleString()} remaining in your ${alert.category} budget this month.`,
            time:    new Date(),
            read:    false,
            priority: 2,
          })
        } else if (alert.level === 'warning') {
          notifications.push({
            id:      `budget-warning-${alert.category}`,
            type:    'budget_warning',
            title:   `${alert.category} budget at ${alert.percent}%`,
            message: `₹${Math.round(alert.remaining).toLocaleString()} remaining in your ${alert.category} budget.`,
            time:    new Date(),
            read:    false,
            priority: 3,
          })
        }
      }
    } catch (_) {}

    // 2. Recurring expenses — due today or soon
    try {
      const { data: recurData } = await api.get('/recurring')
      for (const item of recurData.recurring || []) {
        if (!item.is_active) continue
        const dueDate  = new Date(item.next_due_date)
        const daysLeft = differenceInDays(dueDate, now)

        if (daysLeft <= 0) {
          notifications.push({
            id:      `recurring-due-${item.id}`,
            type:    'recurring_due',
            title:   `${item.title} is due today!`,
            message: `₹${parseFloat(item.amount).toLocaleString()} ${item.frequency} payment is due. Go to Recurring to generate it.`,
            time:    dueDate,
            read:    false,
            priority: 1,
            link:    '/recurring',
          })
        } else if (daysLeft === 1) {
          notifications.push({
            id:      `recurring-tomorrow-${item.id}`,
            type:    'recurring_soon',
            title:   `${item.title} due tomorrow`,
            message: `₹${parseFloat(item.amount).toLocaleString()} ${item.frequency} payment due on ${format(dueDate, 'dd MMM')}.`,
            time:    dueDate,
            read:    false,
            priority: 2,
            link:    '/recurring',
          })
        } else if (daysLeft <= 3) {
          notifications.push({
            id:      `recurring-soon-${item.id}`,
            type:    'recurring_soon',
            title:   `${item.title} in ${daysLeft} days`,
            message: `₹${parseFloat(item.amount).toLocaleString()} ${item.frequency} payment due on ${format(dueDate, 'dd MMM yyyy')}.`,
            time:    dueDate,
            read:    false,
            priority: 3,
            link:    '/recurring',
          })
        }
      }
    } catch (_) {}

    // 3. Savings goals — milestones
    try {
      const { data: goalsData } = await api.get('/goals')
      for (const goal of goalsData.goals || []) {
        const current = parseFloat(goal.current_amount)
        const target  = parseFloat(goal.target_amount)
        const percent = Math.round((current / target) * 100)

        if (goal.is_completed) {
          notifications.push({
            id:      `goal-complete-${goal.id}`,
            type:    'goal_completed',
            title:   `🎉 Goal "${goal.title}" completed!`,
            message: `Congratulations! You've saved ₹${target.toLocaleString()} for ${goal.title}.`,
            time:    new Date(goal.updated_at),
            read:    false,
            priority: 2,
            link:    '/goals',
          })
        } else if (percent >= 75 && percent < 100) {
          notifications.push({
            id:      `goal-milestone-${goal.id}`,
            type:    'goal_milestone',
            title:   `${goal.emoji} ${goal.title} is ${percent}% funded!`,
            message: `You're almost there! ₹${Math.round(target - current).toLocaleString()} more to reach your goal.`,
            time:    new Date(goal.updated_at),
            read:    false,
            priority: 3,
            link:    '/goals',
          })
        } else if (percent >= 50 && percent < 75) {
          notifications.push({
            id:      `goal-half-${goal.id}`,
            type:    'goal_milestone',
            title:   `${goal.emoji} Halfway to "${goal.title}"`,
            message: `You've saved ₹${Math.round(current).toLocaleString()} of ₹${Math.round(target).toLocaleString()}. Keep going!`,
            time:    new Date(goal.updated_at),
            read:    false,
            priority: 4,
            link:    '/goals',
          })
        }

        // Deadline approaching
        if (goal.deadline && !goal.is_completed) {
          const deadline  = new Date(goal.deadline)
          const daysToDeadline = differenceInDays(deadline, now)
          if (daysToDeadline >= 0 && daysToDeadline <= 7) {
            notifications.push({
              id:      `goal-deadline-${goal.id}`,
              type:    'goal_milestone',
              title:   `${goal.emoji} ${goal.title} deadline in ${daysToDeadline} days`,
              message: `Still need ₹${Math.round(target - current).toLocaleString()} more. Add funds to stay on track!`,
              time:    new Date(),
              read:    false,
              priority: 2,
              link:    '/goals',
            })
          }
        }
      }
    } catch (_) {}

  } catch (_) {}

  // Sort by priority then time
  return notifications.sort((a, b) => a.priority - b.priority || b.time - a.time)
}

// ── Notification Bell Button (for AppLayout) ─────────────────────────────
export function NotificationBell({ onClick, count }) {
  return (
    <button
      onClick={onClick}
      className="relative btn-ghost p-2"
      title="Notifications"
    >
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}

// ── Main Notification Center Page ─────────────────────────────────────────
export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]   = useState(true)
  const [readIds, setReadIds]   = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('read_notifications') || '[]')) }
    catch { return new Set() }
  })
  const [filter, setFilter] = useState('all') // all | unread | budget | recurring | goals

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const notifs = await generateNotifications()
      setNotifications(notifs)
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const markRead = (id) => {
    const next = new Set([...readIds, id])
    setReadIds(next)
    localStorage.setItem('read_notifications', JSON.stringify([...next]))
  }

  const markAllRead = () => {
    const next = new Set(notifications.map(n => n.id))
    setReadIds(next)
    localStorage.setItem('read_notifications', JSON.stringify([...next]))
    toast.success('All notifications marked as read')
  }

  const isRead = (id) => readIds.has(id)
  const unreadCount = notifications.filter(n => !isRead(n.id)).length

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !isRead(n.id)
    if (filter === 'budget') return n.type.startsWith('budget')
    if (filter === 'recurring') return n.type.startsWith('recurring')
    if (filter === 'goals') return n.type.startsWith('goal')
    return true
  })

  const FILTERS = [
    { key: 'all',       label: 'All' },
    { key: 'unread',    label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { key: 'budget',    label: 'Budget' },
    { key: 'recurring', label: 'Recurring' },
    { key: 'goals',     label: 'Goals' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetch} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-primary flex items-center gap-2 text-sm">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              filter === f.key
                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-brand-300'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-3">
            <BellOff size={24} className="text-slate-400" />
          </div>
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {filter === 'all'
              ? 'Add expenses, set budgets, and create goals to get notifications'
              : 'Try changing the filter above'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(notif => {
            const style = TYPES[notif.type] || TYPES.monthly_summary
            const Icon  = style.icon
            const read  = isRead(notif.id)

            return (
              <div
                key={notif.id}
                className={clsx(
                  'card p-4 border transition-all',
                  read ? 'opacity-60' : style.bg,
                  read ? 'border-slate-100 dark:border-slate-700' : style.border
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                    read ? 'bg-slate-100 dark:bg-slate-700' : style.bg
                  )}>
                    <Icon size={17} className={read ? 'text-slate-400' : style.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={clsx('font-semibold text-sm', read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white')}>
                            {notif.title}
                          </p>
                          {!read && (
                            <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                          )}
                          <span className={clsx('badge text-xs', style.bg, style.color)}>
                            {style.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1.5">
                          {formatDistanceToNow(new Date(notif.time), { addSuffix: true })}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {notif.link && (
                          <a href={notif.link}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600">
                            <ChevronRight size={14} />
                          </a>
                        )}
                        {!read && (
                          <button
                            onClick={() => markRead(notif.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-brand-500"
                            title="Mark as read"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
