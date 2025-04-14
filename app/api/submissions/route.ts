import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const assignmentId = url.searchParams.get('assignmentId');
    const studentId = url.searchParams.get('studentId');
    
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true, student: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let whereClause: any = {};
    
    if (user.role === 'Professor' && user.professor) {
      if (assignmentId) {
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
        whereClause.assignment = {
          project: {
            professorId: user.professor.id
          }
        };
      }
      
      if (studentId) {
        whereClause.studentId = studentId;
      }
    } 
    else if (user.role === 'Student' && user.student) {
      whereClause.studentId = user.student.id;
      
      if (assignmentId) {
        whereClause.assignmentId = assignmentId;
      }
    }
    
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
    
    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      student: {
        user: {
          name: submission.student.user.name
        }
      },
      studentName: submission.student.user.name,
      assignment: {
        name: submission.assignment.name,
        project: {
          name: submission.assignment.project.name
        }
      },
      project: submission.assignment.project.name,
      submittedAt: submission.submittedAt,
      grade: submission.grade,
      status: submission.grade !== null ? 'graded' : 'pending'
    }));
    
    return NextResponse.json(formattedSubmissions);

  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true, student: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const requestData = await req.json();

    if (user.role === 'Student' && user.student) {
      const { assignmentId, content } = requestData;
      
      if (!assignmentId || !content) {
        return NextResponse.json({ error: 'Assignment ID and content are required' }, { status: 400 });
      }
      
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId }
      });
      
      if (!assignment) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }
       
      const existingSubmission = await prisma.submission.findFirst({
        where: {
          assignmentId,
          studentId: user.student.id
        }
      });
      
      if (existingSubmission) {
        return NextResponse.json({ error: 'You have already submitted this assignment' }, { status: 400 });
      }
      
      let penalty = 0;
      const now = new Date();
      if (now > assignment.dueDate) {
        const daysLate = Math.ceil((now.getTime() - assignment.dueDate.getTime()) / (1000 * 60 * 60 * 24));
        penalty = Math.min(daysLate * 5, 50);
      }
      
      const submission = await prisma.submission.create({
        data: {
          studentId: user.student.id,
          assignmentId,
          content,
          penalty
        }
      });
      
      const daysToDueDate = Math.ceil((assignment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysToDueDate >= 7) {
        const existingBadge = await prisma.badge.findFirst({
          where: {
            studentId: user.student.id,
            name: 'EarlyBird'
          }
        });
        
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
    // else if (user.role === 'Professor' && user.professor) {
    //   const { submissionId, grade, remarks } = requestData;
      
    //   if (!submissionId || grade === undefined) {
    //     return NextResponse.json({ error: 'Submission ID and grade are required' }, { status: 400 });
    //   }
      
    //   const submission = await prisma.submission.findFirst({
    //     where: {
    //       id: submissionId,
    //       assignment: {
    //         project: {
    //           professorId: user.professor.id
    //         }
    //       }
    //     },
    //     include: {
    //       assignment: true,
    //       student: true
    //     }
    //   });
      
    //   if (!submission) {
    //     return NextResponse.json({ error: 'Submission not found or not authorized' }, { status: 404 });
    //   }
      
    //   let finalGrade = grade;
    //   if (submission.penalty && submission.penalty > 0) {
    //     finalGrade = Math.max(0, grade - (grade * submission.penalty / 100));
    //   }
      
    //   const updatedSubmission = await prisma.submission.update({
    //     where: { id: submissionId },
    //     data: {
    //       grade: Math.round(finalGrade), // Round to nearest integer
    //       remarks
    //     }
    //   });
      
    //   if (finalGrade >= submission.assignment.maxPoints) {
    //     const existingBadge = await prisma.badge.findFirst({
    //       where: {
    //         studentId: submission.studentId,
    //         name: 'Perfectionist'
    //       }
    //     });
        
    //     if (!existingBadge) {
    //       await prisma.badge.create({
    //         data: {
    //           name: 'Perfectionist',
    //           studentId: submission.studentId
    //         }
    //       });
    //     }
    //   }
      
    //   return NextResponse.json(updatedSubmission);
    // } else {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    // }
  } catch (error) {
    console.error('Error handling submission:', error);
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
  }
}
