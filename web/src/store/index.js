import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: {},
    selectedTags: [],
  },
  mutations: {
    setTags: (state, newTagList) => state.selectedTags = newTagList,
  }
})
