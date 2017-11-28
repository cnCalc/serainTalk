'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');
const config = require('../../config');

let agent = supertest.agent(require('../../index'));

describe('message part', async () => {
  it('send message.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let url = `/api/v1/message/${newMemberInfo.id}`;
      let payload = {
        content: 'hello, here is test message.'
      };
      let messageRes = await agent.post(url)
        .send(payload)
        .expect(201);
      messageRes = messageRes.body;
      expect(messageRes.status).to.be.equal('ok');
      expect(payload.content).to.be.equal(messageRes.newMessage.content);
    });
  });

  it('get message list', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let postUrl = `/api/v1/message/${newMemberInfo.id}`;
      let payload = {
        content: 'hello, here is test message.'
      };
      await agent.post(postUrl)
        .send(payload)
        .expect(201);
      let getUrl = '/api/v1/messages';
      let messageRes = await agent.get(getUrl)
        .expect(200);
      messageRes = messageRes.body;
      let messages = messageRes.messages;
      let count = messageRes.count;
      expect(messages).to.be.an('array');
      expect(messages[0]).to.be.ok;
      expect(messages[0]._id).to.be.ok;
      expect(messages[0].participatesInfo).to.be.an('array');
      expect(messages[0].participatesInfo.length).to.be.equal(2);
      expect(count).to.be.ok;
    });
  });
});
