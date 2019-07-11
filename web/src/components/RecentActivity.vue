<template lang="pug">
  div.member-recent-activity
    ul: li.activity-item(v-for="activity in member.recentActivities")
      span.activity-time {{ timeAgo(activity.posts.createDate) }}
        span.activity-type(v-if="activity.posts.index === 1") 发起讨论：
        span.activity-type(v-else) 发表回复：
      router-link(:to="`/d/${activity._id}/${indexToPage(activity.posts.index)}#index-${activity.posts.index}`"): h3.discussion-title {{ activity.title }}
      div.activity-info
        div.activity-member-info
          router-link(:to="'/m/' + member._id").discussion-post-avater: div.discussion-post-avater
            div.avatar-image(v-if="member.avatar" v-bind:style="{ backgroundImage: 'url(' + member.avatar + ')'}")
            div.avatar-fallback(v-else) {{ (member.username || '?').substr(0, 1).toUpperCase() }}
          div.activity-member-name
            b {{ member.username }} 
        post-content(:content="activity.posts.content" :reply-to="activity.posts.replyTo" :discussion-id="activity._id")
    div.list-nav(v-if="canLoadMoreActivities")
      loading-icon(v-if="busy")
      button.button.load-more(@click="loadMoreRecentActivity" v-if="!busy") 加载更多
    div.list-nav(v-else): span.already-max 没有更多了
</template>

<script>
import { timeAgo, indexToPage } from '../utils/filters';
import PostContent from './PostContent.vue';
import LoadingIcon from './LoadingIcon.vue';

export default {
  components: {
    PostContent, LoadingIcon,
  },
  data () {
    return {
      canLoadMoreActivities: true,
    };
  },
  computed: {
    member () {
      return this.$store.state.member;
    },
    busy () {
      return this.$store.state.busy;
    },
  },
  methods: {
    timeAgo, indexToPage,
    loadMoreRecentActivity () {
      if (!this.canLoadMoreActivities) {
        return;
      }

      this.$store.commit('setBusy', true);

      const lastDate = this.member.recentActivities[this.member.recentActivities.length - 1].posts.createDate;
      api.v1.member.fetchMoreMemberRecentActivityById({ id: this.member._id, before: lastDate }).then(({ recentActivities, members }) => {
        if (recentActivities.length === 0) {
          this.canLoadMoreActivities = false;
        } else {
          this.$store.commit('appendMemberRecentActivity', recentActivities);
        }
        this.$store.commit('mergeMembers', members);
        this.$store.commit('setBusy', false);
      });
    },
  },
};
</script>
