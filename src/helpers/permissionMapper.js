/**
 * Helper functions to map sidebar menu items to permission keys
 */

import { PermissionKey } from '../utils/enum.js';

// Mapping from sidebar menu titles to permission keys
export const sidebarToPermissionMap = {
  Dashboard: PermissionKey.DASHBOARD,
  Applicants: PermissionKey.APPLICANTS,
  'Import Applicants': PermissionKey.APPLICANTS_IMPORT,
  Vendors: PermissionKey.VENDORS,
  Vendor: PermissionKey.VENDORS,
  'Vendor List': PermissionKey.VENDOR_LIST,
  'Vendor Job Listing': PermissionKey.VENDOR_JOB_LISTING,
  'Jobs Applicants': PermissionKey.VENDOR_JOB_APPLICANTS,
  'Vendor Applications': PermissionKey.VENDOR_APPLICATIONS_BY_ROLE,
  'Client List': PermissionKey.CLIENT_LIST,
  'Client Job Listing': PermissionKey.CLIENT_JOB_LISTING,
  'Client Jobs Applicants': PermissionKey.CLIENT_JOB_APPLICANTS,
  'Client Applications': PermissionKey.CLIENT_APPLICATIONS_BY_ROLE,
  Email: PermissionKey.EMAIL,
  Reports: PermissionKey.REPORTS,
  'Add Skills': PermissionKey.MASTER_SKILLS,
  'Add Qualification': PermissionKey.MASTER_DEGREE,
  'Add Role And Skill': PermissionKey.MASTER_ROLE_SKILL,
  'Find And Replace Fields': PermissionKey.MASTER_FIND_FIELDS,
  'Add Email Template': PermissionKey.MASTER_EMAIL_TEMPLATE,
  'Add Designation': PermissionKey.MASTER_DESIGNATION,
  'Add Country': PermissionKey.MASTER_COUNTRY,
  'Add State': PermissionKey.MASTER_STATE,
  'Add City': PermissionKey.MASTER_CITY,
};

/**
 * Convert sidebar menu items to permission keys
 * @param {string[]} menuItems - Array of sidebar menu item titles
 * @returns {string[]} Array of permission keys
 */
export const mapMenuItemsToPermissions = (menuItems) => {
  return menuItems
    .map((item) => sidebarToPermissionMap[item])
    .filter((permission) => permission !== undefined);
};

/**
 * Get all available permission keys
 * @returns {string[]} Array of all permission keys
 */
export const getAllPermissionKeys = () => Object.values(PermissionKey);

/**
 * Validate permission keys
 * @param {string[]} permissions - Array of permission keys to validate
 * @returns {Object} Validation result with isValid and invalidKeys
 */
export const validatePermissions = (permissions) => {
  const validPermissions = getAllPermissionKeys();
  const invalidKeys = permissions.filter(
    (permission) => !validPermissions.includes(permission)
  );

  return {
    isValid: invalidKeys.length === 0,
    invalidKeys,
    validKeys: permissions.filter((permission) =>
      validPermissions.includes(permission)
    ),
  };
};

/**
 * Get permission keys by category
 * @returns {Object} Object with categories and their permission keys
 */
export const getPermissionsByCategory = () => ({
  dashboard: [PermissionKey.DASHBOARD],
  applicants: [PermissionKey.APPLICANTS, PermissionKey.APPLICANTS_IMPORT],
  vendors: [
    PermissionKey.VENDORS,
    PermissionKey.VENDOR_LIST,
    PermissionKey.VENDOR_JOB_LISTING,
    PermissionKey.VENDOR_JOB_APPLICANTS,
    PermissionKey.VENDOR_APPLICATIONS_BY_ROLE,
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
  clients: [
    PermissionKey.CLIENTS,
    PermissionKey.CLIENT_LIST,
    PermissionKey.CLIENT_JOB_LISTING,
    PermissionKey.CLIENT_JOB_APPLICANTS,
    PermissionKey.CLIENT_APPLICATIONS_BY_ROLE,
  ],
});
