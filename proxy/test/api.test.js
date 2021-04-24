const request = require('supertest');

const app = require('../src/app');

describe('GET /api/fleek/listFiles', () => {
  it('responds with a json message', (done) => {
    request(app)
      .get('/api/fleek/listFiles')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });
});

describe('GET /api/emojis', () => {
  it('responds with a json message', (done) => {
    request(app)
      .get('/api/v1/emojis')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, ['😀', '😳', '🙄'], done);
  });
});
