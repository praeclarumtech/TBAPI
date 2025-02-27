import request from 'supertest';
import * as chai from 'chai';
import app from '../../server.js';



const { expect } = chai;
describe('USER MODULE', () => {

    describe('POST /api/user/register', () => {
        it('should not user make register if exist', async () => {
            const res = await request(app)
                .post('/api/user/register')
                .send({
                    userName: 'sonalika',
                    email: 'sonalika@gmail.com',
                    password: 'Sonalika@086934',
                    confirmPassword: 'Sonalika@086934',
                    role: 'admin',
                });
            // console.log("response", res.status, res.body)
            expect(res.status).to.equal(409);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message', 'User is already exit.');
        });

        // it('should register', async () => {
        //     const res = await request(app)
        //         .post('/api/user/register')
        //         .send({
        //             userName: 'khatik',
        //             email: 'khatik@gmail.com',
        //             password: 'Khatik@086934',
        //             confirmPassword: 'Khatik@086934',
        //             role: 'admin',
        //         });
        //     // console.log("response", res.status, res.body)
        //     expect(res.status).to.equal(201);
        //     expect(res.body).to.have.property('success', true);
        //     expect(res.body).to.have.property('message', 'Congratulation! You are registered successfully..');
        // });


        it('should not user make register with blank filed', async () => {
            const res = await request(app)
                .post('/api/user/register')
                .send({
                    userName: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: ''
                });
            // console.log("response", res.status, res.body)
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message').that.include('Validation error');
        });
    })

    // LOGIN

    describe('POST /api/user/login', () => {

        // check user is exist
        it('should not login if user is not found', async () => {
            const res = await request(app).post('/api/user/login').send({ email: 'kev8693@gmail.com', password: 'Keval@086934' }) //enter wrong email 

            // console.log("Response", res.status, res.body)
            expect(res.status).to.equal(404)
            expect(res.body).to.have.property('success', false)
            expect(res.body).to.have.property('message', 'User is not found.')
        });


        // incorrect password

        it('should not login if password is incorrect', async () => {
            const res = await request(app).post('/api/user/login').send({
                email: 'kishan132@gmail.com',
                password: 'Keval@086934' // wrong passsword
            });

            // console.log("Response", res.status, res.body);
            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message', 'Invalid credentials.');
        });

        // // compare password if find user
        it('should login successfully with correct credentials', async () => {
            const res = await request(app).post('/api/user/login').send({
                email: 'kishan132@gmail.com',
                password: 'Keval@08693'
            });

            // console.log("Response", res.status, res.body);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('message', 'User logged in successfully.');
            expect(res.body.data).to.have.property('token');
        });
    })
    // profile
    describe('GET /api/user/viewProfile', () => {
        let token;
        it('should login and generate token', async () => {
            const loginToken = await request(app)
                .post('/api/user/login')
                .send({ email: 'kishan132@gmail.com', password: 'Keval@08693' });

            expect(loginToken.status).to.equal(200);
            expect(loginToken.body.data).to.have.property('token');
            token = loginToken.body.data.token;
        });

        it('should view profiles when authorized', async () => {
            const res = await request(app)
                .get('/api/user/viewProfile')
                .set('Authorization', `Bearer ${token}`)
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'All profile are fetched successfully.'
            );
        });
    })

    // vieProfileById
    describe('GET  /api/user/viewProfile/viewProfileById/', () => {

        let token;
        it('should login and generate token', async () => {
            const loginToken = await request(app)
                .post('/api/user/login')
                .send({ email: 'kishan132@gmail.com', password: 'Keval@08693' });

            expect(loginToken.status).to.equal(200);
            expect(loginToken.body.data).to.have.property('token');
            token = loginToken.body.data.token;
        });

        it('should view profileById when authorized', async () => {
            const res = await request(app)
                .get(`/api/user/viewProfile/viewProfileById/67ab1756115b150b6716b806`)
                .set('Authorization', `Bearer ${token}`)
            // console.log("Response", res.status, res.body)
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'Profile is Successfull Fetched by id.'
            );
        });

        it('should return 404 if profile not found', async () => {
            const res = await request(app)
                .get(`/api/user/viewProfile/viewProfileById/67ab33f4e585375bbf8f6014`)
                .set('Authorization', `Bearer ${token}`)
            expect(res.status).to.equal(404);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property(
                'message',
                'Profile is not found.'
            );
        });
    })

    // update profile

    describe('PUT /api/user/updateProfile/', () => {

        let token;
        it('should login and generate token', async () => {
            const loginToken = await request(app)
                .post('/api/user/login')
                .send({ email: 'kishan132@gmail.com', password: 'Keval@08693' });

            expect(loginToken.status).to.equal(200);
            expect(loginToken.body.data).to.have.property('token');
            token = loginToken.body.data.token;
        });


        // it('should not update if profile not found', async () => {
        //     const res = await request(app).put(`/api/user/updateProfile/67ad84e85bf00a41c825e948`)
        //         .set('Authorization', `Bearer ${token}`)
        //     console.log("Response", res.status, res.body)
        //     expect(res.status).to.equal(404)
        //     expect(res.body).to.have.property('success', false)
        //     expect(res.body).to.have.property('message', 'Profile is not found.')
        // })

        it('should update profile', async () => {
            const res = await request(app).put(`/api/user/updateProfile/67bff5382f371b37c28b8aa7`)
                .set('Authorization', `Bearer ${token}`)
                .send({ userName: 'kishan', email: 'kishan132@gmail.com', phoneNumber: 9865457845, dateOfBirth: '1998-01-21', gender: 'male', designation: 'react', profilePicture: 'photo' })
            //     .field('userName', 'kishan')
            //     .field('email', 'kishan132@gmail.com')
            //     .field('phoneNumber', '9865457845')
            //     .field('dateOfBirth', '1998-10-10')
            //     .field('gender', 'gender')
            //     .field('designation', 'react')
            // // .attach('profilePicture', '../images/sample.jpg')
            // console.log("Response", res.status, res.body)
            expect(res.status).to.equal(200)
            expect(res.body).to.have.property('success', true)
            expect(res.body).to.have.property('message', 'Profile is updated successfully.')
        })
    })

    // send email
    describe('POST  /api/user/sendEmail', () => {

        let token;
        it('should login and generate token', async () => {
            const loginToken = await request(app)
                .post('/api/user/login')
                .send({ email: 'kishan132@gmail.com', password: 'Keval@08693' });

            expect(loginToken.status).to.equal(200);
            expect(loginToken.body.data).to.have.property('token');
            token = loginToken.body.data.token;
        });

        it('should return 404 if email not found', async () => {
            const res = await request(app).post('/api/user/sendEmail')
                .set('Authorization', `Bearer ${token}`)
                .send({ email: 'kishan@gmail.com' }) // wrong email

            expect(res.status).to.equal(404)
            expect(res.body).to.have.property('success', false)
            expect(res.body).to.have.property('message', 'User is not found.')
        })

        it('should send otp trough email if authorized', async () => {
            const res = await request(app).post('/api/user/sendEmail')
                .set('Authorization', `Bearer ${token}`)
                .send({ email: 'kishan132@gmail.com' });

            expect(res.status).to.equal(201);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('message', 'Mail sent successfully.');
            expect(res.body).to.have.property('otp');
        })
    })

    describe('VERIFY OTP /api/user/sendEmail/verifyOtp', () => {
        it('should return 404 if email not found', async () => {

            const response = await request(app)
                .post('/api/user/sendEmail')
                .send({ email: 'kishan132@gmail.com' });

            const generatedOtp = response.body.otp || await findOtp('kishan132@gmail.com');

            const res = await request(app).post('/api/user/sendEmail/verifyOtp')
                .send({ email: 'wrong@gmail.com', otp: generatedOtp });

            expect(res.status).to.equal(404);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message', 'User is not found.');
        });

        it('should return 400 if OTP is incorrect', async () => {

            const response = await request(app)
                .post('/api/user/sendEmail')
                .send({ email: 'kishan132@gmail.com' });

            const generatedOtp = response.body.otp || await findOtp('kishan132@gmail.com');

            const res = await request(app).post('/api/user/sendEmail/verifyOtp')
                .send({ email: 'kishan132@gmail.com', otp: '9999' }); // Wrong OTP

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message', 'Invalid OTP.');
        });

        it('should verify OTP successfully', async () => {
            const response = await request(app)
                .post('/api/user/sendEmail')
                .send({ email: 'kishan132@gmail.com' });

            const generatedOtp = response.body.otp || await findOtp('kishan132@gmail.com');

            const res = await request(app).post('/api/user/sendEmail/verifyOtp')
                .send({ email: 'kishan132@gmail.com', otp: generatedOtp });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('message', 'OTP verified successfully.');
        });
    });

})
