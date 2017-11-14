<template lang="pug">
  div.editor
    div.resize
    div.mode
      span(v-if="mode === 'CREATE_DISCUSSION'") 创建新讨论
      span(v-if="mode === 'REPLY_TO_INDEX'") 回复：{{ $store.state.editor.discussionTitle }} # {{ $store.state.editor.index }}
    div.row(v-if="mode === 'CREATE_DISCUSSION'")
      input(placeholder="输入标题", v-model="title")
      select(v-model="category")
        option(v-for="category in categories" :value="category.name") {{ category.name }}
    div.textarea
      textarea(placeholder="说些什么吧", v-model="content")
      div.preview.post-content(v-html="preview === '' ? '说些什么吧' : preview")
    div.footer
      button(@click="submit") 提交
      button(@click="hide") 隐藏窗口
</template>

<script>
import api from '../api';

const app = document.querySelector('div#app');
const hljs = window.hljs;
const md = window.markdownit({
  html: false,
  highlight (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return addSpanEachLine(hljs.highlight(lang, str.trim()).value);
      } catch (__) {}
    }

    return addSpanEachLine(str.trim());;
  }
});

function addSpanEachLine (html) {
  return html.split('\n').map(l => `<span class="__line">${l}</span>`).join('\n');
}

export default {
  name: 'editor',
  data () {
    return {
      preview: '',
      title: '',
      category: '',
      content: '',
    }
  },
  mounted () {
    const resize = document.querySelector('div.resize');
    const editor = document.querySelector('div.editor');
    const textarea = document.querySelector('textarea');
    const app = document.querySelector('#app');
    const dragStep = e => {
      const height = Math.max(window.innerHeight - Math.max(e.clientY - 6, 50), 180);
      editor.style.top = `${window.innerHeight - height}px`;
      app.style.marginBottom = `${height}px`;
    }
    const dragStop = e => {
      document.removeEventListener('mousemove', dragStep);
      document.removeEventListener('mouseup', dragStop);
      document.body.style.userSelect = '';
    }
    resize.addEventListener('mousedown', e => {
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', dragStep);
      document.addEventListener('mouseup', dragStop);
    });
    textarea.addEventListener('change', e => {
      this.updatePreview();
    })
    textarea.addEventListener('keyup', e => {
      this.updatePreview();
    })
  },
  computed: {
    mode () { return this.$store.state.editor.mode; },
    display () { return this.$store.state.editor.display; },
    categories () {
      return this.$store.state.categoriesGroup.reduce((a, b) => [...a, ...b.items], []).filter(c => c.type === 'category');
    }
  },
  watch: {
    display (val) {
      const editor = document.querySelector('div.editor');
      const app = document.querySelector('#app');

      editor.style.transition = 'all ease 0.2s';
      setTimeout(() => {
        editor.style.transition = '';
      }, 200);

      if (val === 'none') {
        app.style.marginBottom = '';
        editor.style.top = '100vh';
      } else {
        app.style.marginBottom = editor.style.top = '50vh';

        const editorState = this.$store.state.editor;
        const members = this.$store.state.members;

        if (editorState.index) {
          // 回复，加入默认@
          this.content = `@${editorState.memberId}#${editorState.discussionId}#${editorState.index}\n`;
          this.updatePreview();
        }
      }
    }
  },
  methods: {
    updatePreview () {
      const editorState = this.$store.state.editor;
      const members = this.$store.state.members;
      const replyReg = /^\@([\da-fA-F]{24})\#([\da-fA-F]{24})\#(\d+?)/;
      let preview = '';

      // 渲染 Markdown
      preview = md.render(this.content);

      // 将开头的回复代码渲染成一个 span
      if (this.content.match(replyReg)) {
        const match = this.content.match(replyReg);
        preview = preview.replace(`@${match[1]}#${match[2]}#${match[3]}`, `<span class="reply-to">${members[match[1]].username}</span>`)
      }

      this.preview = preview;

      // 让 KaTeX 自动渲染 DOM 中的公式
      this.$nextTick(() => {
        try {
          renderMathInElement(document.body);
        } catch (e) {
          // 渲染出错，大概率是用户打了一半没打完，直接忽略即可
        }
      });
    },
    maximum () {
      document.querySelector('div.editor').style.top = '50px';
    },
    hide () {
      this.$store.commit('updateEditorDisplay', 'none');
    },
    createDiscussion () {
      const payload = {
        title: this.title,
        category: this.category,
        content: {
          content: this.content,
          encoding: 'markdown',
        },
        tags: [],
      }
      api.v1.discussion.createDiscussion({ discussion: payload }).then(() => {
        // 成功创建，触发刷新事件，清空文本框并隐藏编辑器。
        // 此处先直接将浏览器刷新，不管后续了
        window.location.href = window.location.href;
      });
    },
    replyToIndex () {
      const editorState = this.$store.state.editor;
      api.v1.discussion.replyToDiscussion({
        id: editorState.discussionId,
        encoding: 'markdown',
        content: this.content,
        replyTo: {
          type: 'index',
          value: editorState.index
        }
      }).then(() => {
        // 同上
        window.location.href = window.location.href;
      });;
    },
    submit () {
      switch (this.mode) {
        case 'CREATE_DISCUSSION':
          this.createDiscussion();
          break;
        case 'REPLY_TO_INDEX':
          this.replyToIndex();
      }
    }
  }
};
</script>


<style lang="scss">
@import '../styles/global.scss';
@import '../styles/post-content.scss';

div.editor {
  position: absolute;
  bottom: 0;
  top: 100vh;
  left: 0;
  right: 0;
  background: #eee;
  z-index: 100;
  pointer-events: all;
  padding-right: 30px;
  text-align: left;
  padding: 0 20px 0 20px;
  display: flex;
  flex-direction: column;

  div.resize {
    width: 80px;
    height: 2px;
    border-top: 1px solid #888;
    border-bottom: 1px solid #888;
    margin: 5px auto;
    cursor: row-resize;
  }

  div.mode {
    font-size: 0.9em;
    color: $theme_color;
    margin: 4px 0;
  }

  div.row {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
  }

  input, select, textarea {    
    margin-right: 10px;
    box-sizing: border-box;
    background-color: white;
    border: 1px solid mix($theme_color, white, 50%);
    transition: all ease 0.2s;
    border-radius: 2px;
  }

  input, select {
    height: 2.2em;
    width: 300px;
  }

  textarea, div.preview {
    width: 50%;
    resize: none;
    padding: 5px;
    overflow-y: auto;
    font-size: 14px;
  }

  div.preview {
    background-color: white;
    border: 1px dashed grey;
  }

  input:focus, select:focus, textarea:focus  {
    outline: none;
    box-shadow: 0 0 3px mix($theme_color, rgba(0, 0, 0, 0), 70%);
  }

  div.row > input {
    padding-left: 0.5em;
    padding-right: 0.5em;
  }

  div.control-row {
    text-align: right;
  }

  div.textarea {
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
  }

  div.footer {
    margin: 13px 0;

    button {
      margin-right: 1em;
    }
  }
}
</style>