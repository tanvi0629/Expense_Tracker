// src/hooks/useExpenses.js
import { useState, useEffect, useCallback } from 'react'
import { getExpenses, createExpense, updateExpense, deleteExpense, exportCSV } from '../services/api'
import toast from 'react-hot-toast'

export function useExpenses(filters = {}) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ total: 0, count: 0 })

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getExpenses(filters)
      setExpenses(data.expenses || [])
      setStats(data.stats || { total: 0, count: 0 })
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => { fetch() }, [fetch])

  const add = async (data) => {
    try {
      const { data: res } = await createExpense(data)
      setExpenses(prev => [res.expense, ...prev])
      toast.success('Expense added!')
      return res.expense
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense')
      throw err
    }
  }

  const edit = async (id, data) => {
    try {
      const { data: res } = await updateExpense(id, data)
      setExpenses(prev => prev.map(e => e.id === id ? res.expense : e))
      toast.success('Expense updated!')
      return res.expense
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update expense')
      throw err
    }
  }

  const remove = async (id) => {
    try {
      await deleteExpense(id)
      setExpenses(prev => prev.filter(e => e.id !== id))
      toast.success('Expense deleted')
    } catch (err) {
      toast.error('Failed to delete expense')
      throw err
    }
  }

  const download = async () => {
    try {
      const res = await exportCSV()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('CSV exported!')
    } catch (err) {
      toast.error('Export failed')
    }
  }

  return { expenses, loading, error, stats, refetch: fetch, add, edit, remove, download }
}
