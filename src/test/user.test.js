import request from 'supertest';
import * as chai from 'chai';
import app from '../../server.js';

const { expect } = chai;
describe('USER MODULE', () => {
    describe('POST /api/user/register', () => {
        it('should not user make register if exist', async () => {
            const res = await request(app).post('/api/user/register').send({
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
            const res = await request(app).post('/api/user/register').send({
                userName: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: '',
            });
            // console.log("response", res.status, res.body)
            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
            expect(res.body)
                .to.have.property('message')
                .that.include('Validation error');
        });
    });

    // LOGIN

    describe('POST /api/user/login', () => {
        // check user is exist
        it('should not login if user is not found', async () => {
            const res = await request(app)
                .post('/api/user/login')
                .send({ email: 'kev8693@gmail.com', password: 'Keval@086934' }); //enter wrong email

            // console.log("Response", res.status, res.body)
            expect(res.status).to.equal(404);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message', 'User is not found.');
        });

        // incorrect password

        it('should not login if password is incorrect', async () => {
            const res = await request(app).post('/api/user/login').send({
                email: 'kishan132@gmail.com',
                password: 'Keval@086934', // wrong passsword
            });

            expect(res.status).to.equal(401);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message', 'Invalid credentials.');
        });

        // // compare password if find user
        it('should login successfully with correct credentials', async () => {
            const res = await request(app).post('/api/user/login').send({
                email: 'kishan132@gmail.com',
                password: 'Keval@08693',
            });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'User logged in successfully.'
            );
            expect(res.body.data).to.have.property('token');
        });
    });
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
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'All profile are fetched successfully.'
            );
        });
    });

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
                .set('Authorization', `Bearer ${token}`);
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
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).to.equal(404);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message', 'Profile is not found.');
        });
    });

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
        //     const res = await request(app).put(`/api/user/updateProfile/67ac91a7c88f54e1f480d38d`)
        //         .set('Authorization', `Bearer ${token}`)
        //     console.log("Response", res.status, res.body)
        //     expect(res.status).to.equal(404)
        //     expect(res.body).to.have.property('success', false)
        //     expect(res.body).to.have.property('message', 'Profile is not found.')
        // })

        it('should update profile', async () => {
            const res = await request(app)
                .put(`/api/user/updateProfile/67bff5382f371b37c28b8aa7`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    userName: 'kishan',
                    email: 'kishan132@gmail.com',
                    phoneNumber: 9865457845,
                    dateOfBirth: '1998-01-21',
                    gender: 'male',
                    designation: 'react',
                    profilePicture: 'photo',
                });
            //     .field('userName', 'kishan')
            //     .field('email', 'kishan132@gmail.com')
            //     .field('phoneNumber', '9865457845')
            //     .field('dateOfBirth', '1998-10-10')
            //     .field('gender', 'gender')
            //     .field('designation', 'react')
            // // .attach('profilePicture', '../images/sample.jpg')
            // console.log("Response", res.status, res.body)
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'Profile is updated successfully.'
            );
        });
    });

    // send email
    // describe('POST  /api/user/sendEmail', () => {

    //     let token;
    //     it('should login and generate token', async () => {
    //         const loginToken = await request(app)
    //             .post('/api/user/login')
    //             .send({ email: 'kishan132@gmail.com', password: 'Keval@08693' });

    //         expect(loginToken.status).to.equal(200);
    //         expect(loginToken.body.data).to.have.property('token');
    //         token = loginToken.body.data.token;
    //     });

    //     it('should return 404 if email not found', async () => {
    //         const res = await request(app).post('/api/user/sendEmail')
    //             .set('Authorization', `Bearer ${token}`)
    //             .send({ email: 'kishan@gmail.com' }) // wrong email

    //         expect(res.status).to.equal(404)
    //         expect(res.body).to.have.property('success', false)
    //         expect(res.body).to.have.property('message', 'User is not found.')
    //     })

    //     it('should send otp trough email if authorized', async () => {
    //         const res = await request(app).post('/api/user/sendEmail')
    //             .set('Authorization', `Bearer ${token}`)
    //             .send({ email: 'kishan132@gmail.com' });

    //         expect(res.status).to.equal(201);
    //         expect(res.body).to.have.property('success', true);
    //         expect(res.body).to.have.property('message', 'Mail sent successfully.');
    //     })

    //     it('should return 400 if OTP is incorrect', async () => {
    //         const res = await request(app).post('/api/user/verifyOtp').send({
    //             email: 'kishan132@gmail.com',
    //             otp: '6565',
    //         });
    //         console.log("Response", res.status, res.body)
    //         expect(res.status).to.equal(400);
    //         expect(res.body).to.have.property('success', false);
    //         expect(res.body).to.have.property('message', 'OTP not matched');
    //     })
    // })

    describe('POST /api/user/forgotPassword/', () => {
        it('should return 404 if user not found', async () => {
            const res = await request(app)
                .put(`/api/user/forgotPassword/67ac91a7c88f54e1f480d38d`)
                .send({ newPassword: 'Test@1234', confirmPassword: 'Test@1234' });

            expect(res.status).to.equal(404);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message', 'User is not found.');
        });

        it('should return 400 if both field are not same', async () => {
            const res = await request(app)
                .put(`/api/user/forgotPassword/67ac97c690765ee0ca1783af`)
                .send({ newPassword: 'Test@12345', confirmPassword: 'Test@1234' }); // wrong pass

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message', 'Validation error');
        });

        it('should forgot password if both field same', async () => {
            const res = await request(app)
                .put(`/api/user/forgotPassword/67ac97c690765ee0ca1783af`)
                .send({ newPassword: 'Test@12345', confirmPassword: 'Test@12345' });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'Password is Forgot successfully.'
            );
        });
    });

    // change password
    describe('POST  /api/user/changePassword', () => {
        let token;
        it('should login and generate token', async () => {
            const loginToken = await request(app)
                .post('/api/user/login')
                .send({ email: 'kishan132@gmail.com', password: 'Keval@08693' });

            expect(loginToken.status).to.equal(200);
            expect(loginToken.body.data).to.have.property('token');
            token = loginToken.body.data.token;
        });

        it('should return 404 if user not found', async () => {
            const res = await request(app)
                .post(`/api/user/changePassword/67ac91a7c88f54e1f480d38d`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    oldPassword: 'Test@1234',
                    newPassword: 'Test@1234',
                    confirmPassword: 'Test@1234',
                });

            expect(res.status).to.equal(404);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('message', 'User is not found.');
        });

        it('should return 400 if old password incorrect', async () => {
            const res = await request(app)
                .post(`/api/user/changePassword/67ac97c690765ee0ca1783af`)
                .send({
                    oldPassword: 'Test@1234',
                    newPassword: 'Test@123456',
                    confirmPassword: 'Test@123456',
                });

            expect(res.status).to.equal(400);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property(
                'message',
                'Old password is incorrecct.'
            );
        });

        it('should change if old password correcct', async () => {
            const res = await request(app)
                .post(`/api/user/changePassword/67ac97c690765ee0ca1783af`)
                .send({
                    oldPassword: 'Test@12345',
                    newPassword: 'Test@123456',
                    confirmPassword: 'Test@123456',
                });

            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'Password successfully changed.'
            );
        });
    });
});
