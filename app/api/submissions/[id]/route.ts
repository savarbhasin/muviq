import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!params?.id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }
    
    const id = await params.id;
    
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true, student: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get submission with related data
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        assignment: {
          include: {
            project: true
          }
        }
      }
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    
    // If user is a student, ensure it's their own submission
    if (user.role === 'Student' && user.student) {
      if (submission.studentId !== user.student.id) {
        return NextResponse.json({ error: 'Not authorized to access this submission' }, { status: 403 });
      }
    }
    // If user is a professor, ensure the assignment belongs to one of their projects
    else if (user.role === 'Professor' && user.professor) {
      const project = await prisma.project.findFirst({
        where: {
          id: submission.assignment.projectId,
          professorId: user.professor.id
        }
      });
      
      if (!project) {
        return NextResponse.json({ error: 'Not authorized to access this submission' }, { status: 403 });
      }
    }
    
    // Format the response
    const formattedSubmission = {
      id: submission.id,
      content: submission.content,
      grade: submission.grade,
      feedback: submission.feedback,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      createdAt: submission.submittedAt,
      updatedAt: submission.updatedAt,
      student: {
        id: submission.student.id,
        userId: submission.student.userId,
        user: {
          name: submission.student.user.name,
          email: submission.student.user.email
        }
      },
      assignment: {
        id: submission.assignment.id,
        name: submission.assignment.name,
        description: submission.assignment.description,
        dueDate: submission.assignment.dueDate,
        maxPoints: submission.assignment.maxPoints,
        projectId: submission.assignment.projectId,
        project: submission.assignment.project
      }
    };
    
    return NextResponse.json(formattedSubmission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}

// PUT /api/submissions/[id] - Update a submission (professor for grading)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!params?.id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }
    
    const id = params.id;
    
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true }
    });
    
    if (!user || user.role !== 'Professor' || !user.professor) {
      return NextResponse.json({ error: 'Only professors can grade submissions' }, { status: 403 });
    }
    
    const { grade, feedback } = await req.json();
    
    if (grade === undefined) {
      return NextResponse.json({ error: 'Grade is required' }, { status: 400 });
    }
    
    // Check if submission exists and belongs to one of the professor's projects
    const submission = await prisma.submission.findFirst({
      where: {
        id,
        assignment: {
          project: {
            professorId: user.professor.id
          }
        }
      },
      include: {
        assignment: true,
        student: true
      }
    });
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found or not authorized' }, { status: 404 });
    }
    
    // Update submission with grade and feedback
    const updatedSubmission = await prisma.submission.update({
      where: { id },
      data: {
        grade: Math.round(grade),
        feedback
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        assignment: {
          include: {
            project: true
          }
        }
      }
    });
    
    // Format the response
    const formattedSubmission = {
      id: updatedSubmission.id,
      content: updatedSubmission.content,
      grade: updatedSubmission.grade,
      feedback: updatedSubmission.feedback,
      assignmentId: updatedSubmission.assignmentId,
      studentId: updatedSubmission.studentId,
      createdAt: updatedSubmission.submittedAt,
      updatedAt: updatedSubmission.updatedAt,
      student: {
        id: updatedSubmission.student.id,
        userId: updatedSubmission.student.userId,
        user: {
          name: updatedSubmission.student.user.name,
          email: updatedSubmission.student.user.email
        }
      },
      assignment: {
        id: updatedSubmission.assignment.id,
        name: updatedSubmission.assignment.name,
        description: updatedSubmission.assignment.description,
        dueDate: updatedSubmission.assignment.dueDate,
        maxPoints: updatedSubmission.assignment.maxPoints,
        projectId: updatedSubmission.assignment.projectId,
        project: updatedSubmission.assignment.project
      }
    };
    
    return NextResponse.json(formattedSubmission);
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
