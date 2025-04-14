import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient, Project } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
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
    
    let projects: Project[] = [];
    
    if (user.role === 'Professor' && user.professor) {
      projects = await prisma.project.findMany({
        where: { professorId: user.professor.id },
        include: {
          assignments: {
            select: {
              id: true,
              name: true,
              _count: {
                select: { submissions: true }
              }
            }
          }
        }
      });
    } 
    else if (user.role === 'Student') {

      projects = await prisma.project.findMany({
        include: {
          assignments: {
            select: {
              id: true,
              name: true,
              dueDate: true
            }
          },
          professor: {
            include: {
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
      
    }
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}


// create a  new project
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
   
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { professor: true }
    });
    
    if (!user || !user.professor || user.role !== 'Professor') {
      return NextResponse.json({ error: 'Only professors can create projects' }, { status: 403 });
    }
    
    const { name, description } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        professorId: user.professor.id
      }
    });
    
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
