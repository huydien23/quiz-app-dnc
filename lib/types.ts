export interface User {
  id: string
  email: string
  name: string
  role: "student" | "admin"
  createdAt: string
}

export interface Quiz {
  id: string
  title: string
  description: string
  questions: Question[]
  timeLimit: number // in minutes
  createdBy: string
  createdAt: string
  isActive: boolean
}

export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface QuizAttempt {
  id: string
  userId: string
  quizId: string
  answers: number[]
  score: number
  completedAt: string
  timeSpent: number // in seconds
}

export interface QuizResult {
  attempt: QuizAttempt
  quiz: Quiz
  correctAnswers: number
  totalQuestions: number
  percentage: number
}
