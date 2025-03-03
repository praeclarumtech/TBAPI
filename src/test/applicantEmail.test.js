import request from 'supertest';
import * as chai from 'chai';
import app from '../../server.js';

const { expect } = chai;

describe('SEND EMAIL', () => {
    describe('POST /api/email/applicant/sendEmail', () => {
        let token;
        it('should login and generate token', async () => {
            const loginToken = await request(app)
                .post('/api/user/login')
                .send({ email: 'kishan132@gmail.com', password: 'Keval@08693' });

            expect(loginToken.status).to.equal(200);
            expect(loginToken.body.data).to.have.property('token');
            token = loginToken.body.data.token;
        });

        // it will return timout exceeeded
        // it('should send mail if authorized', async () => {
        //     const res = await request(app)
        //         .post('/api/email/applicant/sendEmail')
        //         .set('Authorization', `Bearer ${token}`)
        //         .send({ email_to: 'abc@gmail.com', email_bcc: 'uttam.praeclarum@gmail.com', subject: 'internship' })
        //     expect(res.status).to.equal(201);
        //     expect(res.body).to.have.property('success', true);
        //     expect(res.body).to.have.property(
        //         'message',
        //         'Mail sent successfully.'
        //     );
        // });

        it('should return 400 if incorrect email format', async () => {
            const res = await request(app)
                .post('/api/email/applicant/sendEmail')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email_to: 'abc@gmail.com',
                    email_bcc: 'uttam.praeclarumgmail.com',
                    subject: 'internship',
                });
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message', 'Validation error');
        });
    });

    // get emails

    describe('GET emails', () => {
        describe('GET /api/email/applicant/getAllEmails', () => {
            it('should view all emails', async () => {
                const res = await request(app).get('/api/email/applicant/getAllEmails');
                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('success', true);
                expect(res.body).to.have.property(
                    'message',
                    'All emails are fetched successfully.'
                );
            });

            it('should view emails by pagination', async () => {
                const res = await request(app)
                    .get('/api/email/applicant/getAllEmails')
                    .send({ page: 1, limit: 3 });
                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('success', true);
                expect(res.body).to.have.property(
                    'message',
                    'All emails are fetched successfully.'
                );
            });

            it('should get applicant by filters(email_to)', async () => {
                const res = await request(app)
                    .get('/api/email/applicant/getAllEmails')
                    .send({ email_to: 'abc@gmail.com' });
                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('success', true);
            });

            it('should get applicant by filters(subject)', async () => {
                const res = await request(app)
                    .get('/api/email/applicant/getAllEmails')
                    .send({ subject: 'internship' });
                expect(res.status).to.equal(200);
                expect(res.body).to.have.property('success', true);
            });
        });
    });

    // deleteMany email

    describe('DELETE EMAIL', () => {
        describe('DELETE /api/email/applicant/deleteManyEmails', () => {
            // it('should delete single email', async () => {
            //     const res = await request(app).delete('/api/email/applicant/deleteManyEmails').send({ ids: ['67c156b5e7722038d65631ee'] })

            //     expect(res.status).to.equal(200);
            //     expect(res.body).to.have.property('success', true);
            //     expect(res.body).to.have.property('message', 'Email is deleted successfully.');
            // })
            // it('should delete Many email', async () => {
            //     const res = await request(app).delete('/api/email/applicant/deleteManyEmails').send({ ids: ['67c156dae7722038d65631f2', '67c156c3e7722038d65631f0'] })

            //     expect(res.status).to.equal(200);
            //     expect(res.body).to.have.property('success', true);
            //     expect(res.body).to.have.property('message', 'Email is deleted successfully.');
            // })
            it('should return 500', async () => {
                const res = await request(app)
                    .delete('/api/email/applicant/deleteManyEmails')
                    .send({ ids: [''] });

                expect(res.status).to.equal(500);
                expect(res.body).to.have.property('success', false);
                expect(res.body).to.have.property(
                    'message',
                    'Failed to deleteMany emails.'
                );
            });
        });
    });
});
