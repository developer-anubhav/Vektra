/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  // Check sessionStorage (tab-isolated) first, then fallback to localStorage
  const [user, setUser] = useState(() => {
    try {
      const sessionUser = sessionStorage.getItem("user")
      const sessionToken = sessionStorage.getItem("token")
      if (sessionUser && sessionToken) {
        return JSON.parse(sessionUser)
      }

      const localUser = localStorage.getItem("user")
      const localToken = localStorage.getItem("token")
      if (localUser && localToken) {
        // Seed sessionStorage for this tab
        sessionStorage.setItem("user", localUser)
        sessionStorage.setItem("token", localToken)
        return JSON.parse(localUser)
      }

      return null
    } catch (err) {
      console.error("Failed to restore auth session:", err)
      return null
    }
  })

  const login = (userData) => {
    setUser(userData)
    // Write to both sessionStorage (tab-isolated) and localStorage
    sessionStorage.setItem("user", JSON.stringify(userData))
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("token")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
