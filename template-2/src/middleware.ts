import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login' || path === '/';
  
  // Check if user is authenticated
  const authToken = request.cookies.get('schoolTaskUser')?.value;
  
  // Redirect to login if trying to access a protected route without auth
  if (!isPublicPath && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Redirect to dashboard/tasks if already logged in and trying to access login page
  if (isPublicPath && authToken) {
    try {
      const userData = JSON.parse(authToken);
      const redirectPath = userData.role === 'manager' ? '/dashboard' : '/tasks';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    } catch (error) {
      // If token is invalid, clear it and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('schoolTaskUser');
      return response;
    }
  }
  
  return NextResponse.next();
}

// Configure which paths should be processed by this middleware
export const config = {
  matcher: ['/', '/login', '/dashboard/:path*', '/tasks/:path*', '/groups/:path*', '/admin/:path*'],
}; 