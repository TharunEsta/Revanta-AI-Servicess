import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import { Job, JobApplication } from '@/lib/mongodb-schemas';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import emailjs from '@emailjs/nodejs';

const ELIGIBLE_DEGREES = ['B.Tech'];
const ELIGIBLE_SPECIALIZATIONS = ['AI & DS', 'AI & ML', 'AI & CSE'];
const ELIGIBLE_GRADUATION_YEARS = [2027, 2028];

function validateEligibility(degree: string, specialization: string, graduationYear: number) {
  if (!ELIGIBLE_DEGREES.includes(degree)) {
    return { valid: false, error: 'Only B.Tech candidates are eligible for this internship.' };
  }
  if (!ELIGIBLE_SPECIALIZATIONS.includes(specialization)) {
    return { valid: false, error: 'Your specialization is not eligible for this internship.' };
  }
  if (!ELIGIBLE_GRADUATION_YEARS.includes(graduationYear)) {
    return { valid: false, error: 'Only candidates graduating in 2027 or 2028 are eligible.' };
  }
  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();

    const formData = await request.formData();

    // Extract form fields
    const fullName = formData.get('fullName') as string;
    const email = (formData.get('email') as string)?.toLowerCase();
    const phone = formData.get('phone') as string;
    const whatsappNumber = formData.get('whatsappNumber') as string;
    const city = formData.get('city') as string;
    const state = formData.get('state') as string;
    const college = formData.get('college') as string;
    const degree = formData.get('degree') as string;
    const specialization = formData.get('specialization') as string;
    const graduationYear = parseInt(formData.get('graduationYear') as string);
    const cgpa = formData.get('cgpa') ? parseFloat(formData.get('cgpa') as string) : undefined;
    const primaryInterest = formData.get('primaryInterest') as string;
    const technologiesKnown = JSON.parse(formData.get('technologiesKnown') as string || '[]');
    const githubUrl = formData.get('githubUrl') as string;
    const linkedinUrl = formData.get('linkedinUrl') as string;
    const portfolioUrl = formData.get('portfolioUrl') as string;
    const hasProjects = formData.get('hasProjects') === 'true';
    const projectName = formData.get('projectName') as string;
    const projectDescription = formData.get('projectDescription') as string;
    const projectTechnologies = formData.get('projectTechnologies') ? (formData.get('projectTechnologies') as string).split(',').map(t => t.trim()) : [];
    const projectUrl = formData.get('projectUrl') as string;
    const projectGithubUrl = formData.get('projectGithubUrl') as string;
    const hasPreviousWork = formData.get('hasPreviousWork') === 'true';
    const previousWorkExperienceStr = formData.get('previousWorkExperience') as string;
    const previousWorkExperience = previousWorkExperienceStr ? JSON.parse(previousWorkExperienceStr) : null;
    const joiningAvailability = formData.get('joiningAvailability') as string;
    const earliestJoiningDate = formData.get('earliestJoiningDate') ? new Date(formData.get('earliestJoiningDate') as string) : undefined;
    const hoursPerWeek = formData.get('hoursPerWeek') ? parseInt(formData.get('hoursPerWeek') as string) : undefined;
    const hasPersonalLaptop = formData.get('hasPersonalLaptop') === 'true';
    const motivation = formData.get('motivation') as string;
    const learningGoals = formData.get('learningGoals') as string;
    const resumeFile = formData.get('resume') as File | null;

    // Validate required fields
    if (!fullName || !email || !phone || !city || !state) {
      return NextResponse.json({ error: 'Missing required personal information' }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate eligibility
    const eligibility = validateEligibility(degree, specialization, graduationYear);
    if (!eligibility.valid) {
      return NextResponse.json({ error: eligibility.error }, { status: 403 });
    }

    // Validate resume
    if (!resumeFile) {
      return NextResponse.json({ error: 'Resume is required' }, { status: 400 });
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Resume must be less than 5MB' }, { status: 400 });
    }

    const validMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validMimes.includes(resumeFile.type)) {
      return NextResponse.json({ error: 'Resume must be PDF or Word document' }, { status: 400 });
    }

    // Check for duplicate application
    const existingApplication = await JobApplication.findOne({ email, jobId: 'internship-2027' });
    if (existingApplication) {
      return NextResponse.json({
        error: 'You have already submitted an application. Each email can only apply once.'
      }, { status: 409 });
    }

    // Save resume file
    let resumeUrl = null;
    let resumeOriginalName = null;
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'resumes');
      await mkdir(uploadsDir, { recursive: true });

      const fileExtension = resumeFile.name.split('.').pop();
      const fileName = `${randomBytes(16).toString('hex')}-${Date.now()}.${fileExtension}`;
      const filePath = path.join(uploadsDir, fileName);

      const bytes = await resumeFile.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      resumeUrl = `/api/applications/resume/${fileName}`;
      resumeOriginalName = resumeFile.name;
    } catch (error) {
      console.error('Resume upload error:', error);
      return NextResponse.json({ error: 'Failed to upload resume' }, { status: 500 });
    }

    // Create or get job
    let job = await Job.findOne({ slug: 'software-development-intern' });
    if (!job) {
      job = await Job.create({
        title: 'Software Development Intern',
        slug: 'software-development-intern',
        description: 'Work on real-world software development tasks',
        employmentType: 'Internship',
        status: 'OPEN',
        eligibleDegrees: ['B.Tech'],
        eligibleSpecializations: ['AI & DS', 'AI & ML', 'AI & CSE'],
        eligibleGraduationYears: [2027, 2028],
        technologies: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Git']
      });
    }

    // Create application
    const application = await JobApplication.create({
      jobId: job._id.toString(),
      fullName,
      email,
      phone,
      whatsappNumber,
      city,
      state,
      college,
      degree,
      specialization,
      graduationYear,
      cgpa,
      primaryInterest,
      technologiesKnown,
      githubUrl: githubUrl || undefined,
      linkedinUrl: linkedinUrl || undefined,
      portfolioUrl: portfolioUrl || undefined,
      hasProjects,
      projectName: projectName || undefined,
      projectDescription: projectDescription || undefined,
      projectTechnologies,
      projectUrl: projectUrl || undefined,
      projectGithubUrl: projectGithubUrl || undefined,
      hasPreviousWork,
      previousWorkExperience: previousWorkExperience || undefined,
      joiningAvailability,
      earliestJoiningDate,
      hoursPerWeek,
      hasPersonalLaptop,
      motivation: motivation || undefined,
      learningGoals: learningGoals || undefined,
      resumeUrl,
      resumeOriginalName,
      declarationAccepted: true,
      status: 'NEW'
    });

    // Send admin notification email
    try {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '');

      const adminEmail = process.env.ADMIN_EMAIL || 'admin@revanta-ai.com';

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
        {
          admin_email: adminEmail,
          to_email: adminEmail,
          subject: `New Software Development Internship Application — ${fullName}`,
          candidate_name: fullName,
          candidate_email: email,
          candidate_phone: phone,
          city: city,
          state: state,
          degree: degree,
          specialization: specialization,
          graduation_year: graduationYear,
          cgpa: cgpa || 'Not provided',
          technologies: technologiesKnown.join(', ') || 'Not provided',
          primary_interest: primaryInterest,
          github: githubUrl || 'Not provided',
          linkedin: linkedinUrl || 'Not provided',
          portfolio: portfolioUrl || 'Not provided',
          has_projects: hasProjects ? 'Yes' : 'No',
          project_name: projectName || 'N/A',
          experience: experience || 'Not provided',
          certifications: certifications.join(', ') || 'None',
          availability: availableStartDate ? new Date(availableStartDate).toLocaleDateString() : 'Not specified',
          hours_per_week: hoursPerWeek || 'Not specified',
          motivation: motivation || 'Not provided',
          learning_goals: learningGoals || 'Not provided',
          application_id: application._id.toString(),
          submitted_at: new Date().toLocaleString(),
          admin_link: `${process.env.NEXT_PUBLIC_APP_URL}/admin/applications/${application._id.toString()}`
        }
      );
    } catch (error) {
      console.error('Admin email error:', error);
    }

    // Send candidate confirmation email
    try {
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '');

      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
        {
          admin_email: email,
          to_email: email,
          subject: 'Application Received — Software Development Intern',
          candidate_name: fullName,
          message_type: 'candidate_confirmation',
          application_id: application._id.toString(),
          position: 'Software Development Intern'
        }
      );
    } catch (error) {
      console.error('Candidate email error:', error);
    }

    return NextResponse.json({
      applicationId: application._id.toString(),
      message: 'Application submitted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Application submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint - requires admin authentication
export async function GET(request: NextRequest) {
  try {
    // Check admin session - look for session cookie
    const sessionCookie = request.cookies.get('revanta_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const specialization = searchParams.get('specialization');
    const graduationYear = searchParams.get('graduationYear');
    const interest = searchParams.get('interest');
    const search = searchParams.get('search');

    const where: any = {};

    if (status) where.status = status;
    if (specialization) where.specialization = specialization;
    if (graduationYear) where.graduationYear = parseInt(graduationYear);
    if (interest) where.primaryInterest = interest;
    if (search) {
      where.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [applications, total] = await Promise.all([
      JobApplication.find(where)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      JobApplication.countDocuments(where)
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
