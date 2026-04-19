import { ref, push, get, set, remove, update } from "firebase/database"
import { database } from "@/lib/firebase"
import type { Comment } from "@/lib/types"

export class CommentService {
    private static readonly PATH = "comments"

    // Get comments for a quiz (approved only)
    static async getQuizComments(quizId: string): Promise<Comment[]> {
        try {
            const commentsRef = ref(database, this.PATH)
            const snapshot = await get(commentsRef)

            if (!snapshot.exists()) return []

            const comments: Comment[] = []
            snapshot.forEach((child) => {
                const comment = { id: child.key!, ...child.val() } as Comment
                if (comment.quizId === quizId && comment.isApproved) {
                    comments.push(comment)
                }
            })

            return comments.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        } catch (error) {
            console.error('Error getting quiz comments:', error)
            return []
        }
    }

    // Get all comments for a quiz (including unapproved - for admin)
    static async getAllQuizComments(quizId: string): Promise<Comment[]> {
        try {
            const commentsRef = ref(database, this.PATH)
            const snapshot = await get(commentsRef)

            if (!snapshot.exists()) return []

            const comments: Comment[] = []
            snapshot.forEach((child) => {
                const comment = { id: child.key!, ...child.val() } as Comment
                if (comment.quizId === quizId) {
                    comments.push(comment)
                }
            })

            return comments.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        } catch (error) {
            console.error('Error getting all quiz comments:', error)
            return []
        }
    }

    // Get all pending comments (for admin moderation)
    static async getPendingComments(): Promise<Comment[]> {
        try {
            const commentsRef = ref(database, this.PATH)
            const snapshot = await get(commentsRef)

            if (!snapshot.exists()) return []

            const comments: Comment[] = []
            snapshot.forEach((child) => {
                const comment = { id: child.key!, ...child.val() } as Comment
                if (!comment.isApproved) {
                    comments.push(comment)
                }
            })

            return comments.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        } catch (error) {
            console.error('Error getting pending comments:', error)
            return []
        }
    }

    // Get all comments (for admin)
    static async getAllComments(limit: number = 100): Promise<Comment[]> {
        try {
            const commentsRef = ref(database, this.PATH)
            const snapshot = await get(commentsRef)

            if (!snapshot.exists()) return []

            const comments: Comment[] = []
            snapshot.forEach((child) => {
                comments.push({ id: child.key!, ...child.val() } as Comment)
            })

            return comments
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, limit)
        } catch (error) {
            console.error('Error getting all comments:', error)
            return []
        }
    }

    // Get user's comments
    static async getUserComments(userId: string): Promise<Comment[]> {
        try {
            const commentsRef = ref(database, this.PATH)
            const snapshot = await get(commentsRef)

            if (!snapshot.exists()) return []

            const comments: Comment[] = []
            snapshot.forEach((child) => {
                const comment = { id: child.key!, ...child.val() } as Comment
                if (comment.userId === userId) {
                    comments.push(comment)
                }
            })

            return comments.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        } catch (error) {
            console.error('Error getting user comments:', error)
            return []
        }
    }

    // Check if user already commented on a quiz
    static async hasUserCommented(userId: string, quizId: string): Promise<boolean> {
        try {
            const commentsRef = ref(database, this.PATH)
            const snapshot = await get(commentsRef)

            if (!snapshot.exists()) return false

            let hasCommented = false
            snapshot.forEach((child) => {
                const comment = child.val() as Comment
                if (comment.userId === userId && comment.quizId === quizId) {
                    hasCommented = true
                }
            })

            return hasCommented
        } catch (error) {
            console.error('Error checking user comment:', error)
            return false
        }
    }

    // Create new comment
    static async createComment(
        quizId: string,
        userId: string,
        userName: string,
        content: string,
        rating: 1 | 2 | 3 | 4 | 5,
        userAvatar?: string,
        autoApprove: boolean = false,
        parentId?: string
    ): Promise<string> {
        try {
            const commentsRef = ref(database, this.PATH)
            const newRef = push(commentsRef)

            const comment: any = {
                quizId,
                userId,
                userName,
                userAvatar,
                content,
                rating,
                isApproved: autoApprove,
                createdAt: new Date().toISOString(),
                parentId
            }

            // Remove undefined properties for Firebase
            if (comment.userAvatar === undefined) delete comment.userAvatar
            if (comment.parentId === undefined) delete comment.parentId

            await set(newRef, comment)
            return newRef.key!
        } catch (error) {
            console.error('Error creating comment:', error)
            throw error
        }
    }

    // Update comment
    static async updateComment(id: string, content: string, rating: 1 | 2 | 3 | 4 | 5): Promise<void> {
        try {
            const commentRef = ref(database, `${this.PATH}/${id}`)
            await update(commentRef, {
                content,
                rating,
                updatedAt: new Date().toISOString()
            })
        } catch (error) {
            console.error('Error updating comment:', error)
            throw error
        }
    }

    // Approve comment
    static async approveComment(id: string): Promise<void> {
        try {
            const commentRef = ref(database, `${this.PATH}/${id}`)
            await update(commentRef, { isApproved: true })
        } catch (error) {
            console.error('Error approving comment:', error)
            throw error
        }
    }

    // Reject/Unapprove comment
    static async rejectComment(id: string): Promise<void> {
        try {
            const commentRef = ref(database, `${this.PATH}/${id}`)
            await update(commentRef, { isApproved: false })
        } catch (error) {
            console.error('Error rejecting comment:', error)
            throw error
        }
    }

    // Add admin reply
    static async addAdminReply(id: string, reply: string): Promise<void> {
        try {
            const commentRef = ref(database, `${this.PATH}/${id}`)
            await update(commentRef, {
                adminReply: reply,
                adminReplyAt: new Date().toISOString()
            })
        } catch (error) {
            console.error('Error adding admin reply:', error)
            throw error
        }
    }

    // Delete comment
    static async deleteComment(id: string): Promise<void> {
        try {
            const commentRef = ref(database, `${this.PATH}/${id}`)
            await remove(commentRef)
        } catch (error) {
            console.error('Error deleting comment:', error)
            throw error
        }
    }

    // Get quiz average rating
    static async getQuizAverageRating(quizId: string): Promise<{ average: number; count: number }> {
        try {
            const comments = await this.getQuizComments(quizId)

            if (comments.length === 0) {
                return { average: 0, count: 0 }
            }

            const total = comments.reduce((sum, c) => sum + c.rating, 0)
            return {
                average: Math.round((total / comments.length) * 10) / 10,
                count: comments.length
            }
        } catch (error) {
            console.error('Error getting quiz average rating:', error)
            return { average: 0, count: 0 }
        }
    }

    // Get comments stats (for admin dashboard)
    static async getCommentsStats(): Promise<{
        total: number
        pending: number
        approved: number
        averageRating: number
    }> {
        try {
            const comments = await this.getAllComments(10000)

            const pending = comments.filter(c => !c.isApproved).length
            const approved = comments.filter(c => c.isApproved).length
            const totalRating = comments.reduce((sum, c) => sum + c.rating, 0)

            return {
                total: comments.length,
                pending,
                approved,
                averageRating: comments.length > 0
                    ? Math.round((totalRating / comments.length) * 10) / 10
                    : 0
            }
        } catch (error) {
            console.error('Error getting comments stats:', error)
            return { total: 0, pending: 0, approved: 0, averageRating: 0 }
        }
    }
}
