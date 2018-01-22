'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const dbTool = require('../../database');
const fs = require('fs');
const path = require('path');
const staticConfig = require('../../config/staticConfig');

let agent = supertest.agent(require('../../index'));

describe('picture part.', async () => {
  before('prepare database.', async () => {
    await dbTool.prepare();
  });

  it('post one picture.', async () => {
    let getUrl = '/api/v1/picture';
    let pictureRes = await agent.post(getUrl)
      .attach('picture', 'test/testfile/testpng.png');

    let picturePath = path.join(staticConfig.upload.picture.path, pictureRes.body.pictureName);
    expect(fs.existsSync(picturePath)).to.be.true;

    fs.unlinkSync(picturePath);
  });
});
