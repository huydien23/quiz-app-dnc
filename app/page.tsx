import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Trophy, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <BookOpen className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            Luyện thi trắc nghiệm
            <span className="text-primary"> hiệu quả</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-pretty">
            Hệ thống luyện thi trực tuyến với hàng ngàn câu hỏi, theo dõi tiến độ và phân tích kết quả chi tiết
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Bắt đầu ngay
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 bg-transparent">
                Đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Tính năng nổi bật</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Dành cho mọi người</CardTitle>
                <CardDescription>
                  Phù hợp với học sinh, sinh viên và người đi làm muốn nâng cao kiến thức
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Trophy className="h-12 w-12 text-secondary mb-4" />
                <CardTitle>Theo dõi tiến độ</CardTitle>
                <CardDescription>
                  Xem chi tiết kết quả, điểm số và thống kê để cải thiện hiệu suất học tập
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Luyện tập linh hoạt</CardTitle>
                <CardDescription>
                  Làm bài thi mọi lúc mọi nơi với thời gian linh hoạt phù hợp với lịch trình
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">Sẵn sàng bắt đầu hành trình học tập?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Tham gia cùng hàng nghìn học viên đã cải thiện kết quả thi cử
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              Đăng ký miễn phí
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
