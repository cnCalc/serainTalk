'use strict';

const supertest = require('supertest');
const assert = require('assert');
const testTools = require('../testTools');

let app = require('../../index');
let agent = supertest.agent(app);

describe('categroy part.', async () => {
  before('prepare config.', async () => {
    await app.prepare();
  });

  it('get category list.', async () => {
    let getUrl = '/api/v1/categories';
    let categoryRes = await agent.get(getUrl)
      .expect(200);
    categoryRes = categoryRes.body;
    assert(categoryRes.status === 'ok');
  });

  it('get discussions under specified category.', async () => {
    await testTools.member.createOneMember(agent, { email: '233@233.com' }, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, { category: '德州仪器（TI）图形计算器' }, async (newDiscussionInfo) => {
        let getUrl = '/api/v1/categories/ticalc/discussions';
        let discussionRes = await agent.get(getUrl)
          .expect(200);
        discussionRes = discussionRes.body;
        let discussions = discussionRes.discussions;
        assert(discussionRes.status === 'ok');
        assert(discussions.length > 0);
      });
    });
  });

  it('test cache.', async () => {
    let getUrl = '/api/v1/categories/ticalc/discussions';
    let discussionRes = await agent.get(getUrl)
      .expect(200);
    discussionRes = await agent.get(getUrl)
      .expect(200);
    discussionRes = discussionRes.body;
    assert(discussionRes.status === 'ok');
  });
});
