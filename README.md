## 1. vue初始化

> 5067行  Vue的函数

Vue函数实际上是一个构造函数，而且他只能通过new Vue实例化

调用_init方法进行初始化的操作

    initMixin(Vue); //我们的_init方法添加到原型上去
    stateMixin(Vue);//原型上添加$data,$prop,$watch原型方法
    eventsMixin(Vue);//原型上添加事件$on,$once,$emit,$off方法
    lifecycleMixin(Vue);//update方法和destroy方法
    renderMixin(Vue);//添加$nextTick和_render方法

我们还会在这个构造函数的原型上扩展一些方法和属性

进入_init内部一探究竟

> 4955行  _init函数

这里面的vm指的应该是new Vue({})返回的实例对象，在这个对象上添加一些属性和方法

mergeOptions 合并配置

initLifecycle(vm) 初始化生命周期

initEvents(vm) 初始化事件

initRender(vm) 初始化渲染

callhook(vm,'beforeCreate') 触发beforeCreate周期

initInjections(vm) 注入器

initState(vm) 初始化data/props/computed/watcher

initProvide(vm) 初始服务

callHook(vm,'created') 触发created周期

最后vm.$mount(vm.$options.el)





## 2. vue实例挂载的实现

> 9033行 $mount函数

> 11857行 $mount函数

vue是通过$mount实例方法去挂载vm的，$mount方法在多个文件中都有定义，因为这个$mount方法的实现是和平台、构建方式都相关的，所以，接下来我们分析下compiler版本的$mount实现

代码首先缓存了原型上的$mount方法，再重新定义该方法

首先，它对el做了限制，Vue不能挂载到body,html这样的根节点上

接下来，如果没有定义render方法，则会把el或者template字符串转化为 render方法（可以理解为使用compileToFunctions写了一个render方法）

所有的Vue组件都必须通过render方法，它是调用了compileToFunctions方法实现的，最后再调用原先原型上的$mount方法

$mount方法支持传入两个参数，第一个是el,它表示挂载的元素，可以是字符串，也可以是DOM元素，如果是字符串在浏览器环境下会调用query方法转化成DOM元素，第二个参数是跟和服务器渲染有关的

$mount方法实际会去调用 mountComponent方法，注意这里的两个$mount方法

> 4012行 mountComponent函数

mountComponent的核心就是先实例化一个渲染Watcher，在它的回调函数中会调用updateComponent方法，在此方法中调用vm._reander方法生成虚拟Node,最终调用vm._update更新DOM

Watcher在这里起到两个作用，一个是初始化的时候会执行回调函数，另一个是当vm实例中的监测的数据发生变化的时候执行回调函数

函数最后判断为根节点的时候设置vm._isMounted为true,表示这个实例已经挂载了，同时执行mounted钩子函数，这里注意vm.$vnode表示Vue实例的父虚拟Node，所以它为null则表示当前是根Vue的实例

## 3. render 

> 3521行  _render函数

    vnode = render.call(vm._renderProxy, vm.$createElement);

这个函数最大的作用应该就是最终通过执行createElement方法返回vnode虚拟DOM

### 虚拟DOM

> 767行 VNode类

这个虚拟DOM就是用一个原生的js去描述一个DOM节点，所以它比创建一个DOM的代价要小很多，在vue中，visual DOM是用VNode这么一个class去描述的

其实 VNode 是对真实 DOM 的一种抽象描述，它的核心定义无非就几个关键属性，标签名、数据、子节点、键值等，其它属性都是都是用来扩展 VNode 的灵活性以及实现一些特殊 feature 的。由于 VNode 只是用来映射到真实 DOM 的渲染，不需要包含操作 DOM 的方法，因此它是非常轻量和简单的。

Virtual DOM 除了它的数据结构的定义，映射到真实的 DOM 实际上要经历 VNode 的 create、diff、patch 等过程。那么在 Vue.js 中，VNode 的 create 是通过之前提到的 createElement 方法创建的，我们接下来分析这部分的实现。

## 4. createElement（核心知识点）

> 3344行 createElement函数 

    new vue({
        render:function(createElement){
            //这个函数是用来用js创建DOM的
            return createElement('div',{
                attr:{
                    id:'app'
                },
                this.message //渲染的数据
            })
        }
        template:"<div id='app'></div>" //实际template也是调用render方法来实现的
    })

这个函数就是用来创建虚拟DOM的，实际是对_createElement函数的封装，实际调用的是这个。

_createElement方法有5个参数，context表示vnode的上下文环境，它是Component类型，tag表示标签，它可以是一个字符串，也可以是一个Component，data表示Vnode的数据，children表示当前vnode的子节点

这个函数里面主要完成的是children规范和vnode创建

### children规范

由于virtual DOM实际上是一个 树状结构，每一个vnode可能还有若干个子节点，这些子节点应该也是vnode类型

        if (normalizationType === ALWAYS_NORMALIZE) {
            children = normalizeChildren(children);
            } else if (normalizationType === SIMPLE_NORMALIZE) {
            children = simpleNormalizeChildren(children);
        }

这里根据normalizationType的不同，调用了normalizeChildren和simpleNormalizeChildren方法

这里不再展开说明，具体可以看虚拟DOM的实现

### vnode创建

> 3410行 以下都属于是vnode创建的整个过程

这里先对 tag 做判断，如果是 string 类型，则接着判断如果是内置的一些节点，则直接创建一个普通 VNode，如果是为已注册的组件名，则通过 createComponent 创建一个组件类型的 VNode，否则创建一个未知的标签的 VNode。 如果是 tag 一个 Component 类型，则直接调用 createComponent 创建一个组件类型的 VNode 节点。对于 createComponent 创建组件类型的 VNode 的过程，我们之后会去介绍，本质上它还是返回了一个 VNode。

## 5. update

> 3930行 _update函数

这个被调用的时机有两个：一个是首次渲染的时候，一个是数据更新的时候，这个方法的作用就是将VNode渲染成真实的DOM

_update的核心就是调用vm.__patch__方法，该方法实际是调用createPatchFunction方法的返回值

> 5839行 createPatchFunction函数



## 6. 总结

new Vue  ----> init -----> $mount(挂载组件,将一个Vue的实例挂载到DOM上) ----> render(创建虚拟DOM) ------> vnode(虚拟DOM) -----> patch（渲染成真实的DOM） -----> DOM(真实的DOM)

## 7. 组件化

组件化和初始化的时候其实都是调用的render方法，不过不同的是组件化渲染的其实不是一个原生的标签，而是一个Vue的文件

## 8. createComponent

> 5962行 createComponent函数

在_createElement方法中，其中有一段逻辑是对参数tag的判断，如果是一个普通的HTML标签的话，则会实例化一个普通的VNode节点，否则的话通过createComponent方法创建一个组件vnode

3个关键逻辑 ：构造子类构造函数，安装组件钩子函数和实例化vnode.

## 9. patch

> 6452行 patch函数

通过前一章我们知道，当我们通过createComponent创建了组件vnode，接下来会走vm._update,执行vm.__patch__去把vnode转化成真正的dom节点。

而patch的过程会调用createElm创建元素节点

## 10. 合并配置

Vue初始化阶段对于Options的合并有两种方式，子组件初始化过程通过initInternalComponent方式要比外部初始化Vue通过mergeOptions的过程要快，合并完的结果保留在vm.$options中


## 11. 生命周期

> 4207行 callHook函数

源码中的最终执行的生命周期的函数都是调用callHook方法，根据传入的字符串hook,去拿到vm.$options[hook]对应的回调函数数组，然后遍历执行，执行的时候把vm作为函数执行的上下文，callHook函数的功能就是调用某个生命周期钩子注册的所有回调函数

### beforeCreate & created

> 4992 beforeCreate钩子 & created钩子

beforeCreate和created函数都是在实例化Vue的阶段，在_init方法中执行的，它是在initState的前后,initState的作用就是初始化props/data/methods/watch/computed属性，那么显然,beforeCreate的钩子函数中就不能获取到props/data中定义的值，也不能调用Methods中定义的函数

在两个钩子函数执行的时候，并没有渲染DOM，所以我们也不能够访问DOM，一般来说，如果组件在加载的时候需要和后端有交互，放在这两个钩子函数执行都可以，如果需要访问props/data等数据的话，就需要使用created钩子函数。

### beforeMount & mounted

> 4038行 beforeMount函数

> 3146行 mounted函数

顾名思义是发生在mount，也就是DOM挂载之前，它的调用实际是在mountComponent函数中

在执行vm._render函数渲染vnode之前，执行了beforeMount钩子函数，在执行完vm._update把vnode patch 到真实的DOM后，执行了mounted钩子


### beforeUpdate & updated

> 4071行 beforeUpdate函数
> 4364行 updated函数

beforeUpdate的执行时机是在渲染Watcher的before函数中

update的执行时机是在flushSchedulerQueue函数调用时候

### beforeDestroy & destroyed

> 3968行 beforeDestroy函数

是在组件销毁的时候，最终会调用$destroy方法

### activated & deactivated

> 4203行 activated函数

专门为keep-alive组件定制的钩子

## 12. 组件注册

其实理解了全局注册的过程，局部注册是非常简单的。在组件的 Vue 的实例化阶段有一个合并 option 的逻辑，之前我们也分析过，所以就把 components 合并到 vm.$options.components 上，这样我们就可以在 resolveAsset 的时候拿到这个组件的构造函数，并作为 createComponent 的钩子的参数。

注意，局部注册和全局注册不同的是，只有该类型的组件才可以访问局部注册的子组件，而全局注册是扩展到 Vue.options 下，所以在所有组件创建的过程中，都会从全局的 Vue.options.components 扩展到当前组件的 vm.$options.components 下，这就是全局注册的组件能被任意使用的原因


## 13. 异步组件

通过以上代码分析，我们对 Vue 的异步组件的实现有了深入的了解，知道了 3 种异步组件的实现方式，并且看到高级异步组件的实现是非常巧妙的，它实现了 loading、resolve、reject、timeout 4 种状态。异步组件实现的本质是 2 次渲染，除了 0 delay 的高级异步组件第一次直接渲染成 loading 组件外，其它都是第一次渲染生成一个注释节点，当异步获取组件成功后，再通过 forceRender 强制重新渲染，这样就能正确渲染出我们异步加载的组件了

## 14. 总结

下面一个章节理解一下响应式的系统底层的细节

## 15. 响应式对象

Object.defineProperty方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性，并返回这个对象

        Object.defineProperty(obj,prop,descriptor)

obj是要在其上定义属性的对象，prop是要定义或修改的属性的名称,descrptor是将被定义或修改的属性描述符

比较核心的是descriptor，它有很多可选键值，get是给一个属性提供的getter方法，当我们访问了该属性的时候会触发getter方法,set是一个给属性提供的setter方法，当我们对该属性做修改的时候会触发setter方法

一旦对象拥有了getter和setter，我们可以简单的把这个对象称为响应式对象

### initState

在Vue的初始化阶段，_init方法执行的时候，会执行initState方法

initState方法主要是对props/methods/data/computed/wathcer等属性做了初始化操作

props的初始化过程，就是遍历定义的Props配置。遍历的构成主要做两个事情：一个是调用defineReactive方法把每个prop对应的值编程响应式，可以通过vm._props.xxx访问到定义props中对应的属性.另一个是通过proxy把vm._props.xxx的访问代理到vm.xxx中

data的初始化主要过程也是两件事，一个是对定义data的函数返回对象的遍历，通过Proxy把每一个值vm._data.xxx都代理到vm.xxx上，另一个是调用observe方法观测整个data的变化，把data也变成响应式，可以通过vm._data.xxx访问到定义data返回函数中对应的属性

Observer是一个类，它的作用是给对象的属性添加getter和setter，用于依赖收集和派发更新

defineReactive的功能是定义一个响应式的对象，给对象动态添加getter和setter

## 16. 依赖收集

getter就是依赖收集

通过这一节的分析，我们对 Vue 数据的依赖收集过程已经有了认识，并且对这其中的一些细节做了分析。收集依赖的目的是为了当这些响应式数据发生变化，触发它们的 setter 的时候，能知道应该通知哪些订阅者去做相应的逻辑处理，我们把这个过程叫派发更新，其实 Watcher 和 Dep 就是一个非常经典的观察者设计模式的实现，下一节我们来详细分析一下派发更新的过程。

## 17. 派发更新

收集的目的就是为了当我们修改数据的时候，可以对相关的依赖派发更新

通过这一节的分析，我们对 Vue 数据修改派发更新的过程也有了认识，实际上就是当数据发生变化的时候，触发 setter 逻辑，把在依赖过程中订阅的的所有观察者，也就是 watcher，都触发它们的 update 过程，这个过程又利用了队列做了进一步优化，在 nextTick 后执行所有 watcher 的 run，最后执行它们的回调函数。nextTick 是 Vue 一个比较核心的实现了，下一节我们来重点分析它的实现。

## 18. nextTick

Vue.js 提供了 2 种调用 nextTick 的方式，一种是全局 API Vue.nextTick，一种是实例上的方法 vm.$nextTick，无论我们使用哪一种，最后都是调用 next-tick.js 中实现的 nextTick 方法

## 19. 检测变化的注意事项

通过这一节的分析，我们对响应式对象又有了更全面的认识，如果在实际工作中遇到了这些特殊情况，我们就可以知道如何把它们也变成响应式的对象。其实对于对象属性的删除也会用同样的问题，Vue 同样提供了 Vue.del 的全局 API，它的实现和 Vue.set 大同小异，甚至还要更简单一些，这里我就不去分析了，感兴趣的同学可以自行去了解。

## 20. 计算属性 vs 侦听属性

通过这一小节的分析我们对计算属性和侦听属性的实现有了深入的了解，计算属性本质上是 computed watcher，而侦听属性本质上是 user watcher。就应用场景而言，计算属性适合用在模板渲染中，某个值是依赖了其它的响应式对象甚至是计算属性计算而来；而侦听属性适用于观测某个值的变化去完成一段复杂的业务逻辑。

同时我们又了解了 watcher 的 4 个 options，通常我们会在创建 user watcher 的时候配置 deep 和 sync，可以根据不同的场景做相应的配置。

## 21. 组件更新

组件更新的过程核心就是新旧 vnode diff，对新旧节点相同以及不同的情况分别做不同的处理。新旧节点不同的更新流程是创建新节点->更新父占位符节点->删除旧节点；而新旧节点相同的更新流程是去获取它们的 children，根据不同情况做不同的更新逻辑。最复杂的情况是新旧节点相同且它们都存在子节点，那么会执行 updateChildren 逻辑，这块儿可以借助画图的方式配合理解。

## 22.原理图

![原理图](https://ustbhuangyi.github.io/vue-analysis/assets/reactive.png)

## 23. 总结

上面的内容就是VUE实现MVVM的原理

## 24. event

那么至此我们对 Vue 的事件实现有了进一步的了解，Vue 支持 2 种事件类型，原生 DOM 事件和自定义事件，它们主要的区别在于添加和删除事件的方式不一样，并且自定义事件的派发是往当前实例上派发，但是可以利用在父组件环境定义回调函数来实现父子组件的通讯。另外要注意一点，只有组件节点才可以添加自定义事件，并且添加原生 DOM 事件需要使用 native 修饰符；而普通元素使用 .native 修饰符是没有作用的，也只能添加原生 DOM 事件。

## 25. v-model

那么至此，v-model 的实现就分析完了，我们了解到它是 Vue 双向绑定的真正实现，但本质上就是一种语法糖，它即可以支持原生表单元素，也可以支持自定义组件。在组件的实现中，我们是可以配置子组件接收的 prop 名称，以及派发的事件名称。

## 26. slot

通过这一章的分析，我们了解了普通插槽和作用域插槽的实现。它们有一个很大的差别是数据作用域，普通插槽是在父组件编译和渲染阶段生成 vnodes，所以数据的作用域是父组件实例，子组件渲染的时候直接拿到这些渲染好的 vnodes。而对于作用域插槽，父组件在编译和渲染阶段并不会直接生成 vnodes，而是在父节点 vnode 的 data 中保留一个 scopedSlots 对象，存储着不同名称的插槽以及它们对应的渲染函数，只有在编译和渲染子组件阶段才会执行这个渲染函数生成 vnodes，由于是在子组件环境执行的，所以对应的数据作用域是子组件实例。

简单地说，两种插槽的目的都是让子组件 slot 占位符生成的内容由父组件来决定，但数据的作用域会根据它们 vnodes 渲染时机不同而不同。

## 27. keep-alive

那么至此，<keep-alive> 的实现原理就介绍完了，通过分析我们知道了 <keep-alive> 组件是一个抽象组件，它的实现通过自定义 render 函数并且利用了插槽，并且知道了 <keep-alive> 缓存 vnode，了解组件包裹的子元素——也就是插槽是如何做更新的。且在 patch 过程中对于已缓存的组件不会执行 mounted，所以不会有一般的组件的生命周期函数但是又提供了 activated 和 deactivated 钩子函数。另外我们还知道了 <keep-alive> 的 props 除了 include 和 exclude 还有文档中没有提到的 max，它能控制我们缓存的个数。

## 28. transition

那么到此为止基本的 <transition> 过渡的实现分析完毕了，总结起来，Vue 的过渡实现分为以下几个步骤：

自动嗅探目标元素是否应用了 CSS 过渡或动画，如果是，在恰当的时机添加/删除 CSS 类名。

如果过渡组件提供了 JavaScript 钩子函数，这些钩子函数将在恰当的时机被调用。

如果没有找到 JavaScript 钩子并且也没有检测到 CSS 过渡/动画，DOM 操作 (插入/删除) 在下一帧中立即执行。

所以真正执行动画的是我们写的 CSS 或者是 JavaScript 钩子函数，而 Vue 的 <transition> 只是帮我们很好地管理了这些 CSS 的添加/删除，以及钩子函数的执行时机。

## 29. transition-group

那么到此，<transtion-group> 组件的实现原理就介绍完毕了，它和 <transition> 组件相比，实现了列表的过渡，以及它会渲染成真实的元素。当我们去修改列表的数据的时候，如果是添加或者删除数据，则会触发相应元素本身的过渡动画，这点和 <transition> 组件实现效果一样，除此之外 <transtion-group> 还实现了 move 的过渡效果，让我们的列表过渡动画更加丰富。

## 30. vue-router

### Vue.use

vue提供了Vue.use的全局API来注册这些插件
Vue.use接受一个plugin参数，并且维护一个_installedPlugins数组，它存储所有注册过的plugin,接着又会判断plugin有没有定义install方法，如果有的话则调用该方法，并且该方法执行的第一个参数是Vue，最后再把plugin存储到installedPlugins中去

可以看到Vue提供的插件注册机制很简单，每个插件都需要实现一个静态的install方法，当我们执行vue.use注册插件的时候，就会执行这个Install方法，并且这个install方法的第一个参数我们就可以拿到Vue对象，这样的好处就是作为插件的别编写方不需要额外的去import Vue了

### 路由安装

vue-router的入口是src/index.js，其中定义了VueRouter类，也实现了install的静态方法 VueRouter.install = install

当用户执行 Vue.use(VueRouter) 的时候，实际上就是在执行 install 函数，为了确保 install 逻辑只执行一次，用了 install.installed 变量做已安装的标志位。另外用一个全局的 _Vue 来接收参数 Vue，因为作为 Vue 的插件对 Vue 对象是有依赖的，但又不能去单独去 import Vue，因为那样会增加包体积，所以就通过这种方式拿到 Vue 对象。

Vue-Router 安装最重要的一步就是利用 Vue.mixin 去把 beforeCreate 和 destroyed 钩子函数注入到每一个组件中。

回到 Vue-Router 的 install 方法，先看混入的 beforeCreate 钩子函数，对于根 Vue 实例而言，执行该钩子函数时定义了 this._routerRoot 表示它自身；this._router 表示 VueRouter 的实例 router，它是在 new Vue 的时候传入的；另外执行了 this._router.init() 方法初始化 router，这个逻辑之后介绍，然后用 defineReactive 方法把 this._route 变成响应式对象，这个作用我们之后会介绍。而对于子组件而言，由于组件是树状结构，在遍历组件树的过程中，它们在执行该钩子函数的时候 this._routerRoot 始终指向的离它最近的传入了 router 对象作为配置而实例化的父实例。

对于 beforeCreate 和 destroyed 钩子函数，它们都会执行 registerInstance 方法，这个方法的作用我们也是之后会介绍。

接着给 Vue 原型上定义了 $router 和 $route 2 个属性的 get 方法，这就是为什么我们可以在组件实例上可以访问 this.$router 以及 this.$route，它们的作用之后介绍。

接着又通过 Vue.component 方法定义了全局的 <router-link> 和 <router-view> 2 个组件，这也是为什么我们在写模板的时候可以使用这两个标签，它们的作用也是之后介绍。

最后定义了路由中的钩子函数的合并策略，和普通的钩子函数一样。

### 总结

那么到此为止，我们分析了 Vue-Router 的安装过程，Vue 编写插件的时候通常要提供静态的 install 方法，我们通过 Vue.use(plugin) 时候，就是在执行 install 方法。Vue-Router 的 install 方法会给每一个组件注入 beforeCreate 和 destoryed 钩子函数，在 beforeCreate 做一些私有属性定义和路由初始化工作，下一节我们就来分析一下 VueRouter 对象的实现和它的初始化工作。

那么到此，matcher 相关的主流程的分析就结束了，我们了解了 Location、Route、RouteRecord 等概念。并通过 matcher 的 match 方法，我们会找到匹配的路径 Route，这个对 Route 的切换，组件的渲染都有非常重要的指导意义。下一节我们会回到 transitionTo 方法，看一看路径的切换都做了哪些事情。

那么至此我们把路由的 transitionTo 的主体过程分析完毕了，其他一些分支比如重定向、别名、滚动行为等同学们可以自行再去分析。

路径变化是路由中最重要的功能，我们要记住以下内容：路由始终会维护当前的线路，路由切换的时候会把当前线路切换到目标线路，切换过程中会执行一系列的导航守卫钩子函数，会更改 url，同样也会渲染对应的组件，切换完毕后会把目标线路更新替换当前线路，这样就会作为下一次的路径切换的依据。



## 31. vuex

Vuex 应用的核心就是 store（仓库）。“store”基本上就是一个容器，它包含着你的应用中大部分的状态 (state)。有些同学可能会问，那我定义一个全局对象，再去上层封装了一些数据存取的接口不也可以么？

Vuex 和单纯的全局对象有以下两点不同：

Vuex 的状态存储是响应式的。当 Vue 组件从 store 中读取状态的时候，若 store 中的状态发生变化，那么相应的组件也会相应地得到高效更新。

你不能直接改变 store 中的状态。改变 store 中的状态的唯一途径就是显式地提交 (commit) mutation。这样使得我们可以方便地跟踪每一个状态的变化，从而让我们能够实现一些工具帮助我们更好地了解我们的应用。

另外，通过定义和隔离状态管理中的各种概念并强制遵守一定的规则，我们的代码将会变得更结构化且易维护。

### 总结

那么至此，Vuex 的初始化过程就分析完毕了，除了安装部分，我们重点分析了 Store 的实例化过程。我们要把 store 想象成一个数据仓库，为了更方便的管理仓库，我们把一个大的 store 拆成一些 modules，整个 modules 是一个树型结构。每个 module 又分别定义了 state，getters，mutations、actions，我们也通过递归遍历模块的方式都完成了它们的初始化。为了 module 具有更高的封装度和复用性，还定义了 namespace 的概念。最后我们还定义了一个内部的 Vue 实例，用来建立 state 到 getters 的联系，并且可以在严格模式下监测 state 的变化是不是来自外部，确保改变 state 的唯一途径就是显式地提交 mutation。

这一节我们已经建立好 store，接下来就是对外提供了一些 API 方便我们对这个 store 做数据存取的操作，下一节我们就来从源码角度来分析 Vuex 提供的一系列 API。












