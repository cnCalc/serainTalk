'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');
const errorMessages = require('../../utils/error-messages');

let agent = supertest.agent(require('../../index'));

describe('discussion part', async () => {
  it('add a discussion', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, async (newDisscussionInfo) => {
        expect(newDisscussionInfo.posts[0].index).to.be.equal(1);
      });
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

  // FIXME 添加一些数据校验
  it('whitelist test.', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      return;
    });
  });

  it('add a post.', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, async (newDisscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          let postPayload = {
            encoding: 'html',
            content: 'hello test'
          };
          let url = `/api/v1/discussion/${newDisscussionInfo.id}/post`;
          let postRes = await agent.post(url)
            .send(postPayload)
            .expect(201);

          // 检查是否有 index 字段
          let postInfo = postRes.body.newPost;
          expect(postInfo.index).to.be.ok;
          // FIXME 检查数据是否成功添加
          console.log(postRes);
        });
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

  it('reply post by index.', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, async (newDisscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          let postPayload = {
            encoding: 'html',
            content: 'hello test',
            replyTo: {
              type: 'index',
              value: 1
            }
          };
          let url = `/api/v1/discussion/${newDisscussionInfo.id}/post`;
          let postRes = await agent.post(url)
            .send(postPayload)
            .expect(201);

          // 检查是否有 replyTo 字段
          let postInfo = postRes.body.newPost;
          expect(postInfo.replyTo).to.be.ok;
        });
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
