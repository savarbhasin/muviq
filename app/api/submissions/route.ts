import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/submissions - Get all submissions or filter by assignment/student
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const assignmentId = url.searchParams.get('assignmentId');
    const studentId = url.searchParams.get('studentId');
    
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true, student: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let whereClause: any = {};
    
    // If user is a professor
    if (user.role === 'Professor' && user.professor) {
      // Filter by assignment if provided
      if (assignmentId) {
        // Ensure the assignment belongs to one of the professor's projects
        const assignment = await prisma.assignment.findFirst({
          where: {
            id: assignmentId,
            project: {
              professorId: user.professor.id
            }
          }
        });
        
        if (!assignment) {
          return NextResponse.json({ error: 'Assignment not found or not authorized' }, { status: 404 });
        }
        
        whereClause.assignmentId = assignmentId;
      } else {
        // If no assignmentId, get submissions for all assignments in professor's projects
        whereClause.assignment = {
          project: {
            professorId: user.professor.id
          }
        };
      }
      
      // Filter by student if provided
      if (studentId) {
        whereClause.studentId = studentId;
      }
    } 
    // If user is a student, only show their own submissions
    else if (user.role === 'Student' && user.student) {
      whereClause.studentId = user.student.id;
      
      // Filter by assignment if provided
      if (assignmentId) {
        whereClause.assignmentId = assignmentId;
      }
    }
    
    // Get submissions
    const submissions = await prisma.submission.findMany({
      where: whereClause,
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
      }
    });
    
    // Format the response
    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      student: submission.student.user.name,
      studentId: submission.studentId,
      assignment: submission.assignment.name,
      assignmentId: submission.assignmentId,
      project: submission.assignment.project.name,
      submittedAt: submission.submittedAt,
      grade: submission.grade,
      remarks: submission.remarks,
      content: submission.content,
      penalty: submission.penalty,
      status: submission.grade !== null ? 'graded' : 'pending'
    }));
    
    return NextResponse.json(formattedSubmissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// POST /api/submissions - Create a new submission (student) or grade a submission (professor)
export async function POST(req: NextRequest) {
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
    
    const requestData = await req.json();
    
    // Student submitting an assignment
    if (user.role === 'Student' && user.student) {
      const { assignmentId, content } = requestData;
      
      if (!assignmentId || !content) {
        return NextResponse.json({ error: 'Assignment ID and content are required' }, { status: 400 });
      }
      
      // Check if assignment exists
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId }
      });
      
      if (!assignment) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }
       
      // Check if student has already submitted this assignment
      const existingSubmission = await prisma.submission.findFirst({
        where: {
          assignmentId,
          studentId: user.student.id
        }
      });
      
      if (existingSubmission) {
        return NextResponse.json({ error: 'You have already submitted this assignment' }, { status: 400 });
      }
      
      // Calculate penalty if past due date
      let penalty = 0;
      const now = new Date();
      if (now > assignment.dueDate) {
        // Calculate days late (rounded up)
        const daysLate = Math.ceil((now.getTime() - assignment.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        // 5% penalty per day late, up to 50%
        penalty = Math.min(daysLate * 5, 50);
      }
      
      // Create new submission
      const submission = await prisma.submission.create({
        data: {
          studentId: user.student.id,
          assignmentId,
          content,
          penalty
        }
      });
      
      // Check if this is an early submission (at least 7 days before deadline)
      const daysToDueDate = Math.ceil((assignment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysToDueDate >= 7) {
        // Check if student already has the EarlyBird badge
        const existingBadge = await prisma.badge.findFirst({
          where: {
            studentId: user.student.id,
            name: 'EarlyBird'
          }
        });
        
        // Award EarlyBird badge if not already awarded
        if (!existingBadge) {
          await prisma.badge.create({
            data: {
              name: 'EarlyBird',
              studentId: user.student.id
            }
          });
        }
      }
      
      return NextResponse.json(submission, { status: 201 });
    } 
    // Professor grading a submission
    else if (user.role === 'Professor' && user.professor) {
      const { submissionId, grade, remarks } = requestData;
      
      if (!submissionId || grade === undefined) {
        return NextResponse.json({ error: 'Submission ID and grade are required' }, { status: 400 });
      }
      
      // Check if submission exists and belongs to one of the professor's projects
      const submission = await prisma.submission.findFirst({
        where: {
          id: submissionId,
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
      
      // Apply penalty if any
      let finalGrade = grade;
      if (submission.penalty && submission.penalty > 0) {
        finalGrade = Math.max(0, grade - (grade * submission.penalty / 100));
      }
      
      // Update submission with grade and remarks
      const updatedSubmission = await prisma.submission.update({
        where: { id: submissionId },
        data: {
          grade: Math.round(finalGrade), // Round to nearest integer
          remarks
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
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  } catch (error) {
    console.error('Error handling submission:', error);
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
  }
}
