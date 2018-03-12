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

  it('get attachment by aid.', async () => {
    let randomAid;
    let attachmentInfo = 1;
    while (attachmentInfo) {
      randomAid = parseInt(Math.random() * 1e15);
      attachmentInfo = await dbTool.attachment.findOne({ aid: randomAid });
    }
    await dbTool.attachment.insertOne({ aid: randomAid });

    let getUrl = `/api/v1/attachment/info?aid=${randomAid}`;
    let attachmentRes = await agent.get(getUrl).expect(200);
    let attachmentBody = attachmentRes.body;
    let attachment = attachmentBody.attachment;
    expect(attachmentBody.status).to.be.equal('ok');
    expect(attachment.aid).to.be.equal(randomAid);
  });

  it('upload a file.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let fileCount = fs.readdirSync(staticConfig.upload.file.path).length;
      let uploadUrl = '/api/v1/attachment';
      let fileRes = await agent.post(uploadUrl)
        .attach('file', 'test/testfile/attachment.txt');

      expect(fs.readdirSync(staticConfig.upload.file.path).length).to.be.equal(fileCount + 1);

      expect(fileRes.body.status).to.be.equal('ok');
      expect(fileRes.body.attachment.filePath).to.not.be.ok;

      let fileNames = fs.readdirSync(staticConfig.upload.file.path).filter(fileName => fileName.split('-')[0] === newMemberInfo.id);
      fileNames = fileNames.map(fileName => path.join(staticConfig.upload.file.path, fileName));
      fileNames.forEach(filePath => fs.unlinkSync(filePath));
    });
  });

  it('get file upload by self.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let fileCount = fs.readdirSync(staticConfig.upload.file.path).length;

      let uploadUrl = '/api/v1/attachment';
      await agent.post(uploadUrl)
        .attach('file', 'test/testfile/attachment.txt');

      expect(fs.readdirSync(staticConfig.upload.file.path).length).to.be.equal(fileCount + 1);

      let getUrl = '/api/v1/attachment/info/me';
      let attachmentsRes = await agent.get(getUrl);
      let attachments = attachmentsRes.body.attachments;

      expect(attachments[0].fileName).to.be.equal('attachment.txt');
      expect(attachments[0].filePath).to.not.be.ok;

      let fileNames = fs.readdirSync(staticConfig.upload.file.path).filter(fileName => fileName.split('-')[0] === newMemberInfo.id);
      fileNames = fileNames.map(fileName => path.join(staticConfig.upload.file.path, fileName));
      fileNames.forEach(filePath => fs.unlinkSync(filePath));
    });
  });

  it('upload too many file.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let uploadUrl = '/api/v1/attachment';
      for (let i = 0; i < staticConfig.upload.file.maxCount; i++) {
        let fileRes = await agent.post(uploadUrl)
          .attach('file', 'test/testfile/attachment.txt');

        expect(fileRes.body.status).to.be.equal('ok');
      }

      await agent.post(uploadUrl)
        .attach('file', 'test/testfile/attachment.txt')
        .expect(401);

      let fileNames = fs.readdirSync(staticConfig.upload.file.path).filter(fileName => fileName.split('-')[0] === newMemberInfo.id);
      fileNames = fileNames.map(fileName => path.join(staticConfig.upload.file.path, fileName));
      fileNames.forEach(filePath => fs.unlinkSync(filePath));
    });
  });

  it('anonymous upload a file.', async () => {
    let getUrl = '/api/v1/attachment';
    let fileRes = await agent.post(getUrl)
      .attach('file', 'test/testfile/attachment.txt');

    expect(fileRes.body.status).to.be.equal('error');
  });
});
