"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Role = "admin" | "user"

interface RoleContextType {
  role: Role
  setRole: (role: Role) => void
  canAccess: (feature: string) => boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("user")

  const canAccess = (feature: string): boolean => {
    if (role === "admin") return true

    const userAccessibleFeatures = ["dashboard", "files", "user-logs", "oauth-logs", "settings"]
    return userAccessibleFeatures.includes(feature)
  }

  return <RoleContext.Provider value={{ role, setRole, canAccess }}>{children}</RoleContext.Provider>
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}