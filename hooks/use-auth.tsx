"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import {
  type User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth"
import { ref, set, get } from "firebase/database"
import { auth, database, googleProvider } from "@/lib/firebase"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signUp: (email: string, password: string, name: string, role?: 0 | 1) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
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
          const userData = snapshot.val()
          setUser(userData)
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

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    const firebaseUser = result.user
    
    // Nếu người dùng đăng nhập lần đầu, tạo bản ghi trong database
    const userRef = ref(database, `users/${firebaseUser.uid}`)
    const snapshot = await get(userRef)
    
    if (!snapshot.exists()) {
      // Tạo bản ghi người dùng mới trong cơ sở dữ liệu với vai trò mặc định = 1 (người dùng)
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        name: firebaseUser.displayName || "Google User",
        role: 1, 
        createdAt: new Date().toISOString(),
      }
      
      await set(userRef, newUser)
    }
  }

  const signUp = async (email: string, password: string, name: string, role: 0 | 1 = 1) => {
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
    // Clear local state immediately
    setUser(null)
    setFirebaseUser(null)
  }

  const refreshUser = async () => {
    if (firebaseUser) {
      const userRef = ref(database, `users/${firebaseUser.uid}`)
      const snapshot = await get(userRef)
      if (snapshot.exists()) {
        const userData = snapshot.val()
        setUser(userData)
      }
    }
  }

  const value = {
    user,
    firebaseUser,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
