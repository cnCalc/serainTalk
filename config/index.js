'use strict';

const dev = require('./dev');
const procduct = require('./procduct');
const _ = require('lodash');
const mocha = require('./mocha');

let config = {
  database: 'mongodb://localhost:27017/cncalc?autoReconnect=true',
  pagesize: 10,
  jwtSecret: 'exampleSecret',
  siteAddress: 'https://www.cncalc.org', // 末尾不要加'/'
  cookie: {
    renewTime: 86400000
  },
  tokenValidTime: 1000 * 60 * 10,
  password: {
    resetPasswordPage: 'https://www.cncalc.org/resetpassword.html'
  },
  discussion: {
    category: {
      whiteList: 'loading'
    },
    post: {
      vote: [
        'up',
        'down',
        'laugh',
        'hooray',
        'confused',
        'heart'
      ]
    },
    freqLimit: 1000 * 60 * 3, // 发帖间隔
    reset: 'loading'
  },
};

// 优先导出部分基础配置信息
exports = module.exports = config;

if (process.env.NODE_ENV === 'PROCDUCT') {
  _.merge(config, procduct);
}
if (process.env.NODE_ENV === 'DEV') {
  _.merge(config, dev);
}
if (process.env.NODE_ENV === 'MOCHA') {
  _.merge(config, mocha);
}

/**
 * 使用原始配置重置讨论的配置
 *
 * @returns 重置后的 discussion 配置信息
 */
let resetDiscussionConfig = async () => {
  await dbTool.prepare();
  let originSetting = {
    groups: [
      {
        name: '图形编程计算器讨论区',
        items: [
          {
            name: '德州仪器（TI）图形计算器',
            type: 'category',
            slug: 'ticalc',
            description: '德州仪器 Texas Instruments（TI）图形计算器、可编程计算器讨论。',
            color: '#888888',
            img: null
          },
          {
            name: '卡西欧（CASIO）图形计算器',
            type: 'category',
            slug: 'casiocalc',
            description: '卡西欧（CASIO）图形计算器、可编程计算器讨论。',
            color: '#888888',
            img: null
          },
          {
            name: '惠普（HP）图形计算器',
            type: 'category',
            slug: 'hpcalc',
            description: '惠普 Hewlett-Packard（HP）图形计算器、可编程计算器讨论。',
            color: '#888888',
            img: null
          },
          {
            name: '其他图形计算器',
            type: 'category',
            slug: 'othercalc',
            description: '其它可编程计算器，辉光、VFD、LED等古董计算器收藏、泛手持计算设备的讨论。',
            color: '#888888',
            img: null
          },
          {
            name: '图形计算器资源下载',
            type: 'category',
            slug: 'calcdownload',
            description: '提供各种图形以及可编程计算器的程序、模拟器、联机软件等下载。',
            color: '#888888',
            img: null
          },
          {
            name: 'ArithMax开源计算器项目',
            type: 'category',
            slug: 'arithmax',
            description: '',
            color: '#888888',
            img: null
          },
        ]
      }, {
        name: '函数计算器讨论区',
        items: [
          {
            name: '函数机综合讨论区',
            type: 'category',
            slug: 'scicalc',
            description: '函数科学计算器综合讨论区。',
            color: '#888888',
            img: null
          },
          {
            name: '硬升级与硬件讨论',
            type: 'category',
            slug: 'hardmod',
            description: '讨论函数计算器硬升级话题，也欢迎电子方面的讨论。',
            color: '#888888',
            img: null
          },
        ]
      }, {
        name: '非传统平台计算软件讨论区',
        items: [
          {
            name: '计算软件讨论及资源下载',
            type: 'category',
            slug: 'calcsoftware',
            description: '讨论各种计算机平台上的计算软件，如 Mathematica, Maple, MatLab 等，以及 Windows CE、Linux、Mac 等平台上的计算软件。',
            color: '#888888',
            img: null
          },
        ]
      }, {
        name: '杂类版块',
        items: [
          {
            name: '站务管理',
            type: 'category',
            slug: 'site',
            description: '意见、建议发表，系统问题报告',
            color: '#888888',
            img: null
          },
          {
            name: '二手&交易',
            type: 'category',
            slug: 'trade',
            description: '本区为计算器及周边物品交易专区，一切交易帖子请发在这里。',
            color: '#888888',
            img: null
          },
          {
            name: '聊天与贴图',
            type: 'category',
            slug: 'chat',
            description: '聊天之处，绝对禁止纯水。本区仅接受非技术性贴图。与计算器有关的图片请发表到相应的讨论区。',
            color: '#888888',
            img: null
          },
          {
            name: '学生学术讨论',
            type: 'category',
            slug: 'academic',
            description: '有关学生学习交流的板块|心得|研究|报告|讨论',
            color: '#888888',
            img: null
          },
        ]
      }, {
        name: '友情链接',
        items: [
          {
            name: 'TI-Planet',
            type: 'link',
            href: 'https://tiplanet.org/',
            description: 'Programmes et forum sur les calculatrices TI. 国外最活跃的TI社区之一（法语）',
            color: '#888888',
            img: null
          }, {
            name: '中山市中学教学网',
            type: 'link',
            href: 'http://www.gdzssx.com/',
            description: '广东中山市中学教育网，包含Nspire数学教学相关应用。',
            color: '#888888',
            img: null
          }, {
            name: 'TI测绘',
            type: 'link',
            href: 'http://www.ticehui.org/',
            description: '讨论TI计算器测绘应用的测绘论坛。包含问答、文章、程序、软件、教学等等部分。',
            color: '#888888',
            img: null
          }, {
            name: '测工网',
            type: 'link',
            href: 'http://www.cegong.com/',
            description: '',
            color: '#888888',
            img: null
          }, {
            name: 'Casiopeia',
            type: 'link',
            href: 'http://www.casiopeia.net/',
            description: '',
            color: '#888888',
            img: null
          },
        ]
      },
    ]
  };
  await dbTool.generic.updateMany(
    {
      key: 'pinned-categories'
    },
    {
      $set: originSetting
    }
  );
  await setDiscussionCategoryWhiteList();

  return originSetting;
};
exports.discussion.reset = resetDiscussionConfig;

/**
 * 获取 type 为 category 的分类，并将其存入配置文件中
 *
 * @returns 读取到的讨论标签白名单
 */
let setDiscussionCategoryWhiteList = async () => {
  let whiteList = await dbTool.generic.aggregate([
    { $match: { key: 'pinned-categories' }},
    { $unwind: '$groups' },
    { $unwind: '$groups.items' },
    { $match: { 'groups.items.type': 'category' }},
    { $project: { name: '$groups.items.name', _id: 0 }}
  ]).toArray();
  whiteList = whiteList.map(item => item.name);
  config.discussion.category.whiteList = whiteList;

  return whiteList;
};

let dbTool;
/**
 * 从数据库读取额外配置
 *
 */
let updateConfigFromDatabase = async () => {
  dbTool = require('../utils/database');
  await dbTool.prepare();
  setDiscussionCategoryWhiteList();
};

// dbTool 模块生成完成后再读取额外配置
setTimeout(updateConfigFromDatabase, 0);

