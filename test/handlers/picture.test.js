'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const dbTool = require('../../database');

let agent = supertest.agent(require('../../index'));

describe('picture part.', async () => {
  before('prepare database.', async () => {
    await dbTool.prepare();
  });

  it('post one picture.', async () => {
    let getUrl = '/api/v1/picture';
    let pictureRes = await agent.post(getUrl)
      .attach('picture', 'test/testfile/testpng.png');
  });
});
