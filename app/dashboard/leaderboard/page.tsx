"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



export default function LeaderboardPage() {
  const { data: session, status } = useSession();
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [studentBadges, setStudentBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        
        const topStudentsRes = await fetch("/api/leaderboard");
        if (!topStudentsRes.ok) throw new Error("Failed to fetch leaderboard data");
        const topStudentsData = await topStudentsRes.json();
        setTopStudents(topStudentsData);
        
        if (session?.user?.role === "Professor") {
          const badgesRes = await fetch("/api/badges?all=true");
          if (badgesRes.ok) {
            const badgesData = await badgesRes.json();
            setStudentBadges(badgesData);
          }
        }
        
        setError("");
      } catch (err) {
        console.error("Error fetching leaderboard data:", err);
        setError("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchLeaderboardData();
    }
  }, [session, status]);

  const getBadgeIcon = (position: number) => {
    switch (position) {
      case 0: return <Trophy className="h-8 w-8 text-yellow-500" />;
      case 1: return <Medal className="h-8 w-8 text-gray-400" />;
      case 2: return <Medal className="h-8 w-8 text-amber-700" />;
      default: return <Award className="h-8 w-8 text-blue-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <div className="grid gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Leaderboard</h1>
      
      {error && <p className="text-red-500">{error}</p>}
      
      <Tabs defaultValue="top-students">
        <TabsList>
          <TabsTrigger value="top-students">Top Students</TabsTrigger>
          {session?.user?.role === "Professor" && (
            <TabsTrigger value="badges">Student Badges</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="top-students" className="space-y-6 mt-6">
          <p className="text-muted-foreground">Top 5 students based on average grades across all assignments</p>
          
          {topStudents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p>No student performance data available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {topStudents.map((student, index) => (
                <Card key={student.userId} className="overflow-hidden">
                  <div className={`h-1 ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-blue-500'}`}></div>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        {getBadgeIcon(index)}
                      </div>
                      <div>
                        <CardTitle>{student.studentName}</CardTitle>
                        <CardDescription>Rank #{index + 1}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-lg font-bold">
                      {student.averageGrade}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Completed {student.submissionCount} submissions
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {session?.user?.role === "Professor" && (
          <TabsContent value="badges" className="space-y-6 mt-6">
            <p className="text-muted-foreground">Students who have earned badges</p>
            
            {studentBadges.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p>No badges have been awarded to students yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {studentBadges.map((badge, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle>{badge.studentname}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className="px-3 py-1">
                        {badge.badgename} ({formatDate(badge.awardeddate)})
                      </Badge>
                    </CardContent>
                  </Card>
                ))}

              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
