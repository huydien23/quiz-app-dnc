# QuizMaster - Hệ thống luyện thi trắc nghiệm

Một ứng dụng web hiện đại cho việc tạo và quản lý bài thi trắc nghiệm trực tuyến, được xây dựng với Next.js 14, TypeScript, và Firebase.

## ✨ Tính năng chính

### 📚 Dành cho học sinh
- **Làm bài thi trực tuyến**: Giao diện làm bài thân thiện, responsive
- **Random câu hỏi**: Mỗi lần làm bài sẽ random 40 câu từ bộ câu hỏi
- **Điều hướng thông minh**: Navigation grid để chuyển câu nhanh
- **Thống kê cá nhân**: Theo dõi điểm số, xếp hạng, tiến độ
- **Dashboard cá nhân**: Tổng quan thành tích và hoạt động

### 🎯 Dành cho admin
- **Quản lý bài thi**: Tạo, chỉnh sửa, ẩn/hiện bài thi
- **Import thông minh**: Upload file JSON, Excel, Word, PDF với preview và sửa lỗi
- **Tạo nhanh**: Copy-paste nội dung và tự động phân tích câu hỏi
- **Quản lý người dùng**: Xem danh sách, tạo tài khoản
- **Thống kê tổng quan**: Analytics và báo cáo chi tiết
- **Draft system**: Bài thi nháp cho câu hỏi chưa hoàn chỉnh

### 🚀 Tính năng upload file cải tiến
- **Hỗ trợ đa định dạng**: JSON, XLSX, DOCX, PDF
- **Parser linh hoạt**: Không bắt buộc đáp án, cho phép format khác nhau
- **Preview & Edit**: Xem trước và sửa lỗi trước khi import
- **Validation thông minh**: Cảnh báo câu thiếu đáp án, format sai
- **Template download**: Tải mẫu để import đúng format

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Shadcn/ui
- **Backend**: Firebase (Authentication + Realtime Database)
- **State Management**: React Context + Hooks
- **File Processing**: XLSX, Mammoth (Word), PDF.js
- **Icons**: Lucide React
- **Deployment**: Vercel

## 📋 Yêu cầu hệ thống

- Node.js 18+ 
- pnpm (khuyến nghị)
- Firebase project

## 🚀 Cài đặt và chạy

### 1. Clone repository
```bash
git clone <your-repo-url>
cd quiz-app
```

### 2. Cài đặt dependencies
```bash
pnpm install
```

### 3. Cấu hình Firebase

#### Tạo Firebase project:
1. Truy cập [Firebase Console](https://console.firebase.google.com)
2. Tạo project mới
3. Bật Authentication (Email/Password + Google)
4. Bật Realtime Database
5. Lấy config từ Project Settings

#### Tạo file `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com/
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Chạy development server
```bash
pnpm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### 5. Build production
```bash
pnpm run build
pnpm run start
```

## 📁 Cấu trúc project

```
quiz-app/
├── app/                    # Next.js 14 App Router
│   ├── (marketing)/        # Landing pages
│   ├── admin/              # Admin dashboard
│   ├── dashboard/          # Student dashboard  
│   ├── quiz/[id]/          # Quiz taking pages
│   └── layout.tsx          # Root layout
├── components/             # Reusable components
│   ├── ui/                 # Base UI components
│   ├── admin-*.tsx         # Admin-specific components
│   ├── enhanced-quiz-file-uploader.tsx  # File upload with preview
│   └── ...
├── lib/                    # Utilities and services
│   ├── firebase.ts         # Firebase config
│   ├── quiz-service.ts     # Quiz CRUD operations
│   ├── admin-service.ts    # Admin operations
│   └── types.ts            # TypeScript types
└── public/                 # Static assets
    └── sample-quiz.*       # Sample files for testing
```

## 💡 Sử dụng

### Tạo tài khoản admin đầu tiên
1. Đăng ký tài khoản bình thường
2. Vào Firebase Console > Realtime Database
3. Sửa `users/{userId}/role` từ `1` thành `0`

### Upload file bài thi

#### Format JSON (khuyến nghị):
```json
{
  "title": "Bài thi mẫu",
  "description": "Mô tả bài thi",
  "timeLimit": 60,
  "questions": [
    {
      "id": 1,
      "question": "Python là gì?",
      "options": ["Ngôn ngữ lập trình", "Hệ điều hành", "Database", "Framework"],
      "correctAnswer": 0,
      "explanation": "Python là ngôn ngữ lập trình bậc cao"
    }
  ]
}
```

#### Format Excel/CSV:
| Câu hỏi | Lựa chọn A | Lựa chọn B | Lựa chọn C | Lựa chọn D | Đáp án | Giải thích |
|---------|------------|------------|------------|------------|---------|------------|
| 2+2=? | 3 | 4 | 5 | 6 | B | 2+2=4 |

#### Format Word/PDF:
```
Question: Python là gì?
A) Ngôn ngữ lập trình
B) Hệ điều hành  
C) Database
D) Framework
Answer: A
Explanation: Python là ngôn ngữ lập trình bậc cao
```

### Triển khai lên Vercel

1. Đẩy code lên GitHub
2. Kết nối với Vercel
3. Thêm environment variables từ `.env.local`
4. Deploy!

## 🐛 Troubleshooting

### Lỗi Firebase connection
- Kiểm tra file `.env.local` có đúng format không
- Đảm bảo Firebase project đã bật Authentication và Realtime Database
- Kiểm tra domain trong Firebase Console Settings

### Lỗi build TypeScript  
- Chạy `pnpm run build` để xem lỗi cụ thể
- Kiểm tra các import components
- Đảm bảo tất cả types được define

### Lỗi upload file
- Kiểm tra file size (max 10MB)
- Đảm bảo format file đúng
- Xem console để debug parser errors

## 📝 TODO / Roadmap

- [x] ✅ Upload file với preview và validation
- [x] ✅ Tolerant parsing (không bắt buộc đáp án)
- [x] ✅ Draft system cho incomplete questions
- [x] ✅ Admin layout refactor (bỏ negative margin hacks)
- [x] ✅ Strict build settings
- [ ] 🔄 AI integration cho auto-explanation và suggest answers
- [ ] 📊 Advanced analytics với charts
- [ ] 🔐 Role-based permissions (teacher, student, admin)
- [ ] 📱 PWA support
- [ ] 🌙 Dark mode
- [ ] 🎨 Theme customization
- [ ] 📧 Email notifications
- [ ] 📤 Export results to Excel/PDF

## 🤝 Contributing

1. Fork project
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Hỗ trợ

Nếu gặp vấn đề hoặc có đề xuất, hãy:
- Tạo Issue trên GitHub
- Hoặc liên hệ trực tiếp

---

**QuizMaster** - Nâng cao trải nghiệm luyện thi trắc nghiệm! 🎓✨