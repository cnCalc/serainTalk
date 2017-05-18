function timeAgo(time) {
  const between = Date.now() / 1000 - Number(time);
  if (between < 3600) {
    return ` ${~~(between / 60)} 分钟前`;
  } else if (between < 86400) {
    return ` ${~~(between / 3600)} 小时前`;
  } else if (between < 31536000) {
    return ` ${~~(between / 86400)} 天前`;
  } else {
    return `约 ${~~(between / 31536000)} 年 ${~~((between % 31536000) / 86400)} 天前`;    
  }
};

export { timeAgo };