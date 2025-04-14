"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowUpDown, Clock, FileText } from "lucide-react";
import Link from "next/link";

export default function FilterSubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter states
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [gradeRange, setGradeRange] = useState<[number, number]>([0, 100]);
  const [isGraded, setIsGraded] = useState<string>("all"); // "all", "true", "false"
  const [isLate, setIsLate] = useState<string>("all"); // "all", "true", "false"
  const [sortBy, setSortBy] = useState<string>("submittedAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProjects(data);
        
        const projectId = searchParams.get("projectId");
        if (projectId) {
          setSelectedProject(projectId);
        } else if (data.length > 0) {
          setSelectedProject(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects");
      }
    };

    if (status === "authenticated") {
      fetchProjects();
    }
  }, [session, status, searchParams]);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!selectedProject) return;
      
      try {
        setLoading(true);
        const project = projects.find(p => p.id === selectedProject);
        if (project && project.assignments) {
          setAssignments(project.assignments);
          
          const assignmentId = searchParams.get("assignmentId");
          if (assignmentId) {
            setSelectedAssignment(assignmentId);
          } else if (project.assignments.length > 0) {
            setSelectedAssignment(project.assignments[0].id);
          } else {
            setSelectedAssignment("");
          }
        }
      } catch (err) {
        console.error("Error processing assignments:", err);
        setError("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [selectedProject, projects, searchParams]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!selectedProject && !selectedAssignment) return;
      
      try {
        setLoading(true);
        
        const params = new URLSearchParams();
        if (selectedProject) params.append("projectId", selectedProject);
        if (selectedAssignment) params.append("assignmentId", selectedAssignment);
        
    
        if (gradeRange[0] > 0) params.append("minGrade", gradeRange[0].toString());
        if (gradeRange[1] < 100) params.append("maxGrade", gradeRange[1].toString());
        
        if (isGraded !== "all") params.append("isGraded", isGraded);
        if (isLate !== "all") params.append("isLate", isLate);
        params.append("sortBy", sortBy);
        params.append("sortOrder", sortOrder);
        
        const res = await fetch(`/api/submissions/filter?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch submissions");
        const data = await res.json();
        console.log(data)
        setSubmissions(data);
      } catch (err) {
        console.error("Error fetching submissions:", err);
        setError("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [selectedProject, selectedAssignment, gradeRange, isGraded, isLate, sortBy, sortOrder]);

  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    setSelectedAssignment("");
    router.push(`/dashboard/filter?projectId=${value}`);
  };

  const handleAssignmentChange = (value: string) => {
    if (value == 'all_assignments') {
      setSelectedAssignment("");
      router.push(`/dashboard/filter?projectId=${selectedProject}`);
    } else {
      setSelectedAssignment(value);
      router.push(`/dashboard/filter?projectId=${selectedProject}&assignmentId=${value}`);
    }
  };

  const handleGradeRangeChange = (value: [number, number]) => {
    setGradeRange(value);
  };

  const handleSortToggle = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (status === "loading" || (status === "authenticated" && loading && !error)) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">Filter Submissions</h1>
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Filter Submissions by Grade</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Project Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Project</CardTitle>
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
        
        {/* Assignment Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedAssignment} 
              onValueChange={handleAssignmentChange}
              disabled={!selectedProject || assignments.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an assignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_assignments">All Assignments</SelectItem>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id}>
                    {assignment.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        {/* Grade Range */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="pt-4">
              <Slider 
                defaultValue={[0, 100]} 
                max={100} 
                step={1} 
                value={gradeRange}
                onValueChange={(value) => handleGradeRangeChange(value as [number, number])}
              />
            </div>
            <div className="flex justify-between">
              <span>{gradeRange[0]}%</span>
              <span>{gradeRange[1]}%</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Grading Status</Label>
              <Select value={isGraded} onValueChange={setIsGraded}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Submissions</SelectItem>
                  <SelectItem value="true">Graded Only</SelectItem>
                  <SelectItem value="false">Ungraded Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Submission Timing</Label>
              <Select value={isLate} onValueChange={setIsLate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Submissions</SelectItem>
                  <SelectItem value="true">Late Submissions</SelectItem>
                  <SelectItem value="false">On-Time Submissions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Filtered Submissions</CardTitle>
          <CardDescription>
            {submissions.length} submissions found matching your criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 p-4 rounded-md mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          )}
          
          {submissions.length === 0 && !error ? (
            <div className="text-center py-8 text-muted-foreground">
              No submissions match your filter criteria
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSortToggle("studentName")}>
                        Student
                        {sortBy === "studentName" && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSortToggle("submittedAt")}>
                        Submitted
                        {sortBy === "submittedAt" && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSortToggle("grade")}>
                        Grade
                        {sortBy === "grade" && (
                          <ArrowUpDown className={`ml-2 h-4 w-4 ${sortOrder === "asc" ? "rotate-180" : ""}`} />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.submissionId}>
                      <TableCell className="font-medium">
                        {submission.studentName}
                        <div className="text-xs text-muted-foreground">{submission.studentEmail}</div>
                      </TableCell>
                      <TableCell>
                        {formatDate(submission.submittedAt)}
                        {submission.isLate && (
                          <Badge variant="destructive" className="ml-2">
                            <Clock className="mr-1 h-3 w-3" />
                            Late
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.grade !== null ? (
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">
                                {submission.finalGrade} / {submission.maxPoints}
                              </span>
                              {submission.penalty > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                  -{submission.penalty} pts
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {submission.percentageScore}%
                              {submission.penalty > 0 && (
                                <span className="text-destructive"> (Late penalty applied)</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline">Not Graded</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.isLate ? (
                          <div>
                            <Badge variant="destructive">Late</Badge>
                            {submission.penalty > 0 && (
                              <div className="text-xs text-destructive mt-1">
                                Penalty: {submission.penalty} points
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary">On Time</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/submissions/${submission.submissionId}`}>
                            <FileText className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}