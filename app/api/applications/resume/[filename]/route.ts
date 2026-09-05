import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    // Check if user has admin session
    const sessionCookie = request.cookies.get('revanta_session');
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename } = await params;

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
    const filePath = path.join(uploadsDir, filename);

    // Double-check the path is in the correct directory
    if (!filePath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const fileContent = await readFile(filePath);
    const mimeType = filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';

    const response = new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

    return response;
  } catch (error) {
    console.error('Resume download error:', error);
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
  }
}
