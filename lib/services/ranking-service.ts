import { ref, get, set, update } from "firebase/database"
import { database } from "@/lib/firebase"
import type {
    LeaderboardEntry,
    LeaderboardCache,
    UserRanking,
    RankingHistory,
    User,
    QuizAttempt
} from "@/lib/types"

export class RankingService {
    private static readonly CACHE_PATH = "leaderboard_cache"
    private static readonly USER_RANKINGS_PATH = "user_rankings"
    private static readonly HISTORY_PATH = "ranking_history"
    private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

    // ============================================
    // LEADERBOARD CACHE MANAGEMENT
    // ============================================

    // Get cached leaderboard (global or per-quiz)
    static async getCachedLeaderboard(id: string = 'global'): Promise<LeaderboardCache | null> {
        try {
            const cacheRef = ref(database, `${this.CACHE_PATH}/${id}`)
            const snapshot = await get(cacheRef)

            if (!snapshot.exists()) return null

            const cache = snapshot.val() as LeaderboardCache

            // Check if cache is still valid
            const age = Date.now() - new Date(cache.updatedAt).getTime()
            if (age > this.CACHE_TTL) {
                return null // Cache expired
            }

            return cache
        } catch (error) {
            console.error('Error getting cached leaderboard:', error)
            return null
        }
    }

    // Update leaderboard cache
    static async updateLeaderboardCache(
        id: string = 'global',
        entries: LeaderboardEntry[],
        totalUsers: number
    ): Promise<void> {
        try {
            const cacheRef = ref(database, `${this.CACHE_PATH}/${id}`)

            const cache: LeaderboardCache = {
                id,
                entries,
                totalUsers,
                updatedAt: new Date().toISOString()
            }

            await set(cacheRef, cache)
        } catch (error) {
            console.error('Error updating leaderboard cache:', error)
        }
    }

    // Invalidate cache (call after new attempt)
    static async invalidateCache(id: string = 'global'): Promise<void> {
        try {
            const cacheRef = ref(database, `${this.CACHE_PATH}/${id}`)
            await set(cacheRef, null)
        } catch (error) {
            console.error('Error invalidating cache:', error)
        }
    }

    // ============================================
    // USER RANKING MANAGEMENT
    // ============================================

    // Get user ranking
    static async getUserRanking(userId: string): Promise<UserRanking | null> {
        try {
            const rankingRef = ref(database, `${this.USER_RANKINGS_PATH}/${userId}`)
            const snapshot = await get(rankingRef)

            if (!snapshot.exists()) return null

            return { id: userId, ...snapshot.val() } as UserRanking
        } catch (error) {
            console.error('Error getting user ranking:', error)
            return null
        }
    }

    // Update user ranking after attempt
    static async updateUserRanking(
        userId: string,
        currentRank: number,
        stats: {
            totalScore: number
            averageScore: number
            bestScore: number
            totalQuizzes: number
            totalTimeSpent: number
        }
    ): Promise<void> {
        try {
            const existing = await this.getUserRanking(userId)
            const rankingRef = ref(database, `${this.USER_RANKINGS_PATH}/${userId}`)

            const ranking: UserRanking = {
                id: userId,
                userId,
                currentRank,
                previousRank: existing?.currentRank || currentRank,
                highestRank: existing
                    ? Math.min(existing.highestRank, currentRank)
                    : currentRank,
                totalScore: stats.totalScore,
                averageScore: stats.averageScore,
                bestScore: stats.bestScore,
                totalQuizzes: stats.totalQuizzes,
                totalTimeSpent: stats.totalTimeSpent,
                lastActivity: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            await set(rankingRef, ranking)
        } catch (error) {
            console.error('Error updating user ranking:', error)
        }
    }

    // Get all user rankings
    static async getAllUserRankings(): Promise<UserRanking[]> {
        try {
            const rankingsRef = ref(database, this.USER_RANKINGS_PATH)
            const snapshot = await get(rankingsRef)

            if (!snapshot.exists()) return []

            const rankings: UserRanking[] = []
            snapshot.forEach((child) => {
                rankings.push({ id: child.key!, ...child.val() } as UserRanking)
            })

            return rankings.sort((a, b) => a.currentRank - b.currentRank)
        } catch (error) {
            console.error('Error getting all user rankings:', error)
            return []
        }
    }

    // ============================================
    // RANKING HISTORY
    // ============================================

    // Record ranking history (call periodically - daily/weekly)
    static async recordRankingHistory(
        userId: string,
        rank: number,
        averageScore: number,
        period: 'daily' | 'weekly' | 'monthly' = 'daily'
    ): Promise<void> {
        try {
            const historyRef = ref(database, this.HISTORY_PATH)
            const snapshot = await get(historyRef)

            // Check for existing record today
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            let existingKey: string | null = null
            if (snapshot.exists()) {
                snapshot.forEach((child) => {
                    const record = child.val() as RankingHistory
                    if (record.userId === userId && record.period === period) {
                        const recordDate = new Date(record.recordedAt)
                        recordDate.setHours(0, 0, 0, 0)
                        if (recordDate.getTime() === today.getTime()) {
                            existingKey = child.key!
                        }
                    }
                })
            }

            const historyData: Omit<RankingHistory, 'id'> = {
                userId,
                rank,
                averageScore,
                period,
                recordedAt: new Date().toISOString()
            }

            if (existingKey) {
                // Update existing record
                await set(ref(database, `${this.HISTORY_PATH}/${existingKey}`), historyData)
            } else {
                // Create new record
                const newRef = ref(database, `${this.HISTORY_PATH}`)
                const { push } = await import("firebase/database")
                const newHistoryRef = push(newRef)
                await set(newHistoryRef, historyData)
            }
        } catch (error) {
            console.error('Error recording ranking history:', error)
        }
    }

    // Get user's ranking history
    static async getUserRankingHistory(
        userId: string,
        period: 'daily' | 'weekly' | 'monthly' = 'daily',
        limit: number = 30
    ): Promise<RankingHistory[]> {
        try {
            const historyRef = ref(database, this.HISTORY_PATH)
            const snapshot = await get(historyRef)

            if (!snapshot.exists()) return []

            const history: RankingHistory[] = []
            snapshot.forEach((child) => {
                const record = { id: child.key!, ...child.val() } as RankingHistory
                if (record.userId === userId && record.period === period) {
                    history.push(record)
                }
            })

            return history
                .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
                .slice(0, limit)
        } catch (error) {
            console.error('Error getting ranking history:', error)
            return []
        }
    }

    // ============================================
    // OPTIMIZED LEADERBOARD CALCULATION
    // ============================================

    // Calculate and update full leaderboard (call after attempt submission)
    static async recalculateLeaderboard(): Promise<LeaderboardEntry[]> {
        try {
            // Get all data
            const [usersSnapshot, attemptsSnapshot] = await Promise.all([
                get(ref(database, "users")),
                get(ref(database, "attempts"))
            ])

            if (!usersSnapshot.exists() || !attemptsSnapshot.exists()) {
                return []
            }

            const users: User[] = []
            usersSnapshot.forEach((child) => {
                const user = { id: child.key!, ...child.val() } as User
                if (user.role === 1) { // Only students
                    users.push(user)
                }
            })

            const attempts: QuizAttempt[] = []
            attemptsSnapshot.forEach((child) => {
                attempts.push({ id: child.key!, ...child.val() } as QuizAttempt)
            })

            // Calculate stats per user
            const userStatsMap = new Map<string, {
                userId: string
                userName: string
                userEmail: string
                totalQuizzes: number
                totalScore: number
                scores: number[]
                totalTimeSpent: number
                lastActivity: string
            }>()

            attempts.forEach(attempt => {
                const user = users.find(u => u.id === attempt.userId)
                if (!user) return

                const existing = userStatsMap.get(attempt.userId)
                if (existing) {
                    existing.totalQuizzes++
                    existing.totalScore += attempt.score || 0
                    existing.scores.push(attempt.score || 0)
                    existing.totalTimeSpent += attempt.timeSpent || 0
                    if (new Date(attempt.completedAt) > new Date(existing.lastActivity)) {
                        existing.lastActivity = attempt.completedAt
                    }
                } else {
                    userStatsMap.set(attempt.userId, {
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

            // Create leaderboard entries
            const entries: LeaderboardEntry[] = Array.from(userStatsMap.values())
                .map(stats => {
                    const averageScore = stats.totalQuizzes > 0
                        ? Math.round((stats.totalScore / stats.totalQuizzes) * 100) / 100
                        : 0

                    return {
                        userId: stats.userId,
                        userName: stats.userName,
                        userEmail: stats.userEmail,
                        totalQuizzes: stats.totalQuizzes,
                        totalScore: stats.totalScore,
                        averageScore,
                        bestScore: Math.max(...stats.scores),
                        totalTimeSpent: stats.totalTimeSpent,
                        rank: 0,
                        lastActivity: stats.lastActivity
                    }
                })
                .sort((a, b) => {
                    if (b.averageScore !== a.averageScore) {
                        return b.averageScore - a.averageScore
                    }
                    return b.totalQuizzes - a.totalQuizzes
                })

            // Assign ranks and calculate rank changes
            const previousRankings = await this.getAllUserRankings()
            const previousRankMap = new Map(
                previousRankings.map(r => [r.userId, r.currentRank])
            )

            entries.forEach((entry, index) => {
                entry.rank = index + 1
                entry.previousRank = previousRankMap.get(entry.userId) || entry.rank
                entry.rankChange = entry.previousRank - entry.rank
            })

            // Update cache
            await this.updateLeaderboardCache('global', entries.slice(0, 100), entries.length)

            // Update user rankings
            const updatePromises = entries.map(entry =>
                this.updateUserRanking(entry.userId, entry.rank, {
                    totalScore: entry.totalScore,
                    averageScore: entry.averageScore,
                    bestScore: entry.bestScore,
                    totalQuizzes: entry.totalQuizzes,
                    totalTimeSpent: entry.totalTimeSpent
                })
            )
            await Promise.all(updatePromises)

            return entries
        } catch (error) {
            console.error('Error recalculating leaderboard:', error)
            return []
        }
    }

    // Get leaderboard (with caching)
    static async getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
        try {
            // Try cache first
            const cached = await this.getCachedLeaderboard('global')
            if (cached) {
                return cached.entries.slice(0, limit)
            }

            // Recalculate if cache miss
            const entries = await this.recalculateLeaderboard()
            return entries.slice(0, limit)
        } catch (error) {
            console.error('Error getting leaderboard:', error)
            return []
        }
    }

    // Clean up old history
    static async cleanupOldHistory(keepDays: number = 90): Promise<number> {
        try {
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - keepDays)

            const historyRef = ref(database, this.HISTORY_PATH)
            const snapshot = await get(historyRef)

            if (!snapshot.exists()) return 0

            let deleted = 0
            const deletePromises: Promise<void>[] = []

            snapshot.forEach((child) => {
                const record = child.val() as RankingHistory
                if (new Date(record.recordedAt) < cutoffDate) {
                    deletePromises.push(
                        set(ref(database, `${this.HISTORY_PATH}/${child.key}`), null)
                    )
                    deleted++
                }
            })

            await Promise.all(deletePromises)
            return deleted
        } catch (error) {
            console.error('Error cleaning up history:', error)
            return 0
        }
    }
}
