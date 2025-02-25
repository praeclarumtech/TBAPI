import request from 'supertest';
import * as chai from 'chai';
import app from '../../server.js';

const { expect } = chai;

// add skills
describe('POST SKILLS api/skill/addSkills', () => {
    let token;
    it('should login and generate token', async () => {
        const loginToken = await request(app)
            .post('/api/user/login')
            .send({ email: 'keval8693@gmail.com', password: 'Keval@086934' });

        expect(loginToken.status).to.equal(200);
        expect(loginToken.body.data).to.have.property('token');
        token = loginToken.body.data.token;
    });

    it('should create skills when authorized', async () => {
        const res = await request(app)
            .post('/api/skill/addSkills')
            .set('Authorization', `Bearer ${token}`)
            .send({ skills: "django" });
        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property(
            'message',
            'Skills is added successfully.'
        );
    });

    it('should return 401 if no token provided', async () => {
        const res = await request(app).post('/api/skill/addSkills').send({ skills: "java" });

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
            .post('/api/skill/addSkills')
            .set('Authorization', 'InvalidToken')
            .send({ skills: "java" });

        expect(res.status).to.equal(403);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Token is not valid.');
    });
})

// get skills

describe('GET SKILLS /api/skill/viewSkills', () => {
    it('fetched  all skills', async () => {
        const res = await request(app).get('/api/skill/viewSkills');
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property(
            'message',
            'All skills are fetched successfully.'
        );
    });

    it('should fetch skills by pagination', async () => {
        const res = await request(app)
            .get('/api/skill/viewSkills')
            .query({ page: 1, limit: 10 });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property(
            'message',
            'All skills are fetched successfully.'
        );
    });
})

describe('GET /api/skill/viewById', () => {
    it('should Get skill By Id', async () => {
        const res = await request(app).get(
            `/api/skill/viewById/67bdb3e84aef72f8ec99f3de`
        );
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property(
            'message',
            'Skill is Successfull Fetched by id.'
        );
    });

    // it('should return 404 if skill is not found', async () => {
    //     const res = await request(app).get(`/api/skill/viewById/invalidSkillsId`);
    //     console.log("Response===", res.status, res.body)
    //     expect(res.status).to.equal(500);
    //     expect(res.body).to.have.property('success', false);
    //     expect(res.body).to.have.property('message', 'Failed to fetch skills by id.');
    // });
})


// update skills

describe('PUT /api/skill/update', () => {

    it('should update skills', async () => {
        const res = await request(app).put(`/api/skill/update/67bdc18d063010b1cba9cd78`).send({ skills: "ruby+python" })

        expect(res.status).to.equal(202)
        expect(res.body).to.have.property('success', true)
        expect(res.body).to.have.property('message', 'Skills is updated successfully.')
    })

})

