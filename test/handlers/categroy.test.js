'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');

let agent = supertest.agent(require('../../index'));

describe('categroy part.', async () => {
  it('get category list.', async () => {
    let getUrl = '/api/v1/categories';
    let categoryRes = await agent.get(getUrl)
      .expect(200);
    categoryRes = categoryRes.body;
    let categories = categoryRes.groups;
    expect(categoryRes.status).to.be.equal('ok');
    expect(categories).to.be.an('array');
  });

  it('get discussions under specified category.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, { category: '德州仪器（TI）图形计算器' }, async (newDiscussionInfo) => {
        let getUrl = '/api/v1/categories/ticalc/discussions';
        let discussionRes = await agent.get(getUrl)
          .expect(200);
        discussionRes = discussionRes.body;
        let discussions = discussionRes.discussions;
        expect(discussionRes.status).to.be.equal('ok');
        expect(discussions).to.be.an('array');
        expect(discussions.length).to.be.above(0);
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
    let discussions = discussionRes.discussions;
    expect(discussionRes.status).to.be.equal('ok');
    expect(discussions).to.be.an('array');
  });
});
