import { createContext, useContext, useState } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken]       = useState(null)
  const [username, setUsername] = useState(null)
  const [role, setRole]         = useState(null)

  const login = (tok, user, userRole) => {
    setToken(tok)
    setUsername(user)
    setRole(userRole)
  }

  const logout = () => {
    setToken(null)
    setUsername(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ token, username, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}