import mongoose, { Schema, Document, Model } from 'mongoose';

// Job Schema
export interface IJob extends Document {
  title: string;
  slug: string;
  description?: string;
  employmentType: string;
  status: 'OPEN' | 'CLOSED' | 'ARCHIVED';
  eligibleDegrees: string[];
  eligibleSpecializations: string[];
  eligibleGraduationYears: number[];
  technologies?: string[];
  benefits?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: String,
  employmentType: { type: String, default: 'Internship' },
  status: { type: String, enum: ['OPEN', 'CLOSED', 'ARCHIVED'], default: 'OPEN' },
  eligibleDegrees: { type: [String], default: ['B.Tech'] },
  eligibleSpecializations: { type: [String], default: ['AI & DS', 'AI & ML', 'AI & CSE'] },
  eligibleGraduationYears: { type: [Number], default: [2027, 2028] },
  technologies: [String],
  benefits: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

jobSchema.index({ slug: 1 });
jobSchema.index({ status: 1 });

// Previous Work Experience
export interface IPreviousWorkExperience {
  organization?: string;
  role?: string;
  startDate?: Date;
  endDate?: Date;
  responsibilities?: string;
  technologiesUsed?: string[];
  workDescription?: string;
  learnings?: string;
}

// Job Application Schema
export interface IJobApplication extends Document {
  jobId: string;
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber?: string;
  city: string;
  state: string;
  college?: string;
  degree: string;
  specialization: string;
  graduationYear: number;
  cgpa?: number;
  primaryInterest: string;
  technologiesKnown: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  hasProjects: boolean;
  projectName?: string;
  projectDescription?: string;
  projectTechnologies?: string[];
  projectUrl?: string;
  projectGithubUrl?: string;
  hasPreviousWork?: boolean;
  previousWorkExperience?: IPreviousWorkExperience;
  certifications?: string[];
  joiningAvailability?: 'IMMEDIATELY' | 'WITHIN_1_WEEK' | 'WITHIN_2_WEEKS' | 'WITHIN_1_MONTH' | 'MORE_THAN_1_MONTH' | 'SPECIFIC_DATE';
  earliestJoiningDate?: Date;
  hoursPerWeek?: number;
  hasPersonalLaptop?: boolean;
  motivation?: string;
  learningGoals?: string;
  resumeUrl?: string;
  resumeOriginalName?: string;
  declarationAccepted: boolean;
  status: 'NEW' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'ASSESSMENT' | 'INTERVIEW' | 'SELECTED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const jobApplicationSchema = new Schema<IJobApplication>({
  jobId: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  phone: { type: String, required: true },
  whatsappNumber: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  college: String,
  degree: { type: String, required: true },
  specialization: { type: String, required: true },
  graduationYear: { type: Number, required: true },
  cgpa: Number,
  primaryInterest: { type: String, required: true },
  technologiesKnown: [String],
  githubUrl: String,
  linkedinUrl: String,
  portfolioUrl: String,
  hasProjects: { type: Boolean, default: false },
  projectName: String,
  projectDescription: String,
  projectTechnologies: [String],
  projectUrl: String,
  projectGithubUrl: String,
  hasPreviousWork: { type: Boolean, default: false },
  previousWorkExperience: {
    organization: String,
    role: String,
    startDate: Date,
    endDate: Date,
    responsibilities: String,
    technologiesUsed: [String],
    workDescription: String,
    learnings: String
  },
  certifications: [String],
  joiningAvailability: { type: String, enum: ['IMMEDIATELY', 'WITHIN_1_WEEK', 'WITHIN_2_WEEKS', 'WITHIN_1_MONTH', 'MORE_THAN_1_MONTH', 'SPECIFIC_DATE'] },
  earliestJoiningDate: Date,
  hoursPerWeek: Number,
  hasPersonalLaptop: { type: Boolean },
  motivation: String,
  learningGoals: String,
  resumeUrl: String,
  resumeOriginalName: String,
  declarationAccepted: { type: Boolean, default: false },
  status: { type: String, enum: ['NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'REJECTED'], default: 'NEW' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Unique constraint on email + jobId to prevent duplicates
jobApplicationSchema.index({ email: 1, jobId: 1 }, { unique: true });
jobApplicationSchema.index({ status: 1 });
jobApplicationSchema.index({ jobId: 1 });
jobApplicationSchema.index({ email: 1 });
jobApplicationSchema.index({ createdAt: -1 });
jobApplicationSchema.index({ fullName: 'text', email: 'text' });
jobApplicationSchema.index({ graduationYear: 1 });
jobApplicationSchema.index({ specialization: 1 });
jobApplicationSchema.index({ primaryInterest: 1 });
jobApplicationSchema.index({ hasPreviousWork: 1 });
jobApplicationSchema.index({ joiningAvailability: 1 });
jobApplicationSchema.index({ hasPersonalLaptop: 1 });

// Assessment Schema
export interface IAssessment extends Document {
  jobId: string;
  applicationId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED';
  startedAt?: Date;
  submittedAt?: Date;
  score?: number;
  totalScore?: number;
  flagCount: number;
  integrityStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentSchema = new Schema<IAssessment>({
  jobId: { type: String, required: true },
  applicationId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED'], default: 'NOT_STARTED' },
  startedAt: Date,
  submittedAt: Date,
  score: Number,
  totalScore: Number,
  flagCount: { type: Number, default: 0 },
  integrityStatus: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

assessmentSchema.index({ status: 1 });
assessmentSchema.index({ jobId: 1 });

// Assessment Question Schema
export interface IAssessmentQuestion extends Document {
  jobId: string;
  type: 'MCQ' | 'CODING';
  sectionNumber: number;
  questionNumber: number;
  prompt: string;
  timeLimit: number;
  options?: string[];
  correctAnswer?: string;
  codeTemplate?: string;
  testCases?: Record<string, unknown>;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentQuestionSchema = new Schema<IAssessmentQuestion>({
  jobId: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'CODING'], required: true },
  sectionNumber: { type: Number, required: true },
  questionNumber: { type: Number, required: true },
  prompt: { type: String, required: true },
  timeLimit: { type: Number, default: 60 },
  options: [String],
  correctAnswer: String,
  codeTemplate: String,
  testCases: Schema.Types.Mixed,
  points: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

assessmentQuestionSchema.index({ jobId: 1, sectionNumber: 1, questionNumber: 1 });

// Assessment Response Schema
export interface IAssessmentResponse extends Document {
  assessmentId: string;
  questionId: string;
  answerText?: string;
  answerCode?: string;
  testResults?: Record<string, unknown>;
  isCorrect?: boolean;
  pointsEarned?: number;
  timeSpentSeconds: number;
  flaggedForReview: boolean;
  flagReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assessmentResponseSchema = new Schema<IAssessmentResponse>({
  assessmentId: { type: String, required: true },
  questionId: { type: String, required: true },
  answerText: String,
  answerCode: String,
  testResults: Schema.Types.Mixed,
  isCorrect: Boolean,
  pointsEarned: Number,
  timeSpentSeconds: { type: Number, required: true },
  flaggedForReview: { type: Boolean, default: false },
  flagReason: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

assessmentResponseSchema.index({ assessmentId: 1, questionId: 1 }, { unique: true });
assessmentResponseSchema.index({ assessmentId: 1 });

// Proctoring Event Schema
export interface IProctoringEvent extends Document {
  assessmentId: string;
  eventType: string;
  severity: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const proctoringEventSchema = new Schema<IProctoringEvent>({
  assessmentId: { type: String, required: true },
  eventType: { type: String, required: true },
  severity: { type: String, default: 'INFO' },
  description: String,
  metadata: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

proctoringEventSchema.index({ assessmentId: 1 });
proctoringEventSchema.index({ assessmentId: 1, createdAt: -1 });

// Get or create models
export const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', jobSchema);
export const JobApplication: Model<IJobApplication> = mongoose.models.JobApplication || mongoose.model<IJobApplication>('JobApplication', jobApplicationSchema);
export const Assessment: Model<IAssessment> = mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', assessmentSchema);
export const AssessmentQuestion: Model<IAssessmentQuestion> = mongoose.models.AssessmentQuestion || mongoose.model<IAssessmentQuestion>('AssessmentQuestion', assessmentQuestionSchema);
export const AssessmentResponse: Model<IAssessmentResponse> = mongoose.models.AssessmentResponse || mongoose.model<IAssessmentResponse>('AssessmentResponse', assessmentResponseSchema);
export const ProctoringEvent: Model<IProctoringEvent> = mongoose.models.ProctoringEvent || mongoose.model<IProctoringEvent>('ProctoringEvent', proctoringEventSchema);
