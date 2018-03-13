'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');
const errorMessages = require('../../utils/error-messages');
const config = require('../../config');
const utils = require('../../utils');

let agent = supertest.agent(require('../../index'));

describe('discussion part', async () => {
  before('prepare config.', async () => {
    await config.prepare();
  });

  it('add a discussion.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        expect(newDiscussionInfo.posts[0].index).to.be.equal(1);
      });
    });
  });

  it('add a html discussion by admin.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
        await testTools.discussion.createOneDiscussion(agent, { content: { encoding: 'html' } }, async (newDiscussionInfo) => {
          expect(newDiscussionInfo.posts[0].encoding).to.be.equal('html');
        });
      });
    });
  });

  it('add a html discussion by member.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, { content: { encoding: 'html' } }, async (newDiscussionInfo) => {
        expect(newDiscussionInfo.posts[0].encoding).to.be.equal('markdown');
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
        },
      };
      await testTools.discussion.createOneDiscussion(agent, testDiscussion, async (newDiscussionInfo) => {
        let payload = {
          category: ['test'],
          memberId: newMemberInfo.id,
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
        },
      };
      await testTools.discussion.createOneDiscussion(agent, testDiscussion, async (newDiscussionInfo) => {
        let payload = {
          category: ['test'],
          tag: ['temp tag'],
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
        },
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
        let discussionInfo = discussionRes.body.discussionInfo;
        let tempDiscussion = JSON.parse(JSON.stringify(testTools.testObject.discussionInfo));
        delete tempDiscussion.content;
        expect(testTools.discussion.isSameDiscussion(discussionInfo, tempDiscussion)).to.be.ok;
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
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
        await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
          let getUrl = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
          let postsRes = await agent
            .get(getUrl)
            .expect(200);
          postsRes = postsRes.body;
          let members = postsRes.members;
          let posts = postsRes.posts;
          expect(postsRes.status).to.be.equal('ok');
          expect(Object.keys(members)).include(newMemberInfo.id);
          expect(posts.length).to.be.equal(1);

          // 分页测试
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let postUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          for (let i = 0; i < 15; i++) {
            await agent.post(postUrl)
              .send(postPayload)
              .expect(201);
          }
          let getUrl2 = `/api/v1/discussions/${newDiscussionInfo.id}/posts?page=2`;
          postsRes = await agent
            .get(getUrl2)
            .expect(200);
          let postsBody = postsRes.body;
          expect(postsBody.status).to.be.equal('ok');
          expect(postsBody.posts.length).to.be.equal(6);
        });
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

  it('get post by index.', async () => {
    await testTools.member.createOneMember(agent, null, async () => {
      await testTools.discussion.createOneDiscussion(agent, { content: { content: 'a' } }, async (newDiscussionInfo) => {
        let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/1`;
        let postRes = await agent.get(getUrl);
        let post = postRes.body.post;
        expect(post.content).to.be.equal('<p>a</p>\n');
      });
    });
  });

  it('get raw post by index.', async () => {
    await testTools.member.createOneMember(agent, null, async () => {
      await testTools.discussion.createOneDiscussion(agent, { content: { content: 'a' } }, async (newDiscussionInfo) => {
        let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/1?raw=on`;
        let postRes = await agent.get(getUrl);
        let post = postRes.body.post;
        expect(post.content).to.be.equal('a');
      });
    });
  });

  it('whitelist test.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.setWhiteList(['test'], async () => {
        let testDiscussionInfo = {
          title: 'test title',
          tags: ['temp tag'],
          category: 'test',
          content: {
            encoding: 'markdown',
            content: 'test text',
          },
        };
        await testTools.discussion.createOneDiscussion(agent, testDiscussionInfo, async (newDiscussionInfo) => {
          await testTools.discussion.setWhiteList(['noTest'], async () => {
            let payload = {
              category: ['test'],
              memberId: newMemberInfo.id,
            };
            let url = utils.url.createRESTfulUrl('/api/v1/discussions/latest', payload);
            let discussionRes = await agent
              .get(url)
              .expect(200);
            expect(discussionRes.body.status).to.be.equal('ok');
            expect(discussionRes.body.discussions.length).to.be.equal(0);
          });

          let payload = {
            category: ['test'],
            memberId: newMemberInfo.id,
          };
          let url = utils.url.createRESTfulUrl('/api/v1/discussions/latest', payload);
          let discussionRes = await agent
            .get(url)
            .expect(200);
          expect(discussionRes.body.status).to.be.equal('ok');
          expect(discussionRes.body.discussions.length).to.be.equal(1);
        });
      });
    });
  });

  it('add a post.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
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

  it('post notification.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.member.createOneMember(agent, null, async () => {
          // 发送一条回复
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url)
            .send(postPayload)
            .expect(201);
        });

        await testTools.member.login(agent, newMemberInfoA);
        // A 查看消息队列
        let notificationUrl = '/api/v1/notification';
        let notificationRes = await agent.get(notificationUrl)
          .expect(200);
        let notificationBody = notificationRes.body;
        expect(notificationBody.notifications.length).to.be.equal(1);
      });
    });
  });

  it('update a post.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, { content: { content: 'hello test' } }, async (newDiscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
            let postPayload = {
              encoding: 'markdown',
              content: 'hello test',
            };
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(url)
              .send(postPayload)
              .expect(201);

            let updatePayload = {
              content: 'changed content.',
            };
            let updateUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/2`;
            await agent.put(updateUrl)
              .send(updatePayload)
              .expect(201);

            let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/posts`;
            let postsRes = await agent.get(getUrl).expect(200);
            postsRes = postsRes.body;

            let exactPost = postsRes.posts[1];
            let otherPost = postsRes.posts[0];
            expect(exactPost.updateDate).to.be.ok;
            expect(exactPost.content).to.be.equal('<p>changed content.</p>\n');
            expect(otherPost.content).to.be.equal('<p>hello test</p>\n');
          });
        });
      });
    });
  });

  it('update a post by otherone(should be wrong).', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url)
            .send(postPayload)
            .expect(201);

          await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
            let updatePayload = {
              content: 'changed content.',
            };
            let updateUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/2`;
            let updateRes = await agent.put(updateUrl)
              .send(updatePayload)
              .expect(401);
            expect(updateRes.body.message).to.be.equal(errorMessages.PERMISSION_DENIED);

            let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/posts`;
            let postsRes = await agent.get(getUrl).expect(200);
            postsRes = postsRes.body;

            let exactPost = postsRes.posts[1];
            expect(exactPost.updateDate).to.not.be.ok;
            expect(exactPost.content).to.be.equal('<p>hello test</p>\n');
          });
        });
      });
    });
  });

  it('update a post by admin(should be wrong).', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url)
            .send(postPayload)
            .expect(201);

          await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
            await testTools.member.setAdmin(agent, newMemberInfoB._id, async () => {
              let updatePayload = {
                content: 'changed content.',
              };
              let updateUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/2`;
              let updateRes = await agent.put(updateUrl)
                .send(updatePayload)
                .expect(401);
              expect(updateRes.body.message).to.be.equal(errorMessages.PERMISSION_DENIED);

              let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/posts`;
              let postsRes = await agent.get(getUrl).expect(200);
              postsRes = postsRes.body;

              let exactPost = postsRes.posts[1];
              expect(exactPost.updateDate).to.not.be.ok;
              expect(exactPost.content).to.be.equal('<p>hello test</p>\n');
            });
          });
        });
      });
    });
  });

  it('update encoding by common(should be wrong).', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url)
            .send(postPayload)
            .expect(201);

          let updatePayload = {
            encoding: 'html',
            content: 'changed content.',
          };
          let updateUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/2`;
          await agent.put(updateUrl)
            .send(updatePayload)
            .expect(201);

          let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/posts`;
          let postsRes = await agent.get(getUrl).expect(200);
          postsRes = postsRes.body;

          let exactPost = postsRes.posts[1];
          expect(exactPost.updateDate).to.be.ok;
          expect(exactPost.encoding).to.be.equal('markdown');
          expect(exactPost.content).to.be.equal('<p>changed content.</p>\n');
        });
      });
    });
  });

  it('update encoding by admin.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.setAdmin(agent, newMemberInfoA._id, async () => {
        await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
          await testTools.discussion.closeFreqLimit(async () => {
            let postPayload = {
              encoding: 'markdown',
              content: 'hello test',
            };
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(url)
              .send(postPayload)
              .expect(201);

            let updatePayload = {
              encoding: 'html',
              content: 'changed content.',
            };
            let updateUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/2`;
            await agent.put(updateUrl)
              .send(updatePayload)
              .expect(201);

            let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/posts`;
            let postsRes = await agent.get(getUrl).expect(200);
            postsRes = postsRes.body;

            let exactPost = postsRes.posts[1];
            expect(exactPost.updateDate).to.be.ok;
            expect(exactPost.encoding).to.be.equal('html');
            expect(exactPost.content).to.be.equal('changed content.');
          });
        });
      });
    });
  });

  it('add a html post by admin.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
        await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
          await testTools.discussion.closeFreqLimit(async () => {
            let postPayload = {
              encoding: 'html',
              content: 'hello test',
            };
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
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

  it('add a html post by member(should be wrong).', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          let postPayload = {
            encoding: 'html',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
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

  it('add posts frequent by common(should be wrong).', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        try {
          // 测试多个讨论的限制
          await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(url);
            return;
          });
        } catch (err) {
          expect(err.message).to.be.equal(errorMessages.TOO_FREQUENT);
        }

        await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url).send(postPayload).expect(201);
          let Res = await agent.post(url).send(postPayload).expect(403);
          expect(Res.body.message).to.be.equal(errorMessages.TOO_FREQUENT);
        });
      });
    });
  });

  it('reply post by index.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          let postPayload = {
            encoding: 'html',
            content: 'hello test',
            replyTo: {
              type: 'index',
              value: 1,
              memberId: newMemberInfo.id,
            },
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
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
        let voteInfo = {
          vote: 'up',
        };
        await agent
          .post(voteUrl)
          .send(voteInfo);
        let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
        let discussionRes = await agent
          .get(url)
          .expect(200);
        discussionRes = discussionRes.body;
        let votes = discussionRes.posts[0].votes;
        expect(votes.up.memberId[0]).to.be.equal(newMemberInfo.id);
      });
    });
  });

  it('vote for wrong discussion(should be wrong).', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let voteUrl = `/api/v1/discussions/${utils.createRandomString(24, { hax: true })}/post/1/vote`;
        let voteType = config.discussion.post.vote.slice();
        let voteInfo = {
          vote: voteType[0],
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
            vote: vote,
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
          expect(votes[vote].count).to.be.equal(0);
          expect(votes[vote].memberId.length).to.be.equal(0);
        }
      });
    });
  });

  it('vote three times.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let voteUrl = `/api/v1/discussions/${newDiscussionInfo.id}/post/1/vote`;
        let voteInfo = {
          vote: 'up',
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
        let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
        let discussionRes = await agent
          .get(url)
          .expect(200);
        discussionRes = discussionRes.body;
        let votes = discussionRes.posts[0].votes;
        expect(votes.up.memberId[0]).to.be.equal(newMemberInfo.id);
      });
    });
  });

  it('vote up and down.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let voteUrl = `/api/v1/discussions/${newDiscussionInfo.id}/post/1/vote`;
        for (let vote of ['up', 'down']) {
          let voteInfo = {
            vote: vote,
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
        expect(votes.down.memberId[0]).to.be.equal(newMemberInfo.id);
      });
    });
  });

  it('multiple member vote.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        let voteUrl = `/api/v1/discussions/${newDiscussionInfo.id}/post/1/vote`;
        let voteType = ['up'];
        for (let vote of voteType) {
          let voteInfo = {
            vote: vote,
          };
          await agent
            .post(voteUrl)
            .send(voteInfo);
        }
        await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
          for (let vote of voteType) {
            let voteInfo = {
              vote: vote,
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
            expect(votes[vote].memberId).include(newMemberInfoA.id);
            expect(votes[vote].memberId).include(newMemberInfoB.id);
          }
        });
      });
    });
  });

  it('ban a post by admin.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
          await testTools.member.setAdmin(agent, newMemberInfoB._id, async () => {
            let postPayload = {
              encoding: 'markdown',
              content: 'hello test',
            };
            let addPostUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(addPostUrl)
              .send(postPayload)
              .expect(201);

            let banUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/1`;
            await agent.delete(banUrl).expect(204);

            let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
            let discussionRes = await agent
              .get(url)
              .expect(200);
            expect(discussionRes.body.status).to.be.equal('ok');
            let postsInfo = discussionRes.body.posts;
            expect(postsInfo.length).to.be.equal(2);
            expect(postsInfo[0].status.type).to.be.equal(config.discussion.status.deleted);
          });
          let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
          let discussionRes = await agent
            .get(url)
            .expect(200);
          expect(discussionRes.body.status).to.be.equal('ok');
          let postsInfo = discussionRes.body.posts;
          expect(postsInfo.length).to.be.equal(1);
          expect(postsInfo[0].status.type).to.not.be.equal(config.discussion.status.deleted);

          await testTools.member.login(agent, newMemberInfoA);
          let getNotificationUrl = '/api/v1/notification';
          let nitificationRes = await agent.get(getNotificationUrl)
            .expect(200);
          nitificationRes = nitificationRes.body;
          let notifications = nitificationRes.notifications;
          expect(notifications.length).to.be.equal(2);// 封禁通知+被回复通知
        });
      });
    });
  });

  it('recover a post by admin.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
          await testTools.member.setAdmin(agent, newMemberInfoB._id, async () => {
            let postPayload = {
              encoding: 'markdown',
              content: 'hello test',
            };
            let addPostUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(addPostUrl)
              .send(postPayload)
              .expect(201);

            let banUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/1`;
            await agent.delete(banUrl).expect(204);
            await agent.delete(banUrl).expect(204);

            let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
            let discussionRes = await agent
              .get(url)
              .expect(200);
            expect(discussionRes.body.status).to.be.equal('ok');
            let postsInfo = discussionRes.body.posts;
            expect(postsInfo.length).to.be.equal(2);
            expect(postsInfo[0].status.type).to.be.equal(config.discussion.status.ok);

            await testTools.member.login(agent, newMemberInfoA);
            let getNotificationUrl = '/api/v1/notification';
            let nitificationRes = await agent.get(getNotificationUrl)
              .expect(200);
            nitificationRes = nitificationRes.body;
            let notifications = nitificationRes.notifications;
            expect(notifications.length).to.be.equal(3);// 封禁通知+被回复通知+恢复通知
          });
        });
      });
    });
  });

  it('ban a post by commonMember(should be wrong).', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let addPostUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(addPostUrl)
            .send(postPayload)
            .expect(201);

          let banUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/1`;
          await agent.delete(banUrl).expect(401);

          let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
          let discussionRes = await agent
            .get(url)
            .expect(200);
          expect(discussionRes.body.status).to.be.equal('ok');
          let postsInfo = discussionRes.body.posts;
          expect(postsInfo.length).to.be.equal(2);
          expect(postsInfo[0].baned).to.not.be.ok;
        });
      });
    });
  });

  it('ban a discussion by admin.', async () => {
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
        await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfoA) => {
          await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfoB) => {
            await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
              await testTools.member.setAdmin(agent, newMemberInfoB._id, async () => {
                let postPayload = {
                  encoding: 'markdown',
                  content: 'hello test',
                };
                let addPostUrl = `/api/v1/discussion/${newDiscussionInfoA.id}/post`;
                await agent.post(addPostUrl)
                  .send(postPayload)
                  .expect(201);

                let banUrl = `/api/v1/discussion/${newDiscussionInfoA.id}`;
                await agent.delete(banUrl).expect(204);

                let getUrl = `/api/v1/discussions/${newDiscussionInfoA.id}`;
                let discussionRes = await agent
                  .get(getUrl)
                  .expect(200);

                expect(discussionRes.body.status).to.be.equal('ok');
                let discussionInfo = discussionRes.body.discussionInfo;
                expect(discussionInfo.status.type).to.be.equal(config.discussion.status.deleted);

                await testTools.member.login(agent, newMemberInfoA);
                let getNotificationUrl = '/api/v1/notification';
                let nitificationRes = await agent.get(getNotificationUrl)
                  .expect(200);
                nitificationRes = nitificationRes.body;
                let notifications = nitificationRes.notifications;
                expect(notifications.length).to.be.equal(2);// 封禁通知+被回复通知
              });
            });
          });
        });
      });
    });
  });

  it('delete a discussion by admin.', async () => {
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
        await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfoA) => {
          await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfoB) => {
            await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
              await testTools.member.setAdmin(agent, newMemberInfoB._id, async () => {
                let postPayload = {
                  encoding: 'markdown',
                  content: 'hello test',
                };
                let addPostUrl = `/api/v1/discussion/${newDiscussionInfoA.id}/post`;
                await agent.post(addPostUrl)
                  .send(postPayload)
                  .expect(201);

                let deleteUrl = `/api/v1/discussion/${newDiscussionInfoA.id}?force=on`;
                await agent.delete(deleteUrl).expect(204);

                // 强制获取也获取不到的。
                let getUrl = `/api/v1/discussions/${newDiscussionInfoA.id}?force=on`;
                await agent.get(getUrl).expect(404);

                await testTools.member.login(agent, newMemberInfoA);
                let getNotificationUrl = '/api/v1/notification';
                let nitificationRes = await agent.get(getNotificationUrl)
                  .expect(200);
                nitificationRes = nitificationRes.body;
                let notifications = nitificationRes.notifications;
                expect(notifications.length).to.be.equal(2);// 封禁通知+被回复通知
              });
            });
          });
        });
      });
    });
  });

  it('ignore discussion.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
        await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
          // 忽略这个讨论
          let ignoreUrl = `/api/v1/discussions/${newDiscussionInfo.id}/ignore`;
          await agent.post(ignoreUrl);

          // B 回复这个讨论
          await testTools.member.login(agent, newMemberInfoB);
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url)
            .send(postPayload)
            .expect(201);

          // A 查看消息队列
          await testTools.member.login(agent, newMemberInfoA);
          let notificationUrl = '/api/v1/notification';
          let notificationRes = await agent.get(notificationUrl)
            .expect(200);
          let notificationBody = notificationRes.body;
          expect(notificationBody.notifications.length).to.be.equal(0);
        });
      });
    });
  });

  it('ignore member.', async () => {
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
          await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
            // 忽略 B
            let ignoreUrl = `/api/v1/member/${newMemberInfoB.id}/ignore`;
            await agent.post(ignoreUrl);

            // B 回复这个讨论
            await testTools.member.login(agent, newMemberInfoB);
            let postPayload = {
              encoding: 'markdown',
              content: 'hello test',
            };
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(url)
              .send(postPayload)
              .expect(201);

            // A 查看消息队列
            await testTools.member.login(agent, newMemberInfoA);
            let notificationUrl = '/api/v1/notification';
            let notificationRes = await agent.get(notificationUrl)
              .expect(200);
            let notificationBody = notificationRes.body;
            expect(notificationBody.notifications.length).to.be.equal(0);
          });
        });
      });
    });
  });

  it('add a post in my discussion.', async () => {
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
        await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
          // 为讨论添加帖子
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url)
            .send(postPayload)
            .expect(201);

          // A 查看消息队列
          await testTools.member.login(agent, newMemberInfoA);
          let notificationUrl = '/api/v1/notification';
          let notificationRes = await agent.get(notificationUrl)
            .expect(200);
          let notificationBody = notificationRes.body;
          expect(notificationBody.notifications.length).to.be.equal(0);
        });
      });
    });
  });

  it('other one reply my post in my discussion.', async () => {
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
        await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
          // 为讨论添加帖子
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url)
            .send(postPayload)
            .expect(201);

          await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
            // B 回复 A 的帖子
            let postPayload = {
              encoding: 'markdown',
              content: 'hello test',
              replyTo: {
                type: 'index',
                value: 2,
                memberId: newMemberInfoA.id,
              },
            };
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(url)
              .send(postPayload)
              .expect(201);
          });

          // A 查看消息队列
          await testTools.member.login(agent, newMemberInfoA);
          let notificationUrl = '/api/v1/notification';
          let notificationRes = await agent.get(notificationUrl)
            .expect(200);
          let notificationBody = notificationRes.body;
          expect(notificationBody.notifications.length).to.be.equal(1);
        });
      });
    });
  });

  it('other one reply other one post in my discussion.', async () => {
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
        await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
          await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
            // B 为讨论添加帖子
            let postPayload = {
              encoding: 'markdown',
              content: 'hello test',
            };
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(url)
              .send(postPayload)
              .expect(201);

            await testTools.member.createOneMember(agent, null, async (newMemberInfoC) => {
              // C 回复 B 的帖子
              let postPayload = {
                encoding: 'markdown',
                content: 'hello test',
                replyTo: {
                  type: 'index',
                  value: 1,
                  memberId: newMemberInfoB.id,
                },
              };
              let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
              await agent.post(url)
                .send(postPayload)
                .expect(201);

              // A 查看消息队列
              await testTools.member.login(agent, newMemberInfoA);
              let notificationUrl = '/api/v1/notification';
              let notificationRes = await agent.get(notificationUrl)
                .expect(200);
              let notificationBody = notificationRes.body;
              expect(notificationBody.notifications.length).to.be.equal(2);

              // B 查看消息队列
              await testTools.member.login(agent, newMemberInfoB);
              notificationUrl = '/api/v1/notification';
              notificationRes = await agent.get(notificationUrl)
                .expect(200);
              notificationBody = notificationRes.body;
              expect(notificationBody.notifications.length).to.be.equal(1);
            });
          });
        });
      });
    });
  });

  it('ignore member.', async () => {
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
          await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
            // 忽略 B
            let ignoreUrl = `/api/v1/member/${newMemberInfoB.id}/ignore`;
            await agent.post(ignoreUrl);

            // B 回复这个讨论
            await testTools.member.login(agent, newMemberInfoB);
            let postPayload = {
              encoding: 'markdown',
              content: 'hello test',
            };
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(url)
              .send(postPayload)
              .expect(201);

            // B 回复 A 的帖子
            postPayload = {
              encoding: 'markdown',
              content: 'hello test',
              replyTo: {
                type: 'index',
                value: 1,
                memberId: newMemberInfoA.id,
              },
            };
            url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(url)
              .send(postPayload)
              .expect(201);

            // A 查看消息队列
            await testTools.member.login(agent, newMemberInfoA);
            let notificationUrl = '/api/v1/notification';
            let notificationRes = await agent.get(notificationUrl)
              .expect(200);
            let notificationBody = notificationRes.body;
            expect(notificationBody.notifications.length).to.be.equal(0);
          });
        });
      });
    });
  });

  it('upload attachment.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfo) => {
        await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
          await testTools.discussion.closeFreqLimit(async () => {
            let postPayload = {
              attachments: [newAttachmentInfo.id],
              encoding: 'markdown',
              content: 'hello test',
            };
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            let postRes = await agent.post(url)
              .send(postPayload)
              .expect(201);

            let postInfo = postRes.body.newPost;

            let getUrl = '/api/v1/attachment/info/me';
            let attachmentsRes = await agent.get(getUrl);
            let attachments = attachmentsRes.body.attachments;

            expect(postInfo.attachments[0]).to.be.equal(newAttachmentInfo.id);
            expect(attachments[0]._owner).to.be.equal(newMemberInfo.id);
            expect(attachments[0]._id).to.be.equal(newAttachmentInfo.id);
          });
        });
      });
    });
  });

  it('upload attachment with discussion.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfo) => {
        await testTools.discussion.createOneDiscussion(agent, { attachments: [newAttachmentInfo.id] }, async (newDiscussionInfo) => {
          await testTools.discussion.closeFreqLimit(async () => {
            let getUrl = '/api/v1/attachment/info/me';
            let attachmentsRes = await agent.get(getUrl);
            let attachments = attachmentsRes.body.attachments;

            expect(attachments[0]._owner).to.be.equal(newMemberInfo.id);
            expect(attachments[0]._id).to.be.equal(newAttachmentInfo.id);
            expect(attachments[0]._id).to.be.equal(newDiscussionInfo.posts[0].attachments[0]);
            expect(attachments[0].referer[0]._discussionId).to.be.equal(newDiscussionInfo.id);
            expect(attachments[0].referer[0].index).to.be.equal(1);
          });
        });
      });
    });
  });

  it('upload two attachments.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfoA) => {
        await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfoB) => {
          await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
            await testTools.discussion.closeFreqLimit(async () => {
              let postPayload = {
                attachments: [newAttachmentInfoA.id, newAttachmentInfoB.id],
                encoding: 'markdown',
                content: 'hello test',
              };
              let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
              let postRes = await agent.post(url)
                .send(postPayload)
                .expect(201);

              let postInfo = postRes.body.newPost;

              let getUrl = '/api/v1/attachment/info/me';
              let attachmentsRes = await agent.get(getUrl);
              let attachments = attachmentsRes.body.attachments;

              expect(attachments.length).to.be.equal(2);

              expect(postInfo.attachments[0]).to.be.equal(newAttachmentInfoA.id);
              expect(postInfo.attachments[1]).to.be.equal(newAttachmentInfoB.id);
            });
          });
        });
      });
    });
  });

  it('update two attachments.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfoA) => {
        await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfoB) => {
          await testTools.attachment.uploadOneAttachment(agent, null, async (newAttachmentInfoC) => {
            await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
              await testTools.discussion.closeFreqLimit(async () => {
                let postPayload = {
                  attachments: [newAttachmentInfoA.id, newAttachmentInfoB.id],
                  encoding: 'markdown',
                  content: 'hello test',
                };
                let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
                await agent.post(url).send(postPayload).expect(201);

                let updatePayload = {
                  attachments: [newAttachmentInfoB.id, newAttachmentInfoC.id],
                };
                let updateUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/2`;
                await agent.put(updateUrl)
                  .send(updatePayload)
                  .expect(201);

                let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/posts`;
                let postsRes = await agent.get(getUrl).expect(200);
                let posts = postsRes.body.posts;
                expect(posts[1].attachments[0]).to.be.equal(newAttachmentInfoB.id);
                expect(posts[1].attachments[1]).to.be.equal(newAttachmentInfoC.id);

                let attachmentUrl = '/api/v1/attachment/info/me';
                let attachmentsRes = await agent.get(attachmentUrl);
                let attachments = attachmentsRes.body.attachments;

                expect(attachments[0].referer.length).to.be.equal(0);
                expect(attachments[1].referer[0]._discussionId).to.be.equal(newDiscussionInfo.id);
                expect(attachments[1].referer[0].index).to.be.equal(2);
                expect(attachments[2].referer[0]._discussionId).to.be.equal(newDiscussionInfo.id);
                expect(attachments[2].referer[0].index).to.be.equal(2);
              });
            });
          });
        });
      });
    });
  });
});
