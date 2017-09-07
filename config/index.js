const db = require('../utils/database');
const dev = require('./dev');
const procduct = require('./procduct');

let options = {
  database: 'mongodb://localhost:27017/cncalc?autoReconnect=true',
  pagesize: 10,
  jwtSecret: 'exampleSecret',
  cookie: {
    renewTime: 86400000
  },
  tokenValidTime: 1000 * 60 * 10,
  discussion: {
    category: {
      WhiteList: [
        '德州仪器（TI）图形计算器',
        '卡西欧（CASIO）图形计算器',
        '惠普（HP）图形计算器',
        '其他图形计算器',
        '图形计算器资源下载',
        'ArithMax开源计算器项目',
        '函数机综合讨论区',
        '硬升级与硬件讨论',
        '计算软件讨论及资源下载',
        '站务管理',
        '二手&交易',
        '聊天与贴图',
        '学生学术讨论',
      ]
    }
  }
};

module.exports = {
  DEV: Object.assign({}, options, dev),
  PROCDUCT: Object.assign({}, options, procduct)
}[process.env.NODE_ENV || 'DEV'];
