// ============================================
// USER & AUTHENTICATION TYPES
// ============================================

export interface User {
  id: string
  email: string
  name: string
  role: 0 | 1 // 0 = admin, 1 = user/student
  avatar?: string
  createdAt: string
  lastLoginAt?: string
}

// ============================================
// QUIZ & QUESTION TYPES
// ============================================

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
  // Points per question (default 0.25 for 40 questions = 10 points)
  pointsPerQuestion?: number
  // Category & Tags
  categoryId?: string
  tags?: string[]
  // Difficulty level
  difficulty?: 'easy' | 'medium' | 'hard'
  // Stats
  attemptCount?: number
  averageScore?: number
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

// ============================================
// LEADERBOARD TYPES
// ============================================

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
  // New fields for ranking changes
  previousRank?: number
  rankChange?: number // positive = up, negative = down, 0 = same
}

export interface LeaderboardCache {
  id: string // "global" or quizId
  entries: LeaderboardEntry[]
  totalUsers: number
  updatedAt: string
}

export interface UserRanking {
  id: string // = oderId
  userId: string
  currentRank: number
  previousRank: number
  highestRank: number
  totalScore: number
  averageScore: number
  bestScore: number
  totalQuizzes: number
  totalTimeSpent: number
  lastActivity: string
  updatedAt: string
}

export interface RankingHistory {
  id: string
  userId: string
  rank: number
  averageScore: number
  period: 'daily' | 'weekly' | 'monthly'
  recordedAt: string
}

// ============================================
// CATEGORY & TAG TYPES
// ============================================

export interface Category {
  id: string
  name: string
  description: string
  icon: string // Lucide icon name
  color: string // Hex color
  parentId: string | null
  order: number
  quizCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
  usageCount: number
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'quiz_new'
  | 'quiz_result'
  | 'achievement'
  | 'announcement'

export interface Notification {
  id: string
  userId: string | 'all' // 'all' for broadcast notifications
  title: string
  message: string
  type: NotificationType
  link?: string | null
  isRead: boolean
  createdAt: string
  expiresAt?: string
}

// ============================================
// COMMENT & REVIEW TYPES
// ============================================

export interface Comment {
  id: string
  quizId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  rating: 1 | 2 | 3 | 4 | 5
  isApproved: boolean
  createdAt: string
  updatedAt?: string
  // Admin response
  adminReply?: string
  adminReplyAt?: string
  // Parent for replies
  parentId?: string
}

// ============================================
// BOOKMARK TYPES
// ============================================

export interface Bookmark {
  id: string
  userId: string
  quizId: string
  note?: string
  createdAt: string
}

// ============================================
// ACHIEVEMENT & GAMIFICATION TYPES
// ============================================

export type AchievementType =
  | 'first_quiz'        // Complete first quiz
  | 'perfect_score'     // Get 100% on any quiz
  | 'streak_3'          // 3 day streak
  | 'streak_7'          // 7 day streak
  | 'streak_30'         // 30 day streak
  | 'top_10'            // Reach top 10 on leaderboard
  | 'top_3'             // Reach top 3 on leaderboard
  | 'champion'          // Reach #1 on leaderboard
  | 'quiz_master_10'    // Complete 10 quizzes
  | 'quiz_master_50'    // Complete 50 quizzes
  | 'quiz_master_100'   // Complete 100 quizzes
  | 'speed_demon'       // Complete quiz in under 5 minutes
  | 'night_owl'         // Complete quiz after midnight
  | 'early_bird'        // Complete quiz before 6am
  | 'comeback_king'     // Improve score by 50%+ on retry
  | 'consistent'        // Score 80%+ on 5 quizzes in a row

export interface Achievement {
  id: string
  userId: string
  type: AchievementType
  title: string
  description: string
  icon: string // Lucide icon name
  color: string // Badge color
  earnedAt: string
  metadata?: {
    quizId?: string
    score?: number
    rank?: number
    streakDays?: number
  }
}

// Achievement definitions for UI
export const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, {
  title: string
  description: string
  icon: string
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}> = {
  first_quiz: {
    title: 'Khởi đầu mới',
    description: 'Hoàn thành bài thi đầu tiên',
    icon: 'Sparkles',
    color: '#10b981',
    rarity: 'common'
  },
  perfect_score: {
    title: 'Hoàn hảo',
    description: 'Đạt điểm 100% trong một bài thi',
    icon: 'Star',
    color: '#f59e0b',
    rarity: 'rare'
  },
  streak_3: {
    title: 'Kiên trì',
    description: 'Làm bài 3 ngày liên tiếp',
    icon: 'Flame',
    color: '#ef4444',
    rarity: 'common'
  },
  streak_7: {
    title: 'Tuần năng động',
    description: 'Làm bài 7 ngày liên tiếp',
    icon: 'Flame',
    color: '#f97316',
    rarity: 'rare'
  },
  streak_30: {
    title: 'Chiến binh tháng',
    description: 'Làm bài 30 ngày liên tiếp',
    icon: 'Flame',
    color: '#dc2626',
    rarity: 'legendary'
  },
  top_10: {
    title: 'Top 10',
    description: 'Lọt vào top 10 bảng xếp hạng',
    icon: 'Trophy',
    color: '#a855f7',
    rarity: 'rare'
  },
  top_3: {
    title: 'Top 3',
    description: 'Lọt vào top 3 bảng xếp hạng',
    icon: 'Medal',
    color: '#3b82f6',
    rarity: 'epic'
  },
  champion: {
    title: 'Vô địch',
    description: 'Đứng đầu bảng xếp hạng',
    icon: 'Crown',
    color: '#eab308',
    rarity: 'legendary'
  },
  quiz_master_10: {
    title: 'Học viên',
    description: 'Hoàn thành 10 bài thi',
    icon: 'BookOpen',
    color: '#06b6d4',
    rarity: 'common'
  },
  quiz_master_50: {
    title: 'Chuyên gia',
    description: 'Hoàn thành 50 bài thi',
    icon: 'Award',
    color: '#8b5cf6',
    rarity: 'rare'
  },
  quiz_master_100: {
    title: 'Bậc thầy',
    description: 'Hoàn thành 100 bài thi',
    icon: 'Crown',
    color: '#ec4899',
    rarity: 'legendary'
  },
  speed_demon: {
    title: 'Tốc độ',
    description: 'Hoàn thành bài thi trong 5 phút',
    icon: 'Timer',
    color: '#f59e0b',
    rarity: 'rare'
  },
  night_owl: {
    title: 'Cú đêm',
    description: 'Làm bài sau nửa đêm',
    icon: 'Moon',
    color: '#6366f1',
    rarity: 'common'
  },
  early_bird: {
    title: 'Chim sớm',
    description: 'Làm bài trước 6 giờ sáng',
    icon: 'Sun',
    color: '#f97316',
    rarity: 'common'
  },
  comeback_king: {
    title: 'Vượt qua giới hạn',
    description: 'Cải thiện điểm 50%+ khi làm lại',
    icon: 'TrendingUp',
    color: '#10b981',
    rarity: 'epic'
  },
  consistent: {
    title: 'Ổn định',
    description: 'Đạt 80%+ trong 5 bài liên tiếp',
    icon: 'Target',
    color: '#3b82f6',
    rarity: 'rare'
  }
}

// ============================================
// STUDY PLAN TYPES
// ============================================

export interface StudyPlan {
  id: string
  userId: string
  title: string
  description?: string
  quizIds: string[]
  schedule: {
    frequency: 'daily' | 'weekly' | 'custom'
    daysOfWeek?: number[] // 0-6 for custom
    timeOfDay?: string // HH:mm format
    reminderEnabled: boolean
  }
  progress: {
    completedQuizIds: string[]
    lastActivityAt?: string
    streakDays: number
  }
  createdAt: string
  updatedAt: string
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface SystemSetting {
  key: string
  value: any
  description: string
  type: 'string' | 'number' | 'boolean' | 'json'
  category: 'general' | 'quiz' | 'notification' | 'appearance' | 'security'
  updatedAt: string
  updatedBy: string
}

export const DEFAULT_SETTINGS: Record<string, SystemSetting> = {
  site_name: {
    key: 'site_name',
    value: 'Quiz App',
    description: 'Tên website',
    type: 'string',
    category: 'general',
    updatedAt: '',
    updatedBy: ''
  },
  allow_registration: {
    key: 'allow_registration',
    value: true,
    description: 'Cho phép đăng ký tài khoản mới',
    type: 'boolean',
    category: 'security',
    updatedAt: '',
    updatedBy: ''
  },
  default_time_limit: {
    key: 'default_time_limit',
    value: 30,
    description: 'Thời gian làm bài mặc định (phút)',
    type: 'number',
    category: 'quiz',
    updatedAt: '',
    updatedBy: ''
  },
  enable_leaderboard: {
    key: 'enable_leaderboard',
    value: true,
    description: 'Hiển thị bảng xếp hạng',
    type: 'boolean',
    category: 'general',
    updatedAt: '',
    updatedBy: ''
  },
  enable_achievements: {
    key: 'enable_achievements',
    value: true,
    description: 'Bật hệ thống thành tựu',
    type: 'boolean',
    category: 'general',
    updatedAt: '',
    updatedBy: ''
  },
  require_comment_approval: {
    key: 'require_comment_approval',
    value: false,
    description: 'Yêu cầu duyệt bình luận trước khi hiển thị',
    type: 'boolean',
    category: 'general',
    updatedAt: '',
    updatedBy: ''
  },
  notification_retention_days: {
    key: 'notification_retention_days',
    value: 30,
    description: 'Số ngày giữ thông báo',
    type: 'number',
    category: 'notification',
    updatedAt: '',
    updatedBy: ''
  }
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'quiz_start'
  | 'quiz_submit'
  | 'password_change'
  | 'settings_change'
  | 'export'
  | 'import'

export type AuditTargetType =
  | 'quiz'
  | 'user'
  | 'category'
  | 'comment'
  | 'notification'
  | 'settings'
  | 'attempt'

export interface AuditLog {
  id: string
  action: AuditAction
  targetType: AuditTargetType
  targetId: string
  userId: string
  userName: string
  details?: {
    before?: any
    after?: any
    description?: string
  }
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

// ============================================
// DASHBOARD STATS TYPES
// ============================================

export interface DashboardStats {
  totalQuizzes: number
  activeQuizzes: number
  totalAttempts: number
  totalUsers: number
  avgScore: number
  trendsData: {
    quizzesGrowth: number
    attemptsGrowth: number
    usersGrowth: number
  }
}

export interface CategoryStats {
  categoryId: string
  categoryName: string
  quizCount: number
  attemptCount: number
  averageScore: number
}
