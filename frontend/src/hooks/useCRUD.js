import { useState, useCallback } from 'react'

export function useCRUD(fetchFn) {
  const [data,       setData]       = useState([])
  const [pagination, setPagination] = useState({ total:0, pages:1, currentPage:1 })
  const [loading,    setLoading]    = useState(true)
  const [alert,      setAlert]      = useState(null)

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 4000)
  }

  const load = useCallback(async (params) => {
    setLoading(true)
    try {
      const res = await fetchFn(params)
      const d   = res.data
      // Support different key names
      const items = d.studies || d.subjects || d.sites || d.patients || []
      setData(items)
      setPagination({ total: d.total, pages: d.pages, currentPage: d.currentPage })
    } catch (e) {
      showAlert('danger', e.response?.data?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  return { data, pagination, loading, alert, showAlert, load, setData }
}
