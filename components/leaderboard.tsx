"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, Medal, Award, Crown, Star, 
  TrendingUp, Clock, Target, Users, 
  RefreshCw, Calendar, Timer, BarChart3, Activity
} from "lucide-react"
import { LeaderboardService } from "@/lib/leaderboard-service"
import type { LeaderboardEntry } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { vi } from "date-fns/locale"

interface LeaderboardProps {
  userId?: string
}

export function Leaderboard({ userId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [userStats, setUserStats] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadLeaderboardData()
  }, [userId])

  const loadLeaderboardData = async () => {
    try {
      setLoading(true)
      
      const [leaderboardData, activityData, userStatsData] = await Promise.all([
        LeaderboardService.getLeaderboard(50),
        LeaderboardService.getRecentActivity(20),
        userId ? LeaderboardService.getUserStats(userId) : Promise.resolve(null)
      ])

      setLeaderboard(leaderboardData)
      setRecentActivity(activityData)
      setUserStats(userStatsData)
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadLeaderboardData()
    setRefreshing(false)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-500" />
      case 2: return <Medal className="h-5 w-5 text-gray-400" />
      case 3: return <Award className="h-5 w-5 text-amber-600" />
      default: return <Trophy className="h-4 w-4 text-slate-500" />
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-600"
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-500"
      case 3: return "bg-gradient-to-r from-amber-400 to-amber-600"
      default: return "bg-slate-100"
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 font-heading">Bảng Xếp Hạng</h1>
          <p className="text-slate-600 font-body">Top người dùng xuất sắc nhất</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="btn-secondary">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* User Stats (if logged in) */}
      {userStats && (
        <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              Thống kê của bạn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">#{userStats.rank}</div>
                <div className="text-sm text-slate-600">Xếp hạng</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.averageScore}%</div>
                <div className="text-sm text-slate-600">Điểm TB</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{userStats.totalQuizzes}</div>
                <div className="text-sm text-slate-600">Bài thi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{userStats.bestScore}%</div>
                <div className="text-sm text-slate-600">Điểm cao nhất</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="leaderboard">Bảng xếp hạng</TabsTrigger>
          <TabsTrigger value="activity">Hoạt động gần đây</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-6">
          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* 2nd Place */}
              {leaderboard[1] && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`w-16 h-16 rounded-full ${getRankColor(2)} flex items-center justify-center text-white text-2xl font-bold`}>
                        2
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">{leaderboard[1].userName}</h3>
                    <p className="text-sm text-slate-600 mb-2">{leaderboard[1].averageScore}% điểm trung bình</p>
                    <Badge variant="secondary">{leaderboard[1].totalQuizzes} bài thi</Badge>
                  </CardContent>
                </Card>
              )}

              {/* 1st Place */}
              {leaderboard[0] && (
                <Card className="border-0 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-2xl transform scale-105">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`w-20 h-20 rounded-full ${getRankColor(1)} flex items-center justify-center text-white text-3xl font-bold`}>
                        1
                      </div>
                    </div>
                    <h3 className="font-bold text-xl text-slate-800">{leaderboard[0].userName}</h3>
                    <p className="text-sm text-slate-600 mb-2">{leaderboard[0].averageScore}% điểm trung bình</p>
                    <Badge className="bg-yellow-500 text-white">{leaderboard[0].totalQuizzes} bài thi</Badge>
                  </CardContent>
                </Card>
              )}

              {/* 3rd Place */}
              {leaderboard[2] && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                  <CardContent className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <div className={`w-16 h-16 rounded-full ${getRankColor(3)} flex items-center justify-center text-white text-2xl font-bold`}>
                        3
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">{leaderboard[2].userName}</h3>
                    <p className="text-sm text-slate-600 mb-2">{leaderboard[2].averageScore}% điểm trung bình</p>
                    <Badge variant="secondary">{leaderboard[2].totalQuizzes} bài thi</Badge>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Full Leaderboard */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Bảng xếp hạng đầy đủ
              </CardTitle>
              <CardDescription>Danh sách tất cả người dùng theo thứ tự xếp hạng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>Chưa có dữ liệu xếp hạng</p>
                  </div>
                ) : (
                  leaderboard.map((entry, index) => (
                    <div 
                      key={entry.userId} 
                      className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                        entry.rank <= 3 
                          ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200' 
                          : 'bg-slate-50/50 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${getRankColor(entry.rank)} flex items-center justify-center text-white font-bold`}>
                          {entry.rank}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{entry.userName}</h4>
                          <p className="text-sm text-slate-600">{entry.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{entry.averageScore}%</p>
                          <p className="text-xs text-slate-600">Điểm TB</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{entry.totalQuizzes}</p>
                          <p className="text-xs text-slate-600">Bài thi</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{entry.bestScore}%</p>
                          <p className="text-xs text-slate-600">Tốt nhất</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{formatTime(entry.totalTimeSpent)}</p>
                          <p className="text-xs text-slate-600">Thời gian</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Hoạt động gần đây
              </CardTitle>
              <CardDescription>Những bài thi được hoàn thành gần đây nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>Chưa có hoạt động nào</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center text-sm">
                          <Target className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-800">
                            <span className="font-medium">{activity.userName}</span> đã hoàn thành bài thi 
                            <span className="font-medium"> "{activity.quizTitle}"</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDistanceToNow(new Date(activity.completedAt), { addSuffix: true, locale: vi })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={activity.score >= 80 ? "default" : activity.score >= 60 ? "secondary" : "destructive"}>
                          {activity.score}%
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
