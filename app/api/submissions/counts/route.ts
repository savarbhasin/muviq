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

// GET: Get submission counts by project
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
      return NextResponse.json({ error: 'Only professors can access submission counts' }, { status: 403 });
    }
    
    // Get submission counts by project using an efficient SQL query
    const rawCounts = await prisma.$queryRaw`
      SELECT 
        p.id as "projectId",
        p.name as "projectName",
        COUNT(s.id) as "count"
      FROM 
        "Project" p
      LEFT JOIN 
        "Assignment" a ON p.id = a."projectId"
      LEFT JOIN 
        "Submission" s ON a.id = s."assignmentId"
      WHERE 
        p."professorId" = ${user.professor.id}
      GROUP BY 
        p.id, p.name
      ORDER BY 
        p.name
    `;
    
    // Convert BigInt values to numbers
    const counts = convertBigIntAndDecimal(rawCounts);
    
    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error fetching submission counts:', error);
    return NextResponse.json({ error: 'Failed to fetch submission counts' }, { status: 500 });
  }
}
