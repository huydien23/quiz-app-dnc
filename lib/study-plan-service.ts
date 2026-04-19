import { ref, push, get, set, remove, query, orderByChild, equalTo } from "firebase/database"
import { database } from "@/lib/firebase"
import type { QuizAttempt } from "@/lib/types"
import { AchievementService } from "./services/achievement-service"

export interface StudyGoal {
    id: string
    userId: string
    title: string
    description: string
    targetType: 'quizzes' | 'score' | 'streak' | 'time'
    targetValue: number
    currentValue: number
    deadline: string
    status: 'active' | 'completed' | 'expired'
    createdAt: string
}

export class StudyPlanService {
    private static readonly DB_PATH = "studyGoals"

    static async getGoals(userId: string): Promise<StudyGoal[]> {
        const goalsRef = ref(database, this.DB_PATH)
        // Fetch all goals and filter manually to avoid missing index issues in Firebase rules
        const snapshot = await get(goalsRef)

        if (!snapshot.exists()) return []

        const goals: StudyGoal[] = []
        snapshot.forEach((child) => {
            const goal = { id: child.key, ...child.val() } as StudyGoal
            if (goal.userId === userId) {
                goals.push(goal)
            }
        })

        return goals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    static async createGoal(goal: Omit<StudyGoal, "id">): Promise<string> {
        const goalsRef = ref(database, this.DB_PATH)
        const newGoalRef = push(goalsRef)
        await set(newGoalRef, goal)
        return newGoalRef.key!
    }

    static async updateGoal(id: string, updates: Partial<StudyGoal>): Promise<void> {
        const goalRef = ref(database, `${this.DB_PATH}/${id}`)
        const snapshot = await get(goalRef)
        if (!snapshot.exists()) throw new Error("Goal not found")

        const currentGoal = snapshot.val() as StudyGoal
        await set(goalRef, { ...currentGoal, ...updates })
    }

    static async updateProgressAfterQuiz(
        userId: string,
        data: { quizId: string, score: number, timeSpent: number },
        allAttempts?: QuizAttempt[]
    ): Promise<void> {
        try {
            const goals = await this.getGoals(userId)
            const activeGoals = goals.filter(g => g.status === 'active')
            if (activeGoals.length === 0) return

            // For streak calculation, we might need all attempts
            // but for simple "current streak", we can rely on a dedicated method or just check if they played today

            for (const goal of activeGoals) {
                let newVal = goal.currentValue
                let shouldUpdate = false

                switch (goal.targetType) {
                    case 'quizzes':
                        newVal += 1
                        shouldUpdate = true
                        break
                    case 'score':
                        // If it's a "Reach X score" goal
                        if (data.score >= goal.targetValue && goal.currentValue < goal.targetValue) {
                            newVal = data.score
                            shouldUpdate = true
                        }
                        break
                    case 'time':
                        // Accumulate time in minutes
                        newVal += Math.round(data.timeSpent / 60)
                        shouldUpdate = true
                        break
                    case 'streak':
                        if (allAttempts) {
                            // Use AchievementService's private method logic or just re-calculate here
                            // Actually since calculateStreak is private, we can just calculate it here or in a helper
                            const streak = (AchievementService as any).calculateStreak(allAttempts)
                            newVal = streak
                            shouldUpdate = true
                        }
                        break
                }

                if (shouldUpdate) {
                    const isCompleted = newVal >= goal.targetValue
                    await this.updateGoal(goal.id, {
                        currentValue: newVal,
                        status: isCompleted ? 'completed' : 'active'
                    })
                }
            }
        } catch (error) {
            console.error("Error updating goal progress:", error)
        }
    }

    static async deleteGoal(id: string): Promise<void> {
        const goalRef = ref(database, `${this.DB_PATH}/${id}`)
        await remove(goalRef)
    }
}
