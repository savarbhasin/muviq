import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Helper function to convert BigInt values to numbers for JSON serialization
function convertBigIntAndDecimal(data: any) {
  if (!data) return data;
  
  if (!Array.isArray(data)) {
    data = [data];
  }
  
  return data.map((item: any) => {
    const converted: any = {};
    for (const key in item) {
      const val = item[key];
      if (typeof val === 'bigint') {
        converted[key] = Number(val);
      } else {
        converted[key] = val;
      }
    }
    return converted;
  });
}

// GET: Assignment analytics for professors
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is a professor
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true }
    });
    
    if (!user || user.role !== 'Professor' || !user.professor) {
      return NextResponse.json({ error: 'Only professors can access analytics' }, { status: 403 });
    }
    
    // Get query parameters
    const assignmentId = req.nextUrl.searchParams.get('assignmentId');
    const projectId = req.nextUrl.searchParams.get('projectId');
    const type = req.nextUrl.searchParams.get('type') || 'averageGrades'; // Default to average grades
    
    // Validate parameters
    if (!assignmentId && !projectId) {
      return NextResponse.json({ error: 'Either assignmentId or projectId is required' }, { status: 400 });
    }
    
    // Determine which analytics to retrieve based on type
    switch (type) {
      case 'averageGrades':
        return await getAverageGrades(assignmentId, projectId, user.professor.id);
      
      case 'missingSubmissions':
        if (!assignmentId) {
          return NextResponse.json({ error: 'assignmentId is required for missing submissions' }, { status: 400 });
        }
        return await getMissingSubmissions(assignmentId, user.professor.id);
      
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching assignment analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch assignment analytics' }, { status: 500 });
  }
}

// Get average grades for assignments
async function getAverageGrades(assignmentId: string | null, projectId: string | null, professorId: string) {
  try {
    // If assignmentId is provided, get analytics for a specific assignment
    if (assignmentId) {
      // First verify the assignment belongs to the professor
      const assignment = await prisma.assignment.findFirst({
        where: {
          id: assignmentId,
          project: { professorId }
        },
        include: {
          project: true
        }
      });
      
      if (!assignment) {
        return NextResponse.json({ error: 'Assignment not found or not authorized' }, { status: 404 });
      }
      
      // Get average grade and other stats for the assignment using raw SQL for efficiency
      const rawStats = await prisma.$queryRaw`
        SELECT
          a.id as "assignmentId",
          a.name as "assignmentName",
          COUNT(s.id) as "submissionCount",
          COUNT(s.grade) as "gradedCount",
          COALESCE(AVG(s.grade), 0) as "averageGrade",
          MAX(s.grade) as "highestGrade",
          MIN(CASE WHEN s.grade IS NOT NULL THEN s.grade ELSE NULL END) as "lowestGrade"
        FROM
          "Assignment" a
        LEFT JOIN
          "Submission" s ON a.id = s."assignmentId"
        WHERE
          a.id = ${assignmentId}
        GROUP BY
          a.id, a.name
      `;
      
      // Convert BigInt values to numbers before serializing to JSON
      const stats = convertBigIntAndDecimal(rawStats);
      
      return NextResponse.json(stats);
    }
    
    // If projectId is provided, get analytics for all assignments in the project
    if (projectId) {
      // First verify the project belongs to the professor
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          professorId
        }
      });
      
      if (!project) {
        return NextResponse.json({ error: 'Project not found or not authorized' }, { status: 404 });
      }
      
      // Get average grades for all assignments in the project
      const rawStats = await prisma.$queryRaw`
        SELECT
          a.id as "assignmentId",
          a.name as "assignmentName",
          COUNT(s.id) as "submissionCount",
          COUNT(s.grade) as "gradedCount",
          COALESCE(AVG(s.grade), 0) as "averageGrade",
          MAX(s.grade) as "highestGrade",
          MIN(CASE WHEN s.grade IS NOT NULL THEN s.grade ELSE NULL END) as "lowestGrade"
        FROM
          "Assignment" a
        LEFT JOIN
          "Submission" s ON a.id = s."assignmentId"
        WHERE
          a."projectId" = ${projectId}
        GROUP BY
          a.id, a.name
        ORDER BY
          a."dueDate"
      `;
      
      // Convert BigInt values to numbers before serializing to JSON
      const stats = convertBigIntAndDecimal(rawStats);
      
      return NextResponse.json(stats);
    }
    
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error getting average grades:', error);
    return NextResponse.json({ error: 'Failed to get average grades' }, { status: 500 });
  }
}

async function getMissingSubmissions(assignmentId: string, professorId: string) {
  try {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        project: { professorId }
      }
    });
    
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or not authorized' }, { status: 404 });
    }
    
    // Get all students who haven't submitted this assignment using an efficient SQL query
    const rawMissingSubmissions = await prisma.$queryRaw`
      SELECT
        u.id as "userId",
        u.name as "studentName",
        u.email as "studentEmail"
      FROM
        "User" u
      JOIN
        "Student" s ON u.id = s."userId"
      WHERE
        u.role = 'Student'
        AND NOT EXISTS (
          SELECT 1 FROM "Submission" sub
          WHERE sub."studentId" = s.id
          AND sub."assignmentId" = ${assignmentId}
        )
      ORDER BY
        u.name
    `;
    
    // Convert BigInt values to numbers before serializing to JSON
    const missingSubmissions = convertBigIntAndDecimal(rawMissingSubmissions);
    
    return NextResponse.json(missingSubmissions);
  } catch (error) {
    console.error('Error getting missing submissions:', error);
    return NextResponse.json({ error: 'Failed to get missing submissions' }, { status: 500 });
  }
}
