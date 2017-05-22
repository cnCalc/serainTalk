<template lang="pug">
  div.post-content(v-html="html")
</template>

<script>
import config from '../config';

export default {
  name: 'post-content',
  props: ['content', 'noattach'],
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
      if (this.noattach) {
        this.html = this.html.split(`[attach]${aid}[/attach]`).join('');
      } else {
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
  br {
      content: "";
      margin: 2em;
      display: block;
      font-size: 24%;
  }

  blockquote {
    margin: 0;
    padding: 9px 16px 9px 16px;
    border-radius: 5px;
    font-size: 0.95em;
    line-height: 1.5em;
    color: #999;
    br {
      margin: 0em;
    }
  }

  p {
    margin-top: 0.35em;
    margin-bottom: 0.35em;
  }
  table { 
      border-spacing: 0;
      border-collapse: collapse;
  }
  td {
    border-spacing: 0px;
    padding: 5px;
    text-align: center;
  }
  a {
    transition: all linear 0.3s;
  }
  a:hover {
    text-decoration: underline;
  }
  pre.code {
    font-family: Consolas, Courier New, Courier, monospace;
    font-size: 0.9em;
    line-height: 0.9em;
    padding: 0.3em 1em 0.3em 1em;
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.1);
  }
}
</style>

