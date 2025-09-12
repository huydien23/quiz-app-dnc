import { ref, push, get, set, remove, query, orderByChild } from "firebase/database"
import { database } from "@/lib/firebase"
import type { Quiz, QuizAttempt, QuizResult } from "@/lib/types"

export class QuizService {
  // Get all quizzes (including inactive ones for admin)
  static async getAllQuizzes(): Promise<Quiz[]> {
    const quizzesRef = ref(database, "quizzes")
    const snapshot = await get(quizzesRef)

    if (!snapshot.exists()) return []

    const quizzes: Quiz[] = []
    snapshot.forEach((child) => {
      const quiz = { id: child.key, ...child.val() } as Quiz
      quizzes.push(quiz)
    })

    return quizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Get all active quizzes
  static async getActiveQuizzes(): Promise<Quiz[]> {
    const quizzesRef = ref(database, "quizzes")
    const snapshot = await get(quizzesRef)

    if (!snapshot.exists()) return []

    const quizzes: Quiz[] = []
    snapshot.forEach((child) => {
      const quiz = { id: child.key, ...child.val() } as Quiz
      if (quiz.isActive) {
        quizzes.push(quiz)
      }
    })

    return quizzes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Get quiz by ID
  static async getQuizById(id: string): Promise<Quiz | null> {
    const quizRef = ref(database, `quizzes/${id}`)
    const snapshot = await get(quizRef)

    if (!snapshot.exists()) return null

    return { id, ...snapshot.val() } as Quiz
  }

  // Create new quiz (admin only)
  static async createQuiz(quiz: Omit<Quiz, "id">): Promise<string> {
    const quizzesRef = ref(database, "quizzes")
    const newQuizRef = push(quizzesRef)
    await set(newQuizRef, quiz)
    return newQuizRef.key!
  }

  // Update quiz (admin only)
  static async updateQuiz(id: string, quiz: Partial<Quiz>): Promise<void> {
    const quizRef = ref(database, `quizzes/${id}`)
    await set(quizRef, quiz)
  }

  // Delete quiz (admin only)
  static async deleteQuiz(id: string): Promise<void> {
    const quizRef = ref(database, `quizzes/${id}`)
    await remove(quizRef)
  }

  // Submit quiz attempt
  static async submitQuizAttempt(attempt: Omit<QuizAttempt, "id">): Promise<string> {
    const attemptsRef = ref(database, "attempts")
    const newAttemptRef = push(attemptsRef)
    await set(newAttemptRef, attempt)
    return newAttemptRef.key!
  }

  // Get user's quiz attempts
  static async getUserAttempts(userId: string): Promise<QuizAttempt[]> {
    const attemptsRef = ref(database, "attempts")
    const snapshot = await get(attemptsRef)

    if (!snapshot.exists()) return []

    const attempts: QuizAttempt[] = []
    snapshot.forEach((child) => {
      const attempt = { id: child.key, ...child.val() } as QuizAttempt
      if (attempt.userId === userId) {
        attempts.push(attempt)
      }
    })

    return attempts.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  }

  // Get quiz results for user
  static async getQuizResults(userId: string): Promise<QuizResult[]> {
    const attempts = await this.getUserAttempts(userId)
    const results: QuizResult[] = []

    for (const attempt of attempts) {
      const quiz = await this.getQuizById(attempt.quizId)
      if (quiz) {
        const correctAnswers = attempt.answers.reduce((count, answer, index) => {
          return count + (answer === quiz.questions[index].correctAnswer ? 1 : 0)
        }, 0)

        results.push({
          attempt,
          quiz,
          correctAnswers,
          totalQuestions: quiz.questions.length,
          percentage: Math.round((correctAnswers / quiz.questions.length) * 100),
        })
      }
    }

    return results
  }
}
