'use strict';

const assert = require('assert');
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
        assert(fs.readdirSync(staticConfig.upload.file.path).length === fileCount + 1);
        assert(!newAttachmentInfo.filePath);
      });
    });
  });

  it('upload nothing.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let uploadUrl = '/api/v1/attachment';
      let errorUploadRes = await agent.post(uploadUrl).expect(400);
      assert(errorUploadRes.body.code === 'ERR_BAD_REQUEST');
    });
  });

  it('get file upload by self.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfo) => {
        let getUrl = '/api/v1/attachment/info/me';
        let attachmentsRes = await agent.get(getUrl);
        let attachments = attachmentsRes.body.attachments;

        assert(attachments[0].fileName === 'attachment.txt');
        assert(!attachments[0].filePath);
      });
    });
  });

  it('anonymous upload a file.', async () => {
    let getUrl = '/api/v1/attachment';
    let fileRes = await agent.post(getUrl)
      .attach('file', 'test/testfile/attachment.txt');

    assert(fileRes.body.status === 'error');
  });

  it('get a file.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfo) => {
        let getUrl = `/api/v1/attachment/${newAttachmentInfo.id}`;
        let fileRes = await agent.get(getUrl);
        assert(fileRes.type === 'text/plain');
      });
    });
  });

  it('anonymous get a file.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfo) => {
        await testTools.member.logout(agent, async () => {
          let getUrl = `/api/v1/attachment/${newAttachmentInfo.id}`;
          let fileRes = await agent.get(getUrl);
          assert(fileRes.body.status === 'error');
          assert(fileRes.body.code === 'ERR_REQUIRE_AUTHORIZATION');
        });
      });
    });
  });

  it('get files that does not exit.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let getUrl = `/api/v1/attachment/${utils.createRandomString(24, { hax: true })}`;
      let fileRes = await agent.get(getUrl);
      assert(fileRes.body.status === 'error');
      assert(fileRes.body.code === 'ERR_NOT_FOUND');
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
              assert(fileRes.body.status === 'ok');
              assert(fileList.length === 1);
            });
          });
        });
      });
    });
  });

  it('get daily traffic.', async () => {
    let trafficUrl = '/api/v1/attachment/traffic';
    let trafficRes = await agent.get(trafficUrl);
    assert(trafficRes.body.status === 'error');
    testTools.member.createOneMember(agent, null, async () => {
      trafficRes = await agent.get(trafficUrl);
      assert(trafficRes.body.dailyTraffic === staticConfig.download.dailyTraffic);
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
            assert(fileRes.type === 'text/plain');

            getUrl = `/api/v1/attachment/${newAttachmentInfoB.id}`;
            fileRes = await agent.get(getUrl);
            assert(fileRes.body.status === 'error');
            assert(fileRes.body.code === 'ERR_TRAFFIC_LIMIT_EXCEEDED');
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
          let deleteRes = await agent.delete(deleteUrl).expect(401);
          assert(deleteRes.body.status === 'error');
          assert(deleteRes.body.code === 'ERR_PERMISSION_DENIED');
        });
      });
    });
  });
});
