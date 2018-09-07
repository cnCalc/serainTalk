'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const supertest = require('supertest');
const testTools = require('../testTools');

const dbTool = require('../../database');
const staticConfig = require('../../config/staticConfig');

let app = require('../../index');
let agent = supertest.agent(app);

describe('picture part.', async () => {
  before('prepare database.', async () => {
    await app.prepare();
    await dbTool.prepare();
  });

  it('post one picture.', async () => {
    await testTools.member.createOneMember(agent, null, async () => {
      let getUrl = '/api/v1/picture';
      let pictureRes = await agent.post(getUrl)
        .attach('picture', 'test/testfile/testpng.png');

      expect(pictureRes.body.status).to.be.equal('ok');

      let paths = fs.readdirSync(staticConfig.upload.picture.path);
      paths.forEach(filePath => {
        try { fs.unlinkSync(path.join(staticConfig.upload.picture.path, filePath)); } catch (_) {};
      });
    });
  });
});
