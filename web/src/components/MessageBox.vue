<template lang="pug">
  div.message-box-wrapper
    div.message-box-container(v-bind:class="{ active: showing }", v-on:mousewheel="scrollHelper($event)")
      div.message-box
        h1.title {{ state.title }}
        div.message(v-if="state.html" v-html="state.message")
        div.message(v-else="state.html" v-text="state.message")
        div.form(v-if="state.type === 'INPUT' || state.type === 'PASSWORD'"): form(v-on:submit.prevent="OK")
          input(type="text", v-show="state.type === 'INPUT'", v-model="text")
          input(type="password", v-show="state.type === 'PASSWORD'", v-model="text", autocomplete="new-password")
        div.controls
          button.button(v-if="state.type === 'CANCEL' || state.type === 'OKCANCEL' || state.type === 'INPUT' || state.type === 'PASSWORD'" @click="Cancel") CANCEL
          button.button(v-if="state.type === 'OK' || state.type === 'OKCANCEL' || state.type === 'INPUT' || state.type === 'PASSWORD'" @click="OK") OK
</template>

<script>
export default {
  name: 'message-box',
  data () {
    return {
      showing: false,
      text: '',
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
        this.state.promise.resolve(this.text);
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
        this.text = '';
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
    border-radius: 5px;
    padding: 13px 20px;
    transition: all ease 0.2s;
    margin: 0 20px;
    user-select: none;

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

    div.form {
      margin: 0 0 0.3em 0;
      padding: 0.3em 0;

      input {
        border: none;
        &:focus {
          outline: none;
        }
        width: 100%;
      }
    }

    div.controls {
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
    &:hover {
      background: rgba(white, 0.1);
    }
  }

  div.message-box {
    background: #444;
    color: white;
    box-shadow: 2px 2px 10px #000;
  }

  div.form {
    border-bottom: 1px solid #888;
    input {
      background: rgba(black, 0);
      color: white;
    }
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

  div.message-box {
    background: white;
    box-shadow: 2px 2px 10px #888;
  }

  div.form {
    border-bottom: 1px solid $theme_color;
  }
}
</style>
