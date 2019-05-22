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









