import { Parser } from 'json2csv';
import { applicantEnum, genderEnum } from '../../utils/enum.js';

export const generateApplicantCsv = (applicants) => {
    const fields = [
        { label: 'First Name', value: (row) => row.name?.firstName || '' },
        { label: 'Middle Name', value: (row) => row.name?.middleName || '' },
        { label: 'Last Name', value: (row) => row.name?.lastName || '' },
        { label: 'Phone Number', value: (row) => row.phone?.phoneNumber || '' },
        { label: 'WhatsApp Number', value: (row) => row.phone?.whatsappNumber || '' },
        { label: 'Email', value: (row) => row.email || '' },
        { label: 'Gender', value: (row) => row.gender || '' },
        {
            label: 'Date of Birth',
            value: (row) =>
                row.dateOfBirth
                    ? new Date(row.dateOfBirth).toISOString().split('T')[0]
                    : '',
        },
        { label: 'Qualification', value: (row) => row.qualification || '' },
        { label: 'Specialization', value: (row) => row.specialization || 'Not Provided' },
        { label: 'Passing Year', value: (row) => row.passingYear || '' },
        { label: 'Current Pincode', value: (row) => row.currentPincode || '' },
        { label: 'Current City', value: (row) => row.currentCity || '' },
        { label: 'Current Address', value: (row) => row.currentAddress || '' },
        { label: 'State', value: (row) => row.state || '' },
        { label: 'Country', value: (row) => row.country || '' },
        { label: 'Applied Skills', value: (row) => row.appliedSkills?.join(', ') || '' },
        { label: 'Total Experience (years)', value: (row) => row.totalExperience || '' },
        { label: 'Relevant Skill Experience (years)', value: (row) => row.relevantSkillExperience || '' },
        { label: 'College Name', value: (row) => row.collegeName || '' },
        { label: 'CGPA', value: (row) => row.cgpa || '' },
        { label: 'Permanent Address', value: (row) => row.permanentAddress || '' },
        { label: 'Communication Skill', value: (row) => row.communicationSkill || '' },
        { label: 'Other Skills', value: (row) => row.otherSkills || '' },
        { label: 'Rating', value: (row) => row.rating || '' },
        { label: 'Current Package (LPA)', value: (row) => row.currentPkg || '' },
        { label: 'Expected Package (LPA)', value: (row) => row.expectedPkg || '' },
        { label: 'Notice Period (months)', value: (row) => row.noticePeriod || '' },
        { label: 'Negotiation', value: (row) => row.negotiation || '' },
        { label: 'Work Preference', value: (row) => row.workPreference || '' },
        { label: 'Feedback', value: (row) => row.feedback || '' },
        { label: 'Comment', value: (row) => row.comment || '' },
        { label: 'Status', value: (row) => row.status || '' },
        { label: 'Interview Stage', value: (row) => row.interviewStage || '' },
        {
            label: 'Current Company Designation',
            value: (row) => row.currentCompanyDesignation || '',
        },
        { label: 'Applied Role', value: (row) => row.appliedRole || '' },
        { label: 'Practical URL', value: (row) => row.practicalUrl || '' },
        { label: 'Practical Feedback', value: (row) => row.practicalFeedback || '' },
        { label: 'Portfolio URL', value: (row) => row.portfolioUrl || '' },
        { label: 'Referral', value: (row) => row.referral || '' },
        { label: 'Resume URL', value: (row) => row.resumeUrl || '' },
        { label: 'Preferred Locations', value: (row) => row.preferredLocations || '' },
        { label: 'Current Company Name', value: (row) => row.currentCompanyName || '' },
        { label: 'Marital Status', value: (row) => row.maritalStatus || ' ' },
        {
            label: 'Last Follow-Up Date',
            value: (row) =>
                row.lastFollowUpDate
                    ? new Date(row.lastFollowUpDate).toISOString().split('T')[0]
                    : '',
        },
        { label: 'Any Hands-On Offers', value: (row) => row.anyHandOnOffers ? 'Yes' : 'No' },
        { label: 'LinkedIn URL', value: (row) => row.linkedinUrl || 'Not Provided' },
        { label: 'Client CV URL', value: (row) => row.clientCvUrl || 'Not Provided' },
        { label: 'Client Feedback', value: (row) => row.clientFeedback || 'Not Provided' },
    ];

    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(applicants);
};

const formatDate = (dateString, isRequired = false) => {
    if (!dateString) return isRequired ? undefined : '';
    const parsedDate = new Date(dateString.replace(/[/]/g, '-').split('-').reverse().join('-'));
    return !isNaN(parsedDate.getTime()) ? parsedDate.toISOString().split('T')[0] : isRequired ? undefined : '';
};
const validateAndFillFields = async (data) => {
    return {
        name: {
            firstName: data['First Name']?.trim() || null,
            middleName: data['Middle Name']?.trim() || null,
            lastName: data['Last Name']?.trim() || null,
        },
        phone: {
            phoneNumber: data['Phone Number']?.trim() || null,
            whatsappNumber: data['WhatsApp Number']?.trim() || data['Phone Number']?.trim() || null,
        },
        email: data['Email']?.trim() || null,
        gender: genderEnum[data['Gender']?.toUpperCase()] || genderEnum.OTHER,
        dateOfBirth: data['Date of Birth'] ? formatDate(data['Date of Birth']?.trim(), true) : null,
        currentAddress: data['Current Address'] || 'Not Provided',
        state: data['State'] || null,
        country: data['Country'] || null,
        currentPincode: !isNaN(Number(data['Current Pincode']))
            ? Number(data['Current Pincode'])
            : null,
        currentCity: data['Current City'] || null,
        permanentAddress: data['Permanent Address'] || null,
        qualification: data['Qualification']?.trim() || 'Not Provided',
        specialization: data['Specialization']?.trim() || 'Not Provided',
        passingYear: !isNaN(Number(data['Passing Year']))
            ? Number(data['Passing Year'])
            : null,
        collegeName: data['College Name'] || null,
        cgpa: !isNaN(Number(data['CGPA'])) ? Number(data['CGPA']) : null,
        appliedSkills: data['Applied Skills']
            ? data['Applied Skills'].split(',').map((skill) => skill.trim())
            : [],
        totalExperience: !isNaN(Number(data['Total Experience (years)']))
            ? Number(data['Total Experience (years)'])
            : null,
        relevantSkillExperience: !isNaN(Number(data['Relevant Skill Experience (years)']))
            ? Number(data['Relevant Skill Experience (years)'])
            : null,
        communicationSkill: !isNaN(Number(data['Communication Skill']))
            ? Number(data['Communication Skill'])
            : null,
        otherSkills: data['Other Skills'] || null,
        rating: !isNaN(Number(data['Rating'])) ? Number(data['Rating']) : null,
        currentCompanyName: data['Current Company Name']?.trim() || null,
        currentCompanyDesignation:
            applicantEnum[data['Current Company Designation']?.trim().toUpperCase()] ||
            applicantEnum.NA,
        appliedRole:
            applicantEnum[data['Applied Role']?.trim().toUpperCase()] ||
            applicantEnum[data['Current Company Designation']?.trim().toUpperCase()] ||
            applicantEnum.NA,
        currentPkg: !isNaN(Number(data['Current Package (LPA)'])) ? Number(data['Current Package (LPA)']) : null,
        expectedPkg: !isNaN(Number(data['Expected Package (LPA)']))
            ? Number(data['Expected Package (LPA)'])
            : null,
        noticePeriod: !isNaN(Number(data['Notice Period (months)']))
            ? Number(data['Notice Period (months)'])
            : null,
        negotiation: data['Negotiation'] || null,
        workPreference:
            applicantEnum[data['Work Preference']?.toUpperCase()] ||
            applicantEnum.REMOTE,
        status:
            applicantEnum[data['Status']?.toUpperCase()] || applicantEnum.PENDING,
        interviewStage:
            applicantEnum[data['Interview Stage']?.trim().toUpperCase()] ||
            applicantEnum.FIRST_ROUND,
        practicalUrl: data['Practical URL'] || null,
        practicalFeedback: data['Practical Feedback'] || null,
        portfolioUrl: data['Portfolio URL'] || null,
        referral: data['Referral'] || null,
        resumeUrl: data['Resume URL'] || null,
        preferredLocations: data['Preferred Locations']?.trim() || null,
        maritalStatus:
            applicantEnum[data['Marital Status']?.toUpperCase()?.trim()] ||
            (data['Marital Status']?.trim() === 'Not Provided' ? null : data['Marital Status']?.trim()) ||
            null,
        lastFollowUpDate: formatDate(data['Last Follow-Up Date']),
        anyHandOnOffers: data['Any Hands-On Offers']?.toLowerCase() === 'yes',
        comment: data['Comment'] || null,
        feedback: data['Feedback'] || null,
        linkedinUrl: data['LinkedIn URL'] || 'Not Provided',
        clientCvUrl: data['Client CV URL'] || 'Not Provided',
        clientFeedback: data['Client Feedback'] || 'Not Provided',
    };
};
export const processCsvRow = async (data) => {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data provided to processCsvRow');
        }
        const requiredFields = {
            email: data['Email']?.trim(),
            firstName: data['First Name']?.trim(),
            lastName: data['Last Name']?.trim(),
            appliedRole: applicantEnum[data['Applied Role']?.toUpperCase()] || applicantEnum.NA,
        };
        const missingFields = Object.keys(requiredFields).filter(
            (key) => !requiredFields[key]
        );
        if (missingFields.length > 0) {
            console.warn(`Invalid row - missing essential fields:`, requiredFields);
            return null; //Skip invalid row
        }
        const validatedData = await validateAndFillFields(data);
        console.log('Validated Data:', validatedData);
        return validatedData;
    } catch (error) {
        console.error('Error in processCsvRow:', error);
        return null;
    }
};
