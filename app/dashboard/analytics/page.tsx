"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState('month')

  useEffect(() => {
    // In a real app, we would fetch analytics data here
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeRange])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Analytics</h3>
          <p className="text-sm text-muted-foreground">
            View detailed analytics and performance metrics.
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="quarter">Last Quarter</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      ) : error ? (
        <div className="flex h-[400px] items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <AnalyticsCard
                title="Total Projects"
                value={userRole === "Professor" ? "5" : "3"}
                description={`${timeRange === "week" ? "7" : timeRange === "month" ? "30" : timeRange === "quarter" ? "90" : "365"} day period`}
                trend="+12%"
                trendDirection="up"
              />
              <AnalyticsCard
                title={userRole === "Professor" ? "Total Students" : "Completed Assignments"}
                value={userRole === "Professor" ? "42" : "18"}
                description={`${timeRange === "week" ? "7" : timeRange === "month" ? "30" : timeRange === "quarter" ? "90" : "365"} day period`}
                trend="+8%"
                trendDirection="up"
              />
              <AnalyticsCard
                title={userRole === "Professor" ? "Submissions" : "Average Grade"}
                value={userRole === "Professor" ? "87" : "85%"}
                description={`${timeRange === "week" ? "7" : timeRange === "month" ? "30" : timeRange === "quarter" ? "90" : "365"} day period`}
                trend={userRole === "Professor" ? "+24%" : "+3%"}
                trendDirection="up"
              />
              <AnalyticsCard
                title="Badges Awarded"
                value={userRole === "Professor" ? "15" : "2"}
                description={`${timeRange === "week" ? "7" : timeRange === "month" ? "30" : timeRange === "quarter" ? "90" : "365"} day period`}
                trend="+5%"
                trendDirection="up"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>
                  Activity trends over the selected time period.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Chart visualization would appear here</p>
                    <p className="text-sm">Showing data for the last {timeRange === "week" ? "week" : timeRange === "month" ? "month" : timeRange === "quarter" ? "quarter" : "year"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Completion Rates</CardTitle>
                <CardDescription>
                  Percentage of assignments completed on time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Assignment completion chart would appear here</p>
                    <p className="text-sm">Showing data for the last {timeRange === "week" ? "week" : timeRange === "month" ? "month" : timeRange === "quarter" ? "quarter" : "year"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment Difficulty</CardTitle>
                <CardDescription>
                  Average grades across different assignments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Assignment difficulty chart would appear here</p>
                    <p className="text-sm">Showing data for the last {timeRange === "week" ? "week" : timeRange === "month" ? "month" : timeRange === "quarter" ? "quarter" : "year"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Submission Timeline</CardTitle>
                <CardDescription>
                  When students are submitting their assignments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Submission timeline chart would appear here</p>
                    <p className="text-sm">Showing data for the last {timeRange === "week" ? "week" : timeRange === "month" ? "month" : timeRange === "quarter" ? "quarter" : "year"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>
                  Distribution of grades across all submissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Grade distribution chart would appear here</p>
                    <p className="text-sm">Showing data for the last {timeRange === "week" ? "week" : timeRange === "month" ? "month" : timeRange === "quarter" ? "quarter" : "year"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badges" className="space-y-4 pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Badge Distribution</CardTitle>
                <CardDescription>
                  Types of badges awarded to students.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Badge distribution chart would appear here</p>
                    <p className="text-sm">Showing data for the last {timeRange === "week" ? "week" : timeRange === "month" ? "month" : timeRange === "quarter" ? "quarter" : "year"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Badge Timeline</CardTitle>
                <CardDescription>
                  When badges are being awarded over time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>Badge timeline chart would appear here</p>
                    <p className="text-sm">Showing data for the last {timeRange === "week" ? "week" : timeRange === "month" ? "month" : timeRange === "quarter" ? "quarter" : "year"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

interface AnalyticsCardProps {
  title: string
  value: string
  description: string
  trend: string
  trendDirection: "up" | "down" | "neutral"
}

function AnalyticsCard({ title, value, description, trend, trendDirection }: AnalyticsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className={`mt-2 flex items-center text-xs ${trendDirection === "up" ? "text-green-500" : trendDirection === "down" ? "text-red-500" : "text-gray-500"}`}>
          {trendDirection === "up" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-1 h-4 w-4">
              <path fillRule="evenodd" d="M12 7a1 1 0 01-1-1V5H9a1 1 0 01 0-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-4.293 4.293a1 1 0 01-1.414 0L4.586 9A1 1 0 016 7.586l2.293 2.293L12 6.414V7z" clipRule="evenodd" />
            </svg>
          ) : trendDirection === "down" ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-1 h-4 w-4">
              <path fillRule="evenodd" d="M12 13a1 1 0 01-1 1v1H9a1 1 0 010 2h4a1 1 0 011-1v-4a1 1 0 01-2 0v1.586l-4.293-4.293a1 1 0 010-1.414L9.414 7A1 1 0 0111 8.414l-2.293 2.293L12 14.586V13z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-1 h-4 w-4">
              <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span>{trend} from previous period</span>
        </div>
      </CardContent>
    </Card>
  )
}
