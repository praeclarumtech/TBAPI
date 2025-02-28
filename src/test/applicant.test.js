import request from 'supertest';
import * as chai from 'chai';
import app from '../../server.js';

const { expect } = chai;

describe('APPLICANT MODULE', () => {

    // add applicant
    describe('ADD APPLICANT', () => {

        describe('POST  /api/applicants/addApplicant', () => {

            it('should add applicant', async () => {
                const applicantData = {
                    name: { firstName: "saksi", middleName: "saksi", lastName: "saksi" },
                    phone: { whatsappNumber: "9999999999", phoneNumber: "6789098765" },
                    email: "vivek@example.com",
                    gender: "female",
                    dateOfBirth: "1995-01-20",
                    qualification: "B.Tech",
                    degree: "Computer Science",
                    passingYear: 2017,
                    fullAddress: "ahmedabad",
                    currentLocation: "New York",
                    state: "NY",
                    country: "USA",
                    pincode: 10001,
                    city: "New York",
                    appliedSkills: ["JavaScript", "React"],
                    resume: "resume_link",
                    totalExperience: 10,
                    relevantSkillExperience: 3,
                    otherSkills: "Node.js",
                    rating: 8,
                    currentPkg: "10 LPA",
                    expectedPkg: "15 LPA",
                    noticePeriod: "2 Months",
                    negotiation: "Yes",
                    readyForWork: "yes",
                    workPreference: "remote",
                    aboutUs: "LinkedIn",
                    feedback: "Great opportunity",
                    status: "in-process",
                    interviewStage: "final",
                    referral: "Jane Doe"
                };
                const res = await request(app)
                    .post('/api/applicants/addApplicant')
                    .send(applicantData);
                expect(res.status).to.equal(201);
                expect(res.body).to.include({ success: true, message: 'Applicant is added successfully.' });
            });


        })

    })


})