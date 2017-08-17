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
  $size: 28px;

  position: relative;
  margin: 0;
  padding: 20px;
  height: $size;

  ul {
    display: inline-block;
    list-style: none;
    padding: 0;
    margin-left: 85px;
    position: absolute;
    right: 0;
    margin: 0;
  }

  li {
    display: inline-block;
    width: $size;
    height: $size;
    font-size: 14px;
    line-height: $size;
    text-align: center;
    cursor: pointer;
    margin-right: -1px;
  }

  li:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  li:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

}

.light-theme nav.pagination {
  li {
    color: mix($theme_color, white, 90%);
    border: 1px solid mix($theme_color, white, 20%);
  }

  li:hover {
    background-color: mix($theme_color, white, 20%);
  }

  li.active {
    color: mix($theme_color, white, 10%);
    border: 1px solid mix($theme_color, white, 90%);
    background-color: mix($theme_color, white, 90%);
  }
}

.dark-theme nav.pagination {
  li {
    color: #aaa;
    border: solid 1px #aaa;
  }

  li:hover {
    background-color: #444;
  }

  li.active {
    color: black;
    border: 1px solid #888;
    background-color: #888;
  }
}

</style>