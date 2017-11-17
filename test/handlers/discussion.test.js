'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');
const errorMessages = require('../../utils/error-messages');
const config = require('../../config');
const utils = require('../../utils');

let agent = supertest.agent(require('../../index'));

describe('discussion part', async () => {
  it('add a discussion', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDisscussionInfo) => {
        expect(newDisscussionInfo.posts[0].index).to.be.equal(1);
      });
    });
  });

  it('get latest discussion list by memberId.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let tempWhiteList = config.discussion.category.whiteList;
      config.discussion.category.whiteList = ['test'];
      let testDiscussion = {
        title: 'test title',
        tags: ['temp tag'],
        category: 'test',
        content: {
          encoding: 'markdown',
          content: 'test text',
        }
      };
      await testTools.discussion.createOneDiscussion(agent, testDiscussion, async (newDiscussionInfo) => {
        let payload = {
          category: ['test'],
          memberId: newMemberInfo.id
        };
        let url = utils.url.createRESTfulUrl('/api/v1/discussions/latest', payload);
        let discussionRes = await agent
          .get(url)
          .expect(200);
        expect(discussionRes.body.status).to.be.equal('ok');
        let discussions = discussionRes.body.discussions;
        delete testDiscussion.content;
        expect(testTools.discussion.isSameDiscussion(discussions[0], testDiscussion)).to.be.ok;
      });
      config.discussion.category.whiteList = tempWhiteList;
    });
  });

  it('get discussion by id', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let url = `/api/v1/discussions/${newDiscussionInfo.id}`;
        let discussionRes = await agent
          .get(url)
          .expect(200);
        expect(discussionRes.body.status).to.be.equal('ok');
        delete discussionRes.body.status;
        let tempDiscussion = JSON.parse(JSON.stringify(testTools.testObject.discussionInfo));
        delete tempDiscussion.content;
        expect(testTools.discussion.isSameDiscussion(discussionRes.body, tempDiscussion)).to.be.ok;
      });
    });
  });

  // FIXME 添加一些数据校验
  it('whitelist test.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let tempWhiteList = config.discussion.category.whiteList;
      config.discussion.category.whiteList = ['notest'];
      let testDiscussion = {
        title: 'test title',
        tags: ['temp tag'],
        category: 'test',
        content: {
          encoding: 'markdown',
          content: 'test text',
        }
      };
      await testTools.discussion.createOneDiscussion(agent, testDiscussion, async (newDiscussionInfo) => {
        let payload = {
          category: ['test'],
          memberId: newMemberInfo.id
        };
        let url = utils.url.createRESTfulUrl('/api/v1/discussions/latest', payload);
        let discussionRes = await agent
          .get(url)
          .expect(200);
        expect(discussionRes.body.status).to.be.equal('ok');
        expect(discussionRes.body.discussions.length).to.be.equal(0);
      });
      config.discussion.category.whiteList = tempWhiteList;
    });
  });

  it('add a post.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDisscussionInfo) => {
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
          // console.log(postRes);
        });
      });
    });
  });

  it('add posts frequent.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDisscussionInfo) => {
        try {
          await testTools.discussion.createOneDiscussion(agent, null, async (newDisscussionInfo) => {
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
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDisscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          let postPayload = {
            encoding: 'html',
            content: 'hello test',
            replyTo: {
              type: 'index',
              value: 1,
              memberId: newMemberInfo.id
            }
          };
          let url = `/api/v1/discussion/${newDisscussionInfo.id}/post`;
          let postRes = await agent.post(url)
            .send(postPayload)
            .expect(201);

          // 检查是否有 replyTo 字段
          let postInfo = postRes.body.newPost;
          expect(postInfo.replyTo).to.be.ok;
          expect(postInfo.encoding).to.be.equal('markdown');
        });
      });
    });
  });
  // it('add votes', async () => {
  //   await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
  //     await testTools.discussion.createOneDiscussion(agent, null, async (newDisscussionInfo) => {
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
