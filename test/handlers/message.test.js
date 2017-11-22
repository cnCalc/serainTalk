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
        message: 'hello, here is test message.',
        href: 'hello.test.org'
      };
      let messageRes = await agent.post(url)
        .send(payload)
        .expect(201);
      messageRes = messageRes.body;
      expect(messageRes.status).to.be.equal('ok');
      expect(payload.message).to.be.equal(messageRes.newMessage.message);
      expect(payload.href).to.be.equal(messageRes.newMessage.href);
      expect(messageRes.newMessage.href).to.be.ok;
      expect(messageRes.newMessage.unread).to.be.ok;
    });
  });

  it('send message without href.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let url = `/api/v1/message/${newMemberInfo.id}`;
      let payload = {
        message: 'hello, here is test message.'
      };
      let messageRes = await agent.post(url)
        .send(payload)
        .expect(201);
      messageRes = messageRes.body;
      expect(messageRes.status).to.be.equal('ok');
      expect(payload.message).to.be.equal(messageRes.newMessage.message);
      expect(messageRes.newMessage.href).to.not.be.ok;
      expect(messageRes.newMessage.unread).to.be.ok;
    });
  });

  it('get message', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let postUrl = `/api/v1/message/${newMemberInfo.id}`;
      let payload = {
        message: 'hello, here is test message.'
      };
      for (let i = 0; i < config.pagesize + 1; i++) {
        await agent.post(postUrl)
          .send(payload)
          .expect(201);
      }
      let getUrl = '/api/v1/message';
      let messageRes = await agent.get(getUrl)
        .expect(200);
      messageRes = messageRes.body;
      let messages = messageRes.messages;
      let count = messageRes.count;
      expect(messages.length).to.be.equal(config.pagesize);
      expect(count).to.be.equal(config.pagesize + 1);
    });
  });
});
