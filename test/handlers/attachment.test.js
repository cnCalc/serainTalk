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
    await testTools.member.createOneMember(agent, null, async () => {
      let uploadUrl = '/api/v1/attachment';
      let fileRes = await agent.post(uploadUrl)
        .attach('file', 'test/testfile/attachment.txt');

      expect(fileRes.body.status).to.be.equal('ok');
      let filePath = path.join(staticConfig.upload.file.path, fileRes.body.attachmentName);
      expect(fs.existsSync(filePath)).to.be.true;

      fs.unlinkSync(filePath);
    });
  });

  it('get file upload by self.', async () => {
    await testTools.member.createOneMember(agent, null, async () => {
      let uploadUrl = '/api/v1/attachment';
      let fileRes = await agent.post(uploadUrl)
        .attach('file', 'test/testfile/attachment.txt');
      let filePath = path.join(staticConfig.upload.file.path, fileRes.body.attachmentName);

      let getUrl = '/api/v1/attachment/me';
      let attachmentsRes = await agent.get(getUrl);
      let attachments = attachmentsRes.body.attachments;

      expect(attachments[0].originalName).to.be.equal('attachment.txt');
      expect(attachments[0].fileName).to.be.equal(fileRes.body.attachmentName);

      fs.unlinkSync(filePath);
    });
  });

  it('upload too many file.', async () => {
    await testTools.member.createOneMember(agent, null, async () => {
      let uploadUrl = '/api/v1/attachment';
      let filePath = [];
      for (let i = 0; i < staticConfig.upload.file.maxCount; i++) {
        let fileRes = await agent.post(uploadUrl)
          .attach('file', 'test/testfile/attachment.txt');

        expect(fileRes.body.status).to.be.equal('ok');
        let tempPath = path.join(staticConfig.upload.file.path, fileRes.body.attachmentName);
        expect(fs.existsSync(tempPath)).to.be.true;
        filePath.push(tempPath);
      }

      await agent.post(uploadUrl)
          .attach('file', 'test/testfile/attachment.txt')
          .expect(401);

      filePath.map(path => fs.unlinkSync(path));
    });
  });

  it('anonymous upload a file.', async () => {
    let getUrl = '/api/v1/attachment';
    let fileRes = await agent.post(getUrl)
      .attach('file', 'test/testfile/attachment.txt');

    expect(fileRes.body.status).to.be.equal('error');
  });
});
