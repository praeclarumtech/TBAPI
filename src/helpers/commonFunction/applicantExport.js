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
        { label: 'Specialization', value: (row) => row.specialization || '' },
        { label: 'Passing Year', value: (row) => row.passingYear || '' },
        { label: 'College Name', value: (row) => row.collegeName || '' },
        { label: 'CGPA', value: (row) => row.cgpa || '' },
        { label: 'Current Address', value: (row) => row.currentAddress || '' },
        { label: 'State', value: (row) => row.state || '' },
        { label: 'Country', value: (row) => row.country || '' },
        { label: 'Current Pincode', value: (row) => row.currentPincode || '' },
        { label: 'Current City', value: (row) => row.currentCity || '' },
        { label: 'Permanent Address', value: (row) => row.permanentAddress || '' },
        { label: 'Applied Skills', value: (row) => row.appliedSkills?.join(', ') || '' },
        { label: 'Total Experience (years)', value: (row) => row.totalExperience || '' },
        { label: 'Relevant Skill Experience (years)', value: (row) => row.relevantSkillExperience || '' },
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
        { label: 'Marital Status', value: (row) => row.maritalStatus || 'Not Provided' },
        {
            label: 'Last Follow-Up Date',
            value: (row) =>
                row.lastFollowUpDate
                    ? new Date(row.lastFollowUpDate).toISOString().split('T')[0]
                    : 'Not Provided',
        },
        { label: 'Any Hands-On Offers', value: (row) => row.anyHandOnOffers ? 'Yes' : 'No' },
    ];

    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(applicants);
};
const validateAndFillFields = async (data) => {
    return {
        name: {
            firstName: data['First Name'] || 'N/A',
            middleName: data['Middle Name'] || '',
            lastName: data['Last Name'] || 'N/A',
        },
        phone: {
            phoneNumber: data['Phone Number'] || '0000000000',
            whatsappNumber: data['WhatsApp Number'] || '0000000000',
        },
        email: data['Email'] || 'notprovided@example.com',
        gender: genderEnum[data['Gender']?.toUpperCase()] || genderEnum.OTHER,
        dateOfBirth: data['Date of Birth']
            ? new Date(data['Date of Birth']).toISOString().split('T')[0]
            : null,
        currentAddress: data['Current Address'] || 'N/A',
        state: data['State'] || 'N/A',
        country: data['Country'] || 'N/A',
        currentPincode: !isNaN(Number(data['Current Pincode']))
            ? Number(data['Current Pincode'])
            : null,
        currentCity: data['Current City'] || 'Unknown',
        permanentAddress: data['Permanent Address'] || 'N/A',
        qualification: data['Qualification']?.trim() || '',
        specialization: data['Specialization']?.trim() || '',
        passingYear: !isNaN(Number(data['Passing Year']))
            ? Number(data['Passing Year'])
            : new Date().getFullYear(),
        collegeName: data['College Name'] || 'N/A',
        cgpa: !isNaN(Number(data['CGPA'])) ? Number(data['CGPA']) : 0,
        appliedSkills: data['Applied Skills']
            ? data['Applied Skills'].split(',').map((skill) => skill.trim())
            : [],
        totalExperience: !isNaN(Number(data['Total Experience (years)']))
            ? Number(data['Total Experience (years)'])
            : 0,
        relevantSkillExperience: !isNaN(
            Number(data['Relevant Skill Experience (years)'])
        )
            ? Number(data['Relevant Skill Experience (years)'])
            : 0,
        communicationSkill: !isNaN(Number(data['Communication Skill']))
            ? Number(data['Communication Skill'])
            : 1,
        otherSkills: data['Other Skills'] || 'Not Provided',
        rating: !isNaN(Number(data['Rating'])) ? Number(data['Rating']) : 0,
        currentCompanyName: data['Current Company Name']?.trim() || 'Not Provided',
        currentCompanyDesignation:
            applicantEnum[data['Current Company Designation']?.toUpperCase()] ||
            applicantEnum.NA,
        appliedRole:
            applicantEnum[data['Applied Role']?.toUpperCase()] || applicantEnum.NA,

        currentPkg: data['Current Package (LPA)'] || 'N/A',
        expectedPkg: !isNaN(Number(data['Expected Package (LPA)']))
            ? Number(data['Expected Package (LPA)'])
            : 0,
        noticePeriod: !isNaN(Number(data['Notice Period (months)']))
            ? Number(data['Notice Period (months)'])
            : 0,
        negotiation: data['Negotiation'] || 'N/A',
        workPreference:
            applicantEnum[data['Work Preference']?.toUpperCase()] ||
            applicantEnum.REMOTE,
        status:
            applicantEnum[data['Status']?.toUpperCase()] || applicantEnum.PENDING,
        interviewStage:
            applicantEnum[data['Interview Stage']?.toUpperCase()] ||
            applicantEnum.HR_ROUND,
        practicalUrl: data['Practical URL'] || 'Not Provided',
        practicalFeedback: data['Practical Feedback'] || 'Not Provided',
        portfolioUrl: data['Portfolio URL'] || 'Not Provided',
        referral: data['Referral'] || 'Not Provided',
        resumeUrl: data['Resume URL'] || 'Not Provided',
        preferredLocations: data['Preferred Locations']?.trim() || 'Not Provided',
        maritalStatus:
            applicantEnum[data['Marital Status']?.toUpperCase()?.trim()] ||
            data['Marital Status']?.trim() ||
            '',
        lastFollowUpDate: data['Last Follow-Up Date']
            ? new Date(data['Last Follow-Up Date']).toISOString().split('T')[0]
            : null,
        anyHandOnOffers: data['Any Hands-On Offers']?.toLowerCase() === 'yes',
        comment: data['Comment'] || 'No Comments',
        feedback: data['Feedback'] || 'No Feedback',
    };

};
export const processCsvRow = async (data) => {
    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data provided to processCsvRow');
        }
        const validatedData = await validateAndFillFields(data);
        console.log('Validated Data:', validatedData);
        return validatedData;
    } catch (error) {
        console.error('Error in processCsvRow:', error);
        return null;
    }
};
