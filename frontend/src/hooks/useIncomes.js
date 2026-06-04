// frontend/src/hooks/useIncomes.js
import { useState, useEffect, useCallback } from 'react'
import { getIncomes, createIncome, updateIncome, deleteIncome } from '../services/api'
import toast from 'react-hot-toast'

export function useIncomes(filters = {}) {
  const [incomes, setIncomes]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [stats, setStats]       = useState({ total: 0, count: 0 })

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getIncomes(filters)
      setIncomes(data.incomes || [])
      setStats(data.stats || { total: 0, count: 0 })
    } catch (_) {}
    finally { setLoading(false) }
  }, [JSON.stringify(filters)])

  useEffect(() => { fetch() }, [fetch])

  const add = async (data) => {
    const { data: res } = await createIncome(data)
    setIncomes(prev => [res.income, ...prev])
    toast.success('Income added!')
    return res.income
  }

  const edit = async (id, data) => {
    const { data: res } = await updateIncome(id, data)
    setIncomes(prev => prev.map(i => i.id === id ? res.income : i))
    toast.success('Income updated!')
    return res.income
  }

  const remove = async (id) => {
    await deleteIncome(id)
    setIncomes(prev => prev.filter(i => i.id !== id))
    toast.success('Income deleted')
  }

  return { incomes, loading, stats, refetch: fetch, add, edit, remove }
}