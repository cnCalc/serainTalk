<template lang="pug">
div
  loading-icon(v-if="busy && !member._id", style="margin-top: 20px;")
  div.member-info(v-if="member._id")
    div.avatar
      div.avatar-image(v-if="member.avatar" v-bind:style="{ backgroundImage: 'url(' + member.avatar + ')'}")
      div.avatar-fallback(v-else) {{ (member.username || '?').substr(0, 1).toUpperCase() }}
    div.name-and-bio-container
      h1.member-name {{ member.username }}
      h2.member-bio(:title="member.bio") {{ member.bio }}
      div.member-other-info
        //- span 加入于{{ timeAgo(member.regdate) }}&nbsp;|&nbsp;
        span {{ member.online === true ? '当前在线' : ('最后访问于' + timeAgo(member.lastlogintime)) }}
  div.member-activity(v-if="member._id")
    div.member-activity-container
      div.member-side-nav
        div: router-link(:to="`/m/${$route.params.memberId}`"): button.button(v-bind:class="{ active: subPath === '' }") 最近的活动
        div: router-link(:to="`/m/${$route.params.memberId}/discussions`"): button.button(v-bind:class="{ active: subPath === '/discussions' }") 创建的讨论
        div(v-if="$route.params.memberId === $store.state.me._id"): router-link(:to="`/m/${$route.params.memberId}/subscribed`"): button.button(v-bind:class="{ active: subPath === '/subscribed' }") 订阅的讨论
        div(v-if="$route.params.memberId === $store.state.me._id"): router-link(:to="`/m/${$route.params.memberId}/settings`"): button.button(v-bind:class="{ active: subPath === '/settings' }") 个人设置
        div(v-if="$store.state.me._id && $route.params.memberId !== $store.state.me._id"): router-link(:to="`/message/new/${$route.params.memberId}`"): button.button 开始对话
      router-view
</template>

<script>
import LoadingIcon from '../components/LoadingIcon.vue';
import CheckBox from '../components/form/CheckBox.vue';
import PostContent from '../components/PostContent.vue';
import DiscussionList from '../components/DiscussionList.vue';
import api from '../api';
import titleMixin from '../mixins/title.js';
import axios from 'axios';
import config from '../config';

import { timeAgo, indexToPage } from '../utils/filters';

// import bus from '../utils/ws-eventbus';

export default {
  name: 'MemberView',
  components: {
    LoadingIcon, PostContent, DiscussionList, CheckBox,
  },
  mixins: [titleMixin],
  data () {
    return {
      currentMember: null,
      firstIn: true,
    };
  },
  title () {
    if (!this.member.username) {
      return 'Loading';
    }

    switch (this.subPath) {
      case '':
        return `${this.member.username} 的最近活动`;
      case '/discussions':
        return `${this.member.username} 创建的讨论`;
      case '/subscribed':
        return `${this.member.username} 订阅的讨论`;
      case '/settings':
        return '个人设置';
    }
  },
  computed: {
    member () {
      return this.$store.state.member;
    },
    busy () {
      return this.$store.state.busy;
    },
    subPath () {
      return this.$route.path.substring(27);
    },
  },
  watch: {
    '$route.params.memberId': function (id) {
      if (id && id !== this.currentMember) {
        this.currentMember = id;
        this.$options.asyncData({ route: this.$route, store: this.$store });
      }
    },
  },
  asyncData ({ store, route }) {
    return store.dispatch('fetchMemberInfo', { id: route.params.memberId }).then(() => {
    }).catch((error) => {
      if (process.env.VUE_ENV !== 'server' && error.response.status === 404) {
        this.$router.replace('/not-found');
      } else {
        throw error;
      }
    });
  },
  created () {
    this.currentPage = 1;
    this.currentMember = this.$route.params.memberId;
  },
  activated () {
    this.$store.commit('setGlobalTitles', [' ', ' ', true]);
  },
  mounted () {
    this.$store.commit('setGlobalTitles', [' ', ' ', true]);
    if (this.member.recentActivities && this.member.recentActivities.length < config.api.pagesize) {
      this.canLoadMoreActivities = false;
    }
    if (this.member.discussions && this.member.discussions.length < config.api.pagesize) {
      this.canLoadMorePosts = false;
    }
  },
  methods: {
    timeAgo, indexToPage,
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';
@import '../styles/load-more-button.scss';

div.member-info {
  text-align: left;
  $avatar-size: 120px;
  display: flex;
  padding: 0 15px;
  @include respond-to(phone) {
    flex-direction: column;
    align-items: center;
    height: 270px;
    box-sizing: content-box;
    margin-top: -270px;
  }
  > * {
    @include respond-to(laptop) {
      margin-top: -$avatar-size / 2;
    }
    @include respond-to(tablet) {
      margin-top: -$avatar-size / 2;
    }
  }
  div.avatar {
    width: $avatar-size;
    height: $avatar-size;
    position: relative;
    border-radius: $avatar-size / 2;
    overflow: hidden;
    display: inline-block;
    box-shadow: 0 0 10px black;
    flex-grow: 0;
    flex-shrink: 0;
    div.avatar-image, div.avatar-fallback {
      position: absolute;
      width: 100%;
      height: 100%;
      line-height: $avatar-size;
    }
    div.avatar-image {
      z-index: 2;
      background-position: center;
      background-size: cover;
      background-repeat: no-repeat;
    }
    div.avatar-fallback {
      background-color: $theme_color;
      text-align: center;
      color: white;
      font-size: $avatar-size * 0.5;
    }
  }

  div.name-and-bio-container {
    display: inline-block;
    flex-grow: 1;
    flex-shrink: 1;
    padding-left: 1em;
    vertical-align: top;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    @include respond-to(phone) {
      width: 100%;
      padding: 0.2em;
      text-align: center;
    }
    h1.member-name {
      font-weight: 300;
      margin: 0;
      line-height: $avatar-size / 2;
      height: $avatar-size / 2;
      display: inline-block;
      color: white;
      text-shadow: 0 0 5px black;
    }
    h2.member-bio {
      font-weight: normal;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 16px;
      margin: 0;
      line-height: $avatar-size / 4;
      @include respond-to(phone) {
        color: white;
        text-shadow: 0 0 5px black;
      }
    }
    div.member-other-info {
      color: #666;
      font-size: 13px;
      line-height: $avatar-size / 4;
      height: $avatar-size / 4;
      @include respond-to(phone) {
        color: white;
        text-shadow: 0 0 5px black;
      }
    }
  }
}

div.member-activity {
  text-align: left;

  div.member-activity-container {
    margin-top: 10px;
    display: flex;
    @include respond-to(phone) {
      flex-direction: column;
    }

    div.member-side-nav {
      flex-grow: 0;
      flex-shrink: 0;
      order: 1;
      text-align: center;
      line-height: 20px;
      padding: 0.3rem;

      @include respond-to(tablet) {
        width: 120px;
      }
      @include respond-to(laptop) {
        padding-top: 20px;
        width: 120px;
      }

      @include respond-to(phone) {
        display: flex;
        overflow-y: scroll;
        width: 90vw;
        margin: 0 auto;
      }

      a {
        cursor: pointer;
        font-size: 0.9em;
        line-height: 0.9em;
        color: white;
      }

      button.button {
        margin: 0.3rem 0.1rem;
        padding: 0.3em 0.5em;
        width: 100px;
        border: none;
      }
    }

    div.member-recent-activity {
      min-width: 0;
      padding: 0 20px;
      margin-top: 10px;
      box-sizing: border-box;
    }

    div.member-recent-activity h3.discussion-title {
      font-weight: 400;
      font-size: 18px;
      margin: 5px 0;
    }

    div.member-settings, div.member-upload-avatar {
      padding: 10px 20px;
      box-sizing: border-box;
    }

    div.member-settings {
      .row {
        display: flex;
        width: 100%;
        overflow: hidden;
        align-items: center;
        &:not(:first-child) {
          margin-bottom: 8px;
        }
        .check-box {
          flex-shrink: 0;
        }
        span {
          font-size: 15px;
          vertical-align: middle;
          margin-left: .8em;
        }
        button.button {
          font-size: 14px;
          border: none;
          padding: 6px 14px;
          margin-right: 5px;
          margin-bottom: 5px;
        }
        &.wrap {
          flex-wrap: wrap;
        }
      }
      h3 {
        margin: 1.5em 0 0.9em 0;
        padding: 0;
        font-size: 14px
      }
    }

    div.member-recent-activity, div.member-recent-posts, div.member-settings, div.member-upload-avatar {
      flex-grow: 1;
      flex-shrink: 1;
      order: 2;
      width: 100%;

      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      span.activity-time {
        display: block;
        color: #bbb;
        font-size: 12px;
      }

      li.activity-item {
        display: block;
        padding-bottom: 24px;
        margin-bottom: 12px;

        div.post-content {
          padding: 10px 0;
          font-size: 14px;
        }
      }

      div.activity-info {
        display: flex;
        flex-direction: column;
        overflow: show;
      }

      div.activity-member-info {
        display: flex;
        align-items: center;
      }

      div.activity-member-name {
        @include respond-to(phone) {
          padding-left: 8px;
        }
      }

      @mixin set-avatar ($avatar-size) {
        a.discussion-post-avater {
          width: $avatar-size;
          height: $avatar-size;
        }
        div.discussion-post-avater {
          width: $avatar-size;
          height: $avatar-size;
          border-radius: $avatar-size / 2;
          line-height: $avatar-size;
          font-size: $avatar-size * 0.45;
        }
      }

      @mixin set-avatar-outside($avatar-size) {
        $avatar-padding: 12px;
        .activity-info {
          padding-left: $avatar-size + $avatar-padding;
        }
        a.discussion-post-avater {
          width: 0;
          height: 0;
        }
        div.discussion-post-avater {
          margin-left: -$avatar-size - $avatar-padding;
          margin-top: -4px;
        }
      }

      @include respond-to(phone) {
        @include set-avatar(32px);
      }
      @include respond-to(tablet) {
        @include set-avatar(50px);
        @include set-avatar-outside(50px);
      }
      @include respond-to(laptop) {
        @include set-avatar(60px);
        @include set-avatar-outside(60px);
      }

      a.discussion-post-avater {
        display: block;
      }

      div.discussion-post-avater {
        position: relative;
        order: 1;
        flex-grow: 0;
        flex-shrink: 0;
        background-color: mix($theme_color, white, 80%);
        text-align: center;
        color: white;
        overflow: hidden;

        div.avatar-image {
          position: absolute;
          width: 100%;
          height: 100%;
          background-size: cover;
        }
      }
    }
  }

  div.list-nav {
    padding-bottom: 16px;
    height: 40px;
  }

  span.already-max {
    font-size: 0.85em;
    color: #888;
  }
}

.dark-theme div.member-info, .dark-theme div.member-activity {
  color: #ccc;
  a {
    color: white;
  }
  li.activity-item:not(:last-child) {
    border-bottom: 1px solid #555;
  }
  .member-settings, .member-upload-avatar {
    button {
      color: white;
      background: #444;
      &:hover {
        color: white;
        background: #555;
      }
    }
  }
  div.member-side-nav {
    button.button.active {
      background: #444;
      color: white;
    }

    button.button {
      background: rgba(0, 0, 0, 0);
      color: lightgrey;
    }
  }
}

.light-theme div.member-info, .light-theme div.member-activity {
  a {
    color: $theme_color;
  }
  li.activity-item:not(:last-child) {
    border-bottom: 1px solid rgba($theme_color, 0.3);
  }
  .member-settings, .member-upload-avatar {
    button {
      color: mix($theme_color, black, 90%);
      background: mix($theme_color, white, 15%);
      &:hover {
        color: mix($theme_color, black, 60%);
        background: mix($theme_color, white, 20%);
      }
    }
  }
  div.member-side-nav {
    button.button.active {
      background: $theme_color;
      color: white;
    }

    button.button {
      background: rgba(0, 0, 0, 0);
      color: $theme_color;
    }
  }
}
</style>
