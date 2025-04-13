import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

interface SubmissionWithRelations {
  id: string;
  student: {
    user: {
      name: string;
    };
  };
  assignment: {
    name: string;
    project: {
      name: string;
    };
  };
  submittedAt: Date;
  grade: number | null;
}

interface AssignmentWithRelations {
  id: string;
  name: string;
  project: {
    name: string;
  };
  dueDate: Date;
}

const prisma = new PrismaClient();

// GET /api/dashboard - Get dashboard stats and data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true, student: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let dashboardData = {};
    
    // Professor dashboard data
    if (user.role === 'Professor' && user.professor) {
      // Get projects count
      const projectsCount = await prisma.project.count({
        where: { professorId: user.professor.id }
      });
      
      // Get total students count across all projects (in a real app, this would be more complex)
      const studentsCount = await prisma.student.count();
      
      // Get pending evaluations count
      const pendingEvaluationsCount = await prisma.submission.count({
        where: {
          grade: null,
          assignment: {
            project: {
              professorId: user.professor.id
            }
          }
        }
      });
      
      // Get completed assignments count
      const completedAssignmentsCount = await prisma.submission.count({
        where: {
          grade: { not: null },
          assignment: {
            project: {
              professorId: user.professor.id
            }
          }
        }
      });
      
      // Get recent submissions
      const recentSubmissions = await prisma.submission.findMany({
        where: {
          assignment: {
            project: {
              professorId: user.professor.id
            }
          }
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          assignment: {
            include: {
              project: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 5
      });
      
      dashboardData = {
        stats: {
          projectsCount,
          studentsCount,
          pendingEvaluationsCount,
          completedAssignmentsCount
        },
        recentSubmissions: recentSubmissions.map((submission: SubmissionWithRelations) => ({
          id: submission.id,
          student: {
            user: {
              name: submission.student.user.name
            }
          },
          assignment: {
            name: submission.assignment.name,
            project: {
              name: submission.assignment.project.name
            }
          },
          project: submission.assignment.project.name,
          submittedAt: submission.submittedAt,
          status: submission.grade !== null ? 'graded' : 'pending',
          grade: submission.grade
        }))
      };
    }
    // Student dashboard data
    else if (user.role === 'Student' && user.student) {
      // Get enrolled projects count (in a real app, this would be based on enrollment)
      const enrolledProjectsCount = await prisma.project.count();
      
      // Get pending assignments count
      const pendingAssignmentsCount = await prisma.assignment.count({
        where: {
          dueDate: {
            gt: new Date()
          },
          submissions: {
            none: {
              studentId: user.student.id
            }
          }
        }
      });
      
      // Get submitted assignments count
      const submittedAssignmentsCount = await prisma.submission.count({
        where: {
          studentId: user.student.id
        }
      });
      
      // Get badges count
      const badgesCount = await prisma.badge.count({
        where: {
          studentId: user.student.id
        }
      });
      
      // Get upcoming assignments
      const upcomingAssignments = await prisma.assignment.findMany({
        where: {
          dueDate: {
            gt: new Date()
          },
          submissions: {
            none: {
              studentId: user.student.id
            }
          }
        },
        include: {
          project: true
        },
        orderBy: {
          dueDate: 'asc'
        },
        take: 5
      });
      
      // Get recent submissions
      const recentSubmissions = await prisma.submission.findMany({
        where: {
          studentId: user.student.id
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          assignment: {
            include: {
              project: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 5
      });
      
      dashboardData = {
        stats: {
          enrolledProjectsCount,
          pendingAssignmentsCount,
          submittedAssignmentsCount,
          badgesCount
        },
        upcomingAssignments: upcomingAssignments.map((assignment: any) => ({
          id: assignment.id,
          name: assignment.name,
          project: assignment.project.name,
          dueDate: assignment.dueDate,
          daysLeft: Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        })),
        recentSubmissions: recentSubmissions.map((submission: SubmissionWithRelations) => ({
          id: submission.id,
          student: {
            user: {
              name: submission.student.user.name
            }
          },
          assignment: {
            name: submission.assignment.name,
            project: {
              name: submission.assignment.project.name
            }
          },
          project: submission.assignment.project.name,
          submittedAt: submission.submittedAt,
          status: submission.grade !== null ? 'graded' : 'pending',
          grade: submission.grade
        }))
      };
    }
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
