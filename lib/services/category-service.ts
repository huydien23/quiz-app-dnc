import { ref, push, get, set, remove, update } from "firebase/database"
import { database } from "@/lib/firebase"
import type { Category } from "@/lib/types"

export class CategoryService {
    private static readonly PATH = "categories"

    // Get all categories
    static async getAllCategories(): Promise<Category[]> {
        try {
            const categoriesRef = ref(database, this.PATH)
            const snapshot = await get(categoriesRef)

            if (!snapshot.exists()) return []

            const categories: Category[] = []
            snapshot.forEach((child) => {
                categories.push({ id: child.key!, ...child.val() } as Category)
            })

            return categories.sort((a, b) => a.order - b.order)
        } catch (error) {
            console.error('Error getting categories:', error)
            return []
        }
    }

    // Get active categories only
    static async getActiveCategories(): Promise<Category[]> {
        const all = await this.getAllCategories()
        return all.filter(cat => cat.isActive)
    }

    // Get category by ID
    static async getCategoryById(id: string): Promise<Category | null> {
        try {
            const categoryRef = ref(database, `${this.PATH}/${id}`)
            const snapshot = await get(categoryRef)

            if (!snapshot.exists()) return null

            return { id, ...snapshot.val() } as Category
        } catch (error) {
            console.error('Error getting category:', error)
            return null
        }
    }

    // Create new category
    static async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'quizCount'>): Promise<string> {
        try {
            const categoriesRef = ref(database, this.PATH)
            const newRef = push(categoriesRef)

            const category: Omit<Category, 'id'> = {
                ...data,
                quizCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            await set(newRef, category)
            return newRef.key!
        } catch (error) {
            console.error('Error creating category:', error)
            throw error
        }
    }

    // Update category
    static async updateCategory(id: string, data: Partial<Category>): Promise<void> {
        try {
            const categoryRef = ref(database, `${this.PATH}/${id}`)
            await update(categoryRef, {
                ...data,
                updatedAt: new Date().toISOString()
            })
        } catch (error) {
            console.error('Error updating category:', error)
            throw error
        }
    }

    // Delete category
    static async deleteCategory(id: string): Promise<void> {
        try {
            const categoryRef = ref(database, `${this.PATH}/${id}`)
            await remove(categoryRef)
        } catch (error) {
            console.error('Error deleting category:', error)
            throw error
        }
    }

    // Update quiz count for a category
    static async updateQuizCount(categoryId: string, increment: number = 1): Promise<void> {
        try {
            const category = await this.getCategoryById(categoryId)
            if (category) {
                await this.updateCategory(categoryId, {
                    quizCount: Math.max(0, (category.quizCount || 0) + increment)
                })
            }
        } catch (error) {
            console.error('Error updating quiz count:', error)
        }
    }

    // Get categories with quiz counts
    static async getCategoriesWithStats(): Promise<(Category & { activeQuizzes: number })[]> {
        try {
            const [categories, quizzesSnapshot] = await Promise.all([
                this.getAllCategories(),
                get(ref(database, "quizzes"))
            ])

            const quizCountMap = new Map<string, number>()

            if (quizzesSnapshot.exists()) {
                quizzesSnapshot.forEach((child) => {
                    const quiz = child.val()
                    if (quiz.categoryId && quiz.isActive && !quiz.isDraft) {
                        quizCountMap.set(
                            quiz.categoryId,
                            (quizCountMap.get(quiz.categoryId) || 0) + 1
                        )
                    }
                })
            }

            return categories.map(cat => ({
                ...cat,
                activeQuizzes: quizCountMap.get(cat.id) || 0
            }))
        } catch (error) {
            console.error('Error getting categories with stats:', error)
            return []
        }
    }

    // Reorder categories
    static async reorderCategories(orderedIds: string[]): Promise<void> {
        try {
            const updates: Promise<void>[] = orderedIds.map((id, index) =>
                this.updateCategory(id, { order: index })
            )
            await Promise.all(updates)
        } catch (error) {
            console.error('Error reordering categories:', error)
            throw error
        }
    }
}
