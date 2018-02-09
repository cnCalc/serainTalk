<template lang="pug">
  div.message
    div.left-sessions(v-bind:class="{ 'hide-on-mobile': activeSession}")
      h2 消息列表
      ul.session-list
        li(v-for="session in sessions" @click="$router.push(`/message/${session._id}`)" v-bind:class="{ active: session._id == activeSession }")
          template
            div.avatar(v-if="members[session.peer].avatar !== null" v-bind:style="{ backgroundImage: `url(${members[session.peer].avatar})` }")
            div.avatar.fallback(v-else) {{ (members[session.peer].username || '?').substr(0, 1).toUpperCase() }}
          span.username {{ members[session.peer].username }}
    div.right-messages(v-if="session._id !== undefined && activeSession === session._id" v-bind:class="{ 'hide-on-mobile': !activeSession }")
      h2 {{ members[session.peer].username }}
      div.message-session-view(v-if="activeSession !== null")
        ul.message-list
          li(v-for="(message, index) in session.timeline")
            div.time(v-if="session.timeline[index + 1] === undefined || message.from !== session.timeline[index + 1].from") {{ new Date(message.date).toLocaleDateString() }} {{ new Date(message.date).toLocaleTimeString() }}
            div.message-item(v-bind:class="{ 'is-peer': message.from !== me._id }")
              div.avatar-wrapper(v-bind:style="{ opacity: (session.timeline[index - 1] === undefined || message.from !== session.timeline[index - 1].from) ? 1 : 0,  }")
                div.avatar(v-if="members[message.from].avatar !== null" v-bind:style="{ backgroundImage: `url(${members[message.from].avatar})` }")
                div.avatar.fallback(v-else) {{ (members[message.from].username || '?').substr(0, 1).toUpperCase() }}
              div.message-content {{ message.content }}
          template(v-if="!busy")
            li.load-more(v-if="session.canLoadMore" @click="loadMore()") 查看更多历史消息
            li.no-more(v-else) 没有更多消息
          li.loading(v-else) 正在加载……
      div.textbox: form(v-on:submit.prevent="sendMessage" style="width: 100%;")
        input(placeholder="回车键发送", v-model="newMessage", :disabled="busy")
    div.other-info.hide-on-mobile(v-else)
      loading-icon(v-if="busy")
      div(v-else) 从左侧选择一个以开始。
</template>

<script>
import api from '../api';
import LoadingIcon from '../components/LoadingIcon.vue';
import titleMixin from '../mixins/title';

import bus from '../utils/ws-eventbus';

export default {
  name: 'message-view',
  components: { LoadingIcon },
  mixins: [titleMixin],
  data () {
    return {
      sessions: [],
      session: {},
      activeSession: null,
      busy: false,
      newMessage: '',
    };
  },
  title () {
    if (!this.activeSession) {
      return '站内信';
    } else {
      return `与 ${this.members[this.session.peer].username} 的会话`;
    }
  },
  created () {
    this.updateTitle();
    this.loadSessions().then(() => {
      if (this.$route.params.messageId) {
        this.activeSession = this.$route.params.messageId;
      }
    });
    this.$store.commit('setGlobalTitles', []);
    bus.$on('message', payload => {
      let id = payload.messageId;
      if (id === this.activeSession) {
        this.busy = true;
        let after = this.session.timeline[0].date;
        api.v1.message.fetchMessageSessionById({ id: this.activeSession, after }).then(res => {
          this.busy = false;
          let el = this.$el.querySelector('.message-session-view');
          this.session.timeline = [...res.message.timeline, ...this.session.timeline];
          this.$nextTick(() => {
            el.scrollTop = el.scrollHeight;
          });
        });
      }
    });
  },
  computed: {
    members () {
      return this.$store.state.members;
    },
    me () {
      return this.$store.state.me;
    },
  },
  methods: {
    loadSessions () {
      return api.v1.message.fetchMessageSessions().then(res => {
        this.$store.commit('mergeMembers', res.members);
        this.sessions = res.messagesInfo.map(el => {
          el.peer = this.getPeer(el.members);
          return el;
        });
      }).catch(() => {
        return bus.$emit('notification', { type: 'error', body: '游客无法访问此页面，请登录后再继续。' });
      });
    },
    getPeer (members) {
      return members.filter(id => id !== this.me._id)[0];
    },
    loadMore () {
      let before = this.session.timeline[this.session.timeline.length - 1].date;
      this.busy = true;
      api.v1.message.fetchMessageSessionById({ id: this.activeSession, before }).then(res => {
        if (res.message.timeline.length < 10) {
          this.session.canLoadMore = false;
        }
        let el = this.$el.querySelector('.message-session-view');
        let recordHeight = el.scrollHeight - el.scrollTop;
        this.session.timeline = [...this.session.timeline, ...res.message.timeline];
        this.$nextTick(() => {
          this.busy = false;
          el.scrollTop = el.scrollHeight - recordHeight;
        });
      });
    },
    sendMessage () {
      if (this.busy) {
        return bus.$emit('notification', { type: 'error', body: '上一次发送未完成，请稍后再试……' });
      }

      this.busy = true;

      if (this.newMessage === '') {
        return bus.$emit('notification', { type: 'error', body: '内容不能为空' });
      }

      api.v1.message.sendNewMessage({
        id: this.session.peer,
        content: this.newMessage,
      }).then(() => {
        this.newMessage = '';
        let after = this.session.timeline[0].date;
        return api.v1.message.fetchMessageSessionById({ id: this.activeSession, after });
      }).then(res => {
        this.busy = false;
        let el = this.$el.querySelector('.message-session-view');
        this.session.timeline = [...res.message.timeline, ...this.session.timeline];
        this.$nextTick(() => {
          this.busy = false;
          el.scrollTop = el.scrollHeight;
        });
      });
    },
  },
  beforeDestroy () {
    this.$store.commit('updateMessageSession', null);
  },
  watch: {
    '$route': function () {
      if (this.$route.params.messageId !== this.activeSession) {
        this.activeSession = this.$route.params.messageId;
      }
    },
    busy (val) {
      if (!val) {
        const input = this.$el.querySelector('input');
        if (input) {
          this.$nextTick(() => {
            input.focus();
          });
        }
      }
    },
    activeSession (id) {
      if (!id) {
        return;
      }
      this.busy = true;
      api.v1.message.fetchMessageSessionById({ id }).then(res => {
        this.session = res.message;
        this.session.canLoadMore = true;
        this.session.peer = this.getPeer(this.session.members);
        if (this.session.timeline.length < 10) {
          this.session.canLoadMore = false;
        }
        this.$store.commit('updateMessageSession', id);
        this.updateTitle();
        this.$nextTick(() => {
          this.busy = false;
          let el = this.$el.querySelector('.message-session-view');
          el.scrollTop = el.scrollHeight;
        });
      });
    },
  },
};
</script>


<style lang="scss">
@import '../styles/global.scss';

div.message {
  display: flex;
  height: calc(100vh - 50px);
  text-align: left;
  box-sizing: border-box;
  
  > * {
    min-width: 0;
  }

  h2 {
    font-size: 16px;
    margin: 0;
    padding: 0.2em 0.5em;
    text-align: center;
    user-select: none;
    line-height: 2em;
    font-weight: bold;
  }

  div.other-info {
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-content: space-around;
    font-size: 1.5em;
  }

  .left-sessions {
    user-select: none;
    @include respond-to(laptop) {
      width: 280px;
    }
    @include respond-to(tablet) {
      width: 280px;
    }
    @include respond-to(phone) {
      width: 100%;
    }
    flex-grow: 0;
    flex-shrink: 0;
    height: 100%;
    overflow-y: hidden;
    display: flex;
    flex-direction: column;

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
      overflow-y: scroll;
    }

    li {
      padding: 10px;
      cursor: pointer;
      transition: all ease 0.2s;

      > * {
        vertical-align: middle;
      }
    }

    div.avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-size: cover;
      display: inline-block;
      &.fallback {
        font-size: 22px;
        line-height: 50px;
        text-align: center;
      }
    }
    span.username {
      margin-left: 10px;
    }
  }

  div.right-messages {
    flex-grow: 1;
    flex-shrink: 1;
    display: flex;
    flex-direction: column;

    div.message-session-view {
      min-height: 0;
      flex-grow: 1;
      flex-shrink: 1;
      overflow-y: scroll;
    }

    div.textbox {
      height: 48px;
      flex-grow: 0;
      flex-shrink: 0;
      display: flex;

      input {
        border: none;
        box-sizing: border-box;
        vertical-align: top;
        height: 100%;
        width: 100%;
        padding: 0 1em;
        font-size: 14px;
        &:focus {
          outline: none;
        }
      }
    }

    ul.message-list {
      display: flex;
      flex-direction: column-reverse;
      
      margin: 0;
      padding: 0;
      list-style: none;

      li {
        margin: 0px 0 7px 0;
      }

      li.load-more, li.no-more, li.loading {
        font-size: 12px;
        text-align: center;
        margin-top: 1em;
      }

      li.load-more {
        cursor: pointer;
        &:hover {
          text-decoration: underline;
        }
      }

    }

    div.time {
      font-size: 12px;
      text-align: center;
      line-height: 25px;
      user-select: none;
    }

    .message-item {
      display: flex;
      align-items: flex-end;
      .avatar-wrapper > * {
        vertical-align: bottom;
      }
    }

    .message-item:not(.is-peer) {
      flex-direction: row-reverse;
    }

    div.message-content {
      font-size: 14px;
      box-sizing: border-box;
      width: fit-content;
      word-break: break-word;
      max-width: 70%;
      @include respond-to(phone) {
        max-width: calc(100% - 100px);
      }
      padding: 5px 12px;
      border-radius: 10px;
      line-height: 1.7em;
    }

    div.avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background-size: cover;
      display: inline-block;
      margin: 0 10px;
      &.fallback {
        font-size: 16px;
        line-height: 30px;
        text-align: center;
      }
    }
  }

  @include respond-to(phone) {
    .hide-on-mobile {
      display: none !important;
    }
  }
}

.light-theme div.message {
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  
  h2 {
    border-bottom: 1px solid #ccc;
    background: white;
  }
  div.other-info {
    background-color: #f1f1f1;
    color: $theme_color;
  }
  .left-sessions {
    border-right: 1px solid #ccc;

    li {
      &.active {
        background: #ddd;
      }

      &:not(.active):hover {
        background: #eee;
      }
    }

    div.avatar.fallback {
      background-color: $theme_color;
      color: white;
    }
  }

  div.right-messages {
    div.message-session-view {
      background-color: #f1f1f1;
    }
    li.no-more, li.loading {
      color: #aaa;
    }
    li.load-more {
      color: $theme_color;
    }
    div.time {
      color: #aaa;
    }
    div.message-content {
      background: $theme_color;
      color: white;
    }
    div.avatar.fallback {
      background-color: $theme_color;
      color: white;
    }
  }
}

.dark-theme div.message {
  border-left: 1px solid #555;
  border-right: 1px solid #555;
  border-bottom: 1px solid #555;
  
  h2 {
    border-bottom: 1px solid #555;
    background: #444;
    color: white;
  }
  div.other-info {
    background-color: #222;
    color: #888;
  }
  .left-sessions {
    border-right: 1px solid #555;

    li {
      color: white;

      &.active {
        background: #555;
      }

      &:not(.active):hover {
        background: #444;
      }
    }

    div.avatar.fallback {
      background-color: $theme_color;
      color: white;
    }
  }

  div.right-messages {
    div.message-session-view {
      background-color: #222;
    }
    li.no-more, li.loading {
      color: #aaa;
    }
    li.load-more {
      color: #fff;
    }
    div.time {
      color: #aaa;
    }
    div.message-content {
      background: #666;
      color: white;
    }
    div.avatar.fallback {
      background-color: $theme_color;
      color: white;
    }
    input {
      background-color: #444;
      color: white;
    }
  }
}
</style>
