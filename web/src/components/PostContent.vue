<template lang="pug">
  div.post-content
    div.reply-preview-wrapper(v-if="this.replyTo" :id="pattern" v-bind:style="{ opacity: preview ? 1 : 0, pointerEvents: preview ? '' : 'none' }")
      div.reply-preview-container(v-on:mouseover="showReplyPreview" v-on:mouseout="hideReplyPreview")
        div.reply-preview-member-meta
          div.avatar
            div.avatar-image(v-if="parentMemeber.avatar" v-bind:style="{ backgroundImage: `url(${parentMemeber.avatar})` }")
          div: router-link(:to="`/m/${this.replyTo.memberId}`") {{ parentMemeber.username }}
        div.inject-link.reply-preview-content(v-html="previewReplyHtml")
    div.inject-link(v-html="html")
</template>

<script>
import { indexToPage } from '../utils/filters';
import api from '../api';

export default {
  name: 'PostContent',
  props: {
    content: {
      type: String,
      default: '',
    },
    replyTo: {
      type: Object,
      default: () => ({}),
    },
    discussionId: {
      type: String,
      default: '',
    },
  },
  data () {
    return {
      html: '',
      previewReplyHtml: '',
      preview: false,
      previewLoaded: false,
      attachmentMap: {},
      loaded: false,
      timeoutId: null,
    };
  },
  computed: {
    pattern () {
      return `@${this.replyTo.memberId}#${this.discussionId || this.$store.state.discussionMeta._id}#${this.replyTo.value}`;
    },
    parentMemeber () {
      if (this.$store.state.members[this.replyTo.memberId]) {
        return this.$store.state.members[this.replyTo.memberId];
      } else {
        return { username: 'ERROR' };
      }
    },
  },
  watch: {
    content () {
      this.html = this.replaceMentionTag(this.replaceReplyTag(this.content));
    },
    preview () {
      if (!this.previewLoaded) {
        this.previewReplyHtml = 'Loading...';
        api.v1.discussion.fetchDiscussionPostByIdAndIndex({ id: this.discussionId || this.$store.state.discussionMeta._id, index: this.replyTo.value }).then(response => {
          this.previewLoaded = true;
          this.previewReplyHtml = response.post.content.replace(/\@([\da-fA-F]{24})\#([\da-fA-F]{24})\#(\d+)/, '');
        });
      }
    },
    html () {
      // 让 KaTeX 自动渲染 DOM 中的公式
      this.$nextTick(() => {
        try {
          window.renderMathInElement(this.$el);
        } catch (e) {
          console.log(e);
        }
      });
    },
  },
  created () {
    this.html = this.replaceMentionTag(this.replaceReplyTag(this.content));
    this.injectLinks();
  },
  mounted () {
    this.addPreviewEvents();
  },
  methods: {
    showReplyPreview () {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      if (this.preview) {
        return;
      }
      this.timeoutId = setTimeout(() => {
        this.preview = true;
        this.timeoutId = null;
      }, 500);
    },
    injectLinks () {
      this.$nextTick(() => {
        if (process.env.VUE_ENV !== 'server') {
          this.$el.querySelectorAll('.inject-link a').forEach(el => {
            el.addEventListener('click', e => {
              const url = new URL(el.href);
              const hostname = url.hostname;

              const queryString = url.search.substr(1);
              const queryObject = {};

              queryString.split('&').forEach(pair => {
                const [k, v] = pair.split('=');
                queryObject[k] = v;
              });

              if (hostname === location.hostname) {
                e.preventDefault();
                this.$router.push({
                  path: url.pathname,
                  hash: url.hash,
                  query: queryObject,
                });
              }
            });
          });
        }
      });
    },
    hideReplyPreview () {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      if (!this.preview) {
        return;
      } else {
        this.timeoutId = setTimeout(() => {
          this.preview = false;
        }, 500);
      }
    },
    replaceReplyTag (html) {
      if (!this.replyTo) {
        return html;
      }

      const pattern = this.pattern;
      const replyReg = /\@([\da-fA-F]{24})\#([\da-fA-F]{24})\#(\d+)/;
      if (html.match(replyReg)) {
        const match = html.match(replyReg);
        html = html.replace(pattern, `<a href="${`/d/${match[2]}/${indexToPage(this.replyTo.value)}#index-${this.replyTo.value}`}"><span class="reply-to" oncontextmenu="return false">${this.parentMemeber.username}</span></a>`);
        this.addPreviewEvents();
      }

      return html;
    },
    replaceMentionTag (html) {
      const members = this.$store.state.members;
      // 替换全文中出现的 mention
      return html.replace(/@([a-fA-F0-9]{24})/g, (match, id) => `<a href="/m/${id}"><span class="mention"> @${members[id] ? members[id].username : '无效用户'} </span></a>`);
    },
    addPreviewEvents () {
      if (!this.replyTo) {
        return;
      }
      this.$nextTick(() => {
        if (!this.$el) {
          return;
        }
        const replyTo = this.$el.querySelector('span.reply-to');
        replyTo.addEventListener('mouseover', () => {
          this.showReplyPreview();
        });
        replyTo.addEventListener('mouseout', () => {
          this.hideReplyPreview();
        });
      });
    },
  },
};
</script>

<style lang="scss">
@import '../styles/post-content.scss';
div.post-content {
  position: relative;
  box-sizing: border-box;

  div.reply-preview-wrapper {
    z-index: 100;
    height: 0;
    overflow: show;
    transition: all ease 0.2s;
  }

  $preview-height: 160px;
  div.reply-preview-container {
    width: fit-content;
    height: fit-content;
    max-height: 30vh;
    transform: translateY(calc(2px - 100%));
    background: white;
    box-shadow: 0px 0px 5px rgba(black, 0.5);
    padding: .8em 1em;
    box-sizing: border-box;
    border-radius: 5px;
    overflow-y: scroll;
  }

  div.reply-preview-member-meta {
    font-size: 12px;
    font-weight: 700;
    line-height: 12px;
    margin-bottom: 5px;
    display: flex;
    align-items: center;
    &::after {
      content: '：'
    }
  }

  div.reply-preview-content {
    padding: 0.5em 0;
  }

  $avatar-size: 20px;
  div.avatar, div.avatar-image {
    width: $avatar-size;
    height: $avatar-size;
    border-radius: 50%;
    margin-right: 5px;
  }
  div.avatar {
    display: inline-block;
  }
  div.avatar-image {
    background-size: cover;
  }
}
</style>

