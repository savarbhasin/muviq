"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, BarChart, UserX } from "lucide-react";
import Link from "next/link";



export default function AssignmentAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [assignmentStats, setAssignmentStats] = useState<any[]>([]);
  const [missingSubmissions, setMissingSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProjects(data);
        
        const projectId = searchParams.get("projectId");
        const assignmentId = searchParams.get("assignmentId");
        
        if (projectId) {
          setSelectedProject(projectId);
          if (assignmentId) {
            setSelectedAssignment(assignmentId);
          }
        } else if (data.length > 0) {
          setSelectedProject(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated" && session?.user?.role === "Professor") {
      fetchProjects();
    } else if (status === "authenticated" && session?.user?.role !== "Professor") {
      router.push("/dashboard");
    }
  }, [session, status, router, searchParams]);

  // Fetch assignment stats when project changes
  useEffect(() => {
    const fetchAssignmentStats = async () => {
      if (!selectedProject) return;
      
      try {
        setLoading(true);
        const res = await fetch(`/api/analytics/assignments?projectId=${selectedProject}&type=averageGrades`);
        if (!res.ok) throw new Error("Failed to fetch assignment stats");
        const data = await res.json();
        setAssignmentStats(data);
        
        const assignmentExists = data.some((stat: any) => stat.assignmentId === selectedAssignment);
        if (selectedAssignment && !assignmentExists) {
          setSelectedAssignment("");
          setMissingSubmissions([]);
        }
      } catch (err) {
        console.error("Error fetching assignment stats:", err);
        setError("Failed to load assignment statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignmentStats();
  }, [selectedProject, selectedAssignment]);

  // Fetch missing submissions when assignment changes
  useEffect(() => {
    const fetchMissingSubmissions = async () => {
      if (!selectedAssignment) {
        setMissingSubmissions([]);
        return;
      }
      
      try {
        setLoading(true);
        const res = await fetch(`/api/analytics/assignments?assignmentId=${selectedAssignment}&type=missingSubmissions`);
        if (!res.ok) throw new Error("Failed to fetch missing submissions");
        const data = await res.json();
        setMissingSubmissions(data);
      } catch (err) {
        console.error("Error fetching missing submissions:", err);
        setError("Failed to load missing submissions data");
      } finally {
        setLoading(false);
      }
    };

    fetchMissingSubmissions();
  }, [selectedAssignment]);

  // Handle project change
  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    setSelectedAssignment(""); // Reset assignment selection
    router.push(`/dashboard/analytics/assignments?projectId=${projectId}`);
  };

  // Handle assignment change
  const handleAssignmentChange = (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    router.push(`/dashboard/analytics/assignments?projectId=${selectedProject}&assignmentId=${assignmentId}`);
  };

  if (status === "loading" || (status === "authenticated" && loading && !error)) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">Assignment Analytics</h1>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
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

  if (status === "authenticated" && session?.user?.role !== "Professor") {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assignment Analytics</h1>
        <Button variant="outline" asChild>
          <Link href="/dashboard/leaderboard">
            View Leaderboard
          </Link>
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Project</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProject} onValueChange={handleProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        {selectedProject && (
          <Card>
            <CardHeader>
              <CardTitle>Select Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedAssignment} onValueChange={handleAssignmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_assignments">All Assignments</SelectItem>
                  {projects
                    .find(p => p.id === selectedProject)?.assignments
                    .map((assignment:any) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}
      </div>
      
      {selectedProject && (
        <Tabs defaultValue="grades">
          <TabsList>
            <TabsTrigger value="grades">
              <BarChart className="h-4 w-4 mr-2" />
              Grade Statistics
            </TabsTrigger>
            {selectedAssignment && (
              <TabsTrigger value="missing">
                <UserX className="h-4 w-4 mr-2" />
                Missing Submissions
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="grades" className="space-y-6 mt-6">
            {assignmentStats.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p>No assignment data available for this project.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Grade Statistics</CardTitle>
                  <CardDescription>
                    {selectedAssignment 
                      ? "Detailed statistics for the selected assignment" 
                      : "Overview of all assignments in this project"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assignment</TableHead>
                        <TableHead className="text-right">Submissions</TableHead>
                        <TableHead className="text-right">Graded</TableHead>
                        <TableHead className="text-right">Avg. Grade</TableHead>
                        <TableHead className="text-right">Highest</TableHead>
                        <TableHead className="text-right">Lowest</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignmentStats.map((stat) => (
                        <TableRow key={stat.assignmentId}>
                          <TableCell className="font-medium">{stat.assignmentName}</TableCell>
                          <TableCell className="text-right">{stat.submissionCount}</TableCell>
                          <TableCell className="text-right">{stat.gradedCount}</TableCell>
                          <TableCell className="text-right">{stat.averageGrade}</TableCell>
                          <TableCell className="text-right">{stat.highestGrade || '-'}</TableCell>
                          <TableCell className="text-right">{stat.lowestGrade || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {selectedAssignment && (
            <TabsContent value="missing" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Students Missing Submissions</CardTitle>
                  <CardDescription>
                    Students who have not submitted this assignment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {missingSubmissions.length === 0 ? (
                    <p className="text-center py-4">All students have submitted this assignment!</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {missingSubmissions.map((student) => (
                          <TableRow key={student.userId}>
                            <TableCell className="font-medium">{student.studentName}</TableCell>
                            <TableCell>{student.studentEmail}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
