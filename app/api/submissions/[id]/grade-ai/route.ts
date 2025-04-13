import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { gradeSubmission } from '@/lib/gemini';

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true }
    });
    
    if (!user || user.role !== 'Professor' || !user.professor) {
      return NextResponse.json({ error: 'Only professors can grade submissions' }, { status: 403 });
    }
    
    const { id: submissionId } = context.params;
    
    // Check if submission exists and belongs to one of the professor's projects
    // First try to find the submission directly
    let submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        student: true
      }
    });

    // If not found, try with findFirst and the professor check
    if (!submission) {
      submission = await prisma.submission.findFirst({
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
    }
    
    if (!submission) {
      return NextResponse.json({ error: 'Submission not found or not authorized' }, { status: 404 });
    }
    
    // Get the rubrics from the assignment
    const rubrics = submission.assignment.rubrics || 'Grade based on correctness, completeness, and clarity.';
    
    // Use Gemini to grade the submission
    const aiGrading = await gradeSubmission(submission.content || '', rubrics);
    
    // Apply penalty if any
    let finalGrade = aiGrading.grade;
    if (submission.penalty && submission.penalty > 0) {
      finalGrade = Math.max(0, finalGrade - (finalGrade * submission.penalty / 100));
    }
    
    // Update submission with grade and feedback
    // Update submission with grade and feedback
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        grade: Math.round(finalGrade), // Round to nearest integer
        feedback: typeof aiGrading.feedback === 'string' ? aiGrading.feedback : JSON.stringify(aiGrading.feedback)
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
    console.error('Error grading submission with AI:', error);
    return NextResponse.json({ error: 'Failed to grade submission with AI' }, { status: 500 });
  }
}
