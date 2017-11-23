<template lang="pug">
div
  loading-icon(v-if="busy && !member._id", style="margin-top: 20px;")
  div.member-info(v-if="member._id")
    div.avatar
      div.avatar-image(v-if="member.avatar !== null" v-bind:style="{ backgroundImage: 'url(' + member.avatar + ')'}")
      div.avatar-fallback(v-else) {{ (member.username || '?').substr(0, 1).toUpperCase() }}
    div.name-and-bio-container
      h1.member-name {{ member.username }}
      h2.member-bio(:title="member.bio") {{ member.bio }}
      div.member-other-info 加入于{{ timeAgo(member.regdate) }} | 最后访问于{{ timeAgo(member.lastlogintime) }}
  div.member-activity(v-if="member._id")
    div.member-activity-container
      div.member-side-nav
        div: router-link(:to="`/m/${$route.params.memberId}`"): button.button(v-bind:class="{ active: $route.meta.mode === 'posts' }") 最近的活动
        div: router-link(:to="`/m/${$route.params.memberId}/discussions`"): button.button(v-bind:class="{ active: $route.meta.mode !== 'posts' }") 创建的讨论
      div.member-recent-activity(v-if="$route.meta.mode === 'posts'"): ul
        li.activity-item(v-for="activity in member.recentActivities")
          span.activity-time {{ timeAgo(activity.posts[activity.posts.length - 1].createDate) }}
            span.activity-type(v-if="activity.posts[activity.posts.length - 1].index === 1") 发起讨论：
            span.activity-type(v-else) 发表回复：
          router-link(:to="`/d/${activity._id}/${indexToPage(activity.posts[activity.posts.length - 1].index)}#index-${activity.posts[activity.posts.length - 1].index}`"): h3.discussion-title {{ activity.title }}
          div.activity-info
            div.activity-member-info
              router-link(:to="'/m/' + member._id").discussion-post-avater: div.discussion-post-avater
                div.avatar-image(v-if="member.avatar !== null" v-bind:style="{ backgroundImage: 'url(' + member.avatar + ')'}")
                div.avatar-fallback(v-else) {{ (member.username || '?').substr(0, 1).toUpperCase() }}
              div.activity-member-name
                b {{ member.username }} 
            post-content(:content="activity.posts[activity.posts.length - 1].content" noattach="true" :reply-to="activity.posts[activity.posts.length - 1].replyTo" :discussion-id="activity._id")
      div.member-recent-posts(v-else)
        discussion-list(:hideavatar="true" :list="$store.state.member.discussions")
        loading-icon(v-if="busy")
        div.list-nav(v-if="canLoadMore")
          button.button.load-more(@click="loadMore" v-if="!busy") 加载更多
        div.list-nav(v-else): span.already-max 没有更多了
</template>

<script>
import LoadingIcon from '../components/LoadingIcon.vue';
import PostContent from '../components/PostContent.vue';
import DiscussionList from '../components/DiscussionList.vue';

import { timeAgo, indexToPage } from '../utils/filters';

export default {
  name: 'member-view',
  components: {
    LoadingIcon, PostContent, DiscussionList
  },
  data () {
    return {
      currentPage: 1,
      canLoadMore: true,
      currentMember: null,
      firstIn: true,
    };
  },
  computed: {
    member () {
      return this.$store.state.member;
    },
    busy () {
      return this.$store.state.busy;
    },
    discussions () {
      return this.$store.state.member.discussions;
    }
  },
  methods: {
    timeAgo, indexToPage,
    loadMore () {
      this.currentPage++;
      this.$store.dispatch('fetchDiscussionsCreatedByMember', { id: this.$route.params.memberId, page: this.currentPage, append: true }).then(count => {
        if (indexToPage(count) <= this.currentPage) {
          this.canLoadMore = false;
        }
      });
    }
  },
  created () {
    this.currentPage = 1;
    this.currentMember = this.$route.params.memberId;
  },
  watch: {
    '$route': function (route) {
      if (typeof this.currentMember === 'undefined' || this.currentMember !== route.params.memberId || this.firstIn) {
        // 如果 currentMember 和路由中的 member 不一致时，显然可以算作是首次进入。
        let needRefetchMemberInfo = (this.currentMember !== route.params.memberId);
        this.firstIn = false;
        if (route.params.memberId) {
          this.currentMember = route.params.memberId;
          if (needRefetchMemberInfo) {
            this.$store.dispatch('fetchMemberInfo', { id: route.params.memberId });
            this.canLoadMore = true;
          }
          this.$store.dispatch('fetchDiscussionsCreatedByMember', { id: route.params.memberId });
          this.currentPage = 1;
        }
      }
    }
  },
  activated () {
    if (this.$store.state.member && this.$store.state.member._id !== this.$route.params.memberId) {
      // this.$options.asyncData({ store: this.$store, route: this.$route });
      this.firstIn = true;
      this.canLoadMore = true;
    }
    this.$store.commit('setGlobalTitles', [' ', ' ', true]);
  },
  asyncData ({ store, route }) {
    return store.dispatch('fetchMemberInfo', { id: route.params.memberId }).then(() => {
      if (route.meta.mode === 'discussions') {
        store.dispatch('fetchDiscussionsCreatedByMember', { id: route.params.memberId });
      }
    });
  }
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
      // color: #888;
      font-size: 14px;
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
        > * {
          // flex-grow: 1;
        }
      }

      a {
        cursor: pointer;
        font-size: 0.9em;
        line-height: 0.9em;
        color: white;
      }

      button.button.active {
        background: $theme_color;
        color: white;
      }

      button.button {
        background: rgba(0, 0, 0, 0);
        margin: 0.3rem;
        padding: 0.3em 0.5em;
        width: 100px;
        color: $theme_color;
        border: none;

        &:focus {
          outline: none;
        }
      }
    }

    div.member-recent-activity {
      overflow: hidden;
      padding: 0 20px;
      box-sizing: border-box;
    }

    div.member-recent-activity h3.discussion-title {
      font-weight: 400;
      font-size: 18px;
      margin: 5px 0;
    }

    div.member-recent-activity, div.member-recent-posts {
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
        overflow: hidden;
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
}

.light-theme div.member-info, .light-theme div.member-activity {
  a {
    color: $theme_color;
  }
  li.activity-item:not(:last-child) {
    border-bottom: 1px solid rgba($theme_color, 0.3);
  }
}
</style>
