import { ref, get, remove } from "firebase/database"
import { database } from "@/lib/firebase"
import type { User, Quiz, QuizAttempt } from "@/lib/types"

export class AdminService {
  // Get all users
  static async getAllUsers(): Promise<User[]> {
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)

    if (!snapshot.exists()) return []

    const users: User[] = []
    snapshot.forEach((child) => {
      users.push({ id: child.key, ...child.val() } as User)
    })

    return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Get all quizzes (including inactive)
  static async getAllQuizzes(): Promise<Quiz[]> {
    const quizzesRef = ref(database, "quizzes")
    const snapshot = await get(quizzesRef)

    if (!snapshot.exists()) return []

    const quizzes: Quiz[] = []
    snapshot.forEach((child) => {
      quizzes.push({ id: child.key, ...child.val() } as Quiz)
    })

    return quizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Get all quiz attempts
  static async getAllAttempts(): Promise<QuizAttempt[]> {
    const attemptsRef = ref(database, "attempts")
    const snapshot = await get(attemptsRef)

    if (!snapshot.exists()) return []

    const attempts: QuizAttempt[] = []
    snapshot.forEach((child) => {
      attempts.push({ id: child.key, ...child.val() } as QuizAttempt)
    })

    return attempts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  }

  // Get system statistics
  static async getSystemStats() {
    const [users, quizzes, attempts] = await Promise.all([
      this.getAllUsers(),
      this.getAllQuizzes(),
      this.getAllAttempts(),
    ])

    const totalUsers = users.length
    const totalQuizzes = quizzes.length
    const totalAttempts = attempts.length
    const activeQuizzes = quizzes.filter((quiz) => quiz.isActive).length

    // Calculate average score
    const averageScore =
      attempts.length > 0
        ? Math.round((attempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / attempts.length) * 100) / 100
        : 0

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentAttempts = attempts.filter((attempt) => new Date(attempt.completedAt) > sevenDaysAgo).length

    const recentUsers = users.filter((user) => new Date(user.createdAt) > sevenDaysAgo).length

    return {
      totalUsers,
      totalQuizzes,
      activeQuizzes,
      totalAttempts,
      averageScore,
      recentAttempts,
      recentUsers,
      users: users.slice(0, 5), // Recent users
      attempts: attempts.slice(0, 10), // Recent attempts
    }
  }

  // Delete user (admin only)
  static async deleteUser(userId: string): Promise<void> {
    const userRef = ref(database, `users/${userId}`)
    await remove(userRef)

    // Also delete user's attempts
    const attempts = await this.getAllAttempts()
    const userAttempts = attempts.filter((attempt) => attempt.userId === userId)

    for (const attempt of userAttempts) {
      const attemptRef = ref(database, `attempts/${attempt.id}`)
      await remove(attemptRef)
    }
  }
}
