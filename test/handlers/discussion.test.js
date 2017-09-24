'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');

let agent = supertest.agent(require('../../index'));

describe('discussion part', async () => {
  it('add a discussion', async () => {
    await testTools.member.createOneMember(agent, async (newDiscussionInfo) => {
    });
  });

  it('get latest discussion list by memberid.', async () => {
    await testTools.member.createOneMember(agent, async (newDiscussionInfo) => {
      let url = `/api/v1/discussions/latest?${newDiscussionInfo.id}`;
      let discussionList = await agent
        .get(url)
        .expect(200);
      expect(discussionList.body.status).to.be.equal('ok');
      discussionList = discussionList.body;
    });
  });

  it('whitelist test.', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {

    });
  });
});
