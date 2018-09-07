'use strict';

const expect = require('chai').expect;
const fs = require('fs');
const supertest = require('supertest');

const testTools = require('../testTools');
const utils = require('../../utils');
const dbTool = require('../../database');
const staticConfig = require('../../config/staticConfig');

let app = require('../../index');
let agent = supertest.agent(app);

describe('attachment part.', async () => {
  before('prepare database.', async () => {
    await app.prepare();
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

  it('upload nothing.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let uploadUrl = '/api/v1/attachment';
      let errorUploadRes = await agent.post(uploadUrl).expect(400);
      expect(errorUploadRes.body.code).to.be.equal('ERR_BAD_REQUEST');
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

  it('anonymous get a file.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfo) => {
        await testTools.member.logout(agent, async () => {
          let getUrl = `/api/v1/attachment/${newAttachmentInfo.id}`;
          let fileRes = await agent.get(getUrl);
          expect(fileRes.body.status).to.be.equal('error');
          expect(fileRes.body.code).to.be.equal('ERR_REQUIRE_AUTHORIZATION');
        })
      });
    });
  });

  it('get files that does not exit.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let getUrl = `/api/v1/attachment/${utils.createRandomString(24, { hax: true })}`;
      let fileRes = await agent.get(getUrl);
      expect(fileRes.body.status).to.be.equal('error');
      expect(fileRes.body.code).to.be.equal('ERR_NOT_FOUND');
    });
  });

  it('get unused attachment.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfoA) => {
        await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfoB) => {
          await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
            await testTools.discussion.closeFreqLimit(async () => {
              let postPayload = {
                attachments: [newAttachmentInfoB.id],
                encoding: 'markdown',
                content: 'hello test',
              };
              let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
              await agent.post(url)
                .send(postPayload)
                .expect(201);

              let getUrl = '/api/v1/attachment/info/me?excludingUsed=on';
              let fileRes = await agent.get(getUrl);
              let fileList = fileRes.body.attachments;
              expect(fileRes.body.status).to.be.equal('ok');
              expect(fileList.length).to.be.equal(1);
            });
          });
        });
      });
    });
  });

  it('get daily traffic.', async () => {
    let trafficUrl = '/api/v1/attachment/traffic';
    let trafficRes = await agent.get(trafficUrl);
    expect(trafficRes.body.status).to.be.equal('error');
    testTools.member.createOneMember(agent, null, async () => {
      trafficRes = await agent.get(trafficUrl);
      expect(trafficRes.body.dailyTraffic).to.be.equal(staticConfig.download.dailyTraffic);
    });
  });

  it('lack daily traffic.', async () => {
    let eachFileSize = (staticConfig.download.dailyTraffic + 1024 * 1024) / 2;
    let fileName = 'testFile.txt';
    await testTools.attachment.createAttachmentFile(fileName, eachFileSize, async (filePath) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
        await testTools.attachment.uploadOneAttachment(agent, filePath, async (newAttachmentInfoA) => {
          await testTools.attachment.uploadOneAttachment(agent, filePath, async (newAttachmentInfoB) => {
            let getUrl = `/api/v1/attachment/${newAttachmentInfoA.id}`;
            let fileRes = await agent.get(getUrl);
            expect(fileRes.type).to.be.equal('text/plain');

            getUrl = `/api/v1/attachment/${newAttachmentInfoB.id}`;
            fileRes = await agent.get(getUrl);
            expect(fileRes.body.status).to.be.equal('error');
            expect(fileRes.body.code).to.be.equal('ERR_TRAFFIC_LIMIT_EXCEEDED');
          });
        });
      });
    });
  });

  it('delete an attachment that does not exist.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachment) => {
        let deleteUrl = `/api/v1/attachment/${utils.createRandomString(24, { hax: true })}`;
        await agent.delete(deleteUrl).expect(404);
      });
    });
  });

  it('delete an attachment that belongs to others.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachment) => {
        await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
          let deleteUrl = `/api/v1/attachment/${newAttachment.id}`;
          let a = await agent.delete(deleteUrl).expect(401);
        });
      });
    });
  });
});
