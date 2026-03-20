export const Enum = {
  ADMIN: 'admin',
  HR: 'hr',
  USER: 'user',
  VENDOR: 'vendor',
  GUEST: 'guest',
  CLIENT: 'client',
};
export const genderEnum = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
};

export const jodTypeEnum = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  FREELANCE: 'freelance',
  ONSITE: 'onsite',
  REMOTE: 'remote',
};
export const timeZome = {
  IST: 'IST',
  UTC: 'UTC',
  EST: 'EST',
};
export const salaryFrequencyEnum = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  HOURLY: 'hourly',
};
export const salaryCurrencyEnum = {
  INR: 'INR',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  AUD: 'AUD',
  CAD: 'CAD',
  SGD: 'SGD',
};

export const jobPaymentTypeEnum = {
  CTH: 'CTH', // Contract to Hire
  CTC: 'CTC', // Cost to Company
};

export const applicationsEnum = {
  SUBMITTED: 'Submitted',
  INTERVIEW: 'Interview',
};

export const CompanyTypeEnum = {
  PRODUCT: 'product',
  SERVICE: 'service',
  BOTH: 'both',
};

export const HireResourcesEnum = {
  C2C: 'c2c',
  C2H: 'c2h',
  IN_HOUSE: 'in-house',
  ALL: 'all',
};

export const applicantEnum = {
  YES: 'yes',
  NO: 'no',
  REMOTE: 'remote',
  HYBRID: 'hybrid',
  ONSITE: 'onsite',
  FREELANCER_WORK: 'freelancer',
  ONLINE: 'online',
  OFFLINE: 'offline',

  //applicant status
  APPLIED: 'applied',
  IN_PROGRESS: 'in progress',
  SHORTLISTED: 'shortlisted',
  SELECTED: 'selected',
  REJECTED: 'rejected',
  ON_HOLD: 'on hold',
  ONBOARDED: 'onboarded',
  LEAVED: 'leaved',

  //interview stage
  HR_ROUND: 'hr round',
  TECHNICAL: 'technical',
  FIRST_INTERVIEW_ROUND: 'first interview round',
  PRACTICAL: 'practical',
  CLIENT: 'client',

  SOFTWARE_ENGINEER: 'Software Engineer',
  WEB_DESIGNER: 'Web Designer',
  WEB_DEVELOPER: 'web Developer',
  FRONTED_DEVLOPER: 'Frontend Developer',
  SENIOR_FRONTED_DEVLOPER: 'Senior Frontend Developer',
  SENIOR_SOFTWARE_ENGINEER: 'Senior Software Engineer',
  APPLICATION_DEVELOPMENT_MODERNIZATION:
    'Application Development Modernization',
  BACKEND_DEVLOPER: 'Backend Developer',
  JUNIOR_SOFTWARE_ENGINEER: 'Junior Software Engineer',
  FULL_STACK_DEVLOPER: 'Full Stack Developer',
  BLOCKCHAIN_DEVELOPER: 'Blockchain Developer',
  DATA_ANALYST: 'Data Analyst',
  DATA_SCIENTIST: 'Data Scientist',
  PRODUCT_MANAGER: 'Product Manager',
  PROJECT_ENGINEER: 'Project Engineer',
  UI_UX: 'UI_UX Designer',
  SENIOR_UI_ENGINEER: 'Senior UI Engineer',
  APPLICATION_DEVELOPER: 'Application developer',
  QA: 'QA Engineer',
  TECHNICAL_ANALYST: 'Technical Analyst',
  QUALITY_ANALYST: 'Quality Analyst',
  DEVOPS: 'DevOps Engineer',
  BUSNESS_ANALYST: 'Business Analyst',
  TECHNICSL_SUPPORT: 'Technical Support Engineer',
  JUNIOR_MERN_STACK_DEVELOPER: 'Junior MERN Stack Developer',
  MERN_STACK_DEVELOPER: 'MERN Stack Developer',
  MEAN_STACK_DEVELOPER: 'MEAN Stack Developer',
  DOTNET_DEVELOPER: 'DotNet Developer',
  JUNIOR_DOTNET_DEVELOPER: 'Junior DotNet developer',
  SENIOR_DOTNET_DEVELOPER: 'Senior DotNet developer',
  JAVA_DEVELOPER: 'Java Developer',
  PYTHON_DEVELOPER: 'Python Developer',
  PHP_DEVELOPER: 'PHP Developer',
  FRESHER: 'Fresher',
  SPECIALIST_PROGRAMMER: 'Specialist Programmer',
  REACT_DEVELOPER: 'Reactjs Developer',
  REACT_NATIVE_DEVELOPER: 'React Native Developer',
  NODEJS_DEVELOPER: 'Nodejs Developer',
  SENIOR_JAVSCRIPT_DEVELOPER: 'Senior JavaScript Developer',
  ASSOCIATE_SOFTWARE_ENGINEER: 'Associate Software Engineer',
  ASSOCIATE_PROCESS_MANAGER: 'Associate Process Manager',
  FREELANCER: 'Freelancer',
  TEAM_LEADER: 'Team Leader',
  SENIOR_ANGULAR_DEVELOPER: 'Senior Angular Developer',
  SHAREPOINT_DEVELOPER: 'SharePoint Developer',
  PLACEMENT_EXECUTIVE: 'Placement executive',
  SYSTEM_ENGINEER: 'System Engineer',
  SENIOR_SYSTEM_ENGINEER: 'Senior System Engineer',
  PROGRAMER_ANALYST: 'Programmer Analyst',
  CUSTOMER_SUPPORT_SPECIALIST: 'Customer Support Specialist',
  OTHER: 'Other',
  NA: 'Na',
  SINGLE: 'Single',
  MARRIED: 'Married',
  MANUAL: 'Manual',
  CSV: 'Csv',
  RESUME: 'Resume',
  GUEST: 'guest',
};

/** Allowed `workPreference` values: work mode + engagement type (QR/add/edit + view by id). */
export const applicantWorkPreferenceValues = [
  applicantEnum.REMOTE,
  applicantEnum.HYBRID,
  applicantEnum.ONSITE,
  applicantEnum.FREELANCER_WORK,
  jodTypeEnum.FULL_TIME,
  jodTypeEnum.FREELANCE,
  jodTypeEnum.CONTRACT,
  '',
];

/** Labels for validation errors (excludes empty string). */
export const applicantWorkPreferenceAllowedLabels =
  applicantWorkPreferenceValues.filter(Boolean);

/** Joi `any.only` message — keeps API docs and errors in sync with allowed values. */
export const applicantWorkPreferenceJoiMessage = `Work preference must be one or more of: ${applicantWorkPreferenceAllowedLabels.join(', ')}. Use a comma-separated string (e.g. "full-time,freelance,contract"), an array of values, or a single value — case-insensitive. Empty is allowed.`;

/**
 * Normalize form/API input to a canonical comma-separated string (deduped, order preserved).
 * Accepts: "", null, "remote", "full-time,freelance", ["full-time","freelance"], etc.
 * @returns {{ ok: true, value: string } | { ok: false, message: string }}
 */
export function parseApplicantWorkPreference(value) {
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: '' };
  }

  let parts = [];
  if (Array.isArray(value)) {
    parts = value
      .flatMap((v) => String(v).split(','))
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (typeof value === 'string') {
    parts = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  } else {
    return {
      ok: false,
      message: `Work preference must be a string, comma-separated string, or array of strings.`,
    };
  }

  if (parts.length === 0) {
    return { ok: true, value: '' };
  }

  const seen = new Set();
  const out = [];
  for (const p of parts) {
    const canon = applicantWorkPreferenceAllowedLabels.find(
      (a) => a.toLowerCase() === p.toLowerCase()
    );
    if (!canon) {
      return {
        ok: false,
        message: `Invalid work preference "${p}". Allowed: ${applicantWorkPreferenceAllowedLabels.join(', ')}.`,
      };
    }
    if (!seen.has(canon)) {
      seen.add(canon);
      out.push(canon);
    }
  }
  return { ok: true, value: out.join(',') };
}

export const candidateTemplateType = {
  APPLICATION_RECEIVED: 'APPLICATION_RECEIVED',
  SHORTLISTED_FOR_INTERVIEW: 'SHORTLISTED_FOR_INTERVIEW',
  INTERVIEW_INVITATION: 'INTERVIEW_INVITATION',
  INTERVIEW_RESCHEDULE: 'INTERVIEW_RESCHEDULE',
  JOB_OFFER: 'JOB_OFFER',
  OFFER_ACCEPTANCE_CONFIRMATION: 'OFFER_ACCEPTANCE_CONFIRMATION',
  REJECTION_AFTER_INTERVIEW: 'REJECTION_AFTER_INTERVIEW',
  GENERAL_REJECTION: 'GENERAL_REJECTION',
  ONBOARDING_REMINDER: 'ONBOARDING_REMINDER',
  THANK_YOU_FOR_INTERVIEW: 'THANK_YOU_FOR_INTERVIEW',
  JOB_NOTIFICATION: 'JOB_NOTIFICATION',
};

// Permission keys based on sidebar menu structure
export const PermissionKey = {
  // Dashboard
  DASHBOARD: 'dashboard',

  // Applicants
  APPLICANTS: 'applicants',
  APPLICANTS_IMPORT: 'applicants_import',

  //clients
  CLIENTS: 'clients',
  CLIENT_LIST: 'client_list',
  CLIENT_JOB_LISTING: 'client_job_listing',
  CLIENT_JOB_APPLICANTS: 'client_job_applicants',
  CLIENT_APPLICATIONS_BY_ROLE: 'client_applications_by_role',

  // Vendors
  VENDORS: 'vendors',
  VENDOR_LIST: 'vendor_list',
  VENDOR_JOB_LISTING: 'vendor_job_listing',
  VENDOR_JOB_APPLICANTS: 'vendor_job_applicants',
  VENDOR_APPLICATIONS_BY_ROLE: 'vendor_applications_by_role',

  // Analysis
  EMAIL: 'email',
  REPORTS: 'reports',

  // Masters
  MASTER: 'master',
  MASTER_SKILLS: 'master_skills',
  MASTER_DEGREE: 'master_degree',
  MASTER_ROLE_SKILL: 'master_role_skill',
  MASTER_FIND_FIELDS: 'master_find_fields',
  MASTER_EMAIL_TEMPLATE: 'master_email_template',
  MASTER_DESIGNATION: 'master_designation',
  MASTER_COUNTRY: 'master_country',
  MASTER_STATE: 'master_state',
  MASTER_CITY: 'master_city',

  // Settings
  SETTINGS: 'settings',
};
