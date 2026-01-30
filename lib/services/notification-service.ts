import { ref, push, get, set, remove, update, query, orderByChild, equalTo, limitToLast } from "firebase/database"
import { database } from "@/lib/firebase"
import type { Notification, NotificationType } from "@/lib/types"

export class NotificationService {
    private static readonly PATH = "notifications"

    // Get notifications for a user (including broadcast)
    static async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
        try {
            const notificationsRef = ref(database, this.PATH)
            const snapshot = await get(notificationsRef)

            if (!snapshot.exists()) return []

            const notifications: Notification[] = []
            const now = new Date()

            snapshot.forEach((child) => {
                const notification = { id: child.key!, ...child.val() } as Notification

                // Check if notification is for this user or is a broadcast
                if (notification.userId === userId || notification.userId === 'all') {
                    // Check if not expired
                    if (!notification.expiresAt || new Date(notification.expiresAt) > now) {
                        notifications.push(notification)
                    }
                }
            })

            return notifications
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, limit)
        } catch (error) {
            console.error('Error getting notifications:', error)
            return []
        }
    }

    // Get unread count for a user
    static async getUnreadCount(userId: string): Promise<number> {
        const notifications = await this.getUserNotifications(userId)
        return notifications.filter(n => !n.isRead).length
    }

    // Create notification for a specific user
    static async createNotification(
        userId: string,
        title: string,
        message: string,
        type: NotificationType = 'info',
        link?: string,
        expiresInDays?: number
    ): Promise<string> {
        try {
            const notificationsRef = ref(database, this.PATH)
            const newRef = push(notificationsRef)

            const notification: any = {
                userId,
                title,
                message,
                type,
                link: link || null,
                isRead: false,
                createdAt: new Date().toISOString(),
                expiresAt: expiresInDays
                    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
                    : undefined
            }

            // Remove undefined properties for Firebase
            if (notification.expiresAt === undefined) delete notification.expiresAt
            if (notification.link === undefined) delete notification.link

            await set(newRef, notification)
            return newRef.key!
        } catch (error) {
            console.error('Error creating notification:', error)
            throw error
        }
    }

    // Create broadcast notification (for all users)
    static async createBroadcast(
        title: string,
        message: string,
        type: NotificationType = 'announcement',
        link?: string,
        expiresInDays: number = 7
    ): Promise<string> {
        return this.createNotification('all', title, message, type, link, expiresInDays)
    }

    // Send quiz result notification
    static async sendQuizResultNotification(
        userId: string,
        quizTitle: string,
        score: number,
        quizId: string
    ): Promise<string> {
        const emoji = score >= 80 ? '🎉' : score >= 60 ? '👍' : '💪'
        const title = `${emoji} Kết quả bài thi`
        const message = `Bạn đạt ${score}% trong bài "${quizTitle}"`

        return this.createNotification(
            userId,
            title,
            message,
            'quiz_result',
            `/dashboard/history?quiz=${quizId}`
        )
    }

    // Send new quiz notification to all active users
    static async sendNewQuizNotification(quizTitle: string, quizId: string): Promise<string> {
        return this.createBroadcast(
            '📚 Bài thi mới',
            `Bài thi "${quizTitle}" đã được thêm vào. Hãy thử sức ngay!`,
            'quiz_new',
            `/quiz/${quizId}`
        )
    }

    // Send achievement notification
    static async sendAchievementNotification(
        userId: string,
        achievementTitle: string,
        achievementDescription: string
    ): Promise<string> {
        return this.createNotification(
            userId,
            `🏆 Thành tựu mới: ${achievementTitle}`,
            achievementDescription,
            'achievement',
            '/dashboard/achievements'
        )
    }

    // Mark notification as read
    static async markAsRead(notificationId: string): Promise<void> {
        try {
            const notificationRef = ref(database, `${this.PATH}/${notificationId}`)
            await update(notificationRef, { isRead: true })
        } catch (error) {
            console.error('Error marking notification as read:', error)
            throw error
        }
    }

    // Mark all user notifications as read
    static async markAllAsRead(userId: string): Promise<void> {
        try {
            const notifications = await this.getUserNotifications(userId)
            const updates = notifications
                .filter(n => !n.isRead)
                .map(n => this.markAsRead(n.id))

            await Promise.all(updates)
        } catch (error) {
            console.error('Error marking all as read:', error)
            throw error
        }
    }

    // Delete notification
    static async deleteNotification(notificationId: string): Promise<void> {
        try {
            const notificationRef = ref(database, `${this.PATH}/${notificationId}`)
            await remove(notificationRef)
        } catch (error) {
            console.error('Error deleting notification:', error)
            throw error
        }
    }

    // Delete all read notifications for a user
    static async deleteReadNotifications(userId: string): Promise<void> {
        try {
            const notifications = await this.getUserNotifications(userId, 1000)
            const deletes = notifications
                .filter(n => n.isRead && n.userId === userId)
                .map(n => this.deleteNotification(n.id))

            await Promise.all(deletes)
        } catch (error) {
            console.error('Error deleting read notifications:', error)
            throw error
        }
    }

    // Admin: Get all notifications
    static async getAllNotifications(limit: number = 100): Promise<Notification[]> {
        try {
            const notificationsRef = ref(database, this.PATH)
            const snapshot = await get(notificationsRef)

            if (!snapshot.exists()) return []

            const notifications: Notification[] = []
            snapshot.forEach((child) => {
                notifications.push({ id: child.key!, ...child.val() } as Notification)
            })

            return notifications
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, limit)
        } catch (error) {
            console.error('Error getting all notifications:', error)
            return []
        }
    }

    // Clean up expired notifications
    static async cleanupExpiredNotifications(): Promise<number> {
        try {
            const allNotifications = await this.getAllNotifications(10000)
            const now = new Date()

            const expired = allNotifications.filter(
                n => n.expiresAt && new Date(n.expiresAt) < now
            )

            await Promise.all(expired.map(n => this.deleteNotification(n.id)))

            return expired.length
        } catch (error) {
            console.error('Error cleaning up notifications:', error)
            return 0
        }
    }
}
