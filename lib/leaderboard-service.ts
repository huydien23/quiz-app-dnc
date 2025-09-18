import { ref, get } from "firebase/database"
import { database } from "@/lib/firebase"
import type { User, QuizAttempt, LeaderboardEntry } from "@/lib/types"

export class LeaderboardService {
  // Get leaderboard data
  static async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
    try {
      // Get all users and attempts
      const [usersSnapshot, attemptsSnapshot] = await Promise.all([
        get(ref(database, "users")),
        get(ref(database, "attempts"))
      ])

      if (!usersSnapshot.exists() || !attemptsSnapshot.exists()) {
        return []
      }

      const users: User[] = []
      usersSnapshot.forEach((child) => {
        users.push({ id: child.key!, ...child.val() } as User)
      })

      const attempts: QuizAttempt[] = []
      attemptsSnapshot.forEach((child) => {
        attempts.push({ id: child.key!, ...child.val() } as QuizAttempt)
      })

      // Calculate leaderboard entries
      const leaderboardMap = new Map<string, {
        userId: string
        userName: string
        userEmail: string
        totalQuizzes: number
        totalScore: number
        scores: number[]
        totalTimeSpent: number
        lastActivity: string
      }>()

      // Process each attempt
      attempts.forEach(attempt => {
        const user = users.find(u => u.id === attempt.userId)
        if (!user) return

        const existing = leaderboardMap.get(attempt.userId)
        if (existing) {
          existing.totalQuizzes++
          existing.totalScore += attempt.score || 0
          existing.scores.push(attempt.score || 0)
          existing.totalTimeSpent += attempt.timeSpent || 0
          if (new Date(attempt.completedAt) > new Date(existing.lastActivity)) {
            existing.lastActivity = attempt.completedAt
          }
        } else {
          leaderboardMap.set(attempt.userId, {
            userId: attempt.userId,
            userName: user.name,
            userEmail: user.email,
            totalQuizzes: 1,
            totalScore: attempt.score || 0,
            scores: [attempt.score || 0],
            totalTimeSpent: attempt.timeSpent || 0,
            lastActivity: attempt.completedAt
          })
        }
      })

      // Convert to leaderboard entries and calculate rankings
      const leaderboardEntries: LeaderboardEntry[] = Array.from(leaderboardMap.values())
        .map(entry => ({
          userId: entry.userId,
          userName: entry.userName,
          userEmail: entry.userEmail,
          totalQuizzes: entry.totalQuizzes,
          totalScore: entry.totalScore,
          averageScore: entry.totalQuizzes > 0 ? Math.round((entry.totalScore / entry.totalQuizzes) * 100) / 100 : 0,
          bestScore: Math.max(...entry.scores),
          totalTimeSpent: entry.totalTimeSpent,
          rank: 0, // Will be set after sorting
          lastActivity: entry.lastActivity
        }))
        .sort((a, b) => {
          // Sort by average score (descending), then by total quizzes (descending)
          if (b.averageScore !== a.averageScore) {
            return b.averageScore - a.averageScore
          }
          return b.totalQuizzes - a.totalQuizzes
        })
        .slice(0, limit)

      // Set ranks
      leaderboardEntries.forEach((entry, index) => {
        entry.rank = index + 1
      })

      return leaderboardEntries
    } catch (error) {
      console.error('Error getting leaderboard:', error)
      return []
    }
  }

  // Get user's rank
  static async getUserRank(userId: string): Promise<number> {
    const leaderboard = await this.getLeaderboard(1000) // Get more entries to find user
    const userEntry = leaderboard.find(entry => entry.userId === userId)
    return userEntry ? userEntry.rank : 0
  }

  // Get user's stats
  static async getUserStats(userId: string): Promise<LeaderboardEntry | null> {
    const leaderboard = await this.getLeaderboard(1000)
    return leaderboard.find(entry => entry.userId === userId) || null
  }

  // Get recent activity (last 7 days)
  static async getRecentActivity(limit: number = 20): Promise<{
    userId: string
    userName: string
    quizTitle: string
    score: number
    completedAt: string
  }[]> {
    try {
      const [attemptsSnapshot, quizzesSnapshot, usersSnapshot] = await Promise.all([
        get(ref(database, "attempts")),
        get(ref(database, "quizzes")),
        get(ref(database, "users"))
      ])

      if (!attemptsSnapshot.exists()) return []

      const attempts: QuizAttempt[] = []
      attemptsSnapshot.forEach((child) => {
        attempts.push({ id: child.key!, ...child.val() } as QuizAttempt)
      })

      const quizzes: any[] = []
      if (quizzesSnapshot.exists()) {
        quizzesSnapshot.forEach((child) => {
          quizzes.push({ id: child.key!, ...child.val() })
        })
      }

      const users: User[] = []
      if (usersSnapshot.exists()) {
        usersSnapshot.forEach((child) => {
          users.push({ id: child.key!, ...child.val() } as User)
        })
      }

      // Filter recent attempts (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const recentAttempts = attempts
        .filter(attempt => new Date(attempt.completedAt) > sevenDaysAgo)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, limit)

      return recentAttempts.map(attempt => {
        const user = users.find(u => u.id === attempt.userId)
        const quiz = quizzes.find(q => q.id === attempt.quizId)
        return {
          userId: attempt.userId,
          userName: user?.name || 'Unknown User',
          quizTitle: quiz?.title || 'Unknown Quiz',
          score: attempt.score || 0,
          completedAt: attempt.completedAt
        }
      })
    } catch (error) {
      console.error('Error getting recent activity:', error)
      return []
    }
  }
}
