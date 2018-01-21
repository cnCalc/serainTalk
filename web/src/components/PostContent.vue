<template lang="pug">
  div.post-content
    div.reply-preview-wrapper(v-if="this.replyTo" :id="pattern" v-bind:style="{ opacity: preview ? 1 : 0, pointerEvents: preview ? '' : 'none' }" v-on:mouseover="preview = true" v-on:mouseout="preview = false")
      div.reply-preview-container
        div.reply-preview-member-meta
          div.avatar
            div.avatar-image(v-if="this.$store.state.members[this.replyTo.memberId].avatar" v-bind:style="{ backgroundImage: `url(${this.$store.state.members[this.replyTo.memberId].avatar})` }")
          div: router-link(:to="`/m/${this.replyTo.memberId}`") {{ this.$store.state.members[this.replyTo.memberId].username }}
        div.reply-preview-content(v-html="previewReplyHtml")
    div(v-html="html")
</template>

<script>
import { indexToPage } from '../utils/filters';
import api from '../api';

export default {
  name: 'post-content',
  props: ['content', 'noattach', 'reply-to', 'discussion-id'],
  data () {
    return {
      html: '',
      previewReplyHtml: '',
      preview: false,
      previewLoaded: false,
      attachmentMap: {},
      loaded: false,
    };
  },
  created () {
    this.html = this.replaceReplyTag(this.content);
  },
  computed: {
    pattern () {
      return `@${this.replyTo.memberId}#${this.discussionId || this.$store.state.discussionMeta._id}#${this.replyTo.value}`;
    },
  },
  methods: {
    replaceReplyTag (html) {
      if (!this.replyTo) {
        return html;
      }
      const pattern = this.pattern;
      const replyReg = /\@([\da-fA-F]{24})\#([\da-fA-F]{24})\#(\d+?)/;
      if (html.match(replyReg)) {
        const match = html.match(replyReg);
        html = html.replace(pattern, `<a href="${`/d/${match[2]}/${indexToPage(this.replyTo.value)}#index-${this.replyTo.value}`}"><span class="reply-to">${this.$store.state.members[this.replyTo.memberId].username}</span></a>`);

        this.$nextTick(() => {
          const replyTo = this.$el.querySelector('span.reply-to');
          replyTo.addEventListener('mouseover', () => {
            this.preview = true;
          });
          replyTo.addEventListener('mouseout', () => {
            this.preview = false;
          });
        });
      }

      return html;
    },
  },
  watch: {
    content () {
      this.html = this.replaceReplyTag(this.content);
    },
    preview () {
      if (!this.previewLoaded) {
        this.previewReplyHtml = 'Loading...';
        api.v1.discussion.fetchDiscussionPostByIdAndIndex({ id: this.discussionId || this.$store.state.discussionMeta._id, index: this.replyTo.value }).then(response => {
          this.previewLoaded = true;
          this.previewReplyHtml = response.post.content.replace(/\@([\da-fA-F]{24})\#([\da-fA-F]{24})\#(\d+?)/, '');
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
};
</script>

<style lang="scss">
@import '../styles/post-content.scss';
div.post-content {
  position: relative;

  div.reply-preview-wrapper {
    width: 100%;
    position: absolute;
    z-index: 1;
    height: 0;
    overflow: show;
    transition: all ease 0.2s;
  }

  $preview-height: 160px;
  div.reply-preview-container {
    width: 80%;
    height: fit-content;
    transform: translateY(calc(2px - 100%));
    background: white;
    box-shadow: 1px 1px 10px rgba(black, 0.5);
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

