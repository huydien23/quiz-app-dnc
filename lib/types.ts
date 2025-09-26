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
  isDraft?: boolean // Draft status - cannot be taken by students
  hasIncompleteQuestions?: boolean // Has questions with correctAnswer = -1
  // Optional: number of questions randomly selected each attempt
  questionCount?: number
}

export interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number // -1 = unknown/missing, 0-3 = A-D
  explanation?: string
  hasWarning?: boolean // For import validation warnings
  warningMessage?: string
}

export interface QuizAttempt {
  id: string
  userId: string
  quizId: string
  answers: number[]
  questionIndices?: number[] // mapping to original question indexes used for scoring/review
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
