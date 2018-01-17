<template lang="pug">
  div.notification-container
    button.notification(@click="trigger",
      v-bind:class="{ active: activated, new: notifications.new }")
    div.dropdown-wrapper: div.notification-list(@click="$event.stopPropagation()" v-bind:class="{ 'activated': activated }")
      header
        h3 消息通知
        button.mark-all-read(@click="readAll")
      ul.scrollable(v-on:&mousewheel="scrollHelper" v-if="notifications.count !== 0")
        li(v-for="item in notifications.list"
          v-bind:class="{ new: !item.hasRead }"
          v-on:click="readNotification(item)"
          v-bind:style="{ cursor: item.href || !item.hasRead ? 'pointer' : 'initial' }") {{ item.content }}
      div.empty(v-else) 当前没有通知
</template>

<script>
import api from '../api';

export default {
  name: 'notification-control',
  data () {
    return {
      activated: false,
    };
  },
  computed: {
    notifications () {
      // return { count: 0, list: [], new: false }; // this.$store.state.notifications;
      return this.$store.state.notifications;
    },
  },
  methods: {
    trigger (e) {
      if (!this.activated) {
        this.activate();
      }
    },
    activate () {
      this.activated = true;
      this.$nextTick(() => {
        document.addEventListener('click', this.deactivate);
      });
    },
    deactivate () {
      this.activated = false;
      document.removeEventListener('click', this.deactivate);
    },
    scrollHelper (e) {
      e.stopPropagation();

      const node = this.$el.querySelector('ul.scrollable');
      const delta = e.wheelDelta || e.detail || 0;

      if (node.scrollTop === 0 && delta > 0) {
        e.preventDefault();
        return false;
      } else if (node.clientHeight + node.scrollTop >= node.scrollHeight && delta < 0) {
        e.preventDefault();
        return false;
      }
    },
    readNotification (notification) {
      if (!notification.hasRead) {
        this.$store.dispatch('readNotification', { index: notification.index });
      }

      if (notification.href) {
        this.$router.push(notification.href);
      }
    },
    readAll () {
      if (!this.notifications.new) {
        return;
      }
      api.v1.notification.readAllNotifications().then(() => {
        this.$store.dispatch('fetchNotifications');
      }).catch(err => console.error(err));
    },
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.notification-container {
  font-size: 0;

  div.dropdown-wrapper {
    width: 0;
    height: 0;
    position: relative;
    display: block;
  }

  button.mark-all-read {
    border: none;
    background: none;
    width: 22px;
    height: 22px;
    display: inline-block;
    background-image: url(../assets/check.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    cursor: pointer;
  }

  button.notification {
    width: 30px;
    height: 30px;
    background: none;
    border: none;
    border-radius: 100%;
    background-image: url(../assets/notification.svg);
    background-size: 25px;
    background-position: center;
    background-repeat: no-repeat;
    transition: all ease 0.2s;

    &:hover, &.active {
      background-color: mix($theme_color, black, 80%);
    }

    &:focus {
      outline: none;
      background-color: mix($theme_color, black, 80%);
    }
  }

  div.dropdown-wrapper {
    font-size: initial;
  }

  button.notification.new {
    background-image: url(../assets/notification-new.svg);
  }

  div.notification-list {
    width: 320px;
    position: absolute;
    top: 8px;
    right: -15px;
    border-radius: 4px;
    transition: all ease 0.2s;
    overflow: hidden;

    opacity: 0;
    transform: translateY(-6px);
    pointer-events: none;

    &.activated {
      opacity: 1;
      transform: none;
      pointer-events: initial;
    }

    header {
      padding: .5em .7em 0.3em;
      display: flex;
    }

    h3 {
      flex-grow: 1;
      flex-shrink: 1;
      margin: 0;
      font-size: 0.9rem;
      font-weight: 500;
    }

    ul {
      margin: 0;
      height: 250px;
      overflow-y: overlay;
      list-style: none;
      padding: 0;
    }

    div.empty {
      text-align: center;
      padding: 80px 0;
      font-weight: 400;
      font-size: 1.2em;
      user-select: none;
    }

    li {
      text-align: left;
      white-space: normal;
      font-size: 13px;
      padding: 1em 1em;
      user-select: none;
      cursor: pointer;
      transition: background-color ease 0.2s;
    }
  }
}

.light-theme div.notification-container {
  div.notification-list {
    background: white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);

    header {
      border-bottom: 1px solid mix($theme_color, white, 30%);
      color: $theme_color;
    }

    div.empty {
      color: mix($theme_color, white, 40%);
    }

    li {
      border-bottom: 1px solid #eee;
      &:not(.new) {
        color: grey;
      }
    }

    li.new {
      background-color: mix($theme_color, white, 8%);
    }

    li:hover {
      background-color: mix($theme_color, white, 15%);
    }
  }
}

.dark-theme div.notification-container {
  button.mark-all-read {
    filter: grayscale(100%);
  }

  div.notification-list {
    background: #181818;
    box-shadow: 0 1px 4px black;

    header {
      border-bottom: 1px solid #666;
      color: #bbb;
    }

    div.empty {
      color: #666;
    }

    li {
      border-bottom: 1px solid #262626;
      color: #bbb;
    }

    li.new {
      background-color: #222;
    }

    li:hover {
      background-color: #333;
    }
  }
}
</style>
