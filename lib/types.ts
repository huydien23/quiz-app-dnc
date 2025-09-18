export interface User {
  id: string
  email: string
  name: string
  role: 0 | 1 // 0 = admin, 1 = user/student
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
  correctAnswers?: number
  totalQuestions?: number
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

export interface LeaderboardEntry {
  userId: string
  userName: string
  userEmail: string
  totalQuizzes: number
  totalScore: number
  averageScore: number
  bestScore: number
  totalTimeSpent: number
  rank: number
  lastActivity: string
}
