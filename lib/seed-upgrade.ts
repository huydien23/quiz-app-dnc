import { ref, set } from "firebase/database"
import { database } from "./firebase"
import { DEFAULT_SETTINGS } from "./types"

/**
 * Script này dùng để khởi tạo các bảng mới trong Firebase Realtime Database
 * Dữ liệu bao gồm: Settings mặc định, Danh mục mẫu, và các bảng trống.
 */
export async function seedUpgradeDatabase() {
    console.log("🚀 Đang khởi tạo dữ liệu nâng cấp...")

    try {
        // 1. Khởi tạo System Settings (Rất quan trọng)
        console.log("- Khởi tạo System Settings...")
        const settingsRef = ref(database, "settings")
        await set(settingsRef, DEFAULT_SETTINGS)

        // 2. Khởi tạo Categories mẫu
        console.log("- Khởi tạo Danh mục mẫu...")
        const categoriesRef = ref(database, "categories")
        const sampleCategories = {
            "cat_1": {
                id: "cat_1",
                name: "Công nghệ thông tin",
                description: "Các bài thi về lập trình, phần cứng, mạng máy tính",
                icon: "Code",
                color: "#3b82f6",
                order: 1,
                quizCount: 0,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            "cat_2": {
                id: "cat_2",
                name: "Ngoại ngữ",
                description: "Tiếng Anh, Tiếng Nhật, Tiếng Hàn",
                icon: "Languages",
                color: "#10b981",
                order: 2,
                quizCount: 0,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        }
        await set(categoriesRef, sampleCategories)

        // 3. Khởi tạo Achievements mẫu (Định nghĩa)
        console.log("- Khởi tạo Achievements definitions...")
        // Lưu ý: data thực của user sẽ nằm ở /user_achievements/{userId}

        // 4. Khởi tạo các bảng khác ở trạng thái rỗng (Firebase sẽ không hiện nếu rỗng hoàn toàn, 
        // nhưng chúng ta có thể ghi một bản ghi log đầu tiên)
        console.log("- Khởi tạo Audit Log đầu tiên...")
        const firstLogRef = ref(database, "audit_logs/initial")
        await set(firstLogRef, {
            action: "system_upgrade",
            targetType: "settings",
            targetId: "global",
            userId: "system",
            userName: "System",
            details: { description: "Khởi tạo hệ thống nâng cấp thành công" },
            timestamp: new Date().toISOString()
        })

        // 5. Khởi tạo Ranking History đầu tiên
        console.log("- Khởi tạo Ranking History...")
        const firstHistoryRef = ref(database, "ranking_history/initial")
        await set(firstHistoryRef, {
            userId: "system",
            rank: 0,
            averageScore: 0,
            period: "daily",
            recordedAt: new Date().toISOString()
        })

        console.log("✅ Hoàn thành khởi tạo dữ liệu!")
        return { success: true, message: "Đã khởi tạo database thành công" }
    } catch (error: any) {
        console.error("❌ Lỗi khi seed database:", error)
        return { success: false, message: error.message }
    }
}
