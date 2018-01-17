'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const config = require('../../config');

let agent = supertest.agent(require('../../index'));

describe('api part.', async () => {
  before('prepare config.', async () => {
    await config.prepare();
  });

  it('get attachment by id.', async () => {
    let getUrl = '/api/v1/api/ls';
    let apiRes = await agent.get(getUrl).expect(200);
    apiRes = apiRes.body;
    expect(apiRes.status).to.be.equal('ok');
    let apis = apiRes.apis;
    for (let apiCategory of Object.keys(apis)) {
      for (let api of Object.keys(apis[apiCategory])) {
        expect(apis[apiCategory][api]).to.be.ok;
        expect(apis[apiCategory][api].description).to.be.ok;
        expect(apis[apiCategory][api].method).to.be.ok;
        expect(apis[apiCategory][api].route).to.be.an('array');
        expect(apis[apiCategory][api].schema).to.be.ok;
      }
    }
  });
});
