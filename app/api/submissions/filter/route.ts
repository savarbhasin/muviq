import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

// GET: Filter submissions by various criteria including grade ranges
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = req.nextUrl;
    const assignmentId = searchParams.get('assignmentId');
    const projectId = searchParams.get('projectId');
    const minGrade = searchParams.get('minGrade');
    const maxGrade = searchParams.get('maxGrade');
    const isGraded = searchParams.get('isGraded');
    const isLate = searchParams.get('isLate');
    const sortBy = searchParams.get('sortBy') || 'submittedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build the SQL query based on the provided filters
    let query = `
      SELECT 
        s.id as "submissionId",
        s."submittedAt" as "submittedAt",
        s.grade as "grade",
        s.penalty as "penalty",
        s.remarks as "remarks",
        a.id as "assignmentId",
        a.name as "assignmentName",
        a."dueDate" as "dueDate",
        a."maxPoints" as "maxPoints",
        st.id as "studentId",
        u.id as "userId",
        u.name as "studentName",
        u.email as "studentEmail",
        p.id as "projectId",
        p.name as "projectName",
        CASE WHEN s."submittedAt" > a."dueDate" THEN true ELSE false END as "isLate"
      FROM 
        "Submission" s
      JOIN 
        "Assignment" a ON s."assignmentId" = a.id
      JOIN 
        "Student" st ON s."studentId" = st.id
      JOIN 
        "User" u ON st."userId" = u.id
      JOIN 
        "Project" p ON a."projectId" = p.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;
    
    // Add filters to the query
    if (assignmentId) {
      query += ` AND a.id = $${paramIndex++}`;
      params.push(assignmentId);
    }
    
    if (projectId) {
      query += ` AND p.id = $${paramIndex++}`;
      params.push(projectId);
    }
    
    if (minGrade !== null && minGrade !== undefined) {
      query += ` AND s.grade >= $${paramIndex++}`;
      params.push(parseInt(minGrade));
    }
    
    if (maxGrade !== null && maxGrade !== undefined) {
      query += ` AND s.grade <= $${paramIndex++}`;
      params.push(parseInt(maxGrade));
    }
    
    if (isGraded === 'true') {
      query += ` AND s.grade IS NOT NULL`;
    } else if (isGraded === 'false') {
      query += ` AND s.grade IS NULL`;
    }
    
    if (isLate === 'true') {
      query += ` AND s."submittedAt" > a."dueDate"`;
    } else if (isLate === 'false') {
      query += ` AND s."submittedAt" <= a."dueDate"`;
    }
    
    // Add sorting
    const validSortColumns = ['submittedAt', 'grade', 'studentName'];
    const validSortOrders = ['asc', 'desc'];
    
    const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'submittedAt';
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase()) ? sortOrder : 'desc';
    
    if (finalSortBy === 'studentName') {
      query += ` ORDER BY u.name ${finalSortOrder}`;
    } else {
      query += ` ORDER BY s."${finalSortBy}" ${finalSortOrder}`;
    }
    
    // Execute the query
    const rawResults = await prisma.$queryRawUnsafe(query, ...params);
    
    // Convert BigInt values to numbers
    const results = convertBigIntAndDecimal(rawResults);
    
    // Add calculated fields
    const enhancedResults = results.map((submission: any) => {
      const finalGrade = submission.grade !== null ? 
        Math.max(0, submission.grade - (submission.penalty || 0)) : null;
      
      return {
        ...submission,
        finalGrade,
        percentageScore: submission.grade !== null && finalGrade !== null ? 
          ((finalGrade / submission.maxPoints) * 100).toFixed(1) : null
      };
    });
    
    return NextResponse.json(enhancedResults);
  } catch (error) {
    console.error('Error filtering submissions:', error);
    return NextResponse.json({ error: 'Failed to filter submissions' }, { status: 500 });
  }
}
