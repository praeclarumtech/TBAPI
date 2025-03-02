import request from 'supertest';
import * as chai from 'chai';
import app from '../../server.js';

const { expect } = chai;


describe('REPORTS', () => {


    describe('GET /api/reports/applicants/applicationOnProcessCount', () => {

        it('should get applicationOnProcessCount', async () => {
            const res = await request(app)
                .get('/api/reports/applicants/applicationOnProcessCount')
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'Reports is fetched successfully.'
            );
        })
    })


    describe('GET /api/reports/applicants/statusByPercentage', () => {

        it('should get statusByPercentage', async () => {
            const res = await request(app)
                .get('/api/reports/applicants/statusByPercentage')
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'Reports is fetched successfully.'
            );
        })
    })

    describe('GET /api/reports/applicants/technologyStatistics', () => {

        it('should get technologyStatistics', async () => {
            const res = await request(app)
                .get('/api/reports/applicants/technologyStatistics')
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'Reports is fetched successfully.'
            );
        })
    })

})