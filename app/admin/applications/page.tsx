'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface Application {
  _id: string;
  fullName: string;
  email: string;
  whatsappNumber?: string;
  phone: string;
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
  hasPreviousWork?: boolean;
  previousWorkExperience?: any;
  joiningAvailability?: string;
  earliestJoiningDate?: string;
  hoursPerWeek?: number;
  hasPersonalLaptop?: boolean;
  motivation?: string;
  learningGoals?: string;
  resumeUrl?: string;
  resumeOriginalName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const JOINING_LABELS: Record<string, string> = {
  IMMEDIATELY: 'Immediate',
  WITHIN_1_WEEK: '1 Week',
  WITHIN_2_WEEKS: '2 Weeks',
  WITHIN_1_MONTH: '1 Month',
  MORE_THAN_1_MONTH: '1+ Month',
  SPECIFIC_DATE: 'Specific Date'
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  SHORTLISTED: 'bg-purple-100 text-purple-800',
  ASSESSMENT: 'bg-orange-100 text-orange-800',
  INTERVIEW: 'bg-indigo-100 text-indigo-800',
  SELECTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
};

const DEFAULT_COLUMNS = [
  'fullName', 'email', 'whatsappNumber', 'college', 'specialization', 'graduationYear',
  'technologiesKnown', 'hasPreviousWork', 'joiningAvailability', 'hasPersonalLaptop',
  'resumeUrl', 'status', 'createdAt'
];

const ALL_COLUMNS = [
  { key: 'fullName', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'whatsappNumber', label: 'WhatsApp' },
  { key: 'phone', label: 'Phone' },
  { key: 'college', label: 'College' },
  { key: 'degree', label: 'Degree' },
  { key: 'specialization', label: 'Specialization' },
  { key: 'graduationYear', label: 'Graduating' },
  { key: 'primaryInterest', label: 'Interest' },
  { key: 'technologiesKnown', label: 'Skills' },
  { key: 'cgpa', label: 'CGPA' },
  { key: 'hasProjects', label: 'Projects' },
  { key: 'hasPreviousWork', label: 'Previous Work' },
  { key: 'joiningAvailability', label: 'Joining' },
  { key: 'earliestJoiningDate', label: 'Start Date' },
  { key: 'hoursPerWeek', label: 'Hours/Week' },
  { key: 'hasPersonalLaptop', label: 'Laptop' },
  { key: 'githubUrl', label: 'GitHub' },
  { key: 'linkedinUrl', label: 'LinkedIn' },
  { key: 'portfolioUrl', label: 'Portfolio' },
  { key: 'resumeUrl', label: 'Resume' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Applied' }
];

export default function AdminApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(DEFAULT_COLUMNS));
  const [showColumnManager, setShowColumnManager] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [specializationFilter, setSpecializationFilter] = useState(searchParams.get('specialization') || '');
  const [joiningFilter, setJoiningFilter] = useState(searchParams.get('joining') || '');
  const [laptopFilter, setLaptopFilter] = useState(searchParams.get('laptop') || '');
  const [previousWorkFilter, setPreviousWorkFilter] = useState(searchParams.get('previousWork') || '');
  const [graduationFilter, setGraduationFilter] = useState(searchParams.get('graduation') || '');

  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch('/api/applications?limit=1000');
        if (res.status === 401) {
          router.push('/login?next=/admin/applications');
          return;
        }
        if (!res.ok) throw new Error('Failed to load applications');
        const data = await res.json();
        setApplications(data);
        setError('');
      } catch (err) {
        setError('Failed to load applications');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [router]);

  // Filter and sort applications
  const filtered = useMemo(() => {
    return applications.filter(app => {
      if (searchQuery && !(`${app.fullName} ${app.email} ${app.whatsappNumber || ''}`.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      if (statusFilter && app.status !== statusFilter) return false;
      if (specializationFilter && app.specialization !== specializationFilter) return false;
      if (joiningFilter && app.joiningAvailability !== joiningFilter) return false;
      if (laptopFilter && app.hasPersonalLaptop !== (laptopFilter === 'yes')) return false;
      if (previousWorkFilter && app.hasPreviousWork !== (previousWorkFilter === 'yes')) return false;
      if (graduationFilter && app.graduationYear !== parseInt(graduationFilter)) return false;
      return true;
    }).sort((a, b) => {
      const aVal = (a as any)[sortBy];
      const bVal = (b as any)[sortBy];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [applications, searchQuery, statusFilter, specializationFilter, joiningFilter, laptopFilter, previousWorkFilter, graduationFilter, sortBy, sortOrder]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const statuses: Record<string, number> = {};
    let immediate = 0, previousWork = 0, withLaptop = 0;

    applications.forEach(app => {
      statuses[app.status] = (statuses[app.status] || 0) + 1;
      if (app.joiningAvailability === 'IMMEDIATELY') immediate++;
      if (app.hasPreviousWork) previousWork++;
      if (app.hasPersonalLaptop) withLaptop++;
    });

    return { total, statuses, immediate, previousWork, withLaptop };
  }, [applications]);

  const handleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(a => a._id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return '—';
    if (key === 'technologiesKnown' && Array.isArray(value)) {
      return value.length > 3 ? `${value.slice(0, 3).join(' • ')} +${value.length - 3}` : value.join(' • ');
    }
    if (key === 'hasPersonalLaptop') return value ? '✓ Yes' : '✕ No';
    if (key === 'hasPreviousWork') return value ? 'Yes' : 'No';
    if (key === 'joiningAvailability') return JOINING_LABELS[value] || value;
    if (key === 'createdAt') return new Date(value).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.length > 0 ? `${value.length} items` : '—';
    return String(value);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 py-12"><div className="shell"><p className="text-center text-slate-600">Loading applications...</p></div></div>;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="section">
        <div className="shell py-12">
          <h1 className="font-[var(--font-display)] text-3xl font-semibold text-slate-950">Applications</h1>

          {/* Summary Bar */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-slate-600">Total</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{stats.total}</p>
            </div>
            {Object.entries(stats.statuses).map(([status, count]) => (
              <div key={status} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase text-slate-600">{status.replace(/_/g, ' ')}</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{count}</p>
              </div>
            ))}
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-slate-600">Immediate</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{stats.immediate}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-slate-600">Experience</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{stats.previousWork}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-slate-600">Laptop</p>
              <p className="mt-1 text-2xl font-bold text-slate-950">{stats.withLaptop}</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-8 space-y-4 rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-3">
              <div className="flex-1">
                <input type="text" placeholder="Search by name, email, WhatsApp..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
              </div>
              <button onClick={() => setShowColumnManager(!showColumnManager)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                Columns
              </button>
            </div>

            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
                <option value="">All Status</option>
                {Object.keys(STATUS_COLORS).map(status => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
              </select>
              <select value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">All Specializations</option>
                {['AI & DS', 'AI & ML', 'AI & CSE'].map(spec => <option key={spec} value={spec}>{spec}</option>)}
              </select>
              <select value={joiningFilter} onChange={(e) => setJoiningFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">All Joining</option>
                {Object.entries(JOINING_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <select value={laptopFilter} onChange={(e) => setLaptopFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">All Laptop</option>
                <option value="yes">Has Laptop</option>
                <option value="no">No Laptop</option>
              </select>
              <select value={previousWorkFilter} onChange={(e) => setPreviousWorkFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">All Experience</option>
                <option value="yes">Has Experience</option>
                <option value="no">No Experience</option>
              </select>
              <select value={graduationFilter} onChange={(e) => setGraduationFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">All Years</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>
          </div>

          {/* Column Manager */}
          {showColumnManager && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {ALL_COLUMNS.map(col => (
                  <label key={col.key} className="flex items-center gap-2">
                    <input type="checkbox" checked={visibleColumns.has(col.key)} onChange={(e) => {
                      const newCols = new Set(visibleColumns);
                      if (e.target.checked) newCols.add(col.key);
                      else newCols.delete(col.key);
                      setVisibleColumns(newCols);
                    }} className="rounded border-slate-300" />
                    <span className="text-sm text-slate-700">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Spreadsheet Table */}
          <div className="mt-8 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="sticky left-0 z-20 w-12 bg-slate-50 px-4 py-3"><input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={handleSelectAll} className="rounded border-slate-300" /></th>
                  {ALL_COLUMNS.filter(c => visibleColumns.has(c.key)).map(col => (
                    <th key={col.key} className="cursor-pointer px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-100" onClick={() => { setSortBy(col.key); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                      {col.label} {sortBy === col.key && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  ))}
                  <th className="sticky right-0 z-20 bg-slate-50 px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => (
                  <tr key={app._id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 hover:bg-slate-50"><input type="checkbox" checked={selectedIds.has(app._id)} onChange={() => handleSelectOne(app._id)} className="rounded border-slate-300" /></td>
                    {ALL_COLUMNS.filter(c => visibleColumns.has(c.key)).map(col => (
                      <td key={col.key} className="px-4 py-3 text-slate-700">
                        {col.key === 'status' ? (
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[app.status]}`}>{app.status.replace(/_/g, ' ')}</span>
                        ) : col.key === 'resumeUrl' ? (
                          app.resumeUrl ? <a href={app.resumeUrl} className="text-blue-600 hover:underline">Download</a> : '—'
                        ) : col.key === 'githubUrl' || col.key === 'linkedinUrl' || col.key === 'portfolioUrl' ? (
                          (app as any)[col.key] ? <a href={(app as any)[col.key]} target="_blank" className="text-blue-600 hover:underline">Link</a> : '—'
                        ) : (
                          formatValue((app as any)[col.key], col.key)
                        )}
                      </td>
                    ))}
                    <td className="sticky right-0 z-10 bg-white px-4 py-3 text-right hover:bg-slate-50">
                      <Link href={`/admin/applications/${app._id}`} className="text-sm font-medium text-slate-900 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="px-4 py-12 text-center">
                <p className="text-slate-600">No applications found</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-4 text-sm text-slate-600">
            Showing {filtered.length} of {applications.length} applications {selectedIds.size > 0 && `• ${selectedIds.size} selected`}
          </div>
        </div>
      </div>
    </main>
  );
}
