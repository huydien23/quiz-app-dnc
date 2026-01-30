// Application constants
export const APP_CONFIG = {
  name: "Eduliora Center",
  description: "Nâng Tầm Tri Thức - Hệ thống luyện thi trắc nghiệm trực tuyến hiện đại",
  version: "1.2.0",
  author: "Hồ Hoàng Lanh"
} as const

export const FOUNDER_CONFIG = {
  name: "Hồ Hoàng Lanh",
  class: "DH23TIN03",
  location: "Cà Mau",
  bio: "Sinh viên năm 3 ngành Công nghệ thông tin tại Đại học Nam Cần Thơ, chuyên về phát triển Web Fullstack với niềm đam mê kiến tạo những sản phẩm công nghệ giáo dục hữu ích cho cộng đồng.",
  socials: {
    github: "lanhhohoang",
    facebook: "hohoanglanh.cm",
    zalo: "0334455667" // Example number, replace with actual
  }
} as const

// File upload constants
export const FILE_UPLOAD = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['.json', '.docx', '.pdf', '.xlsx', '.xls'],
  supportedFormats: [
    { type: "JSON", extension: ".json", description: "Định dạng JSON chuẩn" },
    { type: "Word", extension: ".docx", description: "Microsoft Word document" },
    { type: "PDF", extension: ".pdf", description: "Portable Document Format" },
    { type: "Excel", extension: ".xlsx", description: "Microsoft Excel spreadsheet" },
  ]
} as const

// Quiz constants
export const QUIZ_CONFIG = {
  defaultTimeLimit: 30, // minutes
  minQuestions: 1,
  maxQuestions: 100,
  minOptions: 2,
  maxOptions: 6,
  defaultOptions: 4
} as const

// User roles
export const USER_ROLES = {
  ADMIN: 0,
  STUDENT: 1
} as const

// Score thresholds
export const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 80,
  AVERAGE: 70,
  POOR: 60
} as const

// API endpoints (if using API routes)
export const API_ENDPOINTS = {
  QUIZZES: '/api/quizzes',
  USERS: '/api/users',
  ATTEMPTS: '/api/attempts',
  LEADERBOARD: '/api/leaderboard'
} as const

// UI constants
export const UI_CONFIG = {
  itemsPerPage: 10,
  leaderboardLimit: 50,
  recentActivityLimit: 20,
  animationDuration: 300
} as const

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.",
  AUTH_ERROR: "Lỗi xác thực. Vui lòng đăng nhập lại.",
  PERMISSION_ERROR: "Bạn không có quyền thực hiện hành động này.",
  FILE_UPLOAD_ERROR: "Lỗi upload file. Vui lòng thử lại.",
  QUIZ_NOT_FOUND: "Không tìm thấy bài thi.",
  USER_NOT_FOUND: "Không tìm thấy người dùng.",
  GENERIC_ERROR: "Đã xảy ra lỗi. Vui lòng thử lại."
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  QUIZ_CREATED: "Tạo bài thi thành công!",
  QUIZ_UPDATED: "Cập nhật bài thi thành công!",
  QUIZ_DELETED: "Xóa bài thi thành công!",
  QUIZ_COMPLETED: "Hoàn thành bài thi thành công!",
  FILE_UPLOADED: "Upload file thành công!",
  PROFILE_UPDATED: "Cập nhật thông tin thành công!",
  LOGOUT_SUCCESS: "Đăng xuất thành công!"
} as const
