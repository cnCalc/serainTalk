'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const supertest = require('supertest');
const testTools = require('../testTools');

const dbTool = require('../../database');
const staticConfig = require('../../config/staticConfig');

let agent = supertest.agent(require('../../index'));

describe('picture part.', async () => {
  before('prepare database.', async () => {
    await dbTool.prepare();
  });

  it('post one picture.', async () => {
    await testTools.member.createOneMember(agent, null, async () => {
      let getUrl = '/api/v1/picture';
      let pictureRes = await agent.post(getUrl)
        .attach('picture', 'test/testfile/testpng.png');

      expect(pictureRes.body.status).to.be.equal('ok');
      let picturePath = path.join(staticConfig.upload.picture.path, pictureRes.body.pictureName);
      expect(fs.existsSync(picturePath)).to.be.true;

      fs.unlinkSync(picturePath);
    });
  });
});
