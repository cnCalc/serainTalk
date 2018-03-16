function timeAgo (time) {
  const between = (Date.now() - Number(time)) / 1000;
  if (between < 120) {
    return ' 3 分钟内';
  } else if (between < 3600) {
    return ` ${~~(between / 60)} 分钟前`;
  } else if (between < 86400) {
    return ` ${~~(between / 3600)} 小时前`;
  } else if (between < 31536000) {
    return ` ${~~(between / 86400)} 天前`;
  } else {
    return `约 ${~~(between / 31536000)} 年 ${~~((between % 31536000) / 86400)} 天前`;
  }
};

function indexToPage (index, pagesize = 10) {
  return Math.floor((index - 1) / pagesize) + 1;
}

function fileSize (size) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  let n = Math.max(Math.floor(Math.log(size) / Math.log(1024)), 0);
  return `${(size / (1024 ** n)).toFixed(2)} ${units[n]}`;
}

export { timeAgo, indexToPage, fileSize };
