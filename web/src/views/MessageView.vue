<template lang="pug">
  div.message
    div.left-sessions
      h2 消息列表
      ul.session-list
        li(v-for="session in sessions" @click="activeSession = session._id" v-bind:class="{ active: session._id === activeSession }")
          template
            div.avatar(v-if="members[session.peer].avatar !== null" v-bind:style="{ backgroundImage: `url(${members[session.peer].avatar})` }")
            div.avatar.fallback(v-else) {{ (members[session.peer].username || '?').substr(0, 1).toUpperCase() }}
          span.username {{ members[session.peer].username }}
    div.right-messages(v-if="session._id !== undefined")
      h2 {{ members[getPeer(session.members)].username }}
      div.message-session-view(v-if="activeSession !== null")
        ul.message-list
          li(v-for="message in session.timeline")
            div.time {{ new Date(message.date).toLocaleDateString() }} {{ new Date(message.date).toLocaleTimeString() }}
            div.message-item(v-bind:class="{ 'is-peer': message.from !== me._id }")
              template
                div.avatar(v-if="members[message.from].avatar !== null" v-bind:style="{ backgroundImage: `url(${members[message.from].avatar})` }")
                div.avatar.fallback(v-else) {{ (members[message.from].username || '?').substr(0, 1).toUpperCase() }}
              div.message-content {{ message.content }}
          li.load-more(v-if="session.canLoadMore" @click="loadMore()") 查看更多历史消息
          li.no-more(v-else) 没有更多消息
      div.textbox
        input(placeholder="Write a message...")
</template>

<script>
import api from '../api';

export default {
  name: 'message-view',
  data () {
    return {
      sessions: [],
      session: {},
      activeSession: null,
      busy: false,
    };
  },
  created () {
    this.loadSessions();
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
      api.v1.message.fetchMessageSessions().then(res => {
        this.$store.commit('mergeMembers', res.members);
        this.sessions = res.messagesInfo.map(el => {
          el.peer = this.getPeer(el.members);
          return el;
        });
      });
    },
    getPeer (members) {
      return members.filter(id => id !== this.me._id)[0];
    },
    loadMore () {
      let before = this.session.timeline[this.session.timeline.length - 1].date;
      api.v1.message.fetchMessageSessionById({ id: this.activeSession, before }).then(res => {
        if (res.message.timeline.length < 10) {
          this.session.canLoadMore = false;
        }
        let el = this.$el.querySelector('.message-session-view');
        let recordHeight = el.scrollHeight - el.scrollTop;
        this.session.timeline = [...this.session.timeline, ...res.message.timeline];
        this.$nextTick(() => {
          el.scrollTop = el.scrollHeight - recordHeight;
        });
      });
    },
  },
  watch: {
    activeSession (id) {
      api.v1.message.fetchMessageSessionById({ id }).then(res => {
        this.session = res.message;
        this.session.canLoadMore = true;
        if (this.session.timeline.length < 10) {
          this.session.canLoadMore = false;
        }
        this.$nextTick(() => {
          let el = this.$el.querySelector('.message-session-view');
          el.scrollTop = el.scrollHeight;
          console.log(el.scrollHeight);
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
  border: 1px solid #ccc;
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
    border-bottom: 1px solid #ccc;
    background: white;
    font-weight: bold;
  }

  .left-sessions {
    user-select: none;
    width: 280px;
    flex-grow: 0;
    flex-shrink: 0;
    height: 100%;
    overflow-y: hidden;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #ccc;

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

      &.active {
        background: #ddd;
      }

      &:not(.active):hover {
        background: #eee;
      }

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
        background-color: $theme_color;
        font-size: 22px;
        line-height: 50px;
        text-align: center;
        color: white;
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
      background-color: #f1f1f1;
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
        box-sizing: content-box;
        vertical-align: top;
        height: 100%;
        width: 100%;
        padding: 0 1em;
        font-size: 14px;
        &:focus {
          outline: none;
        }
      }

      button {

      }
    }

    ul.message-list {
      display: flex;
      flex-direction: column-reverse;
      
      margin: 0;
      padding: 0;
      list-style: none;

      li {
        margin: 0px 14px 14px 14px;
      }

      li.load-more, li.no-more {
        font-size: 12px;
        text-align: center;
        margin-top: 1em;
      }

      li.load-more {
        color: $theme_color;
        cursor: pointer;
        &:hover {
          text-decoration: underline;
        }
      }

      li.no-more {
        color: #aaa;
      }
    }

    div.time {
      font-size: 12px;
      color: #aaa;
      text-align: center;
      line-height: 25px;
      user-select: none;
    }

    .message-item {
      display: flex;
    }

    .message-item:not(.is-peer) {
      flex-direction: row-reverse;
    }

    div.message-content {
      background: $theme_color;
      font-size: 14px;
      color: white;
      width: fit-content;
      max-width: 70%;
      padding: 5px 12px;
      border-radius: 12px;
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
        background-color: $theme_color;
        font-size: 16px;
        line-height: 30px;
        text-align: center;
        color: white;
      }
    }
  }
}
</style>
