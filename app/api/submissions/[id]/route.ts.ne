import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/submissions/[id] - Get a specific submission
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true, student: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get submission
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
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
    
    const requestData = await req.json();
    
    if (user.role === 'Professor' && user.professor) {
      const project = await prisma.project.findFirst({
        where: {
          id: submission.assignment.projectId,
          professorId: user.professor.id
        }
      });
      
      if (!project) {
        return NextResponse.json({ error: 'Not authorized to grade this submission' }, { status: 403 });
      }
      
      const { grade, remarks } = requestData;
      
      if (grade === undefined) {
        return NextResponse.json({ error: 'Grade is required' }, { status: 400 });
      }
      
      // Apply penalty if any
      let finalGrade = grade;
      if (submission.penalty && submission.penalty > 0) {
        finalGrade = Math.max(0, grade - (grade * submission.penalty / 100));
      }
      
      // Update submission with grade and remarks
      const updatedSubmission = await prisma.submission.update({
        where: { id },
        data: {
          grade: Math.round(finalGrade), // Round to nearest integer
          feedback: remarks
        }
      });
      
      // Check if this is a perfect score (after penalty)
      if (finalGrade >= submission.assignment.maxPoints) {
        // Check if student already has the Perfectionist badge
        const existingBadge = await prisma.badge.findFirst({
          where: {
            studentId: submission.studentId,
            name: 'Perfectionist'
          }
        });
        
        // Award Perfectionist badge if not already awarded
        if (!existingBadge) {
          await prisma.badge.create({
            data: {
              name: 'Perfectionist',
              studentId: submission.studentId
            }
          });
        }
      }
      
      return NextResponse.json(updatedSubmission);
    }
    
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}

