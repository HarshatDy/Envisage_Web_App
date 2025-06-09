import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const connectionUri = process.env.MONGODB_URI || '';
    const database = process.env.MONGODB_DB || '';



    const session = await getServerSession(authOptions);
    
    if (!session || session.user.id !== params.userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { db } = await connectToDatabase(connectionUri, database);
    const userStats = await db.collection('userStats').findOne({ 
      userId: params.userId 
    });

    if (!userStats) {
      return new NextResponse('Stats not found', { status: 404 });
    }

    return NextResponse.json(userStats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 