const mdit = require('markdown-it');
const hljs = require('highlight.js');

const md = mdit({
  html: false,
  highlight (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value;
      } catch (__) {}
    }
    return '';
  }
});

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
