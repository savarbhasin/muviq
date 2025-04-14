"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"
import Link from "next/link"

export function UpcomingAssignments() {
  interface Assignment {
    id: string;
    name: string;
    project: string;
    dueDate: string;
    daysLeft: number;
  }

  const [assignments, setAssignments] = useState<Assignment[]>([]);
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
        if (data.upcomingAssignments) {
          setAssignments(data.upcomingAssignments);
        }
      } catch (err) {
        console.error('Error fetching upcoming assignments:', err);
        setError('Failed to load upcoming assignments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  if (loading) {
    return <div className="flex h-[200px] items-center justify-center">Loading upcoming assignments...</div>;
  }

  if (error) {
    return <div className="flex h-[200px] items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">No upcoming assignments</div>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="flex flex-col space-y-2 rounded-md border p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{assignment.name}</h4>
                <Badge variant={assignment.daysLeft <= 3 ? "destructive" : "secondary"}>
                  {assignment.daysLeft} days left
                </Badge>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3" />
                <span>{formatDate(assignment.dueDate)}</span>
                <span className="mx-2">•</span>
                <span>{assignment.project}</span>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/assignments/${assignment.id}`}>View Details</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/dashboard/assignments">View all assignments</Link>
        </Button>
      </div>
    </div>
  )
}
