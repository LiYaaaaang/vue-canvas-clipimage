import Vue from 'vue'
import App from './App.vue'

/* PUBLIC */
import "./assets/reset.min.css";
import "./assets/basic.css";

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')