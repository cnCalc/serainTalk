'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');
const config = require('../../config');

let agent = supertest.agent(require('../../index'));

describe('discussion part', async () => {
  it('add a discussion', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
    });
  });

  it('get latest discussion list by memberid.', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      let url = `/api/v1/discussions/latest?${newMemberInfo.id}`;
      try {
        let discussionList = await agent
          .get(url)
          .expect(200);
        expect(discussionList.body.status).to.be.equal('ok');
        discussionList = discussionList.body;
      } catch (err) {
        console.log(err);
      }
    });
  });

  // FIX ME
  it('whitelist test.', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      return;
    });
  });

  it('add a post.', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, async (newDisscussionInfo) => {
        // 连续发帖，暂时取消发送频率限制
        let tempLimit = config.discussion.freqLimit;
        config.discussion.freqLimit = 0;

        let postPayload = {
          encoding: 'html',
          content: 'hello test'
        };
        let url = `/api/v1/discussion/${newDisscussionInfo.id}/post`;
        let postRes = await agent.post(url)
          .send(postPayload)
          .expect(201);

        // FIXME 检查数据是否成功添加
        console.log(postRes);
        // 恢复发帖频率限制
        config.discussion.freqLimit = tempLimit;
        return;
      });
    });
  });

  it('add posts frequent.', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, async (newDisscussionInfo) => {
        try {
          await testTools.discussion.createOneDiscussion(agent, async (newDisscussionInfo) => {
            let url = `/api/v1/discussion/${newDisscussionInfo.id}/post`;
            await agent.post(url);
            return;
          });
        } catch (err) {
          expect(err.message).to.be.equal(errorMessages.TOO_FREQUENT);
        }
      });
    });
  });

  // it('add votes', async () => {
  //   await testTools.member.createOneMember(agent, async (newMemberInfo) => {
  //     await testTools.discussion.createOneDiscussion(agent, async (newDisscussionInfo) => {
  //       let voteUrl = `/api/v1/discussions/${newMemberInfo.id}/post/1`;
  //       let voteInfo = {
  //         vote: 'up'
  //       };
  //       let voteRes = await agent
  //         .post(voteUrl)
  //         .send(voteInfo);
  //       console.log(voteRes);
  //     });
  //   });
  // });
});
