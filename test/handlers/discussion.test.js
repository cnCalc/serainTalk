'use strict';

const supertest = require('supertest');
const assert = require('assert');
const testTools = require('../testTools');
const errorMessages = require('../../utils/error-messages');
const config = require('../../config');
const utils = require('../../utils');

let app = require('../../index');
let agent = supertest.agent(app);

describe('discussion part', async () => {
  before('prepare config.', async () => {
    await app.prepare();
    await config.prepare();
  });

  it('add a discussion.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        assert(newDiscussionInfo.posts[0].index === 1);
      });
    });
  });

  it('add a html discussion by admin.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
        await testTools.discussion.createOneDiscussion(agent, { content: { encoding: 'html' } }, async (newDiscussionInfo) => {
          assert(newDiscussionInfo.posts[0].encoding === 'html');
        });
      });
    });
  });

  it('add a html discussion by member.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, { content: { encoding: 'html' } }, async (newDiscussionInfo) => {
        assert(newDiscussionInfo.posts[0].encoding === 'markdown');
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
        assert(discussionRes.body.status === 'ok');
        let discussions = discussionRes.body.discussions;
        delete testDiscussion.content;
        assert(testTools.discussion.isSameDiscussion(discussions[0], testDiscussion));
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
        assert(discussionRes.body.status === 'ok');
        let discussions = discussionRes.body.discussions;
        delete testDiscussion.content;
        assert(testTools.discussion.isSameDiscussion(discussions[0], testDiscussion));
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
        assert(discussionRes.body.status === 'ok');
        let discussions = discussionRes.body.discussions;
        delete testDiscussion.content;
        assert(testTools.discussion.isSameDiscussion(discussions[0], testDiscussion));
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
        assert(discussionRes.body.status === 'ok');
        let discussionInfo = discussionRes.body.discussionInfo;
        let tempDiscussion = JSON.parse(JSON.stringify(testTools.testObject.discussionInfo));
        delete tempDiscussion.content;
        assert(testTools.discussion.isSameDiscussion(discussionInfo, tempDiscussion));
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
        assert(discussionRes.status === 'error');
        assert(discussionRes.code === errorMessages.NOT_FOUND.code);
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
          assert(postsRes.status === 'ok');
          assert(Object.keys(members).includes(newMemberInfo.id));
          assert(posts.length === 1);

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
          assert(postsBody.status === 'ok');
          assert(postsBody.posts.length === 6);
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
        assert(discussionRes.status === 'error');
        assert(discussionRes.code === errorMessages.NOT_FOUND.code);
      });
    });
  });

  it('get post by index.', async () => {
    await testTools.member.createOneMember(agent, null, async () => {
      await testTools.discussion.createOneDiscussion(agent, { content: { content: 'a' } }, async (newDiscussionInfo) => {
        let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/1`;
        let postRes = await agent.get(getUrl);
        let post = postRes.body.post;
        assert(post.content === '<p>a</p>\n');
      });
    });
  });

  it('get raw post by index.', async () => {
    await testTools.member.createOneMember(agent, null, async () => {
      await testTools.discussion.createOneDiscussion(agent, { content: { content: 'a' } }, async (newDiscussionInfo) => {
        let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/1?raw=on`;
        let postRes = await agent.get(getUrl);
        let post = postRes.body.post;
        assert(post.content === 'a');
      });
    });
  });

  it('site sticky.', async () => {
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
        await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
          await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfoA) => {
            await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfoB) => {
              await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfoC) => {
                let getUrl = '/api/v1/discussion/latest?pagesize=3';
                let discussionRes = await agent.get(getUrl);
                let discussions = discussionRes.body.discussions;
                assert(newDiscussionInfoA._id.toString() === discussions[2]._id);
                assert(newDiscussionInfoB._id.toString() === discussions[1]._id);
                assert(newDiscussionInfoC._id.toString() === discussions[0]._id);

                let stickyUrl = `/api/v1/discussion/${newDiscussionInfoA._id}/sticky`;
                await agent.post(stickyUrl)
                  .send({ sticky: 'site' });
                discussionRes = await agent.get(getUrl);
                discussions = discussionRes.body.discussions;
                assert(newDiscussionInfoA._id.toString() === discussions[0]._id);
                assert(newDiscussionInfoC._id.toString() === discussions[1]._id);
                assert(newDiscussionInfoB._id.toString() === discussions[2]._id);

                await agent.post(stickyUrl)
                  .send({ sticky: 'site' });
                discussionRes = await agent.get(getUrl);
                discussions = discussionRes.body.discussions;
                assert(newDiscussionInfoA._id.toString() === discussions[2]._id);
                assert(newDiscussionInfoB._id.toString() === discussions[1]._id);
                assert(newDiscussionInfoC._id.toString() === discussions[0]._id);
              });
            });
          });
        });
      });
    });
  });

  it('category sticky.', async () => {
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
        await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
          await testTools.discussion.createOneDiscussion(agent, { category: '函数机综合讨论区' }, async (newDiscussionInfoA) => {
            await testTools.discussion.createOneDiscussion(agent, { category: '函数机综合讨论区' }, async (newDiscussionInfoB) => {
              let getUrl = '/api/v1/categories/scicalc/discussions';
              let discussionRes = await agent.get(getUrl);
              let discussions = discussionRes.body.discussions;
              assert(newDiscussionInfoA._id.toString() === discussions[1]._id);
              assert(newDiscussionInfoB._id.toString() === discussions[0]._id);

              let stickyUrl = `/api/v1/discussion/${newDiscussionInfoA._id}/sticky`;
              await agent.post(stickyUrl)
                .send({ sticky: 'category' });
              discussionRes = await agent.get(getUrl);
              discussions = discussionRes.body.discussions;
              assert(newDiscussionInfoA._id.toString() === discussions[0]._id);
              assert(newDiscussionInfoB._id.toString() === discussions[1]._id);

              await agent.post(stickyUrl)
                .send({ sticky: 'category' });
              discussionRes = await agent.get(getUrl);
              discussions = discussionRes.body.discussions;
              assert(newDiscussionInfoA._id.toString() === discussions[1]._id);
              assert(newDiscussionInfoB._id.toString() === discussions[0]._id);
            });
          });
        });
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
            assert(discussionRes.body.status === 'ok');
            assert(discussionRes.body.discussions.length === 0);
          });

          let payload = {
            category: ['test'],
            memberId: newMemberInfo.id,
          };
          let url = utils.url.createRESTfulUrl('/api/v1/discussions/latest', payload);
          let discussionRes = await agent
            .get(url)
            .expect(200);
          assert(discussionRes.body.status === 'ok');
          assert(discussionRes.body.discussions.length === 1);
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
          assert(postInfo);
          assert(postInfo.index === 2);
          assert(postInfo.content === postPayload.content);
          assert(postInfo.encoding === postPayload.encoding);
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

        // A 查看消息队列
        let notificationUrl = '/api/v1/notification';
        let notificationRes = await agent.get(notificationUrl)
          .expect(200);
        let notificationBody = notificationRes.body;
        assert(notificationBody.notifications.length === 1);
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
            assert(exactPost.updateDate);
            assert(exactPost.content === '<p>changed content.</p>\n');
            assert(otherPost.content === '<p>hello test</p>\n');
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
            assert(updateRes.body.code === errorMessages.PERMISSION_DENIED.code);

            let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/posts`;
            let postsRes = await agent.get(getUrl).expect(200);
            postsRes = postsRes.body;

            let exactPost = postsRes.posts[1];
            assert(!exactPost.updateDate);
            assert(exactPost.content === '<p>hello test</p>\n');
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
              assert(updateRes.body.code === errorMessages.PERMISSION_DENIED.code);

              let getUrl = `/api/v1/discussion/${newDiscussionInfo.id}/posts`;
              let postsRes = await agent.get(getUrl).expect(200);
              postsRes = postsRes.body;

              let exactPost = postsRes.posts[1];
              assert(!exactPost.updateDate);
              assert(exactPost.content === '<p>hello test</p>\n');
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
          assert(exactPost.updateDate);
          assert(exactPost.encoding === 'markdown');
          assert(exactPost.content === '<p>changed content.</p>\n');
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
            assert(exactPost.updateDate);
            assert(exactPost.encoding === 'html');
            assert(exactPost.content === 'changed content.');
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
            assert(postInfo.encoding === postPayload.encoding);
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
          assert(postInfo.index);
          assert(postInfo.encoding === 'markdown');
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
          assert(err.code === errorMessages.TOO_FREQUENT.code);
        }

        await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url).send(postPayload).expect(201);
          let Res = await agent.post(url).send(postPayload).expect(403);
          assert(Res.body.code === errorMessages.TOO_FREQUENT.code);
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
          assert(postInfo.replyTo);
          assert(postInfo.encoding === 'markdown');
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
        assert(votes.up.memberId[0] === newMemberInfo.id);
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
        assert(voteRes.status === 'error');
        assert(voteRes.code === errorMessages.NOT_FOUND.code);
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
          assert(votes[vote].count === 0);
          assert(votes[vote].memberId.length === 0);
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
        assert(votes.up.memberId[0] === newMemberInfo.id);
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
        assert(votes.down.memberId[0] === newMemberInfo.id);
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
            assert(votes[vote].memberId.includes(newMemberInfoA.id));
            assert(votes[vote].memberId.includes(newMemberInfoB.id));
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
            assert(discussionRes.body.status === 'ok');
            let postsInfo = discussionRes.body.posts;
            assert(postsInfo.length === 2);
            assert(postsInfo[0].status.type === config.discussion.status.deleted);
          });
          let url = `/api/v1/discussions/${newDiscussionInfo.id}/posts`;
          let discussionRes = await agent
            .get(url)
            .expect(200);
          assert(discussionRes.body.status === 'ok');
          let postsInfo = discussionRes.body.posts;
          assert(postsInfo.length === 1);
          assert(postsInfo[0].status.type !== config.discussion.status.deleted);
        });
        let getNotificationUrl = '/api/v1/notification';
        let notificationRes = await agent.get(getNotificationUrl)
          .expect(200);
        notificationRes = notificationRes.body;
        let notifications = notificationRes.notifications;
        assert(notifications.length === 2);// 封禁通知+被回复通知
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
            assert(discussionRes.body.status === 'ok');
            let postsInfo = discussionRes.body.posts;
            assert(postsInfo.length === 2);
            assert(postsInfo[0].status.type === config.discussion.status.ok);
          });
        });

        let getNotificationUrl = '/api/v1/notification';
        let notificationRes = await agent.get(getNotificationUrl)
          .expect(200);
        notificationRes = notificationRes.body;
        let notifications = notificationRes.notifications;
        assert(notifications.length === 3);// 封禁通知+被回复通知+恢复通知
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
          assert(discussionRes.body.status === 'ok');
          let postsInfo = discussionRes.body.posts;
          assert(postsInfo.length === 2);
          assert(!postsInfo[0].baned);
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

                assert(discussionRes.body.status === 'ok');
                let discussionInfo = discussionRes.body.discussionInfo;
                assert(discussionInfo.status.type === config.discussion.status.deleted);
              });
            });
            let getNotificationUrl = '/api/v1/notification';
            let notificationRes = await agent.get(getNotificationUrl)
              .expect(200);
            notificationRes = notificationRes.body;
            let notifications = notificationRes.notifications;
            assert(notifications.length === 2);// 封禁通知+被回复通知
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
              });
            });

            let getNotificationUrl = '/api/v1/notification';
            let notificationRes = await agent.get(getNotificationUrl)
              .expect(200);
            notificationRes = notificationRes.body;
            let notifications = notificationRes.notifications;
            assert(notifications.length === 2);// 封禁通知+被回复通知
          });
        });
      });
    });
  });

  it('ignore discussion.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        // 忽略这个讨论
        let ignoreUrl = `/api/v1/discussions/${newDiscussionInfo.id}/ignore`;
        await agent.post(ignoreUrl);

        await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
          // B 回复这个讨论
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test',
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url)
            .send(postPayload)
            .expect(201);
        });

        // A 查看消息队列
        let notificationUrl = '/api/v1/notification';
        let notificationRes = await agent.get(notificationUrl)
          .expect(200);
        let notificationBody = notificationRes.body;
        assert(notificationBody.notifications.length === 0);
      });
    });
  });

  it('watch discussion.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
          // A watch 这个讨论
          let watchUrl = `/api/v1/discussions/${newDiscussionInfo.id}/watch`;
          await agent.post(watchUrl);

          await testTools.member.createOneMember(agent, null, async (newMemberInfoC) => {
            // C 发布新 post
            let postPayload = {
              encoding: 'markdown',
              content: 'hello test',
            };
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(url)
              .send(postPayload)
              .expect(201);
          });

          // A 查看消息队列
          let notificationUrl = '/api/v1/notification';
          let notificationRes = await agent.get(notificationUrl)
            .expect(200);
          let notificationBody = notificationRes.body;
          assert(notificationBody.notifications.length === 1);
          assert(/你关注的/.test(notificationBody.notifications[0].content) === true);
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
            await testTools.member.login(agent, newMemberInfoB, async () => {
              let postPayload = {
                encoding: 'markdown',
                content: 'hello test',
              };
              let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
              await agent.post(url)
                .send(postPayload)
                .expect(201);
            });

            // A 查看消息队列
            let notificationUrl = '/api/v1/notification';
            let notificationRes = await agent.get(notificationUrl)
              .expect(200);
            let notificationBody = notificationRes.body;
            assert(notificationBody.notifications.length === 0);
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
          let notificationUrl = '/api/v1/notification';
          let notificationRes = await agent.get(notificationUrl)
            .expect(200);
          let notificationBody = notificationRes.body;
          assert(notificationBody.notifications.length === 0);
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
          let notificationUrl = '/api/v1/notification';
          let notificationRes = await agent.get(notificationUrl)
            .expect(200);
          let notificationBody = notificationRes.body;
          assert(notificationBody.notifications.length === 1);
        });
      });
    });
  });

  it('other one reply other one post in my discussion.', async () => {
    let notificationUrl = '/api/v1/notification';
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
            });

            // B 查看消息队列
            let notificationRes = await agent.get(notificationUrl)
              .expect(200);
            let notificationBody = notificationRes.body;
            assert(notificationBody.notifications.length === 1);
          });

          // A 查看消息队列
          let notificationRes = await agent.get(notificationUrl)
            .expect(200);
          let notificationBody = notificationRes.body;
          assert(notificationBody.notifications.length === 2);
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

            await testTools.member.login(agent, newMemberInfoB, async () => {
              // B 回复这个讨论
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
            });

            // A 查看消息队列
            let notificationUrl = '/api/v1/notification';
            let notificationRes = await agent.get(notificationUrl)
              .expect(200);
            let notificationBody = notificationRes.body;
            assert(notificationBody.notifications.length === 0);
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

            assert(postInfo.attachments[0] === newAttachmentInfo.id);
            assert(attachments[0]._owner === newMemberInfo.id);
            assert(attachments[0]._id === newAttachmentInfo.id);
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

            assert(attachments[0]._owner === newMemberInfo.id);
            assert(attachments[0]._id === newAttachmentInfo.id);
            assert(attachments[0]._id === newDiscussionInfo.posts[0].attachments[0]);
            assert(attachments[0].referer[0]._discussionId === newDiscussionInfo.id);
            assert(attachments[0].referer[0].index === 1);
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

              assert(attachments.length === 2);

              assert(postInfo.attachments[0] === newAttachmentInfoA.id);
              assert(postInfo.attachments[1] === newAttachmentInfoB.id);
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
                assert(posts[1].attachments[0] === newAttachmentInfoB.id);
                assert(posts[1].attachments[1] === newAttachmentInfoC.id);

                let attachmentUrl = '/api/v1/attachment/info/me';
                let attachmentsRes = await agent.get(attachmentUrl);
                let attachments = attachmentsRes.body.attachments;

                assert(attachments[2].referer.length === 0);
                assert(attachments[1].referer[0]._discussionId === newDiscussionInfo.id);
                assert(attachments[1].referer[0].index === 2);
                assert(attachments[0].referer[0]._discussionId === newDiscussionInfo.id);
                assert(attachments[0].referer[0].index === 2);
              });
            });
          });
        });
      });
    });
  });

  it('search a discussion banned by admin.', async () => {
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
        await testTools.discussion.createOneDiscussion(agent, {
          title: utils.createRandomString(),
        }, async (newDiscussionInfoA) => {
          await testTools.member.createOneMember(agent, null, async (newMemberInfoC) => {
            let searchRes = await agent.get(`/api/v1/search/discussion?keywords=${newDiscussionInfoA.title}`);
            let searchInfo = searchRes.body.result;
            assert(searchInfo.length === 1);
          });
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

              assert(discussionRes.body.status === 'ok');
              let discussionInfo = discussionRes.body.discussionInfo;
              assert(discussionInfo.status.type === config.discussion.status.deleted);
            });
          });
          await testTools.member.createOneMember(agent, null, async (newMemberInfoC) => {
            let searchRes = await agent.get(`/api/v1/search/discussion?keywords=${newDiscussionInfoA.title}`);
            let searchInfo = searchRes.body.result;
            assert(searchInfo.length === 0);
          });
        });
      });
    });
  });

  it('search a post banned by admin.', async () => {
    await testTools.discussion.closeFreqLimit(async () => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
        await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfoA) => {
          // 写入二楼
          let postPayload = {
            encoding: 'markdown',
            content: utils.createRandomString(),
          };
          let addPostUrl = `/api/v1/discussion/${newDiscussionInfoA.id}/post`;
          await agent.post(addPostUrl)
            .send(postPayload)
            .expect(201);

          await testTools.member.createOneMember(agent, null, async (newMemberInfoC) => {
            let searchRes = await agent.get(`/api/v1/search/post?keywords=${postPayload.content}`);
            let searchInfo = searchRes.body.result;
            assert(searchInfo.length === 1);
          });
          await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
            await testTools.member.setAdmin(agent, newMemberInfoB._id, async () => {
              let banUrl = `/api/v1/discussion/${newDiscussionInfoA.id}/post/2`;
              await agent.delete(banUrl).expect(204);
            });
            let url = `/api/v1/discussions/${newDiscussionInfoA.id}/posts`;
            let discussionRes = await agent
              .get(url)
              .expect(200);
            assert(discussionRes.body.status === 'ok');
            let postsInfo = discussionRes.body.posts;
            assert(postsInfo.length === 1);
            assert(postsInfo[0].status.type !== config.discussion.status.deleted);
          });
          await testTools.member.createOneMember(agent, null, async (newMemberInfoC) => {
            let searchRes = await agent.get(`/api/v1/search/post?keywords=${postPayload.content}`);
            let searchInfo = searchRes.body.result;
            assert(searchInfo.length === 0);
          });
        });
      });
    });
  });
});
