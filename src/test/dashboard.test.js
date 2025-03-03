import request from 'supertest'
import * as chai from 'chai'
import app from '../../server.js'


const { expect } = chai

describe('DASHBOARD', () => {

    describe('GET  /api/dashboard/applicant/count', () => {
        it('should count applicant', async () => {
            const res = await request(app)
                .get('/api/dashboard/applicant/count')
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'Dashboard data fetched successfully.'
            );
        })
    })

    describe('POST  /api/dashboard/applicant/applicantDetails', () => {
        it('should view applicantDetails', async () => {
            const res = await request(app)
                .post('/api/dashboard/applicant/applicantDetails')
                .send({ startDate: '2022-10-10', endDate: '2022-10-20' })
            expect(res.status).to.equal(200);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property(
                'message',
                'Dashboard data fetched successfully.'
            );
        })
    })

})