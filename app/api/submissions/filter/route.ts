import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const assignmentId = searchParams.get('assignmentId');
    const projectId = searchParams.get('projectId');
    const minGrade = searchParams.get('minGrade');
    const maxGrade = searchParams.get('maxGrade');
    const isGraded = searchParams.get('isGraded');
    const isLate = searchParams.get('isLate');

    const where: any = {};

    if (assignmentId) {
      where.assignmentId = assignmentId;
    }

    if (projectId) {
      where.assignment = {
        projectId: projectId,
      };
    }

    if (minGrade) {
      where.grade = {
        ...(where.grade || {}),
        gte: parseInt(minGrade),
      };
    }

    if (maxGrade) {
      where.grade = {
        ...(where.grade || {}),
        lte: parseInt(maxGrade),
      };
    }

    if (isGraded === 'true') {
      where.grade = {
        ...(where.grade || {}),
        not: null,
      };
    } else if (isGraded === 'false') {
      where.grade = null;
    }

    const submissions = await prisma.submission.findMany({
      where,
      select: {
        id: true,
        submittedAt: true,
        grade: true,
        penalty: true,
        feedback: true,
        assignment: {
          select: {
            id: true,
            name: true,
            dueDate: true,
            maxPoints: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Now apply isLate filter manually since Prisma can't compare related fields
    const filteredResults = submissions.filter((submission) => {
      const late = submission.submittedAt > submission.assignment.dueDate;

      if (isLate === 'true' && !late) return false;
      if (isLate === 'false' && late) return false;

      return true;
    });

    const enhancedResults = filteredResults.map((submission) => {
      const late = submission.submittedAt > submission.assignment.dueDate;

      const finalGrade =
        submission.grade !== null
          ? Math.max(0, submission.grade - (submission.penalty || 0))
          : null;

      const percentageScore =
        submission.grade !== null && finalGrade !== null
          ? ((finalGrade / submission.assignment.maxPoints) * 100).toFixed(1)
          : null;

      return {
        submissionId: submission.id,
        submittedAt: submission.submittedAt,
        grade: submission.grade,
        penalty: submission.penalty,
        feedback: submission.feedback,
        assignmentId: submission.assignment.id,
        assignmentName: submission.assignment.name,
        dueDate: submission.assignment.dueDate,
        maxPoints: submission.assignment.maxPoints,
        studentId: submission.student.id,
        userId: submission.student.user.id,
        studentName: submission.student.user.name,
        studentEmail: submission.student.user.email,
        projectId: submission.assignment.project.id,
        projectName: submission.assignment.project.name,
        isLate: late,
        finalGrade,
        percentageScore,
      };
    });

    return NextResponse.json(enhancedResults);
  } catch (error) {
    console.error('Error filtering submissions:', error);
    return NextResponse.json({ error: 'Failed to filter submissions' }, { status: 500 });
  }
}
