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
      let messages = messageRes.messagesInfo;
      let count = messageRes.count;
      expect(messages).to.be.an('array');
      expect(messages[0]).to.be.ok;
      expect(messages[0]._id).to.be.ok;
      expect(messages[0].participatesInfo).to.be.an('array');
      expect(messages[0].participatesInfo.length).to.be.equal(2);
      expect(count).to.be.ok;
    });
  });

  it('get message by memberId', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let postUrl = `/api/v1/message/${newMemberInfoA.id}`;
        let payload = {
          content: 'hello, here is test message.'
        };
        for (let i = 0; i < config.pagesize + 1; i++) {
          await agent.post(postUrl)
            .send(payload)
            .expect(201);
        }
        let getUrl = `/api/v1/messages/member/${newMemberInfoA.id}`;
        let messageRes = await agent.get(getUrl)
          .expect(200);
        let message = messageRes.body.message;
        let count = messageRes.body.count;
        expect(message.timeline).to.be.an('array');
        expect(message.timeline.length).to.be.equal(config.pagesize);
        expect(Object.keys(message.timeline[0])).to.include.members(['from', 'date', 'content']);
        expect(count).to.be.equal(config.pagesize + 1);
      });
    });
  });

  it('get message by messageId', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let postUrl = `/api/v1/message/${newMemberInfoA.id}`;
        let payload = {
          content: 'hello, here is test message.'
        };
        for (let i = 0; i < config.pagesize + 1; i++) {
          await agent.post(postUrl)
            .send(payload)
            .expect(201);
        }
        let getUrl = '/api/v1/messages';
        let messageRes = await agent.get(getUrl)
          .expect(200);
        let messageInfo = messageRes.body.messagesInfo[0];

        getUrl = `/api/v1/message/${messageInfo._id}?page=2`;
        messageRes = await agent.get(getUrl)
          .expect(200);
        let message = messageRes.body.message;
        let count = messageRes.body.count;
        expect(message.timeline).to.be.an('array');
        expect(message.timeline.length).to.be.equal(1);
        expect(Object.keys(message.timeline[0])).to.include.members(['from', 'date', 'content']);
        expect(count).to.be.equal(config.pagesize + 1);
      });
    });
  });
});
