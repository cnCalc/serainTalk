'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const supertest = require('supertest');
const testTools = require('../testTools');

const dbTool = require('../../database');
const staticConfig = require('../../config/staticConfig');
let agent = supertest.agent(require('../../index'));

describe('attachment part.', async () => {
  before('prepare database.', async () => {
    await dbTool.prepare();
  });

  it('get attachment by id.', async () => {
    let randomAid;
    let attachmentInfo = 1;
    while (attachmentInfo) {
      randomAid = parseInt(Math.random() * 1e15);
      attachmentInfo = await dbTool.attachment.findOne({ aid: randomAid });
    }
    await dbTool.attachment.insertOne({ aid: randomAid });

    let getUrl = `/api/v1/attachment?aid=${randomAid}`;
    let attachmentRes = await agent.get(getUrl).expect(200);
    attachmentRes = attachmentRes.body;
    let attachment = attachmentRes.attachment;
    expect(attachmentRes.status).to.be.equal('ok');
    expect(attachment.aid).to.be.equal(randomAid);
  });

  it('upload a file.', async () => {
    testTools.member.createOneMember(agent, null, async () => {
      let getUrl = '/api/v1/attachment';
      let fileRes = await agent.post(getUrl)
        .attach('file', 'test/testfile/attachment.txt');

      expect(fileRes.body.status).to.be.equal('ok');
      let filePath = path.join(staticConfig.upload.file.path, fileRes.body.attachmentName);
      expect(fs.existsSync(filePath)).to.be.true;

      fs.unlinkSync(filePath);
    });
  });
});
