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
                email: 'keval8693@gmail.com',
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
                email: 'keval8693@gmail.com',
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
                .send({ email: 'keval8693@gmail.com', password: 'Keval@08693' });

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
                .send({ email: 'keval8693@gmail.com', password: 'Keval@08693' });

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
})
