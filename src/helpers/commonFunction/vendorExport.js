import { Parser } from "json2csv";

export const vendorFieldMap = [
  { key: "userId", label: "User ID", value: v => v.userId?._id || "" },
  { key: "username", label: "Username", value: v => v.username || "" },
  { key: "email", label: "Email", value: v => v.email || "" },
  { key: "firstName", label: "First Name", value: v => v.firstName || "" },
  { key: "lastName", label: "Last Name", value: v => v.lastName || "" },

  { key: "whatsapp_number", label: "Whatsapp Number", value: v => v.whatsapp_number || "" },
  { key: "company_name", label: "Company Name", value: v => v.company_name || "" },
  { key: "company_email", label: "Company Email", value: v => v.company_email || "" },
  { key: "company_phone_number", label: "Company Phone Number", value: v => v.company_phone_number || "" },
  { key: "company_location", label: "Company Location", value: v => v.company_location || "" },
  { key: "company_type", label: "Company Type", value: v => v.company_type || "" },
  { key: "hire_resources", label: "Hire Resources", value: v => v.hire_resources || "" },
  { key: "company_strength", label: "Company Strength", value: v => v.company_strength || "" },
  { key: "company_linkedin_profile", label: "Company Linkedin", value: v => v.company_linkedin_profile || "" },
  { key: "company_website", label: "Company Website", value: v => v.company_website || "" },
  { key: "vendor_linkedin_profile", label: "Vendor Linkedin", value: v => v.vendor_linkedin_profile || "" }
];

export const generateVendorCsv = (vendors, selectedFields = null) => {
  // If user selected specific fields
  const fieldsToUse = selectedFields?.length
    ? vendorFieldMap.filter(f => selectedFields.includes(f.key))
    : vendorFieldMap;

  // Prepare rows for CSV
  const rows = vendors.map(v => {
    const row = {};
    fieldsToUse.forEach(field => {
      row[field.label] = field.value(v);
    });
    return row;
  });

  const parser = new Parser({ fields: fieldsToUse.map(f => f.label) });
  return parser.parse(rows);
};

