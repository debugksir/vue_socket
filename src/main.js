import Vue from 'vue'
import App from './App.vue'
import router from './router/index'
import 'mint-ui/lib/style.css'


Vue.config.productionTip = false

new Vue({
  render: h => h(App),
  router,
  components: { App },
  template: '<App/>'
}).$mount('#app')