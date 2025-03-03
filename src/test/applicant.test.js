import request from 'supertest';
import * as chai from 'chai';
import app from '../../server.js';

const { expect } = chai;

describe('APPLICANT MODULE', () => {
    describe('ADD APPLICANT', () => {
        describe('POST  /api/applicants/addApplicant', () => {
            it('should add applicant', async () => {
                const applicantData = {
                    name: {
                        firstName: 'minasaksi',
                        middleName: 'minasaksi',
                        lastName: 'minasaksi',
                    },
                    phone: { whatsappNumber: '9999999999', phoneNumber: '6789098765' },
                    email: 'vivek@example.com',
                    gender: 'female',
                    dateOfBirth: '1995-01-20',
                    qualification: 'B.Tech',
                    degree: 'Computer Science',
                    passingYear: 2017,
                    fullAddress: 'ahmedabad',
                    currentLocation: 'New York',
                    state: 'NY',
                    country: 'USA',
                    pincode: 10001,
                    city: 'New York',
                    appliedSkills: ['JavaScript', 'React'],
                    resume: 'resume_link',
                    totalExperience: 10,
                    relevantSkillExperience: 3,
                    otherSkills: 'Node.js',
                    rating: 8,
                    currentPkg: '10 LPA',
                    expectedPkg: '15 LPA',
                    noticePeriod: '2 Months',
                    negotiation: 'Yes',
                    readyForWork: 'yes',
                    workPreference: 'remote',
                    aboutUs: 'LinkedIn',
                    feedback: 'Great opportunity',
                    status: 'in-process',
                    interviewStage: 'final',
                    referral: 'Jane Doe',
                };
                const res = await request(app)
                    .post('/api/applicants/addApplicant')
                    .send(applicantData);
                expect(res.status).to.equal(201);
                expect(res.body).to.include({
                    success: true,
                    message: 'Applicant is added successfully.',
                });
            });
        });
    });

    // view applicant
    describe('GET APPLICANT', () => {
        describe('GET /api/applicants/viewAllApplicant', () => {
            it('should view applicants', async () => {
                const res = await request(app).get('/api/applicants/viewAllApplicant');
                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('success', true);
                expect(res.body).to.have.property(
                    'message',
                    'Applicant are fetched successfully.'
                );
            });

            it('should view applicants by pagination', async () => {
                const res = await request(app)
                    .get('/api/applicants/viewAllApplicant')
                    .send({ page: 1, limit: 10 });
                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('success', true);
                expect(res.body).to.have.property(
                    'message',
                    'Applicant are fetched successfully.'
                );
            });

            it('should get applicant by filters(applicant number)', async () => {
                const res = await request(app)
                    .get('/api/applicants/viewAllApplicant')
                    .send({ applicationNo: 1001 });
                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('success', true);
            });

            it('should get applicant by matched filter', async () => {
                const res = await request(app)
                    .get('/api/applicants/viewAllApplicant')
                    .send({
                        totalExperience: 10,
                        appliedSkills: ['JavaScript', 'React'],
                    });
                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('success', true);
            });
        });
    });

    describe('VIES APPLICANT BY ID', () => {
        describe('GET /api/applicants/viewApplicant/:id', () => {
            it('should view profileById when authorized', async () => {
                const res = await request(app).get(
                    `/api/applicants/viewApplicant/67c190bc5dd82c5b6c236594`
                );

                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('success', true);
                expect(res.body).to.have.property(
                    'message',
                    'Applicant is Successfull Fetched by id.'
                );
            });

            it('should return 404 if applicant not found', async () => {
                const res = await request(app).get(
                    `/api/applicants/viewApplicant/67c191e94067816e3aadefdd`
                );

                expect(res.status).to.equal(404);
                expect(res.body).to.have.property('success', false);
                expect(res.body).to.have.property('message', 'Applicant is not found.');
            });
        });
    });

    describe('UPDATE APPLICANT', () => {
        describe('/api/applicants/updateApplicant/:id', () => {
            it('should update applicant', async () => {
                const applicantData = {
                    name: {
                        firstName: 'kinjal',
                        middleName: 'kinjal',
                        lastName: 'kinjal',
                    },
                    phone: { whatsappNumber: '9999999999', phoneNumber: '6789098765' },
                    email: 'kishan@example.com',
                    gender: 'female',
                    dateOfBirth: '1995-01-20',
                    qualification: 'B.Tech',
                    degree: 'Computer Science',
                    passingYear: 2017,
                    fullAddress: 'ahmedabad',
                    currentLocation: 'New York',
                    state: 'NY',
                    country: 'USA',
                    pincode: 10001,
                    city: 'New York',
                    appliedSkills: ['JavaScript', 'React'],
                    resume: 'resume_link',
                    totalExperience: 10,
                    relevantSkillExperience: 3,
                    otherSkills: 'Node.js',
                    rating: 8,
                    currentPkg: '10 LPA',
                    expectedPkg: '15 LPA',
                    noticePeriod: '2 Months',
                    negotiation: 'Yes',
                    readyForWork: 'yes',
                    workPreference: 'remote',
                    aboutUs: 'LinkedIn',
                    feedback: 'Great opportunity',
                    status: 'in-process',
                    interviewStage: 'final',
                    referral: 'Jane Doe',
                };
                const res = await request(app)
                    .put(`/api/applicants/updateApplicant/67aee4b6e4002db11a7cc691`)
                    .send(applicantData);
                expect(res.status).to.equal(200);
                expect(res.body).to.include({
                    success: true,
                    message: 'User is updated successfully.',
                });
            });
        });
    });

    describe('DELETE APPLICATION', () => {
        describe('DELETE /api/applicants/deleteApplicant/:id', () => {
            it('should return 404 if applicant not found', async () => {
                const res = await request(app).delete(
                    `/api/applicants/deleteApplicant/67aee55737c363546dd5d998`
                );

                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('success', true);
                expect(res.body).to.have.property(
                    'message',
                    'Applicant is deleted successfully.'
                );
            });

            it('should delete applicant', async () => {
                const res = await request(app).delete(
                    `/api/applicants/deleteApplicant/67aee4b6e4002db11a7cc691`
                );

                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('success', true);
                expect(res.body).to.have.property(
                    'message',
                    'Applicant is deleted successfully.'
                );
            });
        });
    });

    describe('UPDATE STATUS', () => {
        describe('put  /api/applicants/  /status/:id', () => {
            it('should update status', async () => {
                const res = await request(app)
                    .put(`/api/applicants/update/status/67aee56037c363546dd5d99b`)
                    .send({ status: 'rejected' });

                expect(res.status).to.equal(202);
                expect(res.body).to.have.property('success', true);
                expect(res.body).to.have.property(
                    'message',
                    'Applicant status is updated successfully.'
                );
            });
        });
    });
});
