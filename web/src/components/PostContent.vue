<template lang="pug">
  div.post-content(v-html="html")
</template>

<script>
import { indexToPage } from '../utils/filters';

export default {
  name: 'post-content',
  props: ['content', 'noattach', 'reply-to', 'discussion-id'],
  data () {
    return {
      html: '',
      attachmentMap: {},
      loaded: false,
    };
  },
  created () {
    this.html = this.replaceReplyTag(this.content);
  },
  methods: {
    replaceReplyTag (html) {
      if (!this.replyTo) {
        return html;
      }
      const pattern = `@${this.replyTo.memberId}#${this.discussionId || this.$store.state.discussionMeta._id}#${this.replyTo.value}`;
      console.log(pattern);
      const replyReg = /\@([\da-fA-F]{24})\#([\da-fA-F]{24})\#(\d+?)/;
      if (html.match(replyReg)) {
        const match = html.match(replyReg);
        html = html.replace(pattern, `<a href="${`/d/${match[2]}/${indexToPage(this.replyTo.value)}#index-${this.replyTo.value}`}"><span class="reply-to">${this.$store.state.members[this.replyTo.memberId].username}</span></a>`);
      }
      return html;
    }
  },
  watch: {
    content () {
      this.html = this.replaceReplyTag(this.content);
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
    }
  }
};
</script>

<style lang="scss">
@import '../styles/post-content.scss';
</style>

