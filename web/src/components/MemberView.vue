<template lang="pug">
div
  loading-icon(v-if="busy", style="margin-top: 20px;")
  div.member-info(v-if="member")
    div.avatar
      div.avatar-image(v-bind:style="{ backgroundImage: 'url(' + getMemberAvatarUrl(member) + ')'}")
      div.avatar-fallback {{ (member.username || '?').substr(0, 1).toUpperCase() }}
    div.name-and-bio-container
      h1.member-name {{ member.username }}
      h2.member-bio {{ member.bio }}
      div.member-other-info 加入于{{ timeAgo(member.regdate) }}
    div.member-activity-container
      div.member-side-nav
        //- div: a [图标] 最近的活动
        //- div: a [图标] 创建的讨论
      div.member-recent-activity: ul
        li.activity-item(v-for="activity in member.recentActivities")
          span.activity-time {{ timeAgo(activity.posts[activity.posts.length - 1].createDate) }}发表回复：
          router-link(:to="`/d/${activity._id}/${activity.posts[activity.posts.length - 1].index}`"): h3.post-title {{ activity.title }}
          post-content(:content="activity.posts[activity.posts.length - 1].content" noattach="true")
</template>

<script>
import LoadingIcon from './LoadingIcon.vue';
import PostContent from './PostContent.vue';

import config from '../config';
import getMemberAvatarUrl from '../utils/avatar';
import { timeAgo } from '../utils/filters';

export default {
  name: 'member-view',
  components: {
    LoadingIcon, PostContent
  },
  data () {
    return {
      memberId: null,
      member: null,
      busy: true,
    };
  },
  methods: {
    getMemberAvatarUrl, timeAgo,
    loadMemberInfo () {
      this.memberId = this.$route.params.memberId;
      let url = `${config.api.url}${config.api.version}/member/${this.memberId}?recent=on`;
      this.$http.get(url).then(res => {
        delete res.body.status;
        this.member = res.body;
        this.$store.commit('setGlobalTitles', [' ']);
        this.busy = false;
      }, res => {
        if (res.status === 400) {
          this.$router.replace('/400');
        }
      });
    },
  },
  created () {
    this.loadMemberInfo();
  }
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.member-info {
  text-align: left;

  $avatar-size: 120px;
  div.avatar {
    width: $avatar-size;
    height: $avatar-size;
    position: relative;
    border-radius: $avatar-size / 2;
    margin-top: -$avatar-size / 2;
    overflow: hidden;
    display: inline-block;
    box-shadow: 0 0 10px black;

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
    padding-left: 1em;
    margin-top: -$avatar-size / 2;
    vertical-align: top;
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

  div.member-activity-container {
    margin-top: 10px;
    display: flex;

    div.member-side-nav {
      flex-grow: 0;
      flex-shrink: 0;
      width: 120px;
      order: 1;

      padding-top: 20px;
      line-height: 20px;

      a {
        cursor: pointer;
        font-size: 0.9em;
      }
    }

    div.member-recent-activity {
      flex-grow: 1;
      flex-shrink: 1;
      order: 2;

      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }

      h3.post-title {
        padding-left: 20px;
        font-weight: normal;
      }

      span.activity-time {
        display: block;
        color: #bbb;
        font-size: 12px;
        padding-left: 20px;
      }

      h3 {
        margin: 0 0 0.5em 0;
        padding-left: 20px;
      }

      li {
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

      li:not(:last-child) {
        border-bottom: 2px solid rgba(grey, 0.3);
      }
    }
  }
}

.dark-theme div.member-info {
  color: #ccc;
  a {
    color: white;
  }
}

.light-theme div.member-info {
  a {
    color: $theme_color;
  }
}
</style>
