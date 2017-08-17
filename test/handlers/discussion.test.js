'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;

let agent = supertest.agent(require('../../index'));

describe('discussion part', async () => {
  it('get discussion list by memberid', async () => {
    let url = '/api/v1/discussions/latest?memberid=594645288ffd693d6e43d73f';
    let discussionList = await agent
      .get(url)
      .expect(200);
    expect(discussionList.body.status);
    discussionList = discussionList.body;
  });
});
