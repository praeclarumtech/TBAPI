import { Parser } from 'json2csv';
import { applicantEnum, genderEnum } from '../../utils/enum.js';
import states from '../../models/stateModel.js';
import city from '../../models/citymodel.js';
import Skills from '../../models/skillsModel.js';

export const generateApplicantCsv = (applicants, selectedFields = null, ids) => {
  const allFields = [
    { key: 'name.firstName', label: 'First Name', value: row => row.name?.firstName || '' },
    { key: 'name.middleName', label: 'Middle Name', value: row => row.name?.middleName || '' },
    { key: 'name.lastName', label: 'Last Name', value: row => row.name?.lastName || '' },
    { key: 'phone.phoneNumber', label: 'Phone Number', value: row => row.phone?.phoneNumber || '' },
    { key: 'phone.whatsappNumber', label: 'WhatsApp Number', value: row => row.phone?.whatsappNumber || '' },
    { key: 'email', label: 'Email', value: row => row.email || '' },
    { key: 'gender', label: 'Gender', value: row => row.gender || '' },
    { key: 'dateOfBirth', label: 'Date of Birth', value: row => row.dateOfBirth ? new Date(row.dateOfBirth).toISOString().split('T')[0] : '' },
    { key: 'qualification', label: 'Qualification', value: row => row.qualification || '' },
    { key: 'specialization', label: 'Specialization', value: row => row.specialization || '' },
    { key: 'passingYear', label: 'Passing Year', value: row => row.passingYear || '' },
    { key: 'currentPincode', label: 'Current Pincode', value: row => row.currentPincode || '' },
    { key: 'currentCity', label: 'Current City', value: row => row.currentCity || '' },
    { key: 'currentAddress', label: 'Current Address', value: row => row.currentAddress || '' },
    { key: 'state', label: 'State', value: row => row.state || '' },
    { key: 'country', label: 'Country', value: row => row.country || '' },
    { key: 'appliedSkills', label: 'Applied Skills', value: row => row.appliedSkills?.join(', ') || '' },
    { key: 'totalExperience', label: 'Total Experience (years)', value: row => row.totalExperience || '' },
    { key: 'relevantSkillExperience', label: 'Relevant Skill Experience (years)', value: row => row.relevantSkillExperience || '' },
    { key: 'collegeName', label: 'College Name', value: row => row.collegeName || '' },
    { key: 'cgpa', label: 'CGPA', value: row => row.cgpa || '' },
    { key: 'permanentAddress', label: 'Permanent Address', value: row => row.permanentAddress || '' },
    { key: 'communicationSkill', label: 'Communication Skill', value: row => row.communicationSkill || '' },
    { key: 'otherSkills', label: 'Other Skills', value: row => row.otherSkills || '' },
    { key: 'rating', label: 'Rating', value: row => row.rating || '' },
    { key: 'currentPkg', label: 'Current Package', value: row => row.currentPkg || '' },
    { key: 'expectedPkg', label: 'Expected Package', value: row => row.expectedPkg || '' },
    { key: 'noticePeriod', label: 'Notice Period', value: row => row.noticePeriod || '' },
    { key: 'negotiation', label: 'Negotiation', value: row => row.negotiation || '' },
    { key: 'workPreference', label: 'Work Preference', value: row => row.workPreference || '' },
    { key: 'feedback', label: 'Feedback', value: row => row.feedback || '' },
    { key: 'comment', label: 'Comment', value: row => row.comment || '' },
    { key: 'status', label: 'Status', value: row => row.status || '' },
    { key: 'interviewStage', label: 'Interview Stage', value: row => row.interviewStage || '' },
    { key: 'currentCompanyDesignation', label: 'Current Company Designation', value: row => row.currentCompanyDesignation || '' },
    { key: 'appliedRole', label: 'Applied Role', value: row => row.appliedRole || '' },
    { key: 'practicalUrl', label: 'Practical URL', value: row => row.practicalUrl || '' },
    { key: 'practicalFeedback', label: 'Practical Feedback', value: row => row.practicalFeedback || '' },
    { key: 'portfolioUrl', label: 'Portfolio URL', value: row => row.portfolioUrl || '' },
    { key: 'referral', label: 'Referral', value: row => row.referral || '' },
    { key: 'resumeUrl', label: 'Resume URL', value: row => row.resumeUrl || '' },
    { key: 'preferredLocations', label: 'Preferred Locations', value: row => row.preferredLocations || '' },
    { key: 'currentCompanyName', label: 'Current Company Name', value: row => row.currentCompanyName || '' },
    { key: 'maritalStatus', label: 'Marital Status', value: row => row.maritalStatus || ' ' },
    { key: 'lastFollowUpDate', label: 'Last Follow-Up Date', value: row => row.lastFollowUpDate ? new Date(row.lastFollowUpDate).toISOString().split('T')[0] : '' },
    { key: 'anyHandOnOffers', label: 'Any Hands-On Offers', value: row => (row.anyHandOnOffers ? 'Yes' : 'No') },
    { key: 'linkedinUrl', label: 'LinkedIn URL', value: row => row.linkedinUrl || '' },
    { key: 'clientCvUrl', label: 'Client CV URL', value: row => row.clientCvUrl || '' },
    { key: 'clientFeedback', label: 'Client Feedback', value: row => row.clientFeedback || '' },
    { key: 'meta', label: 'Meta', value: row => row.meta || '' },
  ];
  const exportKeys = (ids || selectedFields)
    ? selectedFields?.length
      ? Array.from(new Set([...selectedFields]))
      : selectedFields
    : Array.from(new Set(allFields.map(field => field.key)));

  const filteredFields = exportKeys && exportKeys.length
    ? allFields.filter(field => exportKeys.includes(field.key))
    : allFields;


  const json2csvParser = new Parser({ fields: filteredFields });
  return json2csvParser.parse(applicants);
};


const parseDate = (dateString) => {
  if (!dateString) return null;

  try {
    if (!isNaN(dateString)) {
      const excelEpoch = new Date(1899, 11, 30);
      const parsedDate = new Date(excelEpoch.getTime() + dateString * 86400000);
      return parsedDate.toISOString().split('T')[0];
    }

    const normalized = dateString.replace(/\//g, '-').split('-');
    if (normalized.length === 3) {
      const reversed = normalized.reverse().join('-');
      const date = new Date(reversed);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    const fallbackDate = new Date(dateString);
    return isNaN(fallbackDate.getTime()) ? null : fallbackDate.toISOString().split('T')[0];
  } catch (e) {
    return null;
  }
};

const normalizeLocationField = async (collection, fieldName, inputValue) => {
  if (!inputValue) return '';

  let values = await collection.find({}, { [fieldName]: 1, _id: 0 });
  values = values.map(item => item[fieldName]);

  const normalizedMap = values.reduce((acc, val) => {
    const key = val.replace(/\s+/g, '').toLowerCase();
    acc[key] = val;
    return acc;
  }, {});

  const cleanedInput = inputValue.replace(/\s+/g, '').toLowerCase();
  let finalValue = normalizedMap[cleanedInput];

  if (!finalValue) {
    const fuzzyRegex = new RegExp(cleanedInput.split('').join('.*'), 'i');
    const matched = values.find(val =>
      fuzzyRegex.test(val.replace(/\s+/g, '').toLowerCase())
    );
    finalValue = matched || inputValue.trim();
  }
  return finalValue;
};

const validateAndFillFields = async (data, userRole) => {
  const finalState = await normalizeLocationField(states, 'state_name', data['State']);
  const finalCity = await normalizeLocationField(city, 'city_name', data['Current City']);
  const finalSkills = await normalizeLocationField(Skills, 'skills', data['Applied Skills']);
  return {
    name: {
      firstName: data['First Name']?.trim() || null,
      middleName: data['Middle Name']?.trim() || '',
      lastName: data['Last Name']?.trim() || '',
    },
    phone: {
      phoneNumber: data['Phone Number']?.trim() || null,
      whatsappNumber:
        data['WhatsApp Number']?.trim() || data['Phone Number']?.trim() || null,
    },
    email: data['Email']?.trim() || null,
    gender: genderEnum[data['Gender']?.toUpperCase()] || genderEnum.OTHER,
    dateOfBirth: parseDate(data['Date of Birth']),
    currentAddress: data['Current Address'] || '',
    state: finalState,
    country: data['Country'] || '',
    currentPincode: !isNaN(Number(data['Current Pincode']))
      ? Number(data['Current Pincode'])
      : null,
    currentCity: finalCity,
    permanentAddress: data['Permanent Address'] || '',
    qualification: data['Qualification']?.trim() || '',
    specialization: data['Specialization']?.trim() || '',
    passingYear: !isNaN(Number(data['Passing Year']))
      ? Number(data['Passing Year'])
      : null,
    collegeName: data['College Name'] || '',
    cgpa: !isNaN(Number(data['CGPA'])) ? Number(data['CGPA']) : null,
    appliedSkills: finalSkills,
    totalExperience: !isNaN(Number(data['Total Experience (years)']))
      ? Number(data['Total Experience (years)'])
      : 0,
    relevantSkillExperience: !isNaN(
      Number(data['Relevant Skill Experience (years)'])
    )
      ? Number(data['Relevant Skill Experience (years)'])
      : null,
    communicationSkill: !isNaN(Number(data['Communication Skill']))
      ? Number(data['Communication Skill'])
      : null,
    otherSkills: data['Other Skills'] || '',
    rating: !isNaN(Number(data['Rating'])) ? Number(data['Rating']) : null,
    currentCompanyName: data['Current Company Name']?.trim() || '',

    currentCompanyDesignation:
      Object.values(applicantEnum).find(
        (value) =>
          value.replace(/\s+/g, '').toUpperCase() ===
          data['Current Company Designation']
            ?.trim()
            .replace(/\s+/g, '')
            .toUpperCase()
      ) ||
      data['Current Company Designation']?.trim() ||
      null,
    appliedRole:
      Object.values(applicantEnum).find(
        (value) =>
          value.replace(/\s+/g, '').toUpperCase() ===
          data['Applied Role']?.trim().replace(/\s+/g, '').toUpperCase()
      ) ||
      data['Applied Role']?.trim() ||
      null,
    currentPkg:
      data['Current Package'] && !isNaN(Number(data['Current Package']))
        ? Number(data['Current Package'])
        : 0,
    expectedPkg: !isNaN(Number(data['Expected Package']))
      ? Number(data['Expected Package'])
      : null,
    noticePeriod: !isNaN(Number(data['Notice Period']))
      ? Number(data['Notice Period'])
      : null,
    negotiation: data['Negotiation'] || 0,
    workPreference:
      applicantEnum[data['Work Preference']?.toUpperCase()] ||
      null,
    status:
      applicantEnum[data['Status']?.toUpperCase()] || applicantEnum.PENDING,
    interviewStage:
      applicantEnum[data['Interview Stage']?.trim().toUpperCase()] ||
      applicantEnum.FIRST_INTERVIEW_ROUND,
    practicalUrl: data['Practical URL'] || '',
    practicalFeedback: data['Practical Feedback'] || '',
    portfolioUrl: data['Portfolio URL'] || '',
    referral: data['Referral'] || '',
    resumeUrl: data['Resume URL'] || '',
    preferredLocations: data['Preferred Locations']?.trim() || '',
    maritalStatus:
      applicantEnum[data['Marital Status']?.toUpperCase()?.trim()] ||
      (data['Marital Status']?.trim() === 'Not Provided'
        ? null
        : data['Marital Status']?.trim()) ||
      '',
    lastFollowUpDate: parseDate(data['Last Follow-Up Date']),
    anyHandOnOffers: data['Any Hands-On Offers']?.toLowerCase() === 'yes',
    comment: data['Comment'] || '',
    feedback: data['Feedback'] || '',
    linkedinUrl: data['LinkedIn URL'] || '',
    clientCvUrl: data['Client CV URL'] || '',
    clientFeedback: data['Client Feedback'] || '',
    // createdBy: userRole,
    // updatedBy: userRole,
    addedBy: applicantEnum.CSV,
  };
};
export const processCsvRow = async (data, lineNumber, userRole) => {
  lineNumber += 1;
  const errorMessages = [];

  if (!data || typeof data !== 'object') {
    errorMessages.push('Invalid data provided to processCsvRow');
  }

  const requiredFields = {
    firstName: data['First Name']?.trim(),
    email: data['Email']?.trim(),
    phoneNumber: data['Phone Number'] ? String(data['Phone Number']).trim() : null,
    appliedRole: data['Applied Role']?.trim(),
    currentCompanyDesignation: data['Current Company Designation']?.trim(),
    resumeUrl: data['Resume URL']?.trim(),
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([key, value]) => {
      if (key === 'currentCompanyDesignation' || key === 'appliedRole') return false;
      return !value || (Array.isArray(value) && value.length === 0);
    })
    .map(([key]) => key);

  if (missingFields.length > 0) {
    errorMessages.push(`${missingFields.join(', ')} field(s) are required at line ${lineNumber}.`);
  }

  const fuzzyMatchEnum = (inputValue, fieldName) => {
    if (!inputValue) return '';

    const cleanedInput = inputValue.replace(/\s+/g, '').toLowerCase();
    const enumValues = Object.values(applicantEnum);

    const normalizedMap = enumValues.reduce((acc, val) => {
      const key = val.replace(/\s+/g, '').toLowerCase();
      acc[key] = val;
      return acc;
    }, {});

    if (normalizedMap[cleanedInput]) return normalizedMap[cleanedInput];

    const fuzzyRegex = new RegExp(cleanedInput.split('').join('.*'), 'i');
    const matched = enumValues.find(val =>
      fuzzyRegex.test(val.replace(/\s+/g, '').toLowerCase())
    );

    if (matched) return matched;

    errorMessages.push(`Invalid ${fieldName} "${inputValue}" please check.`);
    return inputValue.trim();
  };

  const appliedRole = fuzzyMatchEnum(data['Applied Role'], 'appliedRole');
  const currentCompanyDesignation = fuzzyMatchEnum(data['Current Company Designation'], 'currentCompanyDesignation');

  if (errorMessages.length > 0) {
    throw {
      lineNumber,
      message: errorMessages,
    };
  }

  const validatedData = await validateAndFillFields(data, userRole);

  validatedData.currentCompanyDesignation = currentCompanyDesignation || applicantEnum.SOFTWARE_ENGINEER;
  validatedData.appliedRole = appliedRole || validatedData.currentCompanyDesignation;

  return {
    valid: true,
    data: {
      ...validatedData,
      appliedRole: validatedData.appliedRole,
      currentCompanyDesignation: validatedData.currentCompanyDesignation,
    },
    number: lineNumber,
  };
};











