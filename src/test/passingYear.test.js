import request from 'supertest';
import * as chai from 'chai';
import app from '../../server.js';

const { expect } = chai;

describe('PassingYear module', () => {
    // addYear
    let token;
    it('should login and generate token', async () => {
        const loginToken = await request(app)
            .post('/api/user/login')
            .send({ email: 'keval8693@gmail.com', password: 'Keval@086934' });

        expect(loginToken.status).to.equal(200);
        expect(loginToken.body.data).to.have.property('token');
        token = loginToken.body.data.token;
    });

    it('should create year when authorized', async () => {
        const res = await request(app)
            .post('/api/year')
            .set('Authorization', `Bearer ${token}`)
            .send({ year: 2024 });
        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property(
            'message',
            'New year is added successfully.'
        );
    });

    it('should return 401 if no token provided', async () => {
        const res = await request(app).post('/api/year').send({ year: 2005 });

        expect(res.status).to.equal(401);

        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('statusCode', 401);
        expect(res.body).to.have.property(
            'message',
            'No token, authorization denied.'
        );
    });

    it('should return 403 if token is not valid', async () => {
        const res = await request(app)
            .post('/api/year')
            .set('Authorization', 'InvalidToken')
            .send({ year: 2024 });

        expect(res.status).to.equal(403);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Token is not valid.');
    });

    // getYears
    it('fetched  all years', async () => {
        const res = await request(app).get('/api/year/listOfYears');
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property(
            'message',
            'All years are fetched successfully.'
        );
    });

    it('fetched years by pagination', async () => {
        const res = await request(app)
            .get('/api/year/listOfYears/')
            .query({ page: 1, limit: 10 });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property(
            'message',
            'All years are fetched successfully.'
        );
    });

    // getYearById
    it('Get Year By Id', async () => {
        const res = await request(app).get(
            `/api/year/getYearById/67bd6909eeb79b118971d9b8`
        );
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property(
            'message',
            'Year is Successfull Fetched by id.'
        );
    });

    it('should return 404 if year is not found', async () => {
        const res = await request(app).get(`/api/year/getYearById/invalidYearId`);

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Validation error');
    });

    // deleteYear
    it('delete year', async () => {
        const res = await request(app).delete(
            `/api/year/deleteYear/67bd6909eeb79b118971d9b8`
        );
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property(
            'message',
            'Year is deleted successfully.'
        );
    });

    it('should return 404 if year is not found', async () => {
        const res = await request(app).delete(`/api/year/deleteYear/invalidYearId`);

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Validation error');
    });

    it('error during delete year', async () => {
        const res = await request(app).delete(`/api/year/deleteYear/invalidYearId`);

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Validation error');
    });

    // updateYear

    it('update year', async () => {
        const res = await request(app)
            .put(`/api/year/updateYear/67bd6909eeb79b118971d9b8`)
            .send({ year: 2000 });
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property(
            'message',
            'Year is updated successfully.'
        );
    });

    it('should return 404 if year is not found', async () => {
        const res = await request(app).put(`/api/year/updateYear/invalidYearId`);

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Validation error');
    });

    it('error during year', async () => {
        const res = await request(app).put(`/api/year/updateYear/invalidYearId`);

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Validation error');
    });
});
