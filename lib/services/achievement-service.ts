import { ref, get, set, push } from "firebase/database"
import { database } from "@/lib/firebase"
import type { Achievement, AchievementType, QuizAttempt } from "@/lib/types"
import { NotificationService } from "./notification-service"

export class AchievementService {
    private static readonly PATH = "achievements"

    // Get all achievements for a user
    static async getUserAchievements(userId: string): Promise<Achievement[]> {
        try {
            const achievementsRef = ref(database, this.PATH)
            const snapshot = await get(achievementsRef)

            if (!snapshot.exists()) return []

            const achievements: Achievement[] = []
            snapshot.forEach((child) => {
                const achievement = { id: child.key!, ...child.val() } as Achievement
                if (achievement.userId === userId) {
                    achievements.push(achievement)
                }
            })

            return achievements.sort((a, b) =>
                new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
            )
        } catch (error) {
            console.error('Error getting achievements:', error)
            return []
        }
    }

    // Check if user has a specific achievement
    static async hasAchievement(userId: string, type: AchievementType): Promise<boolean> {
        try {
            const achievementId = `${userId}_${type}`;
            const achievementRef = ref(database, `${this.PATH}/${achievementId}`);
            const snapshot = await get(achievementRef);
            return snapshot.exists();
        } catch (error) {
            console.error('Error checking achievement:', error)
            return false
        }
    }

    // Award achievement to user
    static async awardAchievement(
        userId: string,
        type: AchievementType,
        metadata?: Achievement['metadata']
    ): Promise<string | null> {
        try {
            const achievementId = `${userId}_${type}`;

            // Double check existence (though set will just overwrite if we don't return)
            const hasIt = await this.hasAchievement(userId, type)
            if (hasIt) {
                return null
            }

            // Import achievement definitions
            const { ACHIEVEMENT_DEFINITIONS } = await import('@/lib/types')
            const definition = ACHIEVEMENT_DEFINITIONS[type]

            if (!definition) {
                console.error('Unknown achievement type:', type)
                return null
            }

            const achievementRef = ref(database, `${this.PATH}/${achievementId}`)

            const achievement: any = {
                id: achievementId,
                userId,
                type,
                title: definition.title,
                description: definition.description,
                icon: definition.icon,
                color: definition.color,
                earnedAt: new Date().toISOString(),
                metadata
            }

            // Remove undefined properties for Firebase
            if (achievement.metadata === undefined) delete achievement.metadata

            await set(achievementRef, achievement)

            // Send notification
            try {
                await NotificationService.sendAchievementNotification(
                    userId,
                    definition.title,
                    definition.description
                )
            } catch (notifyError) {
                console.error('Error sending achievement notification:', notifyError)
            }

            return achievementId
        } catch (error) {
            console.error('Error awarding achievement:', error)
            throw error
        }
    }

    // Check and award achievements after a quiz
    static async checkAndAwardAfterQuiz(
        userId: string,
        attempt: QuizAttempt,
        allUserAttempts: QuizAttempt[]
    ): Promise<AchievementType[]> {
        const newAchievements: AchievementType[] = []

        try {
            // First time completing any quiz
            if (allUserAttempts.length === 1) {
                const awarded = await this.awardAchievement(userId, 'first_quiz')
                if (awarded) newAchievements.push('first_quiz')
            }

            // Perfect score
            if (attempt.score === 100) {
                const awarded = await this.awardAchievement(userId, 'perfect_score', {
                    quizId: attempt.quizId,
                    score: 100
                })
                if (awarded) newAchievements.push('perfect_score')
            }

            // Quiz Master achievements (10, 50, 100)
            const totalCompleted = new Set(allUserAttempts.map(a => a.quizId)).size
            if (totalCompleted >= 10) {
                const awarded = await this.awardAchievement(userId, 'quiz_master_10')
                if (awarded) newAchievements.push('quiz_master_10')
            }
            if (totalCompleted >= 50) {
                const awarded = await this.awardAchievement(userId, 'quiz_master_50')
                if (awarded) newAchievements.push('quiz_master_50')
            }
            if (totalCompleted >= 100) {
                const awarded = await this.awardAchievement(userId, 'quiz_master_100')
                if (awarded) newAchievements.push('quiz_master_100')
            }

            // Speed demon (under 3 minutes)
            if (attempt.timeSpent < 180) {
                const awarded = await this.awardAchievement(userId, 'speed_demon')
                if (awarded) newAchievements.push('speed_demon')
            }

            // Time-based (Night Owl / Early Bird)
            const hour = new Date(attempt.completedAt).getHours()
            if (hour >= 0 && hour < 5) {
                const awarded = await this.awardAchievement(userId, 'night_owl')
                if (awarded) newAchievements.push('night_owl')
            } else if (hour >= 5 && hour < 7) {
                const awarded = await this.awardAchievement(userId, 'early_bird')
                if (awarded) newAchievements.push('early_bird')
            }

            // Streak 3 days
            const streak = this.calculateStreak(allUserAttempts)
            if (streak >= 3) {
                const awarded = await this.awardAchievement(userId, 'streak_3')
                if (awarded) newAchievements.push('streak_3')
            }
            if (streak >= 7) {
                const awarded = await this.awardAchievement(userId, 'streak_7')
                if (awarded) newAchievements.push('streak_7')
            }

        } catch (error) {
            console.error('Error checking achievements:', error)
        }

        return newAchievements
    }

    // Check and award ranking achievements
    static async checkRankingAchievements(userId: string, rank: number): Promise<AchievementType[]> {
        const newAchievements: AchievementType[] = []

        try {
            if (rank === 1) {
                const awarded = await this.awardAchievement(userId, 'champion', { rank: 1 })
                if (awarded) newAchievements.push('champion')
            }
            if (rank <= 3) {
                const awarded = await this.awardAchievement(userId, 'top_3', { rank })
                if (awarded) newAchievements.push('top_3')
            }
            if (rank <= 10) {
                const awarded = await this.awardAchievement(userId, 'top_10', { rank })
                if (awarded) newAchievements.push('top_10')
            }
        } catch (error) {
            console.error('Error checking ranking achievements:', error)
        }

        return newAchievements
    }

    // Calculate current streak
    private static calculateStreak(attempts: QuizAttempt[]): number {
        if (attempts.length === 0) return 0

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const uniqueDays = new Set<string>()
        attempts.forEach(a => {
            const date = new Date(a.completedAt)
            date.setHours(0, 0, 0, 0)
            uniqueDays.add(date.toISOString())
        })

        const sortedDays = Array.from(uniqueDays)
            .map(d => new Date(d))
            .sort((a, b) => b.getTime() - a.getTime())

        let streak = 0
        let currentDate = today

        for (const day of sortedDays) {
            const diffDays = Math.floor((currentDate.getTime() - day.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays === 0 || diffDays === 1) {
                streak++
                currentDate = day
            } else {
                break
            }
        }

        return streak
    }

    // Get achievement progress for user
    static async getAchievementProgress(userId: string): Promise<{
        earned: number
        total: number
        percentage: number
        byRarity: Record<string, { earned: number; total: number }>
    }> {
        try {
            const { ACHIEVEMENT_DEFINITIONS } = await import('@/lib/types')
            const userAchievements = await this.getUserAchievements(userId)
            const earnedTypes = new Set(userAchievements.map(a => a.type))

            const total = Object.keys(ACHIEVEMENT_DEFINITIONS).length
            const earned = earnedTypes.size

            const byRarity: Record<string, { earned: number; total: number }> = {
                common: { earned: 0, total: 0 },
                rare: { earned: 0, total: 0 },
                epic: { earned: 0, total: 0 },
                legendary: { earned: 0, total: 0 }
            }

            Object.entries(ACHIEVEMENT_DEFINITIONS).forEach(([type, def]) => {
                byRarity[def.rarity].total++
                if (earnedTypes.has(type as any)) {
                    byRarity[def.rarity].earned++
                }
            })

            return {
                earned,
                total,
                percentage: Math.round((earned / total) * 100),
                byRarity
            }
        } catch (error) {
            console.error('Error getting achievement progress:', error)
            return {
                earned: 0,
                total: 0,
                percentage: 0,
                byRarity: {}
            }
        }
    }
}
