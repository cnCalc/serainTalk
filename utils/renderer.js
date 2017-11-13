const mdit = require('markdown-it');
const hljs = require('highlight.js');

const md = mdit({
  html: false,
  highlight (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return addSpanEachLine(hljs.highlight(lang, str.trim()).value);
      } catch (__) {}
    }
    return addSpanEachLine(str.trim());
  }
});

function addSpanEachLine (html) {
  return html.split('\n').map(l => `<span class="__line">${l}</span>`).join('\n');
}

function renderPosts (posts) {
  if (!posts instanceof Array) {
    throw new Error('posts should be Array');
  }

  posts.forEach(post => {
    post.encoding === 'markdown' && (post.content = md.render(post.content));
  });

  return posts;
}

module.exports = {
  renderPosts
};
