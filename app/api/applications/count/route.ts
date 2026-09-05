import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { JobApplication } from '@/lib/mongodb-schemas';

export async function GET() {
  try {
    await connectMongoDB();
    const count = await JobApplication.countDocuments();
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Count error:', error);
    return NextResponse.json({ count: 0 });
  }
}
