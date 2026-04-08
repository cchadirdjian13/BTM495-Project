import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI, notificationsAPI } from '../api/api'
import { useLanguage } from './LanguageContext'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [notifications, setNotifs] = useState([])

  const { setLang } = useLanguage()

  // Restore session on mount
  useEffect(() => {
    authAPI.me()
      .then(u => { 
        setUser(u); 
        setLoading(false);
        if (u.language) setLang(u.language);
      })
      .catch(() => setLoading(false))
  }, [setLang])

  // Poll notifications every 15 s when logged in
  useEffect(() => {
    if (!user) return
    const fetchNotifs = () =>
      notificationsAPI.list().then(setNotifs).catch(() => {})
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 15_000)
    return () => clearInterval(interval)
  }, [user])

  const login = useCallback(async (email, password) => {
    const u = await authAPI.login({ email, password })
    setUser(u)
    if (u.language) setLang(u.language)
    return u
  }, [setLang])

  const register = useCallback(async (data) => {
    const u = await authAPI.register(data)
    setUser(u)
    if (u.language) setLang(u.language)
    return u
  }, [setLang])

  const logout = useCallback(async () => {
    await authAPI.logout()
    setUser(null)
    setNotifs([])
  }, [])

  const refreshNotifs = useCallback(() =>
    notificationsAPI.list().then(setNotifs).catch(() => {}), [])

  const markRead = useCallback(async (id) => {
    await notificationsAPI.read(id)
    refreshNotifs()
  }, [refreshNotifs])

  const markAllRead = useCallback(async () => {
    await notificationsAPI.readAll()
    refreshNotifs()
  }, [refreshNotifs])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <AuthContext.Provider value={{
      user, loading, notifications, unreadCount,
      login, register, logout, refreshNotifs, markRead, markAllRead,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
