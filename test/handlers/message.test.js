'use strict';

const supertest = require('supertest');
const assert = require('assert');
const testTools = require('../testTools');
const config = require('../../config');

let app = require('../../index');
let agent = supertest.agent(app);

describe('message part', async () => {
  before(async () => {
    await app.prepare();
    await config.prepare();
  });

  it('send message.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let postUrl = `/api/v1/message/${newMemberInfoA.id}`;
        let payload = {
          content: 'hello, here is test message.',
        };
        let sendMessageRes = await agent.post(postUrl)
          .send(payload)
          .expect(201);
        sendMessageRes = sendMessageRes.body;
        let messageId = sendMessageRes.messageId;
        assert(sendMessageRes.status === 'ok');
        assert(messageId);

        let getUrl = `/api/v1/message/${messageId}`;

        let getMessageRes = await agent.get(getUrl).expect(200);
        getMessageRes = getMessageRes.body;
        let message = getMessageRes.message;
        assert(getMessageRes.status === 'ok');
        assert(message._id === messageId);
        ;
        assert(message.members.length === 2);
        assert(message.members.includes(newMemberInfoA.id));
        assert(message.members.includes(newMemberInfoB.id));
        ;
        assert(message.timeline[0].content === payload.content);
        assert(message.timeline[0].date);
        assert(message.timeline[0].from === newMemberInfoB.id);
      });
    });
  });

  it('get message list', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let postUrl = `/api/v1/message/${newMemberInfoA.id}`;
        let payload = {
          content: 'hello, here is test message.',
        };
        await agent.post(postUrl)
          .send(payload)
          .expect(201);
        let getUrl = '/api/v1/messages';
        let messageRes = await agent.get(getUrl)
          .expect(200);
        messageRes = messageRes.body;
        let messagesInfo = messageRes.messagesInfo;
        let count = messageRes.count;
        ;
        assert(messagesInfo[0]);
        assert(messagesInfo[0]._id);
        ;
        assert(messagesInfo[0].members.length === 2);
        assert(messagesInfo[0].members.includes(newMemberInfoA.id));
        assert(messagesInfo[0].members.includes(newMemberInfoB.id));
        assert(count);
      });
    });
  });

  it('get message by memberId', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let postUrl = `/api/v1/message/${newMemberInfoA.id}`;
        let payload = {
          content: 'hello, here is test message.',
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
        ;
        assert(message.timeline.length === config.pagesize);
        for (let key of Object.keys(message.timeline[0])) {
          assert(['from', 'date', 'content'].includes(key));
        }
      });
    });
  });

  it('get message by messageId', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let postUrl = `/api/v1/message/${newMemberInfoA.id}`;
        let payload = {
          content: 'hello, here is test message.',
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

        getUrl = `/api/v1/message/${messageInfo._id}`;
        messageRes = await agent.get(getUrl)
          .expect(200);
        let message = messageRes.body.message;
        ;
        assert(message.timeline.length === config.pagesize);
        for (let key of Object.keys(message.timeline[0])) {
          assert(['from', 'date', 'content'].includes(key));
        }
      });
    });
  });
});
