<template lang="pug">
div
  loading-icon(v-if="busy && !member._id", style="margin-top: 20px;")
  div.member-info(v-if="member._id")
    div.avatar
      div.avatar-image(v-if="member.avatar !== null" v-bind:style="{ backgroundImage: 'url(' + member.avatar + ')'}")
      div.avatar-fallback(v-else) {{ (member.username || '?').substr(0, 1).toUpperCase() }}
    div.name-and-bio-container
      h1.member-name {{ member.username }}
      h2.member-bio {{ member.bio }}
      div.member-other-info 加入于{{ timeAgo(member.regdate) }}
  div.member-activity(v-if="member._id")
    div.member-activity-container
      div.member-side-nav
        div: router-link(:to="`/m/${$route.params.memberId}`") 最近的活动
        div: router-link(:to="`/m/${$route.params.memberId}/discussions`") 创建的讨论
      div.member-recent-activity(v-if="$route.meta.mode === 'posts'"): ul
        li.activity-item(v-for="activity in member.recentActivities")
          span.activity-time {{ timeAgo(activity.posts[activity.posts.length - 1].createDate) }}发表回复：
          router-link(:to="`/d/${activity._id}/${indexToPage(activity.posts[activity.posts.length - 1].index)}#index-${activity.posts[activity.posts.length - 1].index}`"): h3.post-title {{ activity.title }}
          post-content(:content="activity.posts[activity.posts.length - 1].content" noattach="true")
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
      this.$options.asyncData({ store: this.$store, route: this.$route });
      this.firstIn = true;
      this.canLoadMore = true;
    }
    this.$store.commit('setGlobalTitles', [' ']);
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
  div.avatar {
    width: $avatar-size;
    height: $avatar-size;
    position: relative;
    border-radius: $avatar-size / 2;
    margin-top: -$avatar-size / 2;
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
    margin-top: -$avatar-size / 2;
    vertical-align: top;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    h1.member-name {
      font-weight: normal;
      margin: 0;
      line-height: $avatar-size / 2;
      height: $avatar-size / 2;
      display: inline-block;
      color: white;
      text-shadow: 0 0 5px black;
    }
    h2.member-bio {
      font-weight: normal;
      font-size: 16px;
      margin: 0;
      line-height: $avatar-size / 4;
    }
    div.member-other-info {
      font-size: 14px;
      line-height: $avatar-size / 4;
      height: $avatar-size / 4;
    }
  }
}

div.member-activity {
  text-align: left;

  div.member-activity-container {
    margin-top: 10px;
    display: flex;

    div.member-side-nav {
      flex-grow: 0;
      flex-shrink: 0;
      width: 120px;
      order: 1;
      text-align: center;

      padding-top: 20px;
      line-height: 20px;

      a {
        cursor: pointer;
        font-size: 0.9em;
      }
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

      h3.post-title {
        padding-left: 20px;
        font-weight: normal;
        margin: 0 0 0.5em 0;
        padding-left: 20px;
      }

      span.activity-time {
        display: block;
        color: #bbb;
        font-size: 12px;
        padding-left: 20px;
      }

      li.activity-item {
        display: block;
        padding-bottom: 20px;
        margin-bottom: 12px;

        div.post-content {
          padding: 20px;
          font-size: 14px;
          background-color: rgba(grey, 0.15);
          border-radius: 5px;
          overflow: hidden;
        }
      }

      li.activity-item:not(:last-child) {
        border-bottom: 1px solid rgba(grey, 0.3);
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
}

.light-theme div.member-info, .light-theme div.member-activity {
  a {
    color: $theme_color;
  }
}
</style>
