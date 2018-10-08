'use strict';

const supertest = require('supertest');
const assert = require('assert');
const config = require('../../config');

let app = require('../../index');
let agent = supertest.agent(app);

describe('api part.', async () => {
  before('prepare config.', async () => {
    await app.prepare();
    await config.prepare();
  });

  it('get all route.', async () => {
    let getUrl = '/api/v1/api/ls';
    let apiRes = await agent.get(getUrl);
    apiRes = apiRes.body;
    assert(apiRes.status === 'ok');
    let apis = apiRes.apis;
    for (let apiCategory of Object.keys(apis)) {
      for (let api of Object.keys(apis[apiCategory])) {
        assert(apis[apiCategory][api]);
        assert(apis[apiCategory][api].description);
        assert(apis[apiCategory][api].method);

        assert(apis[apiCategory][api].schema);
      }
    }
  });

  it('check buffer.', async () => {
    let getUrl = '/api/v1/api/ls';
    let apiRes = await agent.get(getUrl).expect(200);
    apiRes = apiRes.body;
    assert(apiRes.status === 'ok');
    let apis = apiRes.apis;
    for (let apiCategory of Object.keys(apis)) {
      for (let api of Object.keys(apis[apiCategory])) {
        assert(apis[apiCategory][api]);
        assert(apis[apiCategory][api].description);
        assert(apis[apiCategory][api].method);

        assert(apis[apiCategory][api].schema);
      }
    }
  });
});
