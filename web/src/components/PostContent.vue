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
      attachmentMap: {},
      loaded: false,
    };
  },
  created () {
    // this.html = this.content; return;
    let html = this.content;
    let attachments = html.match(/<attach>(\d+)<\/attach>/ig);
    if (attachments === null) {
      // nothing to do, exit.
      this.html = html;
      this.loaded = true;
      return;
    }
    attachments = attachments.map(attachTag => Number(attachTag.match(/(\d+)/i)[1]));
    Promise.all(attachments.map(aid => this.attachmentFactory(aid))).then(() => {
      attachments.forEach(aid => {
        html = html.split(`<attach>${aid}<\/attach>`).join(this.attachmentMap[aid]);
      });
      this.html = html;
      this.loaded = true;
    })
  },
  methods: {
    attachmentFactory (aid) {
      return new Promise((resolve, reject) => {
        let url = `${config.api.url}${config.api.version}/attachment?aid=${aid}`;
        this.$http.get(url).then(res => {
          let attachment = res.body.attachment;
          if (!attachment || !attachment.path) {
            this.attachmentMap[aid] = '<a class="attachment invalid-attachment">无效附件</a>'
          } else if (attachment.path && attachment.path.match(/\.(jpg|jpeg|png|bmp)$/)){
            this.attachmentMap[aid] = `<img src="/uploads/attachment/forum/${attachment.path}"/>`
          } else if (attachment.path) {
            this.attachmentMap[aid] = `<a class="attachment" href="/uploads/attachment/forum/${attachment.path}" target="_blank" download="${attachment.filename}">[附件] ${attachment.filename}</a>`;
          } else {
            this.attachmentMap[aid] = '<a class="attachment invalid-attachment">无效附件</a>'
          }
          resolve();
        }, res => {
          this.attachmentMap[aid] = '<a class="attachment invalid-attachment">无效附件</a>'
          resolve();
        });
      });
    }
  }
};
</script>

<style lang="scss">
div.post-content {
  img {
    max-width: 70%;
    // height: 400px;
    // display: block;
  }

  .attachment {
    display: block;
  }

  .invalid-attachment {
    color: #d00 !important;
    cursor: not-allowed;
  }

  // br {
  //     content: "";
  //     margin: 2em;
  //     display: block;
  //     font-size: 24%;
  // }

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

  attach, inject {
    display: none;
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

