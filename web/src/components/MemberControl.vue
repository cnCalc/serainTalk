<template lang="pug">
  div.avatar-container
    button.avatar(@click="trigger")
      div.avatar-image(v-if="me.avatar !== null" v-bind:style="{ backgroundImage: 'url(' + me.avatar + ')'}")
      div.avatar-fallback(v-else) {{ (me.username || '?').substr(0, 1).toUpperCase() }}
    div.dropdown-wrapper: div.menu(v-bind:class="{ 'activated': activated }"): ul
      router-link(:to="`/m/${me._id}`"): li.member 我的主页
      a: li.message 站内消息
      router-link(:to="`/m/${me._id}/settings`"): li.settings 个人设置
      a(@click="switchTheme"): li(:class="theme === 'light' ? 'night-mode' : 'day-mode'") 切换主题
      a(@click="signout"): li.signout 退出登录
</template>

<script>
import api from '../api';

export default {
  name: 'member-control',
  data () {
    return {
      activated: false,
    };
  },
  computed: {
    me () {
      return this.$store.state.me;
    },
    theme () {
      return this.$store.state.theme;
    },
  },
  methods: {
    switchTheme () {
      this.$store.commit('switchTheme');
    },
    trigger () {
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
    signout () {
      api.v1.member.signout().then(() => {
        // refresh
        window.location.href = window.location.href;
      });
    },
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.avatar-container {
  $avatar_width: 30px;
  $avatar_height: 30px;
  font-size: 0px;

  button.avatar {
    width: $avatar_width;
    height: $avatar_height;
    padding: 0;
    border-radius: $avatar_width / 2;
    overflow: hidden;
    border: none;
    cursor: pointer;
    box-sizing: border-box;

    &:focus {
      outline: none;
    }

    .avatar-image {
      width: $avatar_width;
      height: $avatar_height;
      background-size: cover;
    }
  }

  div.dropdown-wrapper {
    width: 0;
    height: 0;
    position: relative;
    display: block;
  }

  div.menu {
    $width: 150px;
    position: absolute;
    top: 8px;
    right: -$avatar_width / 2;
    width: $width;
    border-radius: 4px;
    font-size: initial;
    transition: all ease 0.2s;

    opacity: 0;
    transform: translateY(-6px);
    pointer-events: none;

    &.activated {
      opacity: 1;
      transform: none;
      pointer-events: initial;
    }

    a {
      cursor: pointer;
      display: block;
    }

    li {
      text-align: center;
      font-size: 0.9em;
      height: 2.2em;
      line-height: 2.2em;
    }

    li::before {
      content: '';
      display: inline-block;
      background-size: cover;
      width: 1em;
      height: 1em;
      margin-right: .5em;
      vertical-align: baseline;
    }

    li::after {
      content: '';
      display: inline-block;
      width: 0.5em;
    }

    li.member::before {
      background-image: url(../assets/member.svg);
    }

    li.settings::before {
      background-image: url(../assets/settings.svg);
    }

    li.signout::before {
      background-image: url(../assets/signout.svg);
      margin-bottom: -2px; // Fix to baseline
    }

    li.night-mode::before {
      background-image: url(../assets/night-mode.svg); 
    }

    li.day-mode::before {
      background-image: url(../assets/day-mode.svg); 
    }

    li.message::before {
      background-image: url(../assets/message.svg); 
    }
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 10px 0;
  }
}

.light-theme div.avatar-container {
  div.menu {
    background: white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
    li:hover {
      background-color: mix($theme_color, white, 10%);
    }
    li {
      color: mix($theme_color, black, 80%);
    }
  }
}

.dark-theme div.avatar-container {
  div.menu {
    background: #181818;
    box-shadow: 0 1px 4px black;
    li:hover {
      background-color: mix($theme_color, black, 10%);
    }
    li::before {
      filter: grayscale(100%);
    }
  }
}

</style>