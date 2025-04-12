"use client"

import { useState, useEffect } from "react"
import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSession } from "next-auth/react"
import { BookOpen, CheckCircle, Clock, Users } from "lucide-react"

interface DashboardData {
  stats: {
    projectsCount?: number;
    studentsCount?: number;
    pendingEvaluationsCount?: number;
    completedAssignmentsCount?: number;
    enrolledProjectsCount?: number;
    pendingAssignmentsCount?: number;
    submittedAssignmentsCount?: number;
    badgesCount?: number;
  };
  recentSubmissions?: any[];
  upcomingAssignments?: any[];
}

export function DashboardStats() {
  const { data: session } = useSession()
  const userRole = session?.user?.role
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({ stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard stats...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-8 text-red-500">{error}</div>;
  }

  const stats = dashboardData.stats;

  if (userRole === "Professor") {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Projects"
          value={String(stats.projectsCount || 0)}
          description="Active projects"
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Total Students"
          value={String(stats.studentsCount || 0)}
          description="Across all projects"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Pending Evaluations"
          value={String(stats.pendingEvaluationsCount || 0)}
          description="Submissions to review"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Completed Assignments"
          value={String(stats.completedAssignmentsCount || 0)}
          description="Graded submissions"
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Enrolled Projects"
        value={String(stats.enrolledProjectsCount || 0)}
        description="Active projects"
        icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
      />
      <StatsCard
        title="Pending Assignments"
        value={String(stats.pendingAssignmentsCount || 0)}
        description="Due soon"
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
      />
      <StatsCard
        title="Submitted Assignments"
        value={String(stats.submittedAssignmentsCount || 0)}
        description="Awaiting grades"
        icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
      />
      <StatsCard
        title="Badges Earned"
        value={String(stats.badgesCount || 0)}
        description="Recognition received"
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}

function StatsCard({ title, value, description, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
