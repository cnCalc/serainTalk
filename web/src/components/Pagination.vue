<template lang="pug">
  nav.pagination
    ul(v-if="pages")
      li(@click="move(active - 1)"): span &laquo;
      li(v-for="page in pages" v-bind:class="{active: Number(active) === page}" @click="move(page)"): span {{ page }}
      li(@click="move(active + 1)"): span &raquo;
</template>

<script>
export default {
  name: 'pagination',
  props: ['active', 'length', 'handler', 'max'],
  data () {
    return {
      pages: [],
    };
  },
  methods: {
    move (page) {
      if (page <= 0 || page > this.max || page === this.active) {
        return;
      }
      this.handler && this.handler(page);
    },
    reload () {
      let currentPage = Number(this.active);
      let left = Math.max(1, currentPage - Math.floor(Number(this.length) / 2));
      this.pages = new Array(this.length).fill(0).map((dummy, index) => index + left).filter(i => i <= Number(this.max));
    }
  },
  watch: {
    max () {
      this.reload();
    },
    active () {
      this.reload();
    }
  }
};

</script>

<style lang="scss">
@import '../styles/global.scss';

nav.pagination {
  position: relative;

  ul {
    display: inline-block;
    list-style: none;
    border: 1px solid mix($theme_color, white, 20%);
    border-radius: 4px;
    padding: 0;
    margin-left: 85px;
    position: absolute;
    right: 0;
  }

  $size: 28px;

  li {
    display: inline-block;
    width: $size;
    height: $size;
    font-size: 14px;
    line-height: $size;
    text-align: center;
    color: mix($theme_color, white, 90%);
    cursor: pointer;
  }

  li.active {
    color: mix($theme_color, white, 10%);
    background-color: mix($theme_color, white, 90%);
  }

  li:hover {
    background-color: mix($theme_color, white, 20%);
  }

  li.active:hover {
    color: mix($theme_color, white, 10%);
    background-color: mix($theme_color, white, 90%);
  }

  li:not(:first-child) {
    border-left: 1px solid mix($theme_color, white, 20%);
  }
}
</style>