'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Application {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
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
  experience?: string;
  certifications?: string[];
  availableStartDate?: string;
  hoursPerWeek?: number;
  motivation?: string;
  learningGoals?: string;
  resumeUrl?: string;
  resumeOriginalName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  'NEW',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'ASSESSMENT',
  'INTERVIEW',
  'SELECTED',
  'REJECTED'
];

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  SHORTLISTED: 'bg-purple-100 text-purple-800',
  ASSESSMENT: 'bg-orange-100 text-orange-800',
  INTERVIEW: 'bg-indigo-100 text-indigo-800',
  SELECTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
};

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await fetch(`/api/applications/${params.id}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login?next=/admin/applications');
            return;
          }
          throw new Error('Failed to load application');
        }
        const data = await res.json();
        setApplication(data);
        setStatus(data.status);
      } catch (err) {
        setError('Failed to load application');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [params.id, router]);

  const handleStatusChange = async () => {
    if (status === application?.status) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/applications/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      setApplication(updated);
    } catch (err) {
      setError('Failed to update status');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const downloadResume = async () => {
    if (!application?.resumeUrl) return;
    try {
      const res = await fetch(application.resumeUrl);
      if (!res.ok) throw new Error('Failed to download resume');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = application.resumeOriginalName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Resume download error:', err);
      setError('Failed to download resume');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="shell">
          <p className="text-center text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="shell">
          <div className="text-center">
            <p className="text-slate-600">{error || 'Application not found'}</p>
            <Link href="/admin/applications" className="mt-4 inline-block text-slate-900 hover:underline">
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="section">
        <div className="shell py-12">
          <Link href="/admin/applications" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            ← Back to Applications
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="font-[var(--font-display)] text-3xl font-semibold text-slate-950">
                      {application.fullName}
                    </h1>
                    <p className="mt-2 text-slate-600">{application.email}</p>
                  </div>
                  <span
                    className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${
                      STATUS_COLORS[application.status]
                    }`}
                  >
                    {application.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Personal Information */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="font-[var(--font-display)] text-xl font-semibold text-slate-950">Personal Information</h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Phone</p>
                    <p className="mt-1 text-slate-900">{application.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Location</p>
                    <p className="mt-1 text-slate-900">{application.city}, {application.state}</p>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="font-[var(--font-display)] text-xl font-semibold text-slate-950">Education</h2>
                <div className="mt-6 grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Degree</p>
                    <p className="mt-1 text-slate-900">{application.degree}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Specialization</p>
                    <p className="mt-1 text-slate-900">{application.specialization}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Graduation</p>
                    <p className="mt-1 text-slate-900">{application.graduationYear}</p>
                  </div>
                  {application.cgpa && (
                    <div>
                      <p className="text-sm font-medium text-slate-600">CGPA</p>
                      <p className="mt-1 text-slate-900">{application.cgpa}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Profile */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="font-[var(--font-display)] text-xl font-semibold text-slate-950">Technical Profile</h2>
                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Primary Interest</p>
                    <p className="mt-1 text-slate-900">{application.primaryInterest}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Technologies Known</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {application.technologiesKnown.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="font-[var(--font-display)] text-xl font-semibold text-slate-950">Links</h2>
                <div className="mt-6 space-y-4">
                  {application.githubUrl && (
                    <div>
                      <p className="text-sm font-medium text-slate-600">GitHub</p>
                      <a href={application.githubUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-blue-600 hover:underline">
                        {application.githubUrl}
                      </a>
                    </div>
                  )}
                  {application.linkedinUrl && (
                    <div>
                      <p className="text-sm font-medium text-slate-600">LinkedIn</p>
                      <a href={application.linkedinUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-blue-600 hover:underline">
                        {application.linkedinUrl}
                      </a>
                    </div>
                  )}
                  {application.portfolioUrl && (
                    <div>
                      <p className="text-sm font-medium text-slate-600">Portfolio</p>
                      <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-blue-600 hover:underline">
                        {application.portfolioUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Motivation & Goals */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="font-[var(--font-display)] text-xl font-semibold text-slate-950">Motivation</h2>
                <div className="mt-6 space-y-4">
                  {application.motivation && (
                    <div>
                      <p className="text-sm font-medium text-slate-600">Why Join</p>
                      <p className="mt-1 text-slate-700">{application.motivation}</p>
                    </div>
                  )}
                  {application.learningGoals && (
                    <div>
                      <p className="text-sm font-medium text-slate-600">Learning Goals</p>
                      <p className="mt-1 text-slate-700">{application.learningGoals}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h2 className="font-[var(--font-display)] text-xl font-semibold text-slate-950">Timeline</h2>
                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Applied</p>
                    <p className="mt-1 text-slate-900">
                      {new Date(application.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  {application.updatedAt !== application.createdAt && (
                    <div>
                      <p className="text-sm font-medium text-slate-600">Last Updated</p>
                      <p className="mt-1 text-slate-900">
                        {new Date(application.updatedAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Update */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="font-[var(--font-display)] text-lg font-semibold text-slate-950">Update Status</h3>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleStatusChange}
                  disabled={status === application.status || updating}
                  className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>

              {/* Resume */}
              <div className="rounded-lg border border-slate-200 bg-white p-6">
                <h3 className="font-[var(--font-display)] text-lg font-semibold text-slate-950">Resume</h3>
                {application.resumeUrl ? (
                  <>
                    <p className="mt-2 text-xs text-slate-500">{application.resumeOriginalName}</p>
                    <button
                      onClick={downloadResume}
                      className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-medium hover:bg-slate-50"
                    >
                      Download Resume
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">No resume uploaded</p>
                )}
              </div>

              {/* Application ID */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-600">Application ID</p>
                <p className="mt-2 font-mono text-sm font-semibold text-slate-900">{application._id}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
