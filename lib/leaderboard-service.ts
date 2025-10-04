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

  // Get leaderboard for a specific quiz
  static async getQuizLeaderboard(quizId: string, limit: number = 50): Promise<{
    rank: number
    userId: string
    userName: string
    userEmail: string
    score: number
    finalScore: number
    correctAnswers: number
    totalQuestions: number
    timeSpent: number
    completedAt: string
  }[]> {
    try {
      const [attemptsSnapshot, usersSnapshot, quizzesSnapshot] = await Promise.all([
        get(ref(database, "attempts")),
        get(ref(database, "users")),
        get(ref(database, "quizzes"))
      ])

      if (!attemptsSnapshot.exists() || !usersSnapshot.exists()) {
        return []
      }

      const users: User[] = []
      usersSnapshot.forEach((child) => {
        users.push({ id: child.key!, ...child.val() } as User)
      })

      // Get quiz to know pointsPerQuestion
      let pointsPerQuestion = 0.25 // Default: 0.25 points per question (40 questions = 10 points)
      if (quizzesSnapshot.exists()) {
        quizzesSnapshot.forEach((child) => {
          if (child.key === quizId) {
            const quiz = child.val()
            pointsPerQuestion = quiz.pointsPerQuestion || 0.25
          }
        })
      }

      const attempts: QuizAttempt[] = []
      attemptsSnapshot.forEach((child) => {
        const attempt = { id: child.key!, ...child.val() } as QuizAttempt
        if (attempt.quizId === quizId) {
          attempts.push(attempt)
        }
      })

      // Group by user and get their best attempt
      const userBestAttempts = new Map<string, QuizAttempt>()
      
      attempts.forEach(attempt => {
        const existing = userBestAttempts.get(attempt.userId)
        if (!existing || (attempt.score || 0) > (existing.score || 0)) {
          userBestAttempts.set(attempt.userId, attempt)
        }
      })

      // Create leaderboard entries
      const leaderboard = Array.from(userBestAttempts.values())
        .map(attempt => {
          const user = users.find(u => u.id === attempt.userId)
          const correctAnswers = attempt.correctAnswers || 0
          const totalQuestions = attempt.totalQuestions || 0
          const finalScore = correctAnswers * pointsPerQuestion
          
          return {
            rank: 0, // Will be set after sorting
            userId: attempt.userId,
            userName: user?.name || 'Unknown User',
            userEmail: user?.email || '',
            score: attempt.score || 0,
            finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimal places
            correctAnswers,
            totalQuestions,
            timeSpent: attempt.timeSpent || 0,
            completedAt: attempt.completedAt
          }
        })
        .sort((a, b) => {
          // Sort by score (descending), then by time (ascending - faster is better)
          if (b.score !== a.score) {
            return b.score - a.score
          }
          return a.timeSpent - b.timeSpent
        })
        .slice(0, limit)

      // Set ranks
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1
      })

      return leaderboard
    } catch (error) {
      console.error('Error getting quiz leaderboard:', error)
      return []
    }
  }

  // Get user's rank in a specific quiz
  static async getUserRankInQuiz(quizId: string, userId: string): Promise<{
    rank: number
    totalParticipants: number
    percentile: number
    userScore: number
    userFinalScore: number
    topScore: number
    topFinalScore: number
  } | null> {
    try {
      const leaderboard = await this.getQuizLeaderboard(quizId, 1000)
      
      if (leaderboard.length === 0) {
        return null
      }

      const userEntry = leaderboard.find(entry => entry.userId === userId)
      
      if (!userEntry) {
        return null
      }

      const totalParticipants = leaderboard.length
      const percentile = Math.round(((totalParticipants - userEntry.rank + 1) / totalParticipants) * 100)
      const topScore = leaderboard[0]?.score || 0
      const topFinalScore = leaderboard[0]?.finalScore || 0

      return {
        rank: userEntry.rank,
        totalParticipants,
        percentile,
        userScore: userEntry.score,
        userFinalScore: userEntry.finalScore,
        topScore,
        topFinalScore
      }
    } catch (error) {
      console.error('Error getting user rank in quiz:', error)
      return null
    }
  }
}
