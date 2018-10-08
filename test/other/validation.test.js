'use strict';

const supertest = require('supertest');
const assert = require('assert');
const testTools = require('../testTools');
const errorMessages = require('../../utils/error-messages');

let agent = supertest.agent(require('../../index'));

describe('validation part.', async () => {
  it('send a field that not include.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let postUrl = `/api/v1/message/${newMemberInfoA.id}`;
        let payload = {
          fakeInfo: 'washing powder',
        };
        let sendRes = await agent.post(postUrl)
          .send(payload)
          .expect(400);
        assert(sendRes.body.code === errorMessages.VALIDATION_ERROR.code);
      });
    });
  });
});
