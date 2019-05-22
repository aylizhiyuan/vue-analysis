# vue-analysis
vue源码分析

## 1. vue初始化

> 5067行  Vue的函数

vue初始化主要干了这么几件事儿：合并配置、初始化生命周期、初始化事件中心、初始化渲染、初始化data/props/computed/watcher

在初始化的最后，检测到如果有el属性，则调用vm.$mount方法挂载vm,挂载的目的就是把模板渲染成最终的DOM，那么接下来分析VUE的挂载过程


## 2. vue实例挂载的实现

> 9033行 $mount函数

> 11857行 $mount函数

vue是通过$mount实例方法去挂载vm的，$mount方法在多个文件中都有定义，因为这个$mount方法的实现是和平台、构建方式都相关的，所以，接下来我们分析下compiler版本的$mount实现

代码首先缓存了原型上的$mount方法，再重新定义该方法

首先，它对el做了限制，Vue不能挂载到body,html这样的根节点上

接下来，如果没有定义render方法，则会把el或者template字符串转化为 render方法

所有的Vue组件都必须通过render方法，它是调用了compileToFunctions方法实现的，最后再调用原先原型上的$mount方法

$mount方法支持传入两个参数，第一个是el,它表示挂载的元素，可以是字符串，也可以是DOM元素，如果是字符串在浏览器环境下会调用query方法转化成DOM元素，第二个参数是跟和服务器渲染有关的

$mount方法实际会去调用 mountComponent方法

> 4012行 mountComponent函数

mountComponent的核心就是先实例化一个渲染Watcher，在它的回调函数中会调用updateComponent方法，在此方法中调用vm._reander方法生成虚拟Node,最终调用vm._update更新DOM

Watcher在这里起到两个作用，一个是初始化的时候会执行回调函数，另一个是当vm实例中的监测的数据发生变化的时候执行回调函数

函数最后判断为根节点的时候设置vm._isMounted为true,表示这个实例已经挂载了，同时执行mounted钩子函数，这里注意vm.$vnode表示Vue实例的父虚拟Node，所以它为null则表示当前是根Vue的实例

## 3. render 

> 3521行  _render函数

这个函数最大的作用应该就是最终通过执行createElement方法返回vnode虚拟DOM

### 虚拟DOM

> 767行 VNode类

这个虚拟DOM就是用一个原生的js去描述一个DOM节点，所以它比创建一个DOM的代价要小很多，在vue中，visual DOM是用VNode这么一个class去描述的

其实 VNode 是对真实 DOM 的一种抽象描述，它的核心定义无非就几个关键属性，标签名、数据、子节点、键值等，其它属性都是都是用来扩展 VNode 的灵活性以及实现一些特殊 feature 的。由于 VNode 只是用来映射到真实 DOM 的渲染，不需要包含操作 DOM 的方法，因此它是非常轻量和简单的。

Virtual DOM 除了它的数据结构的定义，映射到真实的 DOM 实际上要经历 VNode 的 create、diff、patch 等过程。那么在 Vue.js 中，VNode 的 create 是通过之前提到的 createElement 方法创建的，我们接下来分析这部分的实现。

## 4. createElement

> 3344行 createElement函数 

这个函数就是用来创建虚拟DOM的，实际是对_createElement函数的封装，实际调用的是这个。

这里先对 tag 做判断，如果是 string 类型，则接着判断如果是内置的一些节点，则直接创建一个普通 VNode，如果是为已注册的组件名，则通过 createComponent 创建一个组件类型的 VNode，否则创建一个未知的标签的 VNode。 如果是 tag 一个 Component 类型，则直接调用 createComponent 创建一个组件类型的 VNode 节点。对于 createComponent 创建组件类型的 VNode 的过程，我们之后会去介绍，本质上它还是返回了一个 VNode

那么至此，我们大致了解了 createElement 创建 VNode 的过程，每个 VNode 有 children，children 每个元素也是一个 VNode，这样就形成了一个 VNode Tree，它很好的描述了我们的 DOM Tree。

## 5. update

> 3930行 _update函数

这个被调用的时机有两个：一个是首次渲染的时候，一个是数据更新的时候，这个方法的作用就是将VNode渲染成真实的DOM


## 6. 总结

new Vue  ----> init -----> $mount ----> compile ----> render ------> vnode -----> patch -----> DOM

## 7. 组件化

组件化和初始化的时候其实都是调用的render方法，不过不同的是组件化渲染的其实不是一个原生的标签，而是一个Vue的文件

## 8. createComponent

## 9. patch

## 10. 合并配置

## 11. 生命周期

## 12. 组件注册

## 13. 异步组件

## 14. 总结

## 15. 响应式对象

## 16. 依赖收集

## 17. 派发更新

## 18. nextTick

## 19. 检测变化的注意事项

## 20. 计算属性 vs 侦听属性

## 21. 组件更新

## 22.原理图

## 23. 总结

## 24. event

## 25. v-model

## 26. slot

## 27. keep-alive

## 28. transition

## 29. transition-group

## 30. vue-router

## 31. vuex












