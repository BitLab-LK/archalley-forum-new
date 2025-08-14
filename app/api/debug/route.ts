import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
  try {
    console.log('Debug API: Starting');
    
    // Check environment
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL,
      databaseUrlLength: process.env.DATABASE_URL?.length || 0
    };
    
    // Check session
    const session = await getServerSession(authOptions);
    const sessionInfo = {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    };
    
    // Test database connection
    let dbTest = null;
    try {
      const commentCount = await prisma.comment.count();
      const postCount = await prisma.post.count();
      dbTest = {
        success: true,
        commentCount,
        postCount
      };
    } catch (dbError) {
      dbTest = {
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown DB error'
      };
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env,
      session: sessionInfo,
      database: dbTest
    });
    
  } catch (error) {
    console.error('Debug API: Error:', error);
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
