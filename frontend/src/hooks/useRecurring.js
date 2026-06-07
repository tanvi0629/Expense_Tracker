// src/hooks/useRecurring.js
import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export function useRecurring() {
  const [recurring, setRecurring] = useState([])
  const [loading, setLoading]     = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/recurring')
      setRecurring(data.recurring || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const add = async (formData) => {
    try {
    const { data } = await api.post('/recurring', formData)
    setRecurring(prev => [...prev, data.recurring])
    toast.success('Recurring expense added!')
    return data.recurring
  } catch (err) {
      console.error('Add recurring error:', err.response?.data || err.message)
      toast.error(err.response?.data?.message || 'Failed to save')
      throw err
    }
  }
  

  const edit = async (id, formData) => {
    try {
    const { data } = await api.put(`/recurring/${id}`, formData)
    setRecurring(prev => prev.map(r => r.id === id ? data.recurring : r))
    toast.success('Updated!')
    return data.recurring
  } catch (err) {
      toast.error('Failed to update')
      throw err
    }
  }

  const remove = async (id) => {
    try {
      await api.delete(`/recurring/${id}`)
      setRecurring(prev => prev.filter(r => r.id !== id))
      toast.success('Deleted')
    } catch (err) {
      toast.error('Failed to delete')
      throw err
    }
  }

  const generateDue = async () => {
    try {
      const { data } = await api.post('/recurring/generate')
      if (data.generated > 0) toast.success(`${data.generated} expense(s) auto-generated!`)
      else toast('No expenses due today')
      return data
    } catch (err) {
      toast.error('Failed to generate expenses')
      throw err
    }
  }

  return { recurring, loading, refetch: fetch, add, edit, remove, generateDue }
}
