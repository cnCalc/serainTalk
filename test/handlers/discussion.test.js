'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');
const errorMessages = require('../../utils/error-messages');
const config = require('../../config');
const utils = require('../../utils');
const _ = require('lodash');

let agent = supertest.agent(require('../../index'));

describe('discussion part', async () => {
  it('add a discussion.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDisscussionInfo) => {
        expect(newDisscussionInfo.posts[0].index).to.be.equal(1);
      });
    });
  });

  it('add a html discussion by admin.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
        await testTools.discussion.createOneDiscussion(agent, { content: { encoding: 'html' } }, async (newDisscussionInfo) => {
          expect(newDisscussionInfo.posts[0].encoding).to.be.equal('html');
        });
      });
    });
  });

  it('add a html discussion by member.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, { content: { encoding: 'html' } }, async (newDisscussionInfo) => {
        expect(newDisscussionInfo.posts[0].encoding).to.be.equal('markdown');
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

  it('get latest discussion list by tag.', async () => {
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
          tag: ['temp tag']
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

  it('get latest discussion list with nothing.', async () => {
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
        let url = '/api/v1/discussions/latest';
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

  it('get discussion by id.', async () => {
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

  it('get discussion by wrong id.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let url = `/api/v1/discussions/${utils.createRandomString(24, { hax: true })}`;
        let discussionRes = await agent
          .get(url)
          .expect(404);
        discussionRes = discussionRes.body;
        expect(discussionRes.status).to.be.equal('error');
        expect(discussionRes.message).to.be.equal(errorMessages.NOT_FOUND);
      });
    });
  });

  it('get discussion posts by id.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
        let discussionRes = await agent
          .get(url)
          .expect(200);
        discussionRes = discussionRes.body;
        let members = discussionRes.members;
        let posts = discussionRes.posts;
        expect(discussionRes.status).to.be.equal('ok');
        expect(Object.keys(members)).include(newMemberInfo.id);
        expect(posts.length).to.be.equal(1);
      });
    });
  });

  it('get discussion posts by wrong id.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let url = `/api/v1/discussions/${utils.createRandomString(24, { hax: true })}/posts`;
        let discussionRes = await agent
          .get(url)
          .expect(404);
        discussionRes = discussionRes.body;
        expect(discussionRes.status).to.be.equal('error');
        expect(discussionRes.message).to.be.equal(errorMessages.NOT_FOUND);
      });
    });
  });

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
      await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
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
          expect(discussionRes.body.discussions.length).to.be.equal(1);
        });
      });
      config.discussion.category.whiteList = tempWhiteList;
    });
  });

  it('add a post.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDisscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test'
          };
          let url = `/api/v1/discussion/${newDisscussionInfo.id}/post`;
          let postRes = await agent.post(url)
            .send(postPayload)
            .expect(201);

          let postInfo = postRes.body.newPost;
          expect(postInfo).to.be.ok;
          expect(postInfo.index).to.be.equal(2);
          expect(postInfo.content).to.be.equal(postPayload.content);
          expect(postInfo.encoding).to.be.equal(postPayload.encoding);
        });
      });
    });
  });

  it('add a html post by admin.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
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

            let postInfo = postRes.body.newPost;
            expect(postInfo.encoding).to.be.equal(postPayload.encoding);
          });
        });
      });
    });
  });

  it('add a html post by member.', async () => {
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

          let postInfo = postRes.body.newPost;
          expect(postInfo.index).to.be.ok;
          expect(postInfo.encoding).to.be.equal('markdown');
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

  it('add vote.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let voteUrl = `/api/v1/discussions/${newDiscussionInfo.id}/post/1/vote`;
        let voteType = config.discussion.post.vote.slice();
        for (let vote of voteType) {
          let voteInfo = {
            vote: vote
          };
          await agent
            .post(voteUrl)
            .send(voteInfo);
        }
        let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
        let discussionRes = await agent
          .get(url)
          .expect(200);
        discussionRes = discussionRes.body;
        let votes = discussionRes.posts[0].votes;
        for (let vote of voteType) {
          expect(votes[vote][0]).to.be.equal(newMemberInfo.id);
        }
      });
    });
  });

  it('vote for wrong discussion.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let voteUrl = `/api/v1/discussions/${utils.createRandomString(24, { hax: true })}/post/1/vote`;
        let voteType = config.discussion.post.vote.slice();
        let voteInfo = {
          vote: voteType[0]
        };
        let voteRes = await agent
          .post(voteUrl)
          .send(voteInfo)
          .expect(404);
        voteRes = voteRes.body;
        expect(voteRes.status).to.be.equal('error');
        expect(voteRes.message).to.be.equal(errorMessages.NOT_FOUND);
      });
    });
  });

  it('remove vote.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let voteUrl = `/api/v1/discussions/${newDiscussionInfo.id}/post/1/vote`;
        let voteType = config.discussion.post.vote.slice();
        for (let vote of voteType) {
          let voteInfo = {
            vote: vote
          };
          await agent
            .post(voteUrl)
            .send(voteInfo);
          await agent
            .post(voteUrl)
            .send(voteInfo);
        }
        let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
        let discussionRes = await agent
          .get(url)
          .expect(200);
        discussionRes = discussionRes.body;
        let votes = discussionRes.posts[0].votes;
        for (let vote of voteType) {
          expect(votes[vote].length).to.be.equal(0);
        }
      });
    });
  });

  it('vote three times.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let voteUrl = `/api/v1/discussions/${newDiscussionInfo.id}/post/1/vote`;
        let voteType = config.discussion.post.vote.slice();
        for (let vote of voteType) {
          let voteInfo = {
            vote: vote
          };
          await agent
            .post(voteUrl)
            .send(voteInfo);
          await agent
            .post(voteUrl)
            .send(voteInfo);
          await agent
            .post(voteUrl)
            .send(voteInfo);
        }
        let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
        let discussionRes = await agent
          .get(url)
          .expect(200);
        discussionRes = discussionRes.body;
        let votes = discussionRes.posts[0].votes;
        for (let vote of voteType) {
          expect(votes[vote][0]).to.be.equal(newMemberInfo.id);
        }
      });
    });
  });

  it('multiple member vote.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let voteUrl = `/api/v1/discussions/${newDiscussionInfo.id}/post/1/vote`;
        let voteType = config.discussion.post.vote.slice();
        for (let vote of voteType) {
          let voteInfo = {
            vote: vote
          };
          await agent
            .post(voteUrl)
            .send(voteInfo);
        }
        await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
          for (let vote of voteType) {
            let voteInfo = {
              vote: vote
            };
            await agent
              .post(voteUrl)
              .send(voteInfo);
          }
          let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
          let discussionRes = await agent
            .get(url)
            .expect(200);
          discussionRes = discussionRes.body;
          let votes = discussionRes.posts[0].votes;
          for (let vote of voteType) {
            expect(votes[vote]).include(newMemberInfoA.id);
            expect(votes[vote]).include(newMemberInfoB.id);
          }
        });
      });
    });
  });
});
