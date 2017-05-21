function decodeHTML (str) {
  let strMap = {
    '&lt': '<',
    '&gt': '>',
    '&quot': '"',
    '&apos': '\'',
    '&amp': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': '\'',
    '&amp;': '&'
  };
  if (str.length === 0) {
    return '';
  }
  return str.replace(/&[0-9a-zA-Z]+;?/g, function (s) {
    return strMap[s] || s;
  });
}

export default decodeHTML;
