<template lang="pug">
  div.editor(v-bind:class="{ mini: display === 'mini' }")
    div.resize(v-show="display !== 'mini'")
    div.mode(v-text="editorTitle" @click="recover")
    div.row(v-if="state.mode === 'CREATE_DISCUSSION'")
      input(placeholder="输入标题", v-model="title")
      select(v-model="category")
        option(v-for="category in categories" :value="category.name") {{ category.name }}
    div.row(v-if="isAdmin")
      span 排版语言：
      select(v-model="lang")
        option(value="html") HTML
        option(value="markdown") Markdown
    div.textarea
      div.mention-wrapper(v-if="!showPreview")
        div.mention-dropdown(v-bind:style="dropdownStyle")
          input(type="text", autocomplete="off", class="mention-filter", v-model="mentionFilter", @keydown="filterKeyDown($event)", placeholder="用户名")
          div.mention-list
            div.option-list-item(v-for="(option, index) in options" 
                                v-bind:class="{ 'highlight': index === dropdownFocus }"
                                @click="filterInsert(index)"
                                :key="option") {{ option }}
        textarea.scrollable(placeholder="说些什么吧", v-model="content", :disabled="!editable" @keydown="handleInput" v-on:mousewheel="scrollHelper")
      div.preview.post-content.scrollable(v-else v-html="preview === '' ? '说些什么吧' : preview" v-on:mousewheel="scrollHelper")
    div.footer
      button(@click="submit") 提交
      button(@click="close") 关闭
      button(@click="minimum") 最小化
      button(@click="togglePreview") 切换预览
</template>

<script>
import api from '../api';
import getCaretCoordinates from '../utils/textarea-caret-coordinates';
import bus from '../utils/ws-eventbus';
import { indexToPage } from '../utils/filters';

const hljs = window.hljs;
const md = window.markdownit({
  html: false,
  linkify: true,
  highlight (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return addSpanEachLine(hljs.highlight(lang, str.trim()).value);
      } catch (__) {}
    }

    return addSpanEachLine(str.trim());
  },
});

function addSpanEachLine (html) {
  return html.split('\n').map(l => `<span class="__line">${l}</span>`).join('\n');
}

// @<Member ID>#<Discussion ID>#<Post Index>
const replyReg = /^\@([\da-fA-F]{24})\#([\da-fA-F]{24})\#(\d+)/;

export default {
  name: 'editor',
  data () {
    return {
      preview: '',
      title: '',
      category: '',
      content: '',
      state: {},
      showPreview: false,
      editable: true,
      lang: 'markdown',
      dropdownStyle: {
        top: 0,
        left: 0,
        opacity: 0,
        pointerEvents: 'none',
      },
      mentionFilter: '',
      options: [],
      dropdownFocus: 0,
      apiTimeoutId: null,
    };
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
    };
    const dragStop = e => {
      document.removeEventListener('mousemove', dragStep);
      document.removeEventListener('mouseup', dragStop);
      document.body.style.userSelect = '';
    };
    resize.addEventListener('mousedown', e => {
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', dragStep);
      document.addEventListener('mouseup', dragStop);
    });
    textarea.addEventListener('change', e => {
      this.updatePreview();
    });
    textarea.addEventListener('keyup', e => {
      this.updatePreview();
    });
  },
  computed: {
    mode () {
      return this.$store.state.editor.mode;
    },
    display () {
      return this.$store.state.editor.display;
    },
    categories () {
      return this.$store.state.categoriesGroup.reduce((a, b) => [...a, ...b.items], []).filter(c => c.type === 'category');
    },
    editorTitle () {
      if (this.state.mode === 'CREATE_DISCUSSION') {
        return '创建新讨论' + (this.title.length > 0 ? `：${this.title}` : '');
      } else if (this.state.mode === 'REPLY_TO_INDEX') {
        return `回复：${this.state.discussionTitle} # ${this.state.index}`;
      } else if (this.state.mode === 'REPLY') {
        return `回复：${this.state.discussionTitle}`;
      } else if (this.state.mode === 'EDIT_POST') {
        return '编辑内容';
      }
    },
    isAdmin () {
      return !!(this.$store.state.me && this.$store.state.me.role === 'admin');
    },
  },
  watch: {
    display (val, oldVal) {
      const editor = document.querySelector('div.editor');
      const app = document.querySelector('#app');

      editor.style.transition = 'all ease 0.2s';
      setTimeout(() => {
        editor.style.transition = '';
      }, 200);

      if (val === 'none') {
        app.style.marginBottom = '';
        editor.style.top = '100vh';

        this.content = '';
        this.category = '';
        this.title = '';
        this.typed = false;
        this.state = {};

        this.updatePreview();
      } else if (val === 'mini') {
        app.style.marginBottom = 'calc(1em + 12px)';
        editor.style.top = 'calc(100vh - 1em - 12px)';
      } else {
        app.style.marginBottom = editor.style.top = '50vh';

        const editorState = Object.assign({}, this.$store.state.editor);
        let flush = false;

        for (let key of Object.keys(this.$store.state.editor)) {
          if (this.state[key] !== editorState[key]) {
            flush = true;
            break;
          }
        }

        if (flush) {
          this.state = editorState;
          if (this.state.mode === 'EDIT_POST') {
            this.editable = false;
            this.preview = this.content = '正在获取内容，请稍等……';
            api.v1.discussion.fetchDiscussionPostByIdAndIndex({ raw: true, index: this.state.index, id: this.state.discussionId }).then(response => {
              this.editable = true;
              this.content = response.post.content;
              this.updatePreview();
            });
            return;
          }
          if (editorState.index) {
            // 回复，加入默认@
            this.content = `@${editorState.memberId}#${editorState.discussionId}#${editorState.index}\n`;
            this.updatePreview();
          }
        }
      }
    },
    mentionFilter (filter, oldFilter) {
      this.updateOptions(filter, oldFilter);
    },
  },
  methods: {
    filterKeyDown (event) {
      const textarea = this.$el.querySelector('textarea');
      if (event.keyCode === 27) { // ESC key
        event.preventDefault();
        this.filterCleanUp();
        textarea.focus();
      } else if (event.keyCode === 40) { // DOWN key
        event.preventDefault();
        if (this.dropdownFocus === undefined) {
          this.dropdownFocus = 0;
        } else {
          this.dropdownFocus++;
        }
        if (this.dropdownFocus >= this.options.length) {
          this.dropdownFocus = 0;
        }
      } else if (event.keyCode === 38) { // UP key
        event.preventDefault();
        if (this.dropdownFocus === undefined) {
          this.dropdownFocus = this.options.length - 1;
        } else {
          this.dropdownFocus--;
        }
        if (this.dropdownFocus < 0) {
          this.dropdownFocus = this.options.length - 1;
        }
      } else if (event.keyCode === 13 || event.keyCode === 9) { // ENTER key or TAB key
        event.preventDefault();
        event.preventDefault();
        this.filterInsert(this.dropdownFocus);
      } else {
        if (this.options.length >= 1) {
          this.dropdownFocus = 0;
        } else {
          this.dropdownFocus = undefined;
        }
      }
    },
    filterInsert (index) {
      const textarea = this.$el.querySelector('textarea');
      let selected;
      if (index === undefined) {
        selected = this.mentionFilter;
      } else {
        let matchedUser = Object.keys(this.$store.state.members).filter(id => this.$store.state.members[id].username === this.options[index]);
        if (matchedUser.length === 1) {
          selected = matchedUser[0];
        } else {
          selected = this.mentionFilter;
        }
      }
      const begin = textarea.selectionStart;
      const end = textarea.selectionEnd;
      this.content = this.content.substring(0, begin) + selected + ' ' + this.content.substring(end);
      this.filterCleanUp();
      textarea.focus();
      this.$nextTick(() => {
        textarea.setSelectionRange(begin + selected.length + 1, begin + selected.length + 1);
        this.updatePreview();
      });
      this.dropdownFocus = undefined;
    },
    handleInput (event) {
      if (event.key === '@') {
        const textarea = this.$el.querySelector('textarea');
        this.$nextTick(() => {
          const position = getCaretCoordinates(textarea, textarea.selectionEnd);
          console.log(textarea.scrollTop);
          this.dropdownStyle.top = `${position.top - textarea.scrollTop}px`;
          this.dropdownStyle.left = position.left + 'px';
          this.dropdownStyle.opacity = 1;
          this.dropdownStyle.pointerEvents = '';
          this.$el.querySelector('input.mention-filter').focus();
          this.dropdownFocus = 0;
          this.updateOptions();
        });
      }
    },
    updateOptions (filter, oldFilter) {
      if (!filter || filter.length === 0) {
        const { members } = this.$store.state;
        this.options = Object.keys(members).map(id => members[id].username);
        this.options.sort();
        this.options = this.options.slice(0, 10);
      } else {
        if (this.apiTimeoutId) {
          window.clearTimeout(this.apiTimeoutId);
        }
        this.apiTimeoutId = window.setTimeout(() => {
          api.v1.member.fetchMemberWithLeadingString({ leadingString: filter })
            .then(res => {
              const { members } = res;
              let memberMap = {};
              members.forEach(member => {
                memberMap[member._id] = member;
                delete member._id;
              });
              this.$store.commit('mergeMembers', memberMap);
              this.options = Object.keys(memberMap).map(id => memberMap[id].username);
              this.options.sort();
              this.options = this.options.slice(0, 10);
            });
        }, 500);
      }
    },
    filterCleanUp () {
      this.dropdownStyle = {
        top: 0,
        left: 0,
        opacity: 0,
        pointerEvents: 'none',
      };
      this.dropdownFocus = undefined;
      this.mentionFilter = '';
    },
    updatePreview () {
      if (!this.showPreview) {
        return;
      }
      const members = this.$store.state.members;
      let preview = '';

      if (this.isAdmin && this.lang === 'html') {
        preview = this.content;
      } else {
        // 渲染 Markdown
        preview = md.render(this.content);
      }

      // 将开头的回复代码渲染成一个 span
      if (this.content.match(replyReg)) {
        const match = this.content.match(replyReg);
        preview = preview.replace(`@${match[1]}#${match[2]}#${match[3]}`, `<span class="reply-to">${members[match[1]].username}</span>`);
      }

      // 替换全文中出现的 mention
      preview = preview.replace(/@([a-fA-F0-9]{24})/g, (match, id) => `<span class="mention"> @${members[id] ? members[id].username : '无效用户'} </span>`);

      this.preview = preview;

      // 让 KaTeX 自动渲染 DOM 中的公式
      this.$nextTick(() => {
        try {
          window.renderMathInElement(this.$el);
        } catch (e) {
          // 渲染出错，大概率是用户打了一半没打完，直接忽略即可
        }
      });
    },
    maximum () {
      document.querySelector('div.editor').style.top = '50px';
    },
    minimum () {
      this.$store.commit('updateEditorDisplay', 'mini');
    },
    recover () {
      this.display === 'mini' && this.$store.commit('updateEditorDisplay', 'show');
    },
    close () {
      if (this.content.length === 0 || window.confirm('Are you sure you want to abandon your post?')) {
        this.$store.commit('updateEditorDisplay', 'none');
      }
    },
    togglePreview () {
      this.showPreview = !this.showPreview;
      this.updatePreview();
    },
    errorHandler (error) {
      if (document.cookie.indexOf('membertoken') < 0) {
        bus.$emit('notification', {
          type: 'error',
          body: '游客无法执行此操作，请登录后再继续。',
        });
      } else {
        console.error(error);
        bus.$emit('notification', {
          type: 'error',
          body: '服务器发生异常，查看 JavaScript 控制台以查看详情。',
        });
      }
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
      };
      api.v1.discussion.createDiscussion({ discussion: payload }).then(() => {
        // 成功创建，触发刷新事件，清空文本框并隐藏编辑器。
        // 此处先直接将浏览器刷新，不管后续了
        window.location.reload();
      }).catch(this.errorHandler);
    },
    replyToIndex () {
      const editorState = this.$store.state.editor;
      const matched = this.content.match(replyReg);
      const payload = {
        id: editorState.discussionId,
        encoding: 'markdown',
        content: this.content,
      };

      if (matched) {
        payload.replyTo = {
          type: 'index',
          value: matched[3],
          memberId: matched[1],
        };
      }

      api.v1.discussion.replyToDiscussion(payload).then(res => {
        bus.$emit('reloadDiscussionView');
        this.$router.push(`/d/${this.$route.params.discussionId}/${indexToPage(res.newPost.index)}#index-${res.newPost.index}`);
        this.$store.commit('updateEditorDisplay', 'none');
      }).catch(this.errorHandler);
    },
    reply () {
      const editorState = this.$store.state.editor;
      api.v1.discussion.replyToDiscussion({
        id: editorState.discussionId,
        encoding: 'markdown',
        content: this.content,
      }).then(res => {
        bus.$emit('reloadDiscussionView');
        this.$router.push(`/d/${this.$route.params.discussionId}/${indexToPage(res.newPost.index)}#index-${res.newPost.index}`);
        this.$store.commit('updateEditorDisplay', 'none');
      }).catch(this.errorHandler);
    },
    update () {
      const editorState = this.$store.state.editor;
      const matched = this.content.match(replyReg);
      const payload = {
        id: editorState.discussionId,
        index: editorState.index,
        encoding: 'markdown',
        content: this.content,
      };

      if (matched) {
        payload.replyTo = {
          type: 'index',
          value: matched[3],
          memberId: matched[1],
        };
      }

      api.v1.discussion.updateDiscussionPostByIdAndIndex(payload).then(() => {
        // 同上
        this.$store.dispatch('updateSingleDiscussionPost', { id: this.$store.state.discussionMeta._id, index: editorState.index, raw: false });
        this.$store.commit('updateEditorDisplay', 'none');
      }).catch(this.errorHandler);
    },
    submit () {
      switch (this.mode) {
        case 'CREATE_DISCUSSION':
          this.createDiscussion();
          break;
        case 'REPLY_TO_INDEX':
          this.replyToIndex();
          break;
        case 'REPLY':
          this.reply();
          break;
        case 'EDIT_POST':
          this.update();
          break;
      }
    },
    scrollHelper (e) {
      e.stopPropagation();

      let node = e.target;
      while (node && node.className.indexOf('scrollable') === -1) {
        node = node.parentElement;
      }
      if (!node) {
        return;
      }
      const delta = e.wheelDelta || e.detail || e.deltaY;

      if (node.scrollTop === 0 && delta > 0) {
        e.preventDefault();
        return false;
      } else if (node.clientHeight + node.scrollTop >= node.scrollHeight && delta < 0) {
        e.preventDefault();
        return false;
      }
    },

  },
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
  pointer-events: all;
  padding-right: 30px;
  text-align: left;
  padding: 0 20px 0 20px;
  display: flex;
  flex-direction: column;

  &.mini {
    background-color: $theme_color;
    cursor: pointer;
    opacity: 0.9;
    .mode {
      color: white;
    }
  }

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

  textarea {
    font-family: monospace;
  }

  div.mention-wrapper, div.preview {
    flex-grow: 1;
    width: 100%;
    resize: none;
    padding: 5px;
    overflow-y: auto;
    font-size: 14px;
    overflow: inherit;
  }

  div.preview {
    background-color: white;
    border: 1px dashed grey;
    overflow-y: scroll;
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
    // overflow: hidden;
    min-height: 0;
  }

  div.mention-wrapper {
    position: relative;
    padding-right: 10px;

    textarea {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      padding: 0.5em;
      box-sizing: border-box;
      resize: none;
    }

    div.mention-dropdown {
      position: absolute;
      z-index: 2;
      border: 1px solid mix($theme_color, white, 50%);
      background: white;
      box-shadow: 0 0 3px mix($theme_color, rgba(0, 0, 0, 0), 70%);

      input {
        border: none;
        box-shadow: none;
        font-size: 12px;
        height: 14px;
        line-height: 14px;
      }
    }

    div.option-list-item {
      padding: 0 0.2em;
      cursor: pointer;
    }

    .highlight {
      background-color: mix($theme_color, white, 20%);
    }

    div.option-list-item:not(.highlight):hover {
      background-color: mix($theme_color, white, 8%);
    }
  }

  div.footer {
    margin: 13px 0;

    button {
      margin-right: 1em;
    }
  }
}
</style>
