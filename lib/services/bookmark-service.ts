import { ref, get, set, remove } from "firebase/database"
import { database } from "@/lib/firebase"
import type { Bookmark, Quiz } from "@/lib/types"

export class BookmarkService {
    private static readonly PATH = "bookmarks"

    // Helper to get consistent ID
    private static getPath(userId: string, quizId: string): string {
        return `${this.PATH}/${userId}_${quizId}`;
    }

    // Get all bookmarks for a user
    static async getUserBookmarks(userId: string): Promise<Bookmark[]> {
        try {
            const bookmarksRef = ref(database, this.PATH)
            const snapshot = await get(bookmarksRef)

            if (!snapshot.exists()) return []

            const bookmarks: Bookmark[] = []
            snapshot.forEach((child) => {
                const bookmark = { id: child.key!, ...child.val() } as Bookmark
                if (bookmark.userId === userId) {
                    bookmarks.push(bookmark)
                }
            })

            return bookmarks.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        } catch (error) {
            console.error('Error getting bookmarks:', error)
            return []
        }
    }

    // Get bookmarks with quiz details
    static async getUserBookmarksWithQuizzes(userId: string): Promise<(Bookmark & { quiz: Quiz | null })[]> {
        try {
            const [bookmarks, quizzesSnapshot] = await Promise.all([
                this.getUserBookmarks(userId),
                get(ref(database, "quizzes"))
            ])

            const quizzes = new Map<string, Quiz>()
            if (quizzesSnapshot.exists()) {
                quizzesSnapshot.forEach((child) => {
                    quizzes.set(child.key!, { id: child.key!, ...child.val() } as Quiz)
                })
            }

            return bookmarks.map(bookmark => ({
                ...bookmark,
                quiz: quizzes.get(bookmark.quizId) || null
            }))
        } catch (error) {
            console.error('Error getting bookmarks with quizzes:', error)
            return []
        }
    }

    // Check if quiz is bookmarked by user
    static async isBookmarked(userId: string, quizId: string): Promise<boolean> {
        try {
            const bookmarkId = `${userId}_${quizId}`;
            const bookmarkRef = ref(database, `${this.PATH}/${bookmarkId}`);
            const snapshot = await get(bookmarkRef);
            return snapshot.exists();
        } catch (error) {
            console.error('Error checking bookmark:', error)
            return false
        }
    }

    // Get bookmark ID if exists
    static async getBookmarkId(userId: string, quizId: string): Promise<string | null> {
        try {
            const isExist = await this.isBookmarked(userId, quizId);
            return isExist ? `${userId}_${quizId}` : null;
        } catch (error) {
            console.error('Error getting bookmark ID:', error)
            return null
        }
    }

    // Add bookmark
    static async addBookmark(userId: string, quizId: string, note?: string): Promise<string> {
        try {
            const bookmarkId = `${userId}_${quizId}`;
            const bookmarkRef = ref(database, `${this.PATH}/${bookmarkId}`);

            const bookmark: Bookmark = {
                id: bookmarkId,
                userId,
                quizId,
                note,
                createdAt: new Date().toISOString()
            }

            if (bookmark.note === undefined) delete bookmark.note

            await set(bookmarkRef, bookmark)
            return bookmarkId
        } catch (error) {
            console.error('Error adding bookmark:', error)
            throw error
        }
    }

    // Remove bookmark
    static async removeBookmark(bookmarkId: string): Promise<void> {
        try {
            const bookmarkRef = ref(database, `${this.PATH}/${bookmarkId}`)
            await remove(bookmarkRef)
        } catch (error) {
            console.error('Error removing bookmark:', error)
            throw error
        }
    }

    // Remove bookmark by user and quiz
    static async removeBookmarkByQuiz(userId: string, quizId: string): Promise<void> {
        try {
            const bookmarkId = `${userId}_${quizId}`;
            await this.removeBookmark(bookmarkId)
        } catch (error) {
            console.error('Error removing bookmark by quiz:', error)
            throw error
        }
    }

    // Toggle bookmark (add if not exists, remove if exists)
    static async toggleBookmark(userId: string, quizId: string): Promise<{ isBookmarked: boolean; bookmarkId?: string }> {
        try {
            const isExist = await this.isBookmarked(userId, quizId);

            if (isExist) {
                await this.removeBookmarkByQuiz(userId, quizId)
                return { isBookmarked: false }
            } else {
                const newId = await this.addBookmark(userId, quizId)
                return { isBookmarked: true, bookmarkId: newId }
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error)
            throw error
        }
    }

    // Update bookmark note
    static async updateNote(bookmarkId: string, note: string): Promise<void> {
        try {
            const bookmarkRef = ref(database, `${this.PATH}/${bookmarkId}`)
            const snapshot = await get(bookmarkRef)

            if (snapshot.exists()) {
                await set(bookmarkRef, {
                    ...snapshot.val(),
                    note,
                    updatedAt: new Date().toISOString()
                })
            }
        } catch (error) {
            console.error('Error updating bookmark note:', error)
            throw error
        }
    }

    // Get bookmark count for a quiz
    static async getQuizBookmarkCount(quizId: string): Promise<number> {
        try {
            const bookmarksRef = ref(database, this.PATH)
            const snapshot = await get(bookmarksRef)

            if (!snapshot.exists()) return 0

            let count = 0
            snapshot.forEach((child) => {
                const bookmark = child.val() as Bookmark
                if (bookmark.quizId === quizId) {
                    count++
                }
            })

            return count
        } catch (error) {
            console.error('Error getting quiz bookmark count:', error)
            return 0
        }
    }
}
