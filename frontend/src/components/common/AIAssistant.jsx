// src/components/common/AIAssistant.jsx — Groq AI version
import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  MessageCircle, X, Send, Bot, User, Loader2,
  Sparkles, TrendingDown, PiggyBank, Lightbulb
} from 'lucide-react'
import clsx from 'clsx'

const QUICK_QUESTIONS = [
  { icon: TrendingDown, text: 'How can I reduce my expenses?' },
  { icon: PiggyBank,    text: 'How much should I save monthly?' },
  { icon: Lightbulb,   text: 'Tips to stick to my budget?' },
  { icon: Sparkles,    text: 'How to track expenses effectively?' },
]

const SYSTEM_MESSAGE = `You are Penny, a friendly AI financial assistant built into Spendly — a personal expense tracking app.

Your ONLY purpose is to help users with:
1. Personal finance advice (saving money, budgeting, reducing expenses)
2. How to use the Spendly app (adding expenses, setting budgets, exporting CSV, using the dashboard)
3. Understanding financial concepts (savings rate, budget allocation, expense categories)
4. Tips for better money management

Spendly app features:
- Dashboard: Shows total expenses, income/budget, savings, and spending charts
- Expenses page: Add, edit, delete expenses with categories (Food, Transport, Shopping, Entertainment, Bills, Health, Education, Other)
- Monthly Budget: Set a budget to track spending vs income
- Export CSV: Download all expenses as a spreadsheet
- Dark/Light mode toggle
- Google, Email, and Phone number login

STRICT RULES:
- ONLY answer questions about personal finance, budgeting, saving money, or the Spendly app
- If asked about anything else, politely say: "I am Penny, your financial assistant! I can only help with finance and Spendly app questions."
- Keep answers concise, friendly, and actionable (3-5 sentences or a short list)
- Use Indian Rupee Rs as currency
- Always be encouraging and positive`

async function callGroq(messages, apiKey) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: messages,
      max_tokens: 300,
      temperature: 0.7,
    })
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error?.message || `API error: ${res.status}`)
  }

  return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'
}

export default function AIAssistant({ expenseStats }) {
  const { dbUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hi${dbUser?.name ? ` ${dbUser.name.split(' ')[0]}` : ''}! I am Penny, your AI financial assistant.\n\nI can help you with saving tips, budgeting advice, and how to use Spendly. What would you like to know?`,
      time: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const sendMessage = async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return

    setInput('')

    // Add user message to display
    setMessages(prev => [...prev, { role: 'user', text: userText, time: new Date() }])
    setLoading(true)

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY
      if (!apiKey) throw new Error('VITE_GROQ_API_KEY is missing in your .env file')

      // Build context about user finances
      const userContext = expenseStats
        ? `\n\n[User financial context: Total expenses this month: Rs.${expenseStats.total?.toFixed(0) || 0}, Number of transactions: ${expenseStats.count || 0}, Monthly budget: Rs.${dbUser?.monthly_budget || 0}]`
        : ''

      // Build message history for Groq (keeps conversation context)
      const newHistory = [
        ...chatHistory,
        { role: 'user', content: userText + (chatHistory.length === 0 ? userContext : '') }
      ]

      const groqMessages = [
        { role: 'system', content: SYSTEM_MESSAGE + userContext },
        ...newHistory
      ]

      const reply = await callGroq(groqMessages, apiKey)

      // Save to history for multi-turn conversation
      setChatHistory([
        ...newHistory,
        { role: 'assistant', content: reply }
      ])

      setMessages(prev => [...prev, { role: 'assistant', text: reply, time: new Date() }])
    } catch (err) {
      console.error('Penny error:', err.message)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Error: ${err.message}`,
        time: new Date(),
        error: true
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm animate-scale-in">
          <div className="card shadow-2xl flex flex-col overflow-hidden" style={{ height: '480px' }}>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-brand-500 to-brand-600">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Penny</p>
                <p className="text-brand-100 text-xs">AI Financial Assistant • Powered by Groq</p>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50 dark:bg-slate-900/50">
              {messages.map((msg, i) => (
                <div key={i} className={clsx('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className={clsx(
                    'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-1',
                    msg.role === 'user'
                      ? 'bg-brand-500'
                      : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
                  )}>
                    {msg.role === 'user'
                      ? <User size={13} className="text-white" />
                      : <Bot size={13} className="text-brand-500" />}
                  </div>

                  <div className={clsx(
                    'max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-brand-500 text-white rounded-tr-sm'
                      : msg.error
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-tl-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
                  )}>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                    <p className={clsx('text-xs mt-1', msg.role === 'user' ? 'text-brand-100' : 'text-slate-400')}>
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                    <Bot size={13} className="text-brand-500" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              {messages.length === 1 && !loading && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs text-slate-400 text-center">Quick questions</p>
                  {QUICK_QUESTIONS.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q.text)}
                      className="w-full flex items-center gap-2 text-left px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all text-xs text-slate-600 dark:text-slate-400">
                      <q.icon size={13} className="text-brand-500 flex-shrink-0" />
                      {q.text}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about saving, budgeting..."
                  rows={1}
                  className="flex-1 input-field py-2 text-sm resize-none"
                  style={{ minHeight: '38px', maxHeight: '80px' }}
                />
                <button onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="btn-primary px-3 py-2 flex items-center justify-center">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 text-center mt-1.5">
                Only answers finance and Spendly questions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={clsx(
          'fixed bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-2xl shadow-lg shadow-brand-500/30 flex items-center justify-center transition-all duration-300 relative',
          open ? 'bg-slate-700 dark:bg-slate-600' : 'bg-brand-500 hover:bg-brand-600 hover:scale-110'
        )}
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
        {!open && <span className="absolute inset-0 rounded-2xl bg-brand-400 animate-ping opacity-20" />}
      </button>
    </>
  )
}
