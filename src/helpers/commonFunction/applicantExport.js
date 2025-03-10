import { Parser } from 'json2csv';
import { generateApplicantNo } from '../generateApplicationNo.js';
import { applicantEnum } from '../../utils/enum.js';

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
        { label: 'Date of Birth', value: (row) => row.dateOfBirth ? new Date(row.dateOfBirth).toISOString().split('T')[0] : '' },
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
        { label: 'Expected Package (LPA)', value: (row) => row.expectedPkg || '' },
        { label: 'Notice Period (months)', value: (row) => row.noticePeriod || '' },
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
        { label: 'Last Follow-Up Date', value: (row) => row.lastFollowUpDate ? new Date(row.lastFollowUpDate).toISOString().split('T')[0] : 'Not Provided' },
        { label: 'Any Hands-On Offers', value: (row) => row.anyHandOnOffers ? 'Yes' : 'No' },
    ];
    const json2csvParser = new Parser({ fields });
    return json2csvParser.parse(applicants);
};


const parseDate = (dateString) => {
    if (!dateString || dateString.toLowerCase() === "not provided") return null;
    const dateParts = dateString.split("-");
    if (dateParts.length !== 3) return null;

    let [day, month, year] = dateParts.map(num => num.trim());

    if (year.length === 2) {
        year = `20${year}`;
    }

    const formattedDate = new Date(`${year}-${month}-${day}`);

    return isNaN(formattedDate.getTime()) ? null : formattedDate;
};


const validateAndFillFields = async (data) => {
    let applicationNo = Number(data["Application Number"]);

    if (!applicationNo || applicationNo <= 0) {
        applicationNo = await generateApplicantNo();
    }
    return {
        applicationNo,
        name: {
            firstName: data["First Name"] || "N/A",
            middleName: data["Middle Name"] || "",
            lastName: data["Last Name"] || "N/A",
        },

        phone: {
            phoneNumber: data["Phone Number"] || "0000000000",
            whatsappNumber: data["WhatsApp Number"] || "0000000000",
        },

        email: data["Email"] || "notprovided@example.com",
        gender: applicantEnum[data["Gender"]?.toUpperCase()] || applicantEnum.OTHER,

        dateOfBirth: parseDate(data["Date of Birth"]),

        homePincode: !isNaN(Number(data["Home Pincode"])) ? Number(data["Home Pincode"]) : null,
        homeTownCity: data["Home Town/City"] || "Unknown",
        appliedRole: applicantEnum[data["Applied Role"]?.toUpperCase()] || applicantEnum.NA,

        currentPincode: !isNaN(Number(data["Current Pincode"])) ? Number(data["Current Pincode"]) : null,
        country: data["Country"] || "N/A",
        state: data["State"] || "N/A",
        currentLocation: data["Current Location"] || "N/A",

        qualification: data["Qualification"] ? data["Qualification"].split(",").map(q => q.trim()) : [],
        degree: data["Degree"] || "N/A",
        passingYear: !isNaN(Number(data["Passing Year"])) ? Number(data["Passing Year"]) : new Date().getFullYear(),

        totalExperience: !isNaN(Number(data["Total Experience (years)"])) ? Number(data["Total Experience (years)"]) : 0,
        relevantSkillExperience: !isNaN(Number(data["Relevant Skill Experience (years)"])) ? Number(data["Relevant Skill Experience (years)"]) : 0,

        communicationSkill: !isNaN(Number(data["Communication Skill"])) ? Number(data["Communication Skill"]) : 1,
        rating: !isNaN(Number(data["Rating"])) ? Number(data["Rating"]) : 0,

        currentPkg: data["Current Package (LPA)"] || "N/A",
        expectedPkg: !isNaN(Number(data["Expected Package (LPA)"])) ? Number(data["Expected Package (LPA)"]) : 0,
        noticePeriod: !isNaN(Number(data["Notice Period (months)"])) ? Number(data["Notice Period (months)"]) : 0,

        negotiation: data["Negotiation"] || "N/A",
        workPreference: applicantEnum[data["Work Preference"]?.toUpperCase()] || applicantEnum.REMOTE,

        aboutUs: data["About Us"] || "",
        feedback: data["Feedback"] || "",

        status: applicantEnum[data["Status"]?.toUpperCase()] || applicantEnum.PENDING,
        interviewStage: applicantEnum[data["Interview Stage"]?.toUpperCase()] || applicantEnum.HR_ROUND,

        appliedSkills: data["Applied Skills"] ? data["Applied Skills"].split(",").map(skill => skill.trim()) : [],
        lastFollowUpDate: parseDate(data["Last Follow-Up Date"]),
        anyHandOnOffers: data["Any Hands-On Offers"]?.toLowerCase() === "yes",
    };
};



export const processCsvRow = async (data) => {
    try {
        if (!data || typeof data !== "object") {
            throw new Error("Invalid data provided to processCsvRow");
        }
        const validatedData = await validateAndFillFields(data);
        console.log("Validated Data:", validatedData);

        return validatedData;
    } catch (error) {
        console.error("Error in processCsvRow:", error);
        return null;
    }
};





