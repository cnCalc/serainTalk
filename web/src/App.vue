<template lang="pug">
  div#app(v-bind:class="{ 'dark-theme': isDarkTheme, 'light-theme': isLightTheme }")
    template(v-if="$store.state.theme === 'light'")
      link(href="https://cdn.bootcss.com/highlight.js/9.12.0/styles/atelier-dune-light.min.css" rel="stylesheet")
      meta(name="theme-color" content="#1770B3")
    template(v-else)
      link(href="https://cdn.bootcss.com/highlight.js/9.12.0/styles/atelier-dune-dark.min.css" rel="stylesheet")
      meta(name="theme-color" content="#555555")
    nav-bar
    global-title
    div.container
      keep-alive: router-view(v-if="$route.meta.keepAlive")
      router-view(v-if="!$route.meta.keepAlive")
    editor
    notification-popup
    message-box
</template>

<script>
import NavBar from './components/NavBar.vue';
import GlobalTitle from './components/GlobalTitle.vue';
import Editor from './components/Editor.vue';
import NotificationPopup from './components/NotificationPopup.vue';
import MessageBox from './components/MessageBox.vue';

export default {
  name: 'app',
  components: {
    NavBar, GlobalTitle, Editor, NotificationPopup, MessageBox,
  },
  beforeMount () {
    // reload session info.
    this.$store.dispatch('fetchCurrentSigninedMemberInfo')
      .then(() => { this.$store.dispatch('fetchNotifications'); })
      .catch(e => {});

    // keep SPA
    window.addEventListener('click', event => {
      let target = event.target;
      while (target !== null && target.tagName !== 'A') {
        target = target.parentNode;
      }
      if (target && target.href && target.href.indexOf(window.location.origin) === 0 && target.target !== '_blank') {
        event.preventDefault();
        let url = new window.URL(target.href);
        this.$router.push(url.href.replace(url.origin, ''));
      }
    });
  },
  computed: {
    isDarkTheme () {
      return this.$store.state.settings.nightmode;
    },
    isLightTheme () {
      return !this.isDarkTheme;
    },
  },
  mounted () {
    console.log([
      '%c┌─┐┌┐┌╔═╗┌─┐┬  ┌─┐ ┌─┐┬─┐┌─┐',
      '│  │││║  ├─┤│  │   │ │├┬┘│ ┬',
      '└─┘┘└┘╚═╝┴ ┴┴─┘└─┘o└─┘┴└─└─┘%c',
      'Powered by serainTalk: https://github.com/cnCalc',
      'Contributors         : kasora, ntzyz, ZephRay',
      'Version              : closed beta',
    ].join('\n'), 'color: #1770b3; font-size: 1.7em;', 'color: initial; font-family: monospace');
  },
};
</script>

<style lang="scss">
@import './styles/global.scss';

body {
  margin: 0;
  overflow-y: scroll;
  overflow-x: hidden;
  word-break: break-word;
}

#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  padding-top: 50px;
  box-sizing: border-box;
  min-height: 100vh;
  transition: background-color linear 0.2s;
}

#app.dark-theme {
  background: #222;
}

</style>
