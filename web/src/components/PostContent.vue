<template lang="pug">
  div.post-content(v-html="html")
</template>

<script>
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
    this.html = this.content;
  },
  watch: {
    content () {
      this.html = this.content;
    }
  },
  methods: {
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
    line-height: 1.2em;
    padding: 0.3em 1em 0.3em 1em;
    border-radius: 4px;
    background-color: rgba(0, 0, 0, 0.1);
    position: relative;
    overflow-x: scroll;
  }
}
</style>

