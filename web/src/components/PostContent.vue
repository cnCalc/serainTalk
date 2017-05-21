<template lang="pug">
  div.post-content(v-html="html")
</template>

<script>
import config from '../config';

export default {
  name: 'post-content',
  props: ['content'],
  data () {
    return {
      html: '',
    };
  },
  created () {
    this.html = this.content;
    let attachments = this.html.match(/\[attach\](\d+)\[\/attach\]/ig);
    if (attachments === null) {
      // nothing to do, exit.
      return;
    }
    attachments
      .map(attachTag => Number(attachTag.match(/(\d+)/i)[1]))
      .forEach(this.injectAttachment);
  },
  methods: {
    injectAttachment (aid) {
      let url = `${config.api.url}${config.api.version}/attachment?aid=${aid}`;
      this.$http.get(url).then(res => {
        let attachment = res.body.attachment;
        if (!attachment || !attachment.path) {
          this.html = this.html.split(`[attach]${aid}[/attach]`).join('<a class="attachment invalid-attachment">无效附件</a>');
        } else if (attachment.path && attachment.path.match(/\.(jpg|jpeg|png|bmp)$/)) {
          this.html = this.html.split(`[attach]${aid}[/attach]`).join(`<img src="/uploads/attachment/forum/${attachment.path}"/>`);
        } else if (attachment.path) {
          this.html = this.html.split(`[attach]${aid}[/attach]`).join(`<a class="attachment" href="/uploads/attachment/forum/${attachment.path}" target="_blank" download="${attachment.filename}">[附件] ${attachment.filename}</a>`);
        }
      }, res => {
        this.html = this.html.split(`[attach]${aid}[/attach]`).join('<a class="attachment invalid-attachment">无效附件</a>');
      });
    }
  }
};
</script>

<style lang="scss">
div.post-content {
  img {
    max-width: 70%;
    // display: block;
  }
  .attachment {
    display: block;
  }
  .invalid-attachment {
    color: #d00 !important;
    cursor: not-allowed;
  }
}
</style>

