<template lang="pug">
  div.message-box-wrapper
    div.message-box-container(v-bind:class="{ active: showing }", v-on:mousewheel="scrollHelper($event)")
      div.message-box
        h1.title {{ state.title }}
        div.message(v-if="state.html" v-html="state.message")
        div.message(v-else="state.html" v-text="state.message")
        div.controls
          button.button(v-if="state.type === 'CANCEL' || state.type === 'OKCANCEL'" @click="Cancel") CANCEL
          button.button(v-if="state.type === 'OK' || state.type === 'OKCANCEL'" @click="OK") OK
</template>

<script>
export default {
  name: 'message-box',
  data () {
    return {
      showing: false,
    };
  },
  computed: {
    state () {
      return this.$store.state.messageBox;
    },
  },
  methods: {
    scrollHelper (e) {
      e.stopPropagation();
      e.preventDefault();
    },
    OK () {
      this.showing = false;
      if (this.state.promise instanceof Promise) {
        this.state.promise.resolve();
      }
    },
    Cancel () {
      this.showing = false;
      if (this.state.promise instanceof Promise) {
        this.state.promise.reject();
      }
    },
  },
  watch: {
    state (val, old) {
      if (val.promise === null) {
        this.showing = false;
      } else {
        this.showing = true;
      }
    },
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.message-box-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  pointer-events: none;
  div.message-box-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    transition: all ease 0.2s;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: center;

    > * {
      transform: translateY(-20px);
      opacity: 0;
    }

    &.active {
      pointer-events: initial;
      background-color: rgba(0, 0, 0, 0.3);
      > * {
        transform: none;
        opacity: 1;
      }
    }
  }

  div.message-box {
    margin: 0 auto;
    max-width: 300px;
    flex-grow: 1;
    min-width: 0;
    background: white;
    border-radius: 5px;
    padding: 13px 20px;
    transition: all ease 0.2s;
    box-shadow: 2px 2px 10px #888;
    margin: 0 20px;

    h1 {
      margin: 0;
      padding-bottom: 10px;
      font-size: 18px;
      font-weight: normal;
    }

    div.message {
      font-size: 14px;
      display: block;

      > *:first-child {
        margin-top: 0;
      }

      > *:last-child {
        margin-bottom: 0;
      }
    }

    div.controls {
      // height: 40px;
      margin-top: 10px;
      text-align: right;
    }
  }
  button.button {
    margin: 0.3rem;
    padding: 0.3em 0.5em;
    width: 80px;
    font-size: 14px;
    border: none;

    &:focus {
      outline: none;
    }
  }
}

.dark-theme div.message-box-wrapper {
  button.button {
    background: rgba(0, 0, 0, 0);
    color: lightgrey;
  }
}

.light-theme div.message-box-wrapper {
  button.button {
    background: rgba(0, 0, 0, 0);
    color: $theme_color;
    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
