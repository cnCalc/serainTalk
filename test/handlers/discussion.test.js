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
            content: 'hello test'
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
          }
        };
        await testTools.discussion.createOneDiscussion(agent, testDiscussionInfo, async (newDiscussionInfo) => {
          await testTools.discussion.setWhiteList(['noTest'], async () => {
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
    });
  });

  it('add a post.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          let postPayload = {
            encoding: 'markdown',
            content: 'hello test'
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

  it('update a post.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, { content: { content: 'hello test' } }, async (newDiscussionInfo) => {
        await testTools.discussion.closeFreqLimit(async () => {
          await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
            let postPayload = {
              encoding: 'markdown',
              content: 'hello test'
            };
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(url)
              .send(postPayload)
              .expect(201);

            let updatePayload = {
              content: 'changed content.'
            };
            let updateUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/2`;
            let tempres = await agent.put(updateUrl)
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
            content: 'hello test'
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url)
            .send(postPayload)
            .expect(201);

          await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
            let updatePayload = {
              content: 'changed content.'
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
            content: 'hello test'
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url)
            .send(postPayload)
            .expect(201);

          await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
            await testTools.member.setAdmin(agent, newMemberInfoB._id, async () => {
              let updatePayload = {
                content: 'changed content.'
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
            content: 'hello test'
          };
          let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
          await agent.post(url)
            .send(postPayload)
            .expect(201);

          let updatePayload = {
            encoding: 'html',
            content: 'changed content.'
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
              content: 'hello test'
            };
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
            await agent.post(url)
              .send(postPayload)
              .expect(201);

            let updatePayload = {
              encoding: 'html',
              content: 'changed content.'
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
              content: 'hello test'
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
            content: 'hello test'
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
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        try {
          await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
            let url = `/api/v1/discussion/${newDiscussionInfo.id}/post`;
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
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
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

  it('vote for wrong discussion(should be wrong).', async () => {
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

  it('ban a post by admin.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
          await testTools.member.setAdmin(agent, newMemberInfoB._id, async () => {
            let postPayload = {
              encoding: 'markdown',
              content: 'hello test'
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
            expect(postsInfo.length).to.be.equal(1);
            expect(postsInfo[0].status.type).to.not.be.equal(config.discussion.status.deleted);

            url = `/api/v1/discussions/${newDiscussionInfo.id}/posts?force=on`;
            discussionRes = await agent
              .get(url)
              .expect(200);
            expect(discussionRes.body.status).to.be.equal('ok');
            postsInfo = discussionRes.body.posts;
            expect(postsInfo.length).to.be.equal(2);
            expect(postsInfo[1].status.type).to.be.equal(config.discussion.status.deleted);
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
            content: 'hello test'
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
          expect(postsInfo[1].baned).to.not.be.ok;
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
                  content: 'hello test'
                };
                let addPostUrl = `/api/v1/discussion/${newDiscussionInfoA.id}/post`;
                await agent.post(addPostUrl)
                  .send(postPayload)
                  .expect(201);

                let banUrl = `/api/v1/discussion/${newDiscussionInfoA.id}`;
                await agent.delete(banUrl).expect(204);

                // 不强制获取则取不到制定的 Discussion
                let url = `/api/v1/discussions/${newDiscussionInfoA.id}`;
                let discussionRes = await agent
                  .get(url)
                  .expect(404);

                let getUrl = `/api/v1/discussions/${newDiscussionInfoA.id}?force=on`;
                discussionRes = await agent
                  .get(getUrl)
                  .expect(200);

                expect(discussionRes.body.status).to.be.equal('ok');
                let discussionInfo = discussionRes.body.discussionInfo;
                expect(discussionInfo.status.type).to.be.equal(config.discussion.status.deleted);
              });
            });
          });
        });
      });
    });
  });
});
