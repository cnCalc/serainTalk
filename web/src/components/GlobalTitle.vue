<template lang="pug">
  div.jumbotron(v-if="title !== ''")
    div.mobile-member-view-placeholder(v-if="isMobileMemberView")
    h1 {{ decodeHTML(title) }}
    h2 {{ decodeHTML(subtitle) }}
</template>

<script>
import decodeHTML from '../utils/decodeHTML';

export default {
  name: 'GlobalTitle',
  computed: {
    title () {
      return this.$store.state.globalTitle.title || '';
    },
    subtitle () {
      return this.$store.state.globalTitle.subtitle || '';
    },
    isMobileMemberView () {
      return this.$store.state.globalTitle.isMobileMemberView;
    },
  },
  methods: {
    decodeHTML,
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.jumbotron {
  min-height: 120px;
  width: 100vw;
  margin-right: calc(50% - 50vw);
  overflow: hidden;
  transition: background linear 0.2s;
  $shadow-color: #444;
  text-shadow: $shadow-color 1px 0 1px, $shadow-color 0 1px 1px, $shadow-color 0 -1px 1px, $shadow-color -1px 0 1px;

  h1, h2 {
    padding: 0 1em;
  }

  h1 {
    font-size: 24px;
    font-weight: 400;
    margin-top: 1.5rem;
  }

  h2 {
    font-size: 18px;
    font-weight: 300;
    margin-bottom: 1.2rem;
  }

  div.mobile-member-view-placeholder {
    @include respond-to(phone) {
      height: 300px;
    }
  }
}

.light-theme {
  div.jumbotron {
    background: #888;
    color: white;
  }
}

.dark-theme {
  div.jumbotron {
    background-color: #333;
    color: lightgray;
  }
}
</style>
