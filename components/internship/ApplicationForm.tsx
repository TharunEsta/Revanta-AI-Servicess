'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SPECIALIZATIONS = ['AI & DS', 'AI & ML', 'AI & CSE'];
const GRADUATION_YEARS = [2027, 2028];
const INTERESTS = ['Frontend Development', 'Backend Development', 'Full Stack Development'];
const TECHNOLOGIES = [
  'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js',
  'Express.js', 'PostgreSQL', 'MongoDB', 'Git', 'GitHub', 'REST APIs', 'GraphQL', 'Other'
];
const JOINING_OPTIONS = [
  { value: 'IMMEDIATELY', label: 'Immediately' },
  { value: 'WITHIN_1_WEEK', label: 'Within 1 Week' },
  { value: 'WITHIN_2_WEEKS', label: 'Within 2 Weeks' },
  { value: 'WITHIN_1_MONTH', label: 'Within 1 Month' },
  { value: 'MORE_THAN_1_MONTH', label: 'More than 1 Month' },
  { value: 'SPECIFIC_DATE', label: 'Specific Date' }
];

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  whatsappSameAsPhone: boolean;
  city: string;
  state: string;
  college: string;
  degree: string;
  specialization: string;
  graduationYear: string;
  cgpa: string;
  primaryInterest: string;
  technologiesKnown: string[];
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  hasProjects: boolean;
  projectName: string;
  projectDescription: string;
  projectTechnologies: string;
  projectUrl: string;
  projectGithubUrl: string;
  hasPreviousWork: boolean;
  previousOrganization: string;
  previousRole: string;
  previousStartDate: string;
  previousEndDate: string;
  previousResponsibilities: string;
  previousTechnologies: string;
  previousWorkDescription: string;
  previousLearnings: string;
  joiningAvailability: string;
  earliestJoiningDate: string;
  hoursPerWeek: string;
  hasPersonalLaptop: boolean;
  motivation: string;
  learningGoals: string;
  resumeFile: File | null;
  declarationAccepted: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function ApplicationForm() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [eligibilityError, setEligibilityError] = useState('');

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    whatsappSameAsPhone: false,
    city: '',
    state: '',
    college: '',
    degree: 'B.Tech',
    specialization: '',
    graduationYear: '',
    cgpa: '',
    primaryInterest: '',
    technologiesKnown: [],
    githubUrl: '',
    linkedinUrl: '',
    portfolioUrl: '',
    hasProjects: false,
    projectName: '',
    projectDescription: '',
    projectTechnologies: '',
    projectUrl: '',
    projectGithubUrl: '',
    hasPreviousWork: false,
    previousOrganization: '',
    previousRole: '',
    previousStartDate: '',
    previousEndDate: '',
    previousResponsibilities: '',
    previousTechnologies: '',
    previousWorkDescription: '',
    previousLearnings: '',
    joiningAvailability: '',
    earliestJoiningDate: '',
    hoursPerWeek: '',
    hasPersonalLaptop: false,
    motivation: '',
    learningGoals: '',
    resumeFile: null,
    declarationAccepted: false
  });

  const validateSection = (section: number): boolean => {
    const newErrors: FormErrors = {};

    if (section === 0) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.whatsappNumber && !formData.whatsappSameAsPhone) {
        newErrors.whatsappNumber = 'WhatsApp number is required';
      }
    }

    if (section === 1) {
      if (!formData.college.trim()) newErrors.college = 'College is required';
      if (!formData.specialization) newErrors.specialization = 'Specialization is required';
      if (!formData.graduationYear) newErrors.graduationYear = 'Graduation year is required';

      if (formData.degree !== 'B.Tech') {
        setEligibilityError('Only B.Tech candidates are eligible for this internship.');
        return false;
      }
      if (!SPECIALIZATIONS.includes(formData.specialization)) {
        setEligibilityError('Your specialization is not eligible for this internship.');
        return false;
      }
      if (![2027, 2028].includes(parseInt(formData.graduationYear))) {
        setEligibilityError('Only candidates graduating in 2027 or 2028 are eligible.');
        return false;
      }
      setEligibilityError('');
    }

    if (section === 2) {
      if (!formData.primaryInterest) newErrors.primaryInterest = 'Primary interest is required';
    }

    if (section === 3) {
      if (formData.hasProjects) {
        if (!formData.projectName.trim()) newErrors.projectName = 'Project name is required if you have projects';
      }
    }

    if (section === 4) {
      if (formData.hasPreviousWork) {
        if (!formData.previousOrganization.trim()) newErrors.previousOrganization = 'Organization is required';
        if (!formData.previousRole.trim()) newErrors.previousRole = 'Role is required';
      }
      if (!formData.joiningAvailability) newErrors.joiningAvailability = 'Joining availability is required';
      if (formData.joiningAvailability === 'SPECIFIC_DATE' && !formData.earliestJoiningDate) {
        newErrors.earliestJoiningDate = 'Joining date is required';
      }
      if (formData.hasPersonalLaptop === undefined) {
        newErrors.hasPersonalLaptop = 'Please confirm if you have a personal laptop';
      }
    }

    if (section === 5) {
      if (!formData.resumeFile) newErrors.resumeFile = 'Resume is required';
      if (!formData.declarationAccepted) newErrors.declarationAccepted = 'You must accept the declaration';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !eligibilityError;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => {
        const updated = { ...prev, [name]: checked };
        if (name === 'whatsappSameAsPhone' && checked) {
          updated.whatsappNumber = prev.phone;
        }
        return updated;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTechChange = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologiesKnown: prev.technologiesKnown.includes(tech)
        ? prev.technologiesKnown.filter(t => t !== tech)
        : [...prev.technologiesKnown, tech]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, resumeFile: 'File must be less than 5MB' }));
        return;
      }
      setFormData(prev => ({ ...prev, resumeFile: file }));
      setErrors(prev => ({ ...prev, resumeFile: '' }));
    }
  };

  const handleNext = () => {
    if (validateSection(currentSection)) {
      setCurrentSection(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentSection(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSection(5)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Handle whatsapp number
      const whatsappFinal = formData.whatsappSameAsPhone ? formData.phone : formData.whatsappNumber;

      // Build object for previous work
      const previousWorkExperience = formData.hasPreviousWork ? {
        organization: formData.previousOrganization,
        role: formData.previousRole,
        startDate: formData.previousStartDate,
        endDate: formData.previousEndDate,
        responsibilities: formData.previousResponsibilities,
        technologiesUsed: formData.previousTechnologies,
        workDescription: formData.previousWorkDescription,
        learnings: formData.previousLearnings
      } : null;

      // Add form fields
      const fieldsToSend = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        whatsappNumber: whatsappFinal,
        city: formData.city,
        state: formData.state,
        college: formData.college,
        degree: formData.degree,
        specialization: formData.specialization,
        graduationYear: formData.graduationYear,
        cgpa: formData.cgpa,
        primaryInterest: formData.primaryInterest,
        technologiesKnown: JSON.stringify(formData.technologiesKnown),
        githubUrl: formData.githubUrl,
        linkedinUrl: formData.linkedinUrl,
        portfolioUrl: formData.portfolioUrl,
        hasProjects: formData.hasProjects,
        projectName: formData.projectName,
        projectDescription: formData.projectDescription,
        projectTechnologies: formData.projectTechnologies,
        projectUrl: formData.projectUrl,
        projectGithubUrl: formData.projectGithubUrl,
        hasPreviousWork: formData.hasPreviousWork,
        previousWorkExperience: JSON.stringify(previousWorkExperience),
        joiningAvailability: formData.joiningAvailability,
        earliestJoiningDate: formData.earliestJoiningDate,
        hoursPerWeek: formData.hoursPerWeek,
        hasPersonalLaptop: formData.hasPersonalLaptop,
        motivation: formData.motivation,
        learningGoals: formData.learningGoals,
        declarationAccepted: formData.declarationAccepted
      };

      Object.entries(fieldsToSend).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== false) {
          formDataToSend.append(key, String(value));
        }
      });

      if (formData.resumeFile) {
        formDataToSend.append('resume', formData.resumeFile);
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const error = await response.json();
        setEligibilityError(error.error || 'Application submission failed');
        setIsSubmitting(false);
        return;
      }

      const result = await response.json();
      router.push(`/careers/software-development-intern/apply/success?id=${result.applicationId}`);
    } catch (error) {
      setEligibilityError('An error occurred while submitting your application. Please try again.');
      setIsSubmitting(false);
    }
  };

  const sections = [
    { title: 'Personal Information', fields: ['fullName', 'email', 'phone', 'whatsappNumber', 'city', 'state'] },
    { title: 'Education', fields: ['college', 'degree', 'specialization', 'graduationYear'] },
    { title: 'Technical Profile', fields: ['primaryInterest', 'technologiesKnown'] },
    { title: 'Links & Projects', fields: ['githubUrl', 'linkedinUrl', 'portfolioUrl', 'hasProjects'] },
    { title: 'Experience & Availability', fields: ['hasPreviousWork', 'joiningAvailability', 'hoursPerWeek', 'hasPersonalLaptop'] },
    { title: 'Motivation & Resume', fields: ['motivation', 'learningGoals', 'resumeFile', 'declarationAccepted'] }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex gap-2">
        {sections.map((_, idx) => (
          <div key={idx} className={`h-2 flex-1 rounded-full transition-colors ${idx <= currentSection ? 'bg-slate-900' : 'bg-slate-200'}`} />
        ))}
      </div>

      <div>
        <h2 className="font-[var(--font-display)] text-2xl font-semibold text-slate-900">
          {sections[currentSection].title}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Section {currentSection + 1} of {sections.length}
        </p>
      </div>

      {eligibilityError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{eligibilityError}</p>
        </div>
      )}

      {/* Section 0: Personal Information */}
      {currentSection === 0 && (
        <div className="space-y-6">
          <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleInputChange} error={errors.fullName} required />
          <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} error={errors.email} required />
          <InputField label="Phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} error={errors.phone} required />

          <div>
            <label className="block text-sm font-medium text-slate-700">WhatsApp Number <span className="text-red-500">*</span></label>
            <div className="mt-2 space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" name="whatsappSameAsPhone" checked={formData.whatsappSameAsPhone} onChange={handleInputChange} className="rounded border-slate-300" />
                <span className="text-sm text-slate-600">Same as phone number</span>
              </label>
              {!formData.whatsappSameAsPhone && (
                <input type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} placeholder="+91 9876543210" className={`w-full rounded-lg border px-4 py-2 text-sm ${errors.whatsappNumber ? 'border-red-300' : 'border-slate-200'}`} />
              )}
              {errors.whatsappNumber && <p className="text-sm text-red-600">{errors.whatsappNumber}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="City" name="city" value={formData.city} onChange={handleInputChange} error={errors.city} required />
            <InputField label="State" name="state" value={formData.state} onChange={handleInputChange} error={errors.state} required />
          </div>
        </div>
      )}

      {/* Section 1: Education */}
      {currentSection === 1 && (
        <div className="space-y-6">
          <InputField label="College / University" name="college" value={formData.college} onChange={handleInputChange} error={errors.college} required />

          <SelectField label="Degree" name="degree" value={formData.degree} onChange={handleInputChange} required>
            <option value="B.Tech">B.Tech</option>
          </SelectField>

          <SelectField label="Specialization" name="specialization" value={formData.specialization} onChange={handleInputChange} error={errors.specialization} required>
            <option value="">Select specialization</option>
            {SPECIALIZATIONS.map(spec => <option key={spec} value={spec}>{spec}</option>)}
          </SelectField>

          <SelectField label="Expected Graduation Year" name="graduationYear" value={formData.graduationYear} onChange={handleInputChange} error={errors.graduationYear} required>
            <option value="">Select graduation year</option>
            {[2027, 2028].map(year => <option key={year} value={year}>{year}</option>)}
          </SelectField>

          <InputField label="CGPA (Optional)" name="cgpa" type="number" value={formData.cgpa} onChange={handleInputChange} step="0.01" min="0" max="10" />
        </div>
      )}

      {/* Section 2: Technical Profile */}
      {currentSection === 2 && (
        <div className="space-y-6">
          <SelectField label="Primary Interest" name="primaryInterest" value={formData.primaryInterest} onChange={handleInputChange} error={errors.primaryInterest} required>
            <option value="">Select your primary interest</option>
            {INTERESTS.map(interest => <option key={interest} value={interest}>{interest}</option>)}
          </SelectField>

          <div>
            <label className="block text-sm font-medium text-slate-700">Technologies Known</label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {TECHNOLOGIES.map(tech => (
                <label key={tech} className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.technologiesKnown.includes(tech)} onChange={() => handleTechChange(tech)} className="rounded border-slate-300" />
                  <span className="text-sm text-slate-700">{tech}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Links & Projects */}
      {currentSection === 3 && (
        <div className="space-y-6">
          <InputField label="GitHub Profile URL" name="githubUrl" type="url" value={formData.githubUrl} onChange={handleInputChange} />
          <InputField label="LinkedIn Profile URL" name="linkedinUrl" type="url" value={formData.linkedinUrl} onChange={handleInputChange} />
          <InputField label="Portfolio / Personal Website" name="portfolioUrl" type="url" value={formData.portfolioUrl} onChange={handleInputChange} />

          <div className="border-t border-slate-200 pt-6">
            <label className="flex items-center gap-3">
              <input type="checkbox" name="hasProjects" checked={formData.hasProjects} onChange={handleInputChange} className="rounded border-slate-300" />
              <span className="text-sm font-medium text-slate-700">I have completed software projects</span>
            </label>
          </div>

          {formData.hasProjects && (
            <div className="space-y-4 rounded-lg bg-slate-50 p-4">
              <InputField label="Project Name" name="projectName" value={formData.projectName} onChange={handleInputChange} error={errors.projectName} required />
              <TextArea label="Project Description" name="projectDescription" value={formData.projectDescription} onChange={handleInputChange} rows={3} />
              <InputField label="Technologies Used" name="projectTechnologies" value={formData.projectTechnologies} onChange={handleInputChange} />
              <InputField label="Project URL" name="projectUrl" type="url" value={formData.projectUrl} onChange={handleInputChange} />
              <InputField label="GitHub Repository URL" name="projectGithubUrl" type="url" value={formData.projectGithubUrl} onChange={handleInputChange} />
            </div>
          )}
        </div>
      )}

      {/* Section 4: Experience & Availability */}
      {currentSection === 4 && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-6">
            <label className="flex items-center gap-3">
              <input type="checkbox" name="hasPreviousWork" checked={formData.hasPreviousWork} onChange={handleInputChange} className="rounded border-slate-300" />
              <span className="text-sm font-medium text-slate-700">I have previous internship or work experience</span>
            </label>
          </div>

          {formData.hasPreviousWork && (
            <div className="space-y-4 rounded-lg bg-slate-50 p-4">
              <InputField label="Organization" name="previousOrganization" value={formData.previousOrganization} onChange={handleInputChange} error={errors.previousOrganization} required />
              <InputField label="Role" name="previousRole" value={formData.previousRole} onChange={handleInputChange} error={errors.previousRole} required />
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Start Date" name="previousStartDate" type="date" value={formData.previousStartDate} onChange={handleInputChange} />
                <InputField label="End Date" name="previousEndDate" type="date" value={formData.previousEndDate} onChange={handleInputChange} />
              </div>
              <TextArea label="Responsibilities" name="previousResponsibilities" value={formData.previousResponsibilities} onChange={handleInputChange} rows={3} />
              <InputField label="Technologies Used" name="previousTechnologies" value={formData.previousTechnologies} onChange={handleInputChange} />
              <TextArea label="What did you work on?" name="previousWorkDescription" value={formData.previousWorkDescription} onChange={handleInputChange} rows={3} />
              <TextArea label="What did you learn?" name="previousLearnings" value={formData.previousLearnings} onChange={handleInputChange} rows={3} />
            </div>
          )}

          <div className="border-t border-slate-200 pt-6">
            <SelectField label="How soon can you join?" name="joiningAvailability" value={formData.joiningAvailability} onChange={handleInputChange} error={errors.joiningAvailability} required>
              <option value="">Select joining availability</option>
              {JOINING_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </SelectField>

            {formData.joiningAvailability === 'SPECIFIC_DATE' && (
              <div className="mt-4">
                <InputField label="Earliest Joining Date" name="earliestJoiningDate" type="date" value={formData.earliestJoiningDate} onChange={handleInputChange} error={errors.earliestJoiningDate} required />
              </div>
            )}
          </div>

          <InputField label="Hours Available Per Week" name="hoursPerWeek" type="number" value={formData.hoursPerWeek} onChange={handleInputChange} min="0" max="168" />

          <div className="border-t border-slate-200 pt-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Do you have a personal laptop available for the internship? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="hasPersonalLaptop" value="true" checked={formData.hasPersonalLaptop === true} onChange={(e) => setFormData(prev => ({ ...prev, hasPersonalLaptop: true }))} className="rounded-full border-slate-300" />
                <span className="text-sm text-slate-700">Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="hasPersonalLaptop" value="false" checked={formData.hasPersonalLaptop === false} onChange={(e) => setFormData(prev => ({ ...prev, hasPersonalLaptop: false }))} className="rounded-full border-slate-300" />
                <span className="text-sm text-slate-700">No</span>
              </label>
            </div>
            {errors.hasPersonalLaptop && <p className="mt-1 text-sm text-red-600">{errors.hasPersonalLaptop}</p>}
          </div>
        </div>
      )}

      {/* Section 5: Motivation & Resume */}
      {currentSection === 5 && (
        <div className="space-y-6">
          <TextArea label="Why do you want to join this internship?" name="motivation" value={formData.motivation} onChange={handleInputChange} rows={4} />
          <TextArea label="What do you want to learn during this internship?" name="learningGoals" value={formData.learningGoals} onChange={handleInputChange} rows={4} />

          <div>
            <label htmlFor="resume" className="block text-sm font-medium text-slate-700">
              Upload Resume <span className="text-red-500">*</span>
            </label>
            <input type="file" id="resume" name="resume" accept=".pdf,.doc,.docx" onChange={handleFileChange} className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm ${errors.resumeFile ? 'border-red-300' : 'border-slate-200'}`} />
            <p className="mt-1 text-xs text-slate-500">PDF, DOC, or DOCX (max 5MB)</p>
            {errors.resumeFile && <p className="mt-1 text-sm text-red-600">{errors.resumeFile}</p>}
            {formData.resumeFile && <p className="mt-1 text-sm text-green-600">✓ {formData.resumeFile.name}</p>}
          </div>

          <div className="border-t border-slate-200 pt-4">
            <label className="flex items-start gap-3">
              <input type="checkbox" name="declarationAccepted" checked={formData.declarationAccepted} onChange={handleInputChange} className="mt-1 rounded border-slate-300" />
              <span className="text-sm text-slate-700">
                I confirm that the information provided in this application is accurate and that I meet the eligibility requirements for this internship.
                <span className="text-red-500">*</span>
              </span>
            </label>
            {errors.declarationAccepted && <p className="mt-1 text-sm text-red-600">{errors.declarationAccepted}</p>}
          </div>
        </div>
      )}

      <div className="flex gap-4 border-t border-slate-200 pt-8">
        <button type="button" onClick={handlePrev} disabled={currentSection === 0} className="px-6 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">
          Previous
        </button>
        {currentSection === sections.length - 1 ? (
          <button type="submit" disabled={isSubmitting} className="ml-auto rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        ) : (
          <button type="button" onClick={handleNext} className="ml-auto rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Next
          </button>
        )}
      </div>
    </form>
  );
}

// Helper Components
function InputField({ label, name, type = 'text', value, onChange, error, required = false, ...props }: any) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input id={name} name={name} type={type} value={value} onChange={onChange} className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${error ? 'border-red-300' : 'border-slate-200'}`} {...props} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, value, onChange, children, error, required = false }: any) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select id={name} name={name} value={value} onChange={onChange} className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${error ? 'border-red-300' : 'border-slate-200'}`}>
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function TextArea({ label, name, value, onChange, rows = 4, error, required = false }: any) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea id={name} name={name} value={value} onChange={onChange} rows={rows} className={`mt-2 w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 ${error ? 'border-red-300' : 'border-slate-200'}`} />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
