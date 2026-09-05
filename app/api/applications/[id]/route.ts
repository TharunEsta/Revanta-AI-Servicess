import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { JobApplication } from '@/lib/mongodb-schemas';
import mongoose from 'mongoose';

function getAdminFromSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('revanta_session');
  return !!sessionCookie?.value;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!getAdminFromSession(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const application = await JobApplication.findById(id).lean();

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);

  } catch (error) {
    console.error('Get application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!getAdminFromSession(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    // Check if application exists
    const application = await JobApplication.findById(id);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Update application
    const updated = await JobApplication.findByIdAndUpdate(
      id,
      { status: status || application.status, updatedAt: new Date() },
      { new: true }
    ).lean();

    return NextResponse.json(updated);

  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
