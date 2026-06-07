// src/components/reports/WeeklyReports.jsx
import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import {
  Mail, Send, Settings, Check, Loader2,
  Calendar, Bell, BellOff, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const DAYS = [
  { value: 'monday',    label: 'Monday'    },
  { value: 'tuesday',   label: 'Tuesday'   },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday',  label: 'Thursday'  },
  { value: 'friday',    label: 'Friday'    },
  { value: 'saturday',  label: 'Saturday'  },
  { value: 'sunday',    label: 'Sunday'    },
]

export default function WeeklyReports() {
  const { user, dbUser } = useAuth()
  const [settings, setSettings]   = useState({ is_enabled: true, send_day: 'monday' })
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [sending, setSending]     = useState(false)
  const [lastSent, setLastSent]   = useState(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/reports/settings')
        if (data.settings) {
          setSettings({
            is_enabled: data.settings.is_enabled,
            send_day:   data.settings.send_day,
          })
          setLastSent(data.settings.last_sent_at)
        }
      } catch (_) {}
      finally { setLoading(false) }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data } = await api.post('/reports/settings', settings)
      setSettings({
        is_enabled: data.settings.is_enabled,
        send_day:   data.settings.send_day,
      })
      toast.success('Report settings saved!')
    } catch (_) {
      toast.error('Failed to save settings')
    } finally { setSaving(false) }
  }

  const handleSendNow = async () => {
    if (!user?.email && !dbUser?.email) {
      return toast.error('No email address found. Please sign in with email.')
    }
    setSending(true)
    try {
      const { data } = await api.post('/reports/send')
      toast.success(data.message)
      setLastSent(new Date().toISOString())
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send report')
    } finally { setSending(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
    )
  }

  const email = dbUser?.email || user?.email

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Weekly Email Reports</h1>
        <p className="text-slate-500 text-sm mt-1">
          Get a summary of your finances delivered to your inbox every week
        </p>
      </div>

      {/* Email address */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
            <Mail size={18} className="text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Reports will be sent to</p>
            <p className="font-semibold text-slate-900 dark:text-white">
              {email || 'No email address — sign in with email to use this feature'}
            </p>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              settings.is_enabled
                ? 'bg-brand-50 dark:bg-brand-900/20'
                : 'bg-slate-100 dark:bg-slate-700'
            )}>
              {settings.is_enabled
                ? <Bell size={18} className="text-brand-500" />
                : <BellOff size={18} className="text-slate-400" />
              }
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Weekly Reports</p>
              <p className="text-xs text-slate-500">
                {settings.is_enabled ? 'Enabled — you will receive weekly summaries' : 'Disabled'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, is_enabled: !s.is_enabled }))}
            className={clsx(
              'relative w-12 h-6 rounded-full transition-colors duration-200',
              settings.is_enabled ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
            )}
          >
            <div className={clsx(
              'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200',
              settings.is_enabled ? 'translate-x-7' : 'translate-x-1'
            )} />
          </button>
        </div>
      </div>

      {/* Day selector */}
      {settings.is_enabled && (
        <div className="card p-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-slate-500" />
            <p className="font-semibold text-slate-900 dark:text-white text-sm">Send every</p>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {DAYS.map(day => (
              <button
                key={day.value}
                onClick={() => setSettings(s => ({ ...s, send_day: day.value }))}
                className={clsx(
                  'py-2 px-1 rounded-xl text-xs font-medium transition-all',
                  settings.send_day === day.value
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                )}
              >
                {day.label.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* What's included */}
      <div className="card p-5">
        <p className="font-semibold text-slate-900 dark:text-white text-sm mb-3">What's included in the report</p>
        <div className="space-y-2">
          {[
            'Total expenses for the week',
            'Total income for the week',
            'Savings summary',
            'Spending breakdown by category',
            '5 most recent transactions',
            'Budget usage overview',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Check size={14} className="text-brand-500 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Last sent */}
      {lastSent && (
        <div className="card p-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <RefreshCw size={14} />
            Last sent: {new Date(lastSent).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          onClick={handleSendNow}
          disabled={sending || !email}
          className="btn-secondary flex items-center gap-2"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? 'Sending...' : 'Send Now'}
        </button>
      </div>

      {!email && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
          ⚠️ No email found. Sign in with email/password or Google to use email reports.
        </p>
      )}
    </div>
  )
}
