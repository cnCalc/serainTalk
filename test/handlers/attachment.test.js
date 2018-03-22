'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const supertest = require('supertest');
const testTools = require('../testTools');

const dbTool = require('../../database');
const staticConfig = require('../../config/staticConfig');
let agent = supertest.agent(require('../../index'));

describe('attachment part.', async () => {
  before('prepare database.', async () => {
    await dbTool.prepare();
  });

  it('upload a file.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let fileCount = fs.readdirSync(staticConfig.upload.file.path).length;
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfo) => {
        expect(fs.readdirSync(staticConfig.upload.file.path).length).to.be.equal(fileCount + 1);
        expect(newAttachmentInfo.filePath).to.not.be.ok;
      });
    });
  });

  it('get file upload by self.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfo) => {
        let getUrl = '/api/v1/attachment/info/me';
        let attachmentsRes = await agent.get(getUrl);
        let attachments = attachmentsRes.body.attachments;

        expect(attachments[0].fileName).to.be.equal('attachment.txt');
        expect(attachments[0].filePath).to.not.be.ok;
      });
    });
  });

  it('upload too many file.', async () => {
    await testTools.env.setRelease(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
        let uploadUrl = '/api/v1/attachment';
        let attachments = [];
        for (let i = 0; i < staticConfig.upload.file.maxCount; i++) {
          let fileRes = await agent.post(uploadUrl)
            .attach('file', 'test/testfile/attachment.txt')
            .expect(201);
          attachments.push(fileRes.body.attachment._id);
        }

        let fileCount = fs.readdirSync(staticConfig.upload.file.path).length;

        await agent.post(uploadUrl)
          .attach('file', 'test/testfile/attachment.txt')
          .expect(401);

        expect(fs.readdirSync(staticConfig.upload.file.path).length).to.be.equal(fileCount);

        attachments = attachments.map(attachmentId => {
          let deleteUrl = `/api/v1/attachment/${attachmentId}`;
          return agent.delete(deleteUrl).expect(204);
        });
        await Promise.all(attachments);
      });
    });
  });

  it('anonymous upload a file.', async () => {
    let getUrl = '/api/v1/attachment';
    let fileRes = await agent.post(getUrl)
      .attach('file', 'test/testfile/attachment.txt');

    expect(fileRes.body.status).to.be.equal('error');
  });

  it('get a file.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfo) => {
        let getUrl = `/api/v1/attachment/${newAttachmentInfo.id}`;
        let fileRes = await agent.get(getUrl);
        expect(fileRes.type).to.be.equal('text/plain');
      });
    });
  });

  it('get daily traffic.', async () => {
    let trafficUrl = '/api/v1/attachment/traffic';
    let trafficRes = await agent.get(trafficUrl);
    expect(trafficRes.body.dailyTraffic).to.be.equal(0);
    testTools.member.createOneMember(agent, null, async () => {
      trafficRes = await agent.get(trafficUrl);
      expect(trafficRes.body.dailyTraffic).to.be.equal(staticConfig.download.dailyTraffic);
    });
  });
});
