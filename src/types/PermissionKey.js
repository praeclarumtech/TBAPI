/**
 * Permission keys based on sidebar menu structure
 * This file provides TypeScript-style enum functionality for JavaScript
 */

export const PermissionKey = {
  // Dashboard
  DASHBOARD: 'dashboard',

  // Applicants
  APPLICANTS: 'applicants',
  APPLICANTS_IMPORT: 'applicants_import',

  // Vendors
  VENDORS: 'vendors',
  VENDOR_LIST: 'vendor_list',
  VENDOR_JOB_LISTING: 'vendor_job_listing',
  VENDOR_JOB_APPLICANTS: 'vendor_job_applicants',

  // Clients
  CLIENTS: 'clients',
  CLIENT_LIST: 'client_list',
  CLIENT_JOB_LISTING: 'client_job_listing',
  CLIENT_JOB_APPLICANTS: 'client_job_applicants',

  // Analysis
  EMAIL: 'email',
  REPORTS: 'reports',

  // Masters
  MASTER_SKILLS: 'master_skills',
  MASTER_DEGREE: 'master_degree',
  MASTER_ROLE_SKILL: 'master_role_skill',
  MASTER_FIND_FIELDS: 'master_find_fields',
  MASTER_EMAIL_TEMPLATE: 'master_email_template',
  MASTER_DESIGNATION: 'master_designation',
  MASTER_COUNTRY: 'master_country',
  MASTER_STATE: 'master_state',
  MASTER_CITY: 'master_city',
};

// Helper function to get all permission keys
export const getAllPermissionKeys = () => Object.values(PermissionKey);

// Helper function to validate permission keys
export const isValidPermissionKey = (key) =>
  Object.values(PermissionKey).includes(key);

// Helper function to get permission keys by category
export const getPermissionsByCategory = () => ({
  dashboard: [PermissionKey.DASHBOARD],
  applicants: [PermissionKey.APPLICANTS, PermissionKey.APPLICANTS_IMPORT],
  vendors: [
    PermissionKey.VENDORS,
    PermissionKey.VENDOR_LIST,
    PermissionKey.JOB_LISTING,
    PermissionKey.JOB_APPLICANTS,
  ],
  clients: [
    PermissionKey.CLIENTS,
    PermissionKey.CLIENT_LIST,
    PermissionKey.JOB_LISTING,
    PermissionKey.JOB_APPLICANTS,
  ],
  analysis: [PermissionKey.EMAIL, PermissionKey.REPORTS],
  masters: [
    PermissionKey.MASTER_SKILLS,
    PermissionKey.MASTER_DEGREE,
    PermissionKey.MASTER_ROLE_SKILL,
    PermissionKey.MASTER_FIND_FIELDS,
    PermissionKey.MASTER_EMAIL_TEMPLATE,
    PermissionKey.MASTER_DESIGNATION,
    PermissionKey.MASTER_COUNTRY,
    PermissionKey.MASTER_STATE,
    PermissionKey.MASTER_CITY,
  ],
});
