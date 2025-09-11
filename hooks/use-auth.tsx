"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import {
  type User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"
import { ref, set, get } from "firebase/database"
import { auth, database } from "@/lib/firebase"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role?: "student" | "admin") => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser)
        // Get user data from database
        const userRef = ref(database, `users/${firebaseUser.uid}`)
        const snapshot = await get(userRef)
        if (snapshot.exists()) {
          setUser(snapshot.val())
        }
      } else {
        setFirebaseUser(null)
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, name: string, role: "student" | "admin" = "student") => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user: User = {
      id: userCredential.user.uid,
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
    }

    // Save user data to database
    await set(ref(database, `users/${userCredential.user.uid}`), user)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
