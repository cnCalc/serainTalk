<template lang="pug">
  .notification-popup-wrapper
    transition-group(name="list-complete" tag="div")
      div(v-for="(item, index) in items"
          :key="item.key"
          :class="`notification-item notification-${item.type}`"
          v-bind:style="{ cursor: item.href ? 'pointer' : 'initial' }"
          @click="item.href && goto(item.href); items.splice(index, 1)")
        div.controls
          button.close(@click="$event.stopPropagation(); items.splice(index, 1)") ×
        div.body {{ item.body }}
</template>

<script>
import bus from '../utils/ws-eventbus';

window.bus = bus;

export default {
  name: 'notification-popup',
  data () {
    return {
      items: [],
    };
  },
  created () {
    bus.$on('notification', body => {
      body.key = new Date().getTime();
      this.items.push(body);
    });
  },
  methods: {
    goto (href) {
      this.$router.push(href);
    },
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';

.notification-popup-wrapper {
  width: fit-content;
  height: 500px;
  overflow: visible;
  top: 50px;
  right: 0;
  margin: 10px;
  position: fixed;
  z-index: 30;
  pointer-events: none;
  display: flex;

  .notification-item {
    max-width: 300px;
    width: 80vw;
    text-align: left;
    border-radius: 4px;
    margin: 0 0 15px 0;
    padding: 0 0 15px 0;
    font-size: 14px;
    box-shadow: 0 0 5px rgba(black, 0.5);
    pointer-events: initial;
    transition: all 0.3s;
    user-select: none;
    z-index: 31;

    div.controls {
      height: 15px;
      font-size: 14px;
      text-align: right;
      button {
        border: none;
        background: none;
        box-shadow: none;
        color: inherit;
        cursor: pointer;
      }
    }

    div.body {
      padding: 0 10px;
    }
  }

  .notification-error {
    background-color: rgba(#fdd, 0.95);
    color: #cc4444;
  }

  .notification-message {
    background-color: rgba(mix($theme_color, white, 15%), 0.95);
    color: $theme_color;
  }
}

.list-complete-enter, .list-complete-leave-to {
  opacity: 0;
  transform: translateX(60px);
}

.list-complete-leave-active {
  position: absolute;
}
</style>
