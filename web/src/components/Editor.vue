<template lang="pug">
  div.editor(v-show="display !== 'none'")
    div.resize
    div.mode
      span(v-if="mode === 'CREATE_DISCUSSION'") 创建新讨论
    div.row
      input(placeholder="输入标题")
      select
        option(v-for="category in categories") {{ category.name }}
    div.textarea
      textarea(placeholder="说些什么吧")
      div.preview(v-html="preview === '' ? '说些什么吧' : preview")
    div.footer
      button 提交
      button(@click="hide") 隐藏窗口
</template>

<script>
export default {
  name: 'editor',
  data () {
    return {
      preview: '',
    }
  },
  mounted () {
    const resize = document.querySelector('div.resize');
    const editor = document.querySelector('div.editor');
    const textarea = document.querySelector('textarea');
    const md = window.markdownit({ html: false });
    const dragStep = e => {
      editor.style.top = `${Math.max(e.clientY - 6, 50)}px`;
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
      this.preview = md.render(e.target.value);
    })
    textarea.addEventListener('keyup', e => {
      this.preview = md.render(e.target.value);
    })    
  },
  computed: {
    mode () { return this.$store.state.editor.mode; },
    display () { return this.$store.state.editor.display; },
    categories () {
      return this.$store.state.categoriesGroup.reduce((a, b) => [...a, ...b.items], []).filter(c => c.type === 'category');
    }
  },
  methods: {
    maximum () {
      document.querySelector('div.editor').style.top = '50px';
    },
    hide () {
      this.$store.commit('updateEditorDisplay', 'none');
    }
  }
};
</script>


<style lang="scss">
@import '../styles/global.scss';

div.editor {
  position: absolute;
  bottom: 0;
  top: 50vh;
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
