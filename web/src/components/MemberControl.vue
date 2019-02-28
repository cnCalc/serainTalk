<template lang="pug">
  div.avatar-container
    button.avatar(@click="trigger")
      div.avatar-image(v-if="me.avatar" v-bind:style="{ backgroundImage: 'url(' + me.avatar + ')'}")
      div.avatar-fallback(v-else) {{ (me.username || '?').substr(0, 1).toUpperCase() }}
    div.dropdown-wrapper: div.menu(v-bind:class="{ 'activated': activated }"): ul
      router-link(:to="`/m/${me._id}`"): li
        div.icon.member-icon
        div.text {{ i18n('link_my_page') }}
      router-link(to="/message"): li
        div.icon.message-icon
        div.text {{ i18n('link_mails') }}
      router-link(:to="`/m/${me._id}/settings`"): li
        div.icon.settings-icon
        div.text {{ i18n('link_settings') }}
      a(@click="switchTheme"): li
        div(:class="theme === 'light' ? 'icon night-mode-icon' : 'icon day-mode-icon'")
        div.text {{ i18n('link_switch_theme') }}
      a(@click="signout"): li
        div.icon.signout-icon
        div.text {{ i18n('link_sign_out') }}
</template>

<script>
import api from '../api';
import axios from 'axios';

export default {
  name: 'MemberControl',
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
      return axios.put('/api/v1/member/settings/nightmode', { value: !this.$store.state.settings.nightmode }).then(() => {
        this.$store.dispatch('fetchCurrentSigninedMemberInfo');
      });
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

    .avatar-fallback {
      background: mix($theme_color, white, 70%);
      color: white;
      width: $avatar_width;
      line-height: $avatar_height;
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
    right: -$avatar_width;
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
      width: 100%;
      font-size: 0.9em;
      height: 2.2em;
      line-height: 2.2em;
      display: flex;
      align-items: baseline;
    }

    div.icon {
      width: 1em;
      height: 1em;
      background-size: cover;
      margin: 0 0.5em 0 1.5em;
    }

    div.text {
      flex-grow: 1;
      text-align: center;
      margin-right: 2.6em;
    }

    div.icon.member-icon {
      background-image: url(../assets/member.svg);
    }

    div.icon.settings-icon {
      background-image: url(../assets/settings.svg);
    }

    div.icon.signout-icon {
      background-image: url(../assets/signout.svg);
      margin-bottom: -2px; // Fix to baseline
    }

    div.icon.night-mode-icon {
      background-image: url(../assets/night-mode.svg); 
    }

    div.icon.day-mode-icon {
      background-image: url(../assets/day-mode.svg); 
    }

    div.icon.message-icon {
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
    div.icon {
      filter: grayscale(100%);
    }
  }
}

</style>