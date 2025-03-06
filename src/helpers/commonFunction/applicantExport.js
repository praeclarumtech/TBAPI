import { Parser } from 'json2csv';
import { generateApplicantNo } from '../generateApplicationNo.js';

export const generateApplicantCsv = (applicants) => {
    const fields = [
        { label: 'Application Number', value: (row) => row.applicationNo || '' },
        { label: 'First Name', value: (row) => row.name?.firstName || '' },
        { label: 'Middle Name', value: (row) => row.name?.middleName || '' },
        { label: 'Last Name', value: (row) => row.name?.lastName || '' },
        { label: 'Phone Number', value: (row) => row.phone?.phoneNumber || '' },
        { label: 'WhatsApp Number', value: (row) => row.phone?.whatsappNumber || '' },
        { label: 'Email', value: (row) => row.email || '' },
        { label: 'Gender', value: (row) => row.gender || '' },
        { label: 'Date of Birth', value: (row) => row.dateOfBirth || '' },
        { label: 'Qualification', value: (row) => row.qualification?.join(', ') || '' },
        { label: 'Degree', value: (row) => row.degree || '' },
        { label: 'Passing Year', value: (row) => row.passingYear || '' },
        { label: 'Current Location', value: (row) => row.currentLocation || '' },
        { label: 'State', value: (row) => row.state ? row.state.charAt(0).toUpperCase() + row.state.slice(1) : '' },
        { label: 'Country', value: (row) => row.country ? row.country.charAt(0).toUpperCase() + row.country.slice(1) : '' },
        { label: 'Current Pincode', value: (row) => row.currentPincode || '' },
        { label: 'Current City', value: (row) => row.currentCity || '' },
        { label: 'Home Town City', value: (row) => row.homeTownCity || '' },
        { label: 'Home Pincode', value: (row) => row.homePincode || '' },
        { label: 'Applied Skills', value: (row) => row.appliedSkills?.join(', ') || '' },
        { label: 'Total Experience (years)', value: (row) => row.totalExperience || '' },
        { label: 'Relevant Skill Experience (years)', value: (row) => row.relevantSkillExperience || '' },
        { label: 'Communication Skill', value: (row) => row.communicationSkill || '' },
        { label: 'Other Skills', value: (row) => row.otherSkills || '' },
        { label: 'Rating', value: (row) => row.rating || '' },
        { label: 'Current Package (LPA)', value: (row) => row.currentPkg || '' },
        { label: 'Expected Package (LPA)', value: (row) => row.expectedPkg ? `${row.expectedPkg} LPA` : '' },
        { label: 'Notice Period (months)', value: (row) => row.noticePeriod ? `${row.noticePeriod} months` : '' },
        { label: 'Negotiation', value: (row) => row.negotiation || '' },
        { label: 'Work Preference', value: (row) => row.workPreference || '' },
        { label: 'About Us', value: (row) => row.aboutUs || '' },
        { label: 'Feedback', value: (row) => row.feedback || '' },
        { label: 'Status', value: (row) => row.status || '' },
        { label: 'Interview Stage', value: (row) => row.interviewStage || '' },
        { label: 'Current Company Designation', value: (row) => row.currentCompanyDesignation || '' },
        { label: 'Applied Role', value: (row) => row.appliedRole || '' },
        { label: 'Practical URL', value: (row) => row.practicalUrl || '' },
        { label: 'Practical Feedback', value: (row) => row.practicalFeedback || '' },
        { label: 'Portfolio URL', value: (row) => row.portfolioUrl || '' },
        { label: 'Referral', value: (row) => row.referral || '' },
        { label: 'Resume URL', value: (row) => row.resumeUrl || '' },
        { label: 'Preferred Locations', value: (row) => row.preferredLocations || '' },
        { label: 'Current Company Name', value: (row) => row.currentCompanyName || '' },
        { label: 'Marital Status', value: (row) => row.maritalStatus || 'Not Provided' },
        { label: 'Last Follow-Up Date', value: (row) => row.lastFollowUpDate || 'Not Provided' },
        { label: 'Any Hands-On Offers', value: (row) => row.anyHandOnOffers ? 'true' : 'false' },
    ];
    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(applicants);
};

export const processCsvRow = async (data) => {
    const applicationNo =
        data['Application Number']?.trim() || (await generateApplicantNo());
    const rating = data['Rating']?.trim() ? Number(data['Rating'].trim()) : 0;

    return {
        applicationNo,
        name: {
            firstName: data['First Name']?.trim() || '',
            middleName: data['Middle Name']?.trim() || '',
            lastName: data['Last Name']?.trim() || '',
        },
        phone: {
            phoneNumber: data['Phone Number']?.trim() || '',
            whatsappNumber: data['WhatsApp Number']?.trim() || '',
        },
        email: data['Email']?.trim() || '',
        gender: data['Gender']?.trim() || '',
        dateOfBirth: data['Date of Birth'] ? new Date(data['Date of Birth'].trim()) : null,
        qualification: data['Qualification']?.trim()?.split(',').map(q => q.trim()) || [],
        degree: data['Degree']?.trim() || '',
        passingYear: data['Passing Year']?.trim() ? Number(data['Passing Year'].trim()) : null,
        totalExperience: data['Total Experience (years)'] ? Number(data['Total Experience (years)'].trim()) : 0,
        relevantSkillExperience: data['Relevant Skill Experience (years)']
            ? Number(data['Relevant Skill Experience (years)'].trim())
            : 0,
        communicationSkill: data['Communication Skill']?.trim() || '',
        otherSkills: data['Other Skills']?.trim() || '',
        rating,
        currentPkg: data['Current Package (LPA)']?.trim() || '',
        expectedPkg: data['Expected Package (LPA)']?.trim() || '',
        noticePeriod: data['Notice Period (months)']?.trim() || '',
        negotiation: data['Negotiation']?.trim() || '',
        workPreference: data['Work Preference']?.trim() || '',
        aboutUs: data['About Us']?.trim() || '',
        feedback: data['Feedback']?.trim() || '',
        status: data['Status']?.trim() || '',
        interviewStage: data['Interview Stage']?.trim() || '',
        currentCompanyDesignation: data['Current Company Designation']?.trim() || '',
        appliedRole: data['Applied Role']?.trim() || '',
        practicalUrl: data['Practical URL']?.trim() || '',
        practicalFeedback: data['Practical Feedback']?.trim() || '',
        portfolioUrl: data['Portfolio URL']?.trim() || '',
        referral: data['Referral']?.trim() || '',
        resumeUrl: data['Resume URL']?.trim() || '',
        preferredLocations: data['Preferred Locations']
            ? data['Preferred Locations'].trim().split(',').map(loc => loc.trim())
            : [],
        currentCompanyName: data['Current Company Name']?.trim() || '',
        maritalStatus: data['Marital Status']?.trim() || 'Not Provided',
        lastFollowUpDate: data['Last Follow-Up Date'] ? new Date(data['Last Follow-Up Date'].trim()) : null,
        anyHandOnOffers: data['Any Hands-On Offers']?.trim().toLowerCase() === 'yes',
        currentLocation: data['Current Location']?.trim() || '',
        state: data['State']?.trim() || '',
        country: data['Country']?.trim() || '',
        currentPincode: data['Current Pincode']?.trim() ? Number(data['Current Pincode'].trim()) : null,
        currentCity: data['Current City']?.trim() || '',
        homeTownCity: data['Home Town City']?.trim() || '',
        homePincode: data['Home Pincode']?.trim() ? Number(data['Home Pincode'].trim()) : null,
    };
};
