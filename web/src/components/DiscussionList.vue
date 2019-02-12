<template lang="pug">
  div.discussion-list
    //- transition-group(tag="ul" name="list")
    ul
      li(v-for="(discussion, index) in discussions" :key="(keyPrefix || 'dft') + discussion._id" v-on:click="dispatchClickToLink($event, discussion)", style="cursor: pointer"): div.discussion-list-item
        router-link.discussion-avatar(:to="'/m/' + discussion.creater" v-if="!hideavatar")
          div.avater
            div.sticky-icon(v-if="showSticky && discussion.sticky[showSticky]")
            div.avatar-image(v-if="members[discussion.creater].avatar" v-bind:style="{ backgroundImage: 'url(' + members[discussion.creater].avatar + ')'}")
            div.avatar-fallback(v-else) {{ (members[discussion.creater].username || '?').substr(0, 1).toUpperCase() }}
          div.creater-info-popup
            div.triangle-left
            span {{ members[discussion.creater].username || 'undefined' }} {{ i18n('ui_created_at', { date: new Date(discussion.createDate).toLocaleDateString() }) }}
        div.discussion-meta
          h3.discussion-title
            router-link.default(:to="'/d/' + discussion._id") {{ decodeHTML(discussion.title) }}
          div.discussion-meta-other
            span.discussion-last-reply
              span.discussion-user
                router-link(:to="'/m/' + discussion.lastMember") {{ discussion.lastMember ? members[discussion.lastMember].username : 'undefined' }} 
              |{{ i18n( discussion.replies === 1 ? 'ui_created_at' : 'ui_replied_at', { date: timeAgo(discussion.lastDate) })}}
            span.discussion-tags(v-for="tag in discussion.tags"): a {{ tag }}
        div.discussion-meta-right
          span.discussion-category.hide-on-small-device(v-if="discussion.category"): a {{ discussion.category }}
          span.discussion-replies {{ Math.max(discussion.replies - 1, 0) }}
</template>

<script>
import { timeAgo } from '../utils/filters';
import decodeHTML from '../utils/decodeHTML';

export default {
  name: 'DiscussionList',
  props: {
    hideavatar: Boolean,
    list: {
      type: Array,
      default: () => [],
    },
    keyPrefix: {
      type: String,
      default: '',
    },
    showSticky: Boolean,
  },
  data () {
    return {
      lastKeyPrefix: null,
    };
  },
  computed: {
    discussions () {
      return this.$props.list || this.$store.state.discussions;
    },
    members () {
      return this.$store.state.members;
    },
    busy () {
      return this.$store.state.busy;
    },
  },
  methods: {
    timeAgo, decodeHTML,
    dispatchClickToLink (e, discussion) {
      e.stopPropagation();
      let cursor = e.target;
      if (e.target.tagName !== 'A') {
        while (cursor && cursor.tagName !== 'LI') {
          const target = cursor.querySelector('a.default');
          if (cursor.tagName === 'A') {
            break;
          } else if (target) {
            target.click();
            break;
          } else {
            cursor = cursor.parentNode;
          }
        }
      }
    },
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.discussion-list {
  padding-bottom: 10px;
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    div.discussion-list-item {
      padding: 12px;
      margin-bottom: 5px;
      @include respond-to(phone) {
        padding: 6px;
      }
    }
  }

  @mixin set-avatar($avatar_size) {
    width: $avatar_size;
    height: $avatar_size;
    font-size: $avatar_size * 0.55;
    line-height: $avatar_size;
    border-radius: $avatar_size / 2;
    text-align: center;
  }

  div.discussion-list-item {
    transition: all ease 0.2s;
    border-radius: 4px;
    position: relative;
    display: flex;
    flex-wrap: nowrap;
  }

  $avatar_size: 40px;
  div.avater {
    display: inline-block;
    position: relative;
    margin: 3px;
    background-color: mix($theme_color, white, 80%);
    color: white;
    cursor: pointer;
    @include respond-to(phone) {
      @include set-avatar(35px);
    }
    @include respond-to(tablet) {
      @include set-avatar(40px);
    }
    @include respond-to(laptop) {
      @include set-avatar(40px);
    }

    div.sticky-icon {
      width: 20px;
      height: 20px;
      position: absolute;
      top: -4px;
      right: -4px;
      background-color: #CC3333;
      background-image: url(../assets/pin.svg);
      background-size: 80%;
      background-position: center;
      box-shadow: -2px 2px 2px rgba(black, 0.2);
      z-index: 1;
      border-radius: 50%;
    }

    div.avatar-image {
      position: absolute;
      border-radius: 50%;
      width: 100%;
      height: 100%;
      background-size: cover;
    }
  }

  $popup-height: 26px;
  $arrow-width: 5px;
  $arrow-height: 6px;
  $popup-color: #333;
  div.creater-info-popup {
    display: inline-block;
    position: absolute;
    margin-top: 8px;
    margin-left: 8px;
    background:  $popup-color;
    border-radius: 4px;
    font-size: 13.6px;
    line-height: $popup-height;
    color: white;
    opacity: 0;
    transition: opacity ease 0.2s;
    pointer-events: none;

    div.triangle-left {
      display: inline-block;
      margin-left: -$arrow-width;
      margin-top: ($popup-height - $arrow-height) / 2;
      width: 0;
      height: 0;
      border-top: $arrow-height / 2 solid transparent;
      border-bottom: $arrow-height / 2 solid transparent; 
      border-right: $arrow-width solid $popup-color;
      vertical-align: top;
    }

    span {
      display: inline-block;
      opacity: 1;
      padding-left: 8px;
      padding-right: 8px;
    }
  }

  div.avater:hover + div.creater-info-popup {
    opacity: 1;
  }

  .discussion-avatar {
    order: 1;
    flex-shrink: 0;
  }

  div.discussion-meta {
    padding-left: 12px;
    @include respond-to(phone) {
      padding-left: 6px;
    }
    display: inline-block;
    order: 2;
    flex-shrink: 2;
    flex-grow: 2;
    overflow: auto;
    vertical-align: top;
    height: 45px;
    overflow: hidden;
  }

  div.discussion-meta-right {
    order: 3;
    flex-shrink: 0;
    flex-grow: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-around;
    padding-left: 12px;
    height: 45px;
    line-height: 45px;
    > * {
      flex-grow: 0;
    }

    span.discussion-category {
      font-size: 12px;
      line-height: 1em;
      // margin-right: 5px;
      padding: 4px 7px 4px 7px;
      border-radius: 3px;
      cursor: pointer;
    }
  }

  span.discussion-replies {
    font-size: 12px;
    display: block;
    width: 40px;
    line-height: 13px;
  }

  span.discussion-replies::before {
    display: inline-block;
    content: ' ';
    background-image: url(../assets/reply-balloon.svg);
    background-size: cover;
    width: 13px;
    height: 13px;
    margin-right: 4px;
  }

  @media only screen and (max-width: 720px) {
    .hide-on-small-device {
      display: none;
    }
  }


  h3.discussion-title {
    white-space: nowrap;
    font-weight: normal;
    font-size: 16px;
    @include respond-to(phone) {
      font-size: 14px;
    }
    margin: 0;
    transition: color ease 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  div.discussion-meta-other {
    white-space: nowrap;
    overflow: hidden;

    span.discussion-last-reply {
      line-height: 24px;
      font-size: 12px;
    }

    span.discussion-user, span.discussion-tags {
      font-size: 12px;
      font-weight: bold;
      border-radius: 4px;
      padding: 3px;
      transition: background ease 0.2s;
      cursor: pointer;
    }

    span.discussion-tags::before {
      content: '\B7';
      margin: 0 0.1em;
    }
  }

  div.discussion-button {
    margin: 10px auto 0 auto;
    font-size: 0.8em;
    width: 60px;
    line-height: 16px;
    border-radius: 4px;
    text-align: center; 
    padding: 6px;
    transition: all ease 0.1s;
    cursor: pointer;
  }

  div.discussion-button:hover {
    background: mix($theme_color, white, 25%);
  }
}

.light-theme div.discussion-list {
  color: black;
  @include respond-to (laptop) {
    div.discussion-list-item:hover {
      background-color: rgba($theme_color, 0.1);
    }
  }
  span.discussion-category {
    background-color: $theme_color;
    a { color: white; }
  }
  h3.discussion-title:hover {
    color: $theme_color;
  }
  span.discussion-user, span.discussion-tags {
    color: mix($theme_color, white, 90%);
  }
  span.discussion-user {
    color: mix($theme_color, black, 75%);
  }
  div.discussion-button {
    color: mix($theme_color, black, 90%);
    background: mix($theme_color, white, 15%);
  }
  div.discussion-button:hover {
    color: mix($theme_color, black, 60%);
  }
  span.discussion-tags::before {
    color: black;
  }
  span.discussion-replies {
    color: $theme_color;
  }
}

.dark-theme div.discussion-list {
  color: lightgray;
  @include respond-to (laptop) {
    div.discussion-list-item:hover {
      background-color: #333; 
    }
  }
  span.discussion-category {
    background-color: mix($theme_color, black, 10%); 
    a { color: grey; }
  }
  h3.discussion-title:hover {
    color: #eee;
  }
  // span.discussion-tags {
  //   background: black;
  //   color: gray;
  // }
  span.discussion-user, span.discussion-tags {
    color: gray;
  }
  span.discussion-user:hover, span.discussion-tags:hover {
    color: lightgray;
  }
  // span.discussion-tags:hover {
  //   background: mix(black, white, 80%);
  // }
  span.discussion-tags::before {
    color: lightgray;
  }
  span.discussion-replies {
    color: gray;
  }
  span.discussion-replies::before {
    filter: grayscale(100%);
  }
}

</style>
