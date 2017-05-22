function getMemberAvatarUrl (member) {
  let pad = number => ('000000000' + number.toString()).substr(-9);

  if (!member) {
    return;
  }

  if (member.uid) {
    // Discuz 用户数据
    let matchResult = pad(member.uid).match(/(\d{3})(\d{2})(\d{2})(\d{2})/);
    return `/uploads/avatar/${matchResult[1]}/${matchResult[2]}/${matchResult[3]}/${matchResult[4]}_avatar_big.jpg`;
  } else {
    // 新用户，直接返回字段
    return `/uploads/avatar/${member.avatar || 'default.png'}`;
  }
}

export default getMemberAvatarUrl;
