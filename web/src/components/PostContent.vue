<template lang="pug">
  div.post-content(v-html="html")
</template>

<script>
import { indexToPage } from '../utils/filters';

export default {
  name: 'post-content',
  props: ['content', 'noattach', 'reply-to'],
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
      const replyReg = /\@([\da-fA-F]{24})\#([\da-fA-F]{24})\#(\d+?)/;
      if (html.match(replyReg)) {
        const match = html.match(replyReg);
        html = html.replace(`@${match[1]}#${match[2]}#${match[3]}`, `<a href="${`/d/${match[2]}/${indexToPage(match[3])}#index-${match[3]}`}"><span class="reply-to">${(this.$store.state.members[match[1]] || { username: 'TODO'}).username}</span></a>`)
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
          renderMathInElement(this.$el);
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

