import Vuex from 'vuex';
import axios from 'axios';

const createStore = () => {
  return new Vuex.Store({
    state: {
      loadedImpulses: [],
      selectedImpulse: {},
      mixLevel: 10,
      playing: false,
    },
    mutations: {
      setImpulses(state, impulses) {
        state.loadedImpulses = impulses;
      },
      setSelectedImpulse(state, impulse) {
        state.selectedImpulse = impulse;
      },
      setMixLevel(state, level) {
        state.mixLevel = level;
      },
      setPlaying(state, playing) {
        state.playing = playing;
      },
    },
    actions: {
      nuxtServerInit(vuexContext, context) {
        return axios
          .get('http://localhost:3000/api/impulses')
          .then((res) => {
            vuexContext.commit('setImpulses', res.data.impulses);
            vuexContext.commit(
              'setSelectedImpulse',
              res.data.impulses[0],
            );
          })
          .catch((e) => context.error(e));
      },
      setImpulses(vuexContext, impulses) {
        vuexContext.commit('setImpulses', impulses);
      },
      setSelectedImpulse(vuexContext, impulse) {
        vuexContext.commit('setSelectedImpulse', impulse);
      },
      setMixLevel(vuexContext, level) {
        vuexContext.commit('setMixLevel', level);
      },
      togglePlay(vuexContext) {
        if (vuexContext.state.playing) {
          vuexContext.commit('setPlaying', false);
        } else {
          vuexContext.commit('setPlaying', true);
        }
      },
    },
    getters: {
      loadedImpulses(state) {
        return state.loadedImpulses;
      },
      selectedImpulse(state) {
        return state.selectedImpulse;
      },
      mixLevel(state) {
        return state.mixLevel;
      },
      playing(state) {
        return state.playing;
      },
    },
  });
};

export default createStore;
