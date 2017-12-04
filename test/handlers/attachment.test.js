'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const dbTool = require('../../utils/database');

let agent = supertest.agent(require('../../index'));

describe('attachment part.', async () => {
  it('get attachment by id.', async () => {
    let randomAid;
    let attachmentInfo = 1;
    while (attachmentInfo) {
      randomAid = parseInt(Math.random() * 1e15);
      attachmentInfo = await dbTool.attachment.findOne({ aid: randomAid });
    }
    await dbTool.attachment.insertOne({ aid: randomAid });

    let getUrl = `/api/v1/attachment?aid=${randomAid}`;
    let attachmentRes = await agent.get(getUrl).expect(200);
    attachmentRes = attachmentRes.body;
    let attachment = attachmentRes.attachment;
    expect(attachmentRes.status).to.be.equal('ok');
    expect(attachment.aid).to.be.equal(randomAid);
  });
});
