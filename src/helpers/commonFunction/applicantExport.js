import { Parser } from 'json2csv';
import { generateApplicantNo } from '../generateApplicationNo.js';

export const generateApplicantCsv = (applicants) => {
    const fields = [
        { label: 'Application Number', value: (row) => row.applicationNo || '' },
        { label: 'First Name', value: (row) => row.name?.firstName || '' },
        { label: 'Middle Name', value: (row) => row.name?.middleName || '' },
        { label: 'Last Name', value: (row) => row.name?.lastName || '' },
        { label: 'Phone Number', value: (row) => row.phone?.phoneNumber || '' },
        {
            label: 'WhatsApp Number',
            value: (row) => row.phone?.whatsappNumber || '',
        },
        { label: 'Email', value: (row) => row.email || '' },
        { label: 'Gender', value: (row) => row.gender || '' },
        { label: 'Date of Birth', value: (row) => row.dateOfBirth || '' },
        { label: 'Qualification', value: (row) => row.qualification || '' },
        { label: 'Degree', value: (row) => row.degree || '' },
        { label: 'Passing Year', value: (row) => row.passingYear || '' },
        { label: 'Full Address', value: (row) => row.fullAddress || '' },
        { label: 'State', value: (row) => row.state || '' },
        { label: 'Country', value: (row) => row.country || '' },
        { label: 'Pincode', value: (row) => row.pincode || '' },
        { label: 'City', value: (row) => row.city || '' },
        {
            label: 'Applied Skills',
            value: (row) => row.appliedSkills?.join(', ') || '',
        },
        {
            label: 'Total Experience (months)',
            value: (row) => row.totalExperience || '',
        },
        {
            label: 'Relevant Skill Experience',
            value: (row) => row.relevantSkillExperience || '',
        },
        { label: 'Resume', value: (row) => row.resume || '' },
        { label: 'Other Skills', value: (row) => row.otherSkills || '' },
        { label: 'Current Package', value: (row) => row.currentPkg || '' },
        { label: 'Expected Package', value: (row) => row.expectedPkg || '' },
        { label: 'Notice Period', value: (row) => row.noticePeriod || '' },
        { label: 'Negotiation', value: (row) => row.negotiation || '' },
        { label: 'Ready for Work (WFO)', value: (row) => row.readyForWork || '' },
        { label: 'Work Preference', value: (row) => row.workPreference || '' },
        { label: 'Referral', value: (row) => row.referral || '' },
        { label: 'Interview Stage', value: (row) => row.interviewStage || '' },
        { label: 'Status', value: (row) => row.status || '' },
        { label: 'About Us', value: (row) => row.aboutUs || '' },
        { label: 'Portfolio URL', value: (row) => row.portfolioUrl || '' },
        { label: 'Practical URL', value: (row) => row.practicalUrl || '' },
        {
            label: 'Practical Feedback',
            value: (row) => row.practicalFeedback || '',
        },
        { label: 'Referral', value: (row) => row.referral || '' },
        { label: 'Resume URL', value: (row) => row.resumeUrl || '' },
    ];
    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(applicants);
};

// import csv function

export const processCsvRow = async (data) => {
    const applicationNo =
        data['Application No']?.trim() || (await generateApplicantNo());
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
        dateOfBirth: data['Date of Birth']
            ? new Date(data['Date of Birth'].trim())
            : null,
        qualification: data['Qualification']?.trim() || '',
        degree: data['Degree']?.trim() || '',
        passingYear: data['Passing Year']
            ? Number(data['Passing Year'].trim())
            : null,
        fullAddress: data['Full Address']?.trim() || '',
        currentLocation: data['Current Location']?.trim() || '',
        state: data['State']?.trim() || '',
        country: data['Country']?.trim() || '',
        pincode: data['Pincode'] ? Number(data['Pincode'].trim()) : null,
        city: data['City']?.trim() || '',
        appliedSkills: data['Applied Skills']
            ? data['Applied Skills'].trim().split(',')
            : [],
        resume: data['Resume']?.trim() || '',
        totalExperience: data['Total Experience (months)']
            ? Number(data['Total Experience (months)'].trim())
            : 0,
        relevantSkillExperience: data['Relevant Skill Experience']
            ? Number(data['Relevant Skill Experience'].trim())
            : 0,
        otherSkills: data['Other Skill']?.trim() || '',
        currentPkg: data['Current Package']?.trim() || '',
        expectedPkg: data['Expected Package']?.trim() || '',
        noticePeriod: data['Notice Period']?.trim() || '',
        negotiation: data['Negotiation']?.trim() || '',
        readyForWork: data['Ready for Work (WFO)']?.trim() || '',
        workPreference: data['Work Preference']?.trim() || '',
        aboutUs: data['About Us']?.trim() || '',
        feedback: data['Feedback']?.trim() || '',
        status: data['Status']?.trim() || '',
        interviewStage: data['Interview Stage']?.trim() || '',
        practicalUrl: data['Practical URL']?.trim() || '',
        practicalFeedback: data['Practical Feedback']?.trim() || '',
        portfolioUrl: data['Portfolio URL']?.trim() || '',
        referral: data['Referral']?.trim() || '',
        resumeUrl: data['Resume URL']?.trim() || '',
        rating,
    };
};
