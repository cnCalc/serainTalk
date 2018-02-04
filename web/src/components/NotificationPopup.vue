<template lang="pug">
  .notification-popup-wrapper
    transition-group(name="list-complete" tag="div")
      div.notification-item(v-for="(item, index) in items" :key="item" @click="items.splice(index, 1)") {{ item }}
</template>

<script>
export default {
  name: 'notification-popup',
  data () {
    return {
      items: [],
    };
  },
  created () {
    window.insertItem = (item) => {
      this.items.push(item);
    }
  },
};
</script>

<style lang="scss">
.notification-popup-wrapper {
  width: fit-content;
  height: 500px;
  top: 50px;
  right: 0;
  margin: 10px;
  position: fixed;
  pointer-events: none;
  display: flex;

  .notification-item {
    // display: inline-block;
    // width: 100%;
    max-width: 320px;
    width: 100vw;
    min-height: 50px;
    background: white;
    text-align: left;
    border-radius: 4px;
    margin: 0 0 15px 0;
    padding: 5px;
    font-size: 14px;
    box-shadow: 0 0 5px rgba(black, 0.5);
    pointer-events: initial;
    transition: all 0.3s;
  }
}

.list-complete-enter, .list-complete-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-complete-leave-active {
  position: absolute;
}
</style>
