"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Trophy, Medal, Award, Crown, Star, 
  TrendingUp, Clock, Target, Users, 
  RefreshCw, Calendar, Timer, BarChart3, Activity, BookOpen
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
    <div className="space-y-4 sm:space-y-6 pb-24">
      {/* Refresh Button - Mobile floating */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="h-9 px-3 sm:h-10 sm:px-4 border-slate-200 shadow-sm">
          <RefreshCw className={`h-4 w-4 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Làm mới</span>
        </Button>
      </div>

      {/* User Stats (if logged in) - Compact mobile */}
      {userStats && (
        <Card className="border-0 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg animate-fade-in">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl p-2.5 sm:p-3 shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 truncate">Xếp hạng</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">#{userStats.rank}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl p-2.5 sm:p-3 shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 truncate">Điểm TB</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{userStats.averageScore}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl p-2.5 sm:p-3 shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 truncate">Bài thi</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">{userStats.totalQuizzes}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 bg-white rounded-xl p-2.5 sm:p-3 shadow-sm">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-600 truncate">Cao nhất</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">{userStats.bestScore}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="leaderboard" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-slate-200 p-1 rounded-lg shadow-sm h-11">
          <TabsTrigger value="leaderboard" className="rounded-md flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
            <Trophy className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">Xếp hạng</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-md flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
            <Activity className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">Hoạt động</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4 sm:space-y-6">
          {/* Top 3 Podium - Compact mobile */}
          {leaderboard.length >= 3 && (
            <div className="space-y-3">
              {/* 1st Place - Featured */}
              {leaderboard[0] && (
                <Card className="border-0 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg animate-fade-in">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Crown className="absolute -top-1 -right-1 h-5 w-5 text-yellow-500" />
                        <div className={`w-14 h-14 rounded-full ${getRankColor(1)} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                          1
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-slate-800 truncate">{leaderboard[0].userName}</h3>
                        <p className="text-sm text-slate-600">{leaderboard[0].averageScore}% • {leaderboard[0].totalQuizzes} bài thi</p>
                      </div>
                      <Badge className="bg-yellow-500 text-white text-xs px-2 py-1">👑 Top 1</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 2nd & 3rd Place - Side by side */}
              <div className="grid grid-cols-2 gap-3">
                {leaderboard[1] && (
                  <Card className="border-0 bg-white shadow-md animate-fade-in" style={{ animationDelay: '100ms' }}>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className={`w-12 h-12 mx-auto rounded-full ${getRankColor(2)} flex items-center justify-center text-white text-xl font-bold shadow-md mb-2`}>
                          2
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 truncate mb-1">{leaderboard[1].userName}</h4>
                        <p className="text-xs text-slate-600">{leaderboard[1].averageScore}%</p>
                        <Badge variant="secondary" className="text-xs mt-1">{leaderboard[1].totalQuizzes} bài</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {leaderboard[2] && (
                  <Card className="border-0 bg-white shadow-md animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <CardContent className="p-3">
                      <div className="text-center">
                        <div className={`w-12 h-12 mx-auto rounded-full ${getRankColor(3)} flex items-center justify-center text-white text-xl font-bold shadow-md mb-2`}>
                          3
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 truncate mb-1">{leaderboard[2].userName}</h4>
                        <p className="text-xs text-slate-600">{leaderboard[2].averageScore}%</p>
                        <Badge variant="secondary" className="text-xs mt-1">{leaderboard[2].totalQuizzes} bài</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center flex-shrink-0">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Bảng xếp hạng đầy đủ</CardTitle>
                  <CardDescription className="text-xs">Top {leaderboard.length} người dùng</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                      <Trophy className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium">Chưa có dữ liệu xếp hạng</p>
                    <p className="text-xs text-slate-400 mt-2">Hãy hoàn thành bài thi để xuất hiện ở đây</p>
                  </div>
                ) : (
                  leaderboard.slice(3).map((entry, index) => (
                    <div 
                      key={entry.userId} 
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className={`w-8 h-8 flex-shrink-0 rounded-full ${getRankColor(entry.rank)} flex items-center justify-center text-white font-bold text-sm`}>
                          {entry.rank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-slate-800 truncate">{entry.userName}</h4>
                          <p className="text-xs text-slate-600 truncate">{entry.averageScore}% • {entry.totalQuizzes} bài thi</p>
                        </div>
                      </div>
                      
                      <Badge variant="outline" className="text-xs font-semibold flex-shrink-0">
                        {entry.bestScore}%
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 sm:space-y-6">
          <Card className="border-0 bg-white shadow-lg">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Activity className="h-4 w-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg">Hoạt động gần đây</CardTitle>
                  <CardDescription className="text-xs">{recentActivity.length} hoạt động</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-2">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-50 flex items-center justify-center">
                      <Activity className="h-8 w-8 text-purple-300" />
                    </div>
                    <p className="text-sm font-medium">Chưa có hoạt động nào</p>
                    <p className="text-xs text-slate-400 mt-2">Các bài thi gần đây sẽ hiển thị ở đây</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 hover:bg-slate-100/50 transition-all animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white flex items-center justify-center shadow-md">
                          <Target className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-800">
                            <span className="font-semibold truncate inline-block max-w-[120px]">{activity.userName}</span>
                            <span className="text-slate-600"> • </span>
                            <span className="font-medium text-blue-600 truncate inline-block max-w-[150px]">{activity.quizTitle}</span>
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(activity.completedAt), { addSuffix: true, locale: vi })}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={activity.score >= 80 ? "default" : activity.score >= 60 ? "secondary" : "destructive"}
                        className="text-xs px-2 py-1 font-bold flex-shrink-0"
                      >
                        {activity.score}%
                      </Badge>
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
