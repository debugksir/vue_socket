import Vue from 'vue'
import Router from 'vue-router'
import UserClient from '@/components/UserClient'
import DoctorClient from '@/components/DoctorClient'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/user',
      name: 'UserClient',
      component: UserClient
    },{
      path: '/doctor',
      name: 'DoctorClient',
      component: DoctorClient
    }
  ]
})
