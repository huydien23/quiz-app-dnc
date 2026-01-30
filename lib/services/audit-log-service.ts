import { ref, push, get, set, remove } from "firebase/database"
import { database } from "@/lib/firebase"
import type { AuditLog, AuditAction, AuditTargetType } from "@/lib/types"

export class AuditLogService {
    private static readonly PATH = "audit_logs"
    private static readonly MAX_LOGS = 10000 // Keep last 10k logs

    // Create audit log entry
    static async log(
        action: AuditAction,
        targetType: AuditTargetType,
        targetId: string,
        userId: string,
        userName: string,
        details?: AuditLog['details']
    ): Promise<string> {
        try {
            const logsRef = ref(database, this.PATH)
            const newRef = push(logsRef)

            const log: Omit<AuditLog, 'id'> = {
                action,
                targetType,
                targetId,
                userId,
                userName,
                details,
                timestamp: new Date().toISOString()
            }

            if (log.details === undefined) delete log.details

            await set(newRef, log)
            return newRef.key!
        } catch (error) {
            console.error('Error creating audit log:', error)
            throw error
        }
    }

    // Get all logs (paginated)
    static async getLogs(limit: number = 100, offset: number = 0): Promise<AuditLog[]> {
        try {
            const logsRef = ref(database, this.PATH)
            const snapshot = await get(logsRef)

            if (!snapshot.exists()) return []

            const logs: AuditLog[] = []
            snapshot.forEach((child) => {
                logs.push({ id: child.key!, ...child.val() } as AuditLog)
            })

            return logs
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(offset, offset + limit)
        } catch (error) {
            console.error('Error getting logs:', error)
            return []
        }
    }

    // Get logs by action type
    static async getLogsByAction(action: AuditAction, limit: number = 100): Promise<AuditLog[]> {
        try {
            const allLogs = await this.getLogs(10000)
            return allLogs.filter(log => log.action === action).slice(0, limit)
        } catch (error) {
            console.error('Error getting logs by action:', error)
            return []
        }
    }

    // Get logs by target type
    static async getLogsByTarget(targetType: AuditTargetType, limit: number = 100): Promise<AuditLog[]> {
        try {
            const allLogs = await this.getLogs(10000)
            return allLogs.filter(log => log.targetType === targetType).slice(0, limit)
        } catch (error) {
            console.error('Error getting logs by target:', error)
            return []
        }
    }

    // Get logs for a specific target
    static async getLogsForTarget(targetType: AuditTargetType, targetId: string): Promise<AuditLog[]> {
        try {
            const allLogs = await this.getLogs(10000)
            return allLogs.filter(
                log => log.targetType === targetType && log.targetId === targetId
            )
        } catch (error) {
            console.error('Error getting logs for target:', error)
            return []
        }
    }

    // Get logs by user
    static async getLogsByUser(userId: string, limit: number = 100): Promise<AuditLog[]> {
        try {
            const allLogs = await this.getLogs(10000)
            return allLogs.filter(log => log.userId === userId).slice(0, limit)
        } catch (error) {
            console.error('Error getting logs by user:', error)
            return []
        }
    }

    // Get logs within date range
    static async getLogsByDateRange(startDate: Date, endDate: Date): Promise<AuditLog[]> {
        try {
            const allLogs = await this.getLogs(10000)
            return allLogs.filter(log => {
                const logDate = new Date(log.timestamp)
                return logDate >= startDate && logDate <= endDate
            })
        } catch (error) {
            console.error('Error getting logs by date range:', error)
            return []
        }
    }

    // Get recent activity summary
    static async getActivitySummary(days: number = 7): Promise<{
        totalActions: number
        byAction: Record<string, number>
        byTarget: Record<string, number>
        topUsers: { userId: string; userName: string; count: number }[]
    }> {
        try {
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - days)

            const logs = await this.getLogsByDateRange(startDate, new Date())

            const byAction: Record<string, number> = {}
            const byTarget: Record<string, number> = {}
            const userCounts = new Map<string, { userName: string; count: number }>()

            logs.forEach(log => {
                // Count by action
                byAction[log.action] = (byAction[log.action] || 0) + 1

                // Count by target
                byTarget[log.targetType] = (byTarget[log.targetType] || 0) + 1

                // Count by user
                const existing = userCounts.get(log.userId)
                if (existing) {
                    existing.count++
                } else {
                    userCounts.set(log.userId, { userName: log.userName, count: 1 })
                }
            })

            const topUsers = Array.from(userCounts.entries())
                .map(([userId, data]) => ({ userId, ...data }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)

            return {
                totalActions: logs.length,
                byAction,
                byTarget,
                topUsers
            }
        } catch (error) {
            console.error('Error getting activity summary:', error)
            return {
                totalActions: 0,
                byAction: {},
                byTarget: {},
                topUsers: []
            }
        }
    }

    // Clean up old logs
    static async cleanupOldLogs(keepDays: number = 90): Promise<number> {
        try {
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - keepDays)

            const allLogs = await this.getLogs(100000)
            const toDelete = allLogs.filter(
                log => new Date(log.timestamp) < cutoffDate
            )

            await Promise.all(
                toDelete.map(log => {
                    const logRef = ref(database, `${this.PATH}/${log.id}`)
                    return remove(logRef)
                })
            )

            return toDelete.length
        } catch (error) {
            console.error('Error cleaning up logs:', error)
            return 0
        }
    }

    // Helper methods for common actions
    static async logCreate(
        targetType: AuditTargetType,
        targetId: string,
        userId: string,
        userName: string,
        data?: any
    ): Promise<string> {
        return this.log('create', targetType, targetId, userId, userName, { after: data })
    }

    static async logUpdate(
        targetType: AuditTargetType,
        targetId: string,
        userId: string,
        userName: string,
        before?: any,
        after?: any
    ): Promise<string> {
        return this.log('update', targetType, targetId, userId, userName, { before, after })
    }

    static async logDelete(
        targetType: AuditTargetType,
        targetId: string,
        userId: string,
        userName: string,
        data?: any
    ): Promise<string> {
        return this.log('delete', targetType, targetId, userId, userName, { before: data })
    }

    static async logLogin(userId: string, userName: string): Promise<string> {
        return this.log('login', 'user', userId, userId, userName)
    }

    static async logLogout(userId: string, userName: string): Promise<string> {
        return this.log('logout', 'user', userId, userId, userName)
    }

    static async logQuizStart(
        quizId: string,
        userId: string,
        userName: string
    ): Promise<string> {
        return this.log('quiz_start', 'quiz', quizId, userId, userName)
    }

    static async logQuizSubmit(
        attemptId: string,
        userId: string,
        userName: string,
        score: number
    ): Promise<string> {
        return this.log('quiz_submit', 'attempt', attemptId, userId, userName, {
            description: `Score: ${score}%`
        })
    }

    static async logSettingsChange(
        userId: string,
        userName: string,
        settingKey: string,
        before: any,
        after: any
    ): Promise<string> {
        return this.log('settings_change', 'settings', settingKey, userId, userName, {
            before,
            after,
            description: `Changed ${settingKey}`
        })
    }
}
