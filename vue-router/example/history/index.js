var router = new Router({
  id: 'router-view',
  mode: 'history',
  base: '/example/history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: '<div>Home</div>',
      beforeEnter: (next) => {
        console.log('before enter home')
        next()
      },
      afterEnter: (next) => {
        console.log('enter home')
        next()
      },
      beforeLeave: (next) => {
        console.log('start leave home')
        next()
      }
    },
    {
      path: '/bar',
      name: 'bar',
      component: '<div>Bar</div>',
      beforeEnter: (next) => {
        console.log('before enter bar')
        next()
      },
      afterEnter: (next) => {
        console.log('enter bar')
        next()
      },
      beforeLeave: (next) => {
        console.log('start leave bar')
        next()
      }
    },
    {
      path: '/foo',
      name: 'foo',
      component: '<div>Foo</div>'
    }
  ]
})

// setTimeout(function () {
//   router.push({name: 'bar', query: {name: 'bar'}})
//   console.log(router.route)
// }, 1000)
//
// setTimeout(function () {
//   router.go(-1)
// }, 2000)

function jump(path) {
  router.push({path: path})
}

