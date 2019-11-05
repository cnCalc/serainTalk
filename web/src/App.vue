<template lang="pug">
  div#app(v-bind:class="{ 'dark-theme': isDarkTheme, 'light-theme': isLightTheme }")
    template(v-if="$store.state.theme === 'light'")
      link(href="https://cdn.jsdelivr.net/npm/highlight.js@9.13.1/styles/atelier-dune-light.css" rel="stylesheet")
      meta(name="theme-color" content="#1770B3")
    template(v-else)
      link(href="https://cdn.jsdelivr.net/npm/highlight.js@9.13.1/styles/atelier-dune-dark.css" rel="stylesheet")
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
  name: 'App',
  components: {
    NavBar, GlobalTitle, Editor, NotificationPopup, MessageBox,
  },
  computed: {
    isDarkTheme () {
      return this.$store.state.settings.nightmode;
    },
    isLightTheme () {
      return !this.isDarkTheme;
    },
  },
  beforeMount () {
    // reload session info.
    this.$store.dispatch('fetchCurrentSigninedMemberInfo')
      .then(() => { this.$store.dispatch('fetchNotifications'); })
      .catch(e => {});

    this.bus.initialize();
  },
  mounted () {
    this.$store.dispatch('showMessageBox', {
      title: '特别提醒',
      type: 'OK',
      html: true,
      message: '<p>此论坛（next.cncalc.org）目前处于<b>公开测试</b>阶段，新论坛的数据不会保留，仅作为测试用途。<b>开发团队会在需要进行数据重置时回滚数据。</b></p>'
               + '<p>新的需要保留的正常帖子请<a href="www.cncalc.org" target="_blank" style="color: #1770b3">点击此处</a>发布到老论坛。</p>'
               + '<p>开发团队会在进行数据重置前备份所有数据，若您需要查看这些内容，请前往<b>站务管理</b>分区并在相应置顶帖内进行回复，对此造成的不便深表歉意。</p>',
    });

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
