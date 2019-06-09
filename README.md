# Vue的实现原理分析

直接去分析源码意义不大

这里，主要是为了单独实现Vue中的每个功能

自己动手实现一遍会更加理解Vue

## 1. 实现MVVM

如何去实现一个MVVM框架呢？MVVM的实际意义就是数据的双向绑定，我们可以将数据跟视图绑定在一起，当数据变化的时候去通知视图变化，当视图变化的时候，同时也可以去影响数据的变化

实现数据的双向绑定是通过 编译模板 + 数据劫持 + 发布订阅这三个单独的功能组合到一起实现的

下面我们来分别看一下这几个功能的简单介绍

### 编译模板

编译模板实际就是把真实的dom获取之后，编译其中的指令和{{}}模板语法

    class Compile{
        constructor(el,vm){
            //判断他是不是一个元素节点，如果不是我们就找到这个元素节点
            this.el = this.isElementNode(el)?el:document.querySelector(el);
            this.vm = vm; 
            if(this.el){
                //1.先把真实的dom移入到内存中
                let fragment = this.node2fragment(this.el);
                //2.编译==> 提取想要的元素节点 v-model 和文本节点 {{}}
                this.compile(fragment);
                //3.把编译好的fragment塞会页面中去
                this.el.appendChild(fragment);
            }
        }
        //专门写一些辅助的方法
        isElementNode(node){
            return node.nodeType === 1;
        }
        isDirective(name){
            return name.includes('v-');
        }


        //核心方法
        node2fragment(el){
            //需要将el中的内容全部放到内存中
            let fragment = document.createDocumentFragment();
            let firstChild;
            //循环取出第一个子元素
            while(firstChild = el.firstChild){
                fragment.appendChild(firstChild);
            }
            return fragment;//内存中的节点
        }
        //编译元素
        compileElement(node){
            //取出所有标签元素上的属性
            let attrs = node.attributes;
            Array.from(attrs).forEach(attr=>{
                //判断属性名字是不是包含v-
                let attrName = attr.name;
                if(this.isDirective(attrName)){
                    //如果我们的属性带有v-指令的话，就是需要解析的指令
                    let expr = attr.value;
                    //expr是我们的指令的值,例如v-model="message"
                    //expr = message
                    //获取到指令的类型,例如model
                    let [,type] = attrName.split('-');
                    //node是我们的标签,vm是我们的实例,expr是v-model的值
                    CompileUtil[type](node,this.vm,expr);
                }
            })
        }
        //编译文本
        compileText(node){
            //带{{}}
            let expr = node.textContent;
            let reg = /\{\{([^}]+)\}\}/g;
            if(reg.test(expr)){
                CompileUtil['text'](node,this.vm,expr);
            }
        }
        //编译我们的文档碎片，将它进行替换
        compile(fragment){
            //这里拿到的是我们的dom第一层的所有元素
            let childNodes = fragment.childNodes;
            Array.from(childNodes).forEach(node=>{
                //所有的节点(只是第一层)
                if(this.isElementNode(node)){
                    //这里需要编译元素
                    this.compileElement(node);
                    //如果是元素节点的话，再递归去调用
                    //例如<div>{{message}}</div>
                    this.compile(node);
                }else{
                    //是文本节点
                    //这里需要编译文本
                    this.compileText(node);
                }
            })
        }
    }
    CompileUtil = {
        getVal(vm,expr){
            expr = expr.split('.');
            return expr.reduce((prev,next)=>{
                return prev[next]; 
            },vm.$data);
        },
        //这一步主要是为了替换{{}}，然后拿到值之后再去取值
        getTextVal(vm,expr){
            return expr.replace(/\{\{([^}]+)\}\}/g,(...arguments)=>{
                return this.getVal(vm,arguments[1]);
            });
        },
        //编译文本的
        //expr可能是{{message.a.b}},也可能是{{a}} {{b}} {{c}}
        text(node,vm,expr){
            //文本处理
            let updateFn = this.update['updateText'];
            //先把括号去掉后再循环取到data中的值
            //这时候,所有带有{{}}的值都正确得到了替换，得到了新的expr
            let value = this.getTextVal(vm,expr); 
            //给所有的数据都加上一个观察者模式,所以这里要循环
            expr.replace(/\{\{([^}]+)\}\}/g,(...arguments)=>{
                new Watcher(vm,arguments[1],(newValue)=>{
                    updateFn && updateFn(node,this.getTextVal(vm,expr));
                });
            });  
            //将新的expr的值插入到节点的内容中去。
            updateFn && updateFn(node,value);
        },
        setVal(vm,expr,value){
            expr = expr.split('.');
            return expr.reduce((prev,next,currentIndex)=>{
                if(currentIndex == expr.length - 1){
                    return prev[next] = value;
                }
                return prev[next];
            },vm.$data);
        },
        //编译v-model指令的
        //expr的值可能是message.a.b.c
        model(node,vm,expr){
            //输入框的处理
            let updateFn = this.update['updateModel']; 
            //这里应该加一个监控,当你在处理指令的时候,添加一个watcher
            new Watcher(vm,expr,(newValue)=>{
                //当值变化后会调用cb将新值传递过来
                updateFn && updateFn(node,this.getVal(vm,expr));
            });
            node.addEventListener('input',(e)=>{
                let newValue = e.target.value;
                this.setVal(vm,expr,newValue);
            })
            updateFn && updateFn(node,this.getVal(vm,expr));
        },
        //更新的方法
        update:{
            //文档更新
            updateText(node,value){
                node.textContent = value;
            },
            //输入框更新
            updateModel(node,value){
                node.value = value;
            }
        }
    }

### 数据劫持

数据劫持实际就是当你修改vm.$data中的数据的时候，我们定义我们的触发行为

    class Observer{
        constructor(data){
            this.observe(data);
        }
        observe(data){
            //要对这个data数据改成set和get的形式
            if(!data || typeof data !== 'object'){
                return;
            }
            //要将数据一一劫持
            //1. 先获取到data的key,value
            Object.keys(data).forEach(key=>{
                //数据劫持
                this.defineReactive(data,key,data[key]);
                this.observe(data[key]);//如果值是一个对象的话，深度劫持
            })
        }
        //定义响应式
        defineReactive(obj,key,value){
            let that = this;
            let dep = new Dep();//每个变化的数据都会对应一个数组，这个数组是存放所有更新的操作
            Object.defineProperty(obj,key,{
                enumerable:true,
                configurable:true, 
                get(){
                    //来到这里了就意味着target里面有值
                    //什么情况下target里面有值呢？
                    //observe中的get()被调用了
                    //你可以理解为每次你new Watcher的时候都会将它放到dep中去
                    Dep.target && dep.addSub(Dep.target);
                    return value;
                },
                set(newValue){
                    //当我尝试修改data里面值的时候
                    if(newValue != value){
                        that.observe(newValue);//如果是新对象的话，继续劫持
                        value = newValue;
                        dep.notify();
                    }
                }
            })
        }
    }
    class Dep {
        constructor(){
            this.subs = [];
        }
        addSub(watcher){
            this.subs.push(watcher);
        }
        notify(){
            this.subs.forEach(watcher=>watcher.update());
        }
    }

### 发布订阅

当数据劫持成功后，每当你修改vm.$data上的值的时候，我们就触发模板的重新编译，更新试图

    //给需要变化的元素添加一个观察者，当数据变化后，执行对应的方法
    class Watcher {
        constructor(vm,expr,cb){
            //初始化
            this.vm = vm;
            this.expr = expr;
            this.cb = cb;
            //先获取一下老的值
            this.value = this.get();

        }
        getVal(vm,expr){ 
            expr = expr.split('.');
            return expr.reduce((prev,next)=>{
                return prev[next]; 
            },vm.$data);
        }
        get(){
            //将所有实例化的watcher都挂载到dep.target上
            //感觉这个方法有点Low
            Dep.target = this;
            //下面的这个方法会调用observe中的get方法
            let value = this.getVal(this.vm,this.expr);
            Dep.target = null;
            return value;
        }
        update(){
            let newValue = this.getVal(this.vm,this.expr);
            let oldValue = this.value;
            if(newValue != oldValue){
                this.cb(newValue);
            }
        }
    }

## 2. 实现虚拟DOM

实现虚拟DOM到真实DOM的转变是为了减少操作DOM的次数，提高性能

### 首先使用createElement实现虚拟DOM到真实DOM的转变

    class Element{
        constructor(type,props,children){
            this.type = type;
            this.props = props;
            this.children = children;
        }
    }
    function setAttr(node,key,value){
        switch(key){
            case 'value':
                if(node.tagName.toUpperCase() === 'INPUT' || node.tagName.toUpperCase() === 'TEXTAREA'){
                    node.value = value;
                }else{
                    node.setAttribute(key,value);
                }
                break;
            case 'style':
                node.style.cssText = value;
                break;    
            default:
                node.setAttribute(key,value);
                break;    
        }
    }
    //type类型，Prop属性,children子成员
    function createElement(type,props,children){
        return new Element(type,props,children);
    }
    //render方法可以将虚拟dom转化为真实的dom
    function render(eleObj){
        let el = document.createElement(eleObj.type);
        for(let key in eleObj.props){
            //循环将属性添加到dom上去
            setAttr(el,key,eleObj.props[key]);
        }
        //拿到所有的子孙元素children
        eleObj.children.forEach(child=>{
            child = (child instanceof Element)?render(child):document.createTextNode(child);
            el.appendChild(child);
        })
        return el;
    }
    function renderDom(el,target){
        target.appendChild(el);
    }
    export {createElement,render,Element,renderDom}

### 将两个不同的虚拟DOM进行比较就是dom diff

将比较后的结果记录在patches中

    function diff(oldTree,newTree){
        let patches = {};
        let index = 0;
        //递归树，比较后的结果放到补丁包中
        walk(oldTree,newTree,index,patches);
        return patches;
    }
    function diffAttr(oldAttrs,newAttrs){
        let patch = {};
        //直接判断老的属性是否跟新的属性一样，如果不一样的话，则放到patch中
        for(let key in oldAttrs){
            if(oldAttrs[key] !== newAttrs[key]){
                patch[key] = newAttrs[key]; //有可能是undefined
            }
        }
        //判断是否有新增的属性
        for(let key in newAttrs){
            //老节点没有新节点的属性
            if(!oldAttrs.hasOwnProperty(key)){
                patch[key] = newAttrs[key];
            }
        }
        //将属性不同的对象返回
        return patch;
    }
    const ATTRS = 'ATTRS';
    const TEXT = 'TEXT';
    const REMOVE = 'REMOVE';
    const REPLACE = 'REPLACE';
    let Index = 0;
    function diffChildren(oldChildren,newChildren,patches){
        //比较老节点的第一个和新的第一个
        oldChildren.forEach((child,idx)=>{
            walk(child,newChildren[idx],++Index,patches);
        });
    }  
    function isString(node){
        return Object.prototype.toString.call(node) === '[object String]';
    }
    function walk(oldNode,newNode,index,patches){
        let currentPatch = [];
        if(!newNode){
            currentPatch.push({type:REMOVE,index:index});
        }else if(isString(oldNode) && isString(newNode)){
            if(oldNode !== newNode){
                //判断文本是否一致
                currentPatch.push({type:TEXT,text:newNode});
            }
        }else if(oldNode.type === newNode.type){
            //先比父元素，看看类型相同不相同
            //比父元素属性,返回一个变化的对象
            let attrs = diffAttr(oldNode.props,newNode.props);
            if(Object.keys(attrs).length > 0){
                currentPatch.push({type:ATTRS,attrs});
            }
            //如果有儿子节点的话，那么遍历儿子节点接着比较
            diffChildren(oldNode.children,newNode.children,patches);
        }else{
            //替换的情况
            currentPatch.push({type:REPLACE,newNode:newNode});
        }
        //当前的父元素确实有补丁的话，放入第一层的补丁包中。
        if(currentPatch.length > 0){
            patches[index] = currentPatch;
        }
    }
    export default diff

    //当节点类型相同的时候，看一下属性是否相同,产生一个属性的补丁包
    // {type:'ATTRS',attrs:{class:'list-group'}} 属性发生变化的补丁包
    // {type:'REMOVE',index:xxx} 新的dom节点被删除了
    //{type:'REPLACE',newNode:newNode} 节点类型不相同，直接回替换
    //{type:'TEXT',text:1}  文本的内容发生了变化

### 使用patch方法将变化以最小的代价更新视图

    import { render,Element } from "./elemnt";

    let allPathes;
    let index = 0;
    function setAttr(node,key,value){
        switch(key){
            case 'value':
                if(node.tagName.toUpperCase() === 'INPUT' || node.tagName.toUpperCase() === 'TEXTAREA'){
                    node.value = value;
                }else{
                    node.setAttribute(key,value);
                }
                break;
            case 'style':
                node.style.cssText = value;
                break;    
            default:
                node.setAttribute(key,value);
                break;    
        }
    }
    function patch(node,patches){
        //打补丁的过程
        allPathes = patches;
        walk(node);
    }
    function walk(node){
        let currrentPatch = allPathes[index++];
        let childNodes = node.childNodes;
        childNodes.forEach(child=>walk(child));
        if(currrentPatch){
            doPatch(node,currrentPatch);
        }
    }
    function doPatch(node,patches){
        patches.forEach(patch=>{
            switch(patch.type){
                case 'ATTRS':
                    for(let key in patch.attrs){
                        let value = patch.attrs[key];
                        if(value){
                            setAttr(node,key,value);
                        }else{
                            node.removeAttribute(key);
                        }
                    }
                    break;
                case 'TEXT':
                    node.textContent = patch.text;
                    break;
                case 'REPLACE':
                    let newNode = (patch.newNode instanceof Element) ?
                    render(patch.newNode):document.creaateTextNode(patch.newNode);
                    node.parentNode.replaceChild(newNode,node);
                    break;
                case 'REMOVE':
                    node.parentNode.removeChild(node);
                    break;
                default:
                    break;        
            }
        })
    }
    export default patch

## 3. 实现vue-router

### 先看一个router的使用方式

    new Router({
    id: 'router-view', // 容器视图
    mode: 'hash', // 模式
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

###    数据驱动

首先是数据驱动，所以我们可以通过一个route对象来表述当前路由状态，比如：

    current = {
        path: '/', // 路径
        query: {}, // query
        params: {}, // params
        name: '', // 路由名
        fullPath: '/', // 完整路径
        route: {} // 记录当前路由属性
    }

current.route内存放当前路由的配置信息，所以我们只需要监听current.route的变化来动态render页面便可。

接着需要监听不同的路由变化，做相应的处理。以及实现hash和history模式。

这里我们延用vue数据驱动模型，实现一个简单的数据劫持，并更新视图。首先定义我们的observer

    class Observer {
    constructor (value) {
        this.walk(value)
    }

    walk (obj) {
        Object.keys(obj).forEach((key) => {
        // 如果是对象，则递归调用walk，保证每个属性都可以被defineReactive
        if (typeof obj[key] === 'object') {
            this.walk(obj[key])
        }
        defineReactive(obj, key, obj[key])
        })
    }
    }

    function defineReactive(obj, key, value) {
    let dep = new Dep()
    Object.defineProperty(obj, key, {
        get: () => {
        if (Dep.target) {
            // 依赖收集
            dep.add()
        }
        return value
        },
        set: (newValue) => {
        value = newValue
        // 通知更新，对应的更新视图
        dep.notify()
        }
    })
    }

    export function observer(value) {
    return new Observer(value)
    }

再接着，我们需要定义Dep和Watcher:

    export class Dep {
    constructor () {
        this.deppend = []
    }
    add () {
        // 收集watcher
        this.deppend.push(Dep.target)
    }
    notify () {
        this.deppend.forEach((target) => {
        // 调用watcher的更新函数
        target.update()
        })
    }
    }

    Dep.target = null

    export function setTarget (target) {
    Dep.target = target
    }

    export function cleanTarget() {
    Dep.target = null
    }

    // Watcher
    export class Watcher {
    constructor (vm, expression, callback) {
        this.vm = vm
        this.callbacks = []
        this.expression = expression
        this.callbacks.push(callback)
        this.value = this.getVal()

    }
    getVal () {
        setTarget(this)
        // 触发 get 方法，完成对 watcher 的收集
        let val = this.vm
        this.expression.split('.').forEach((key) => {
        val = val[key]
        })
        cleanTarget()
        return val
    }

    // 更新动作
    update () {
        this.callbacks.forEach((cb) => {
        cb()
        })
    }
    }

到这里我们实现了一个简单的订阅-发布器，所以我们需要对current.route做数据劫持。一旦current.route更新，我们可以及时的更新当前页面：

    // 响应式数据劫持
    observer(this.current)

    // 对 current.route 对象进行依赖收集，变化时通过 render 来更新
    new Watcher(this.current, 'route', this.render.bind(this))

恩....到这里，我们似乎已经完成了一个简单的响应式数据更新。其实render也就是动态的为页面指定区域渲染对应内容，这里只做一个简化版的render:

    render() {
        let i
        if ((i = this.history.current) && (i = i.route) && (i = i.component)) {
        document.getElementById(this.container).innerHTML = i
        }
    }


### hash 和 history

接下来是hash和history模式的实现，这里我们可以沿用vue-router的思想，建立不同的处理模型便可。来看一下我实现的核心代码：

    this.history = this.mode === 'history' ? new HTML5History(this) : new HashHistory(this)

当页面变化时，我们只需要监听hashchange和popstate事件，做路由转换transitionTo:

    /**
    * 路由转换
    * @param target 目标路径
    * @param cb 成功后的回调
    */
    transitionTo(target, cb) {
        // 通过对比传入的 routes 获取匹配到的 targetRoute 对象
        const targetRoute = match(target, this.router.routes)
        this.confirmTransition(targetRoute, () => {
        // 这里会触发视图更新
        this.current.route = targetRoute
        this.current.name = targetRoute.name
        this.current.path = targetRoute.path
        this.current.query = targetRoute.query || getQuery()
        this.current.fullPath = getFullPath(this.current)
        cb && cb()
        })
    }

    /**
    * 确认跳转
    * @param route
    * @param cb
    */
    confirmTransition (route, cb) {
        // 钩子函数执行队列
        let queue = [].concat(
        this.router.beforeEach,
        this.current.route.beforeLeave,
        route.beforeEnter,
        route.afterEnter
        )
        
        // 通过 step 调度执行
        let i = -1
        const step = () => {
            i ++
            if (i > queue.length) {
                cb()
            } else if (queue[i]) {
                queue[i](step)
            } else {
                step()
            }
        }
            step(i)
    }

这样我们一方面通过this.current.route = targetRoute达到了对之前劫持数据的更新，来达到视图更新。另一方面我们又通过任务队列的调度，实现了基本的钩子函数beforeEach、beforeLeave、beforeEnter、afterEnter。

到这里其实也就差不多了，接下来我们顺带着实现几个API吧：

    /**
    * 跳转，添加历史记录
    * @param location 
    * @example this.push({name: 'home'})
    * @example this.push('/')
    */
    push (location) {
        const targetRoute = match(location, this.router.routes)

        this.transitionTo(targetRoute, () => {
        changeUrl(this.router.base, this.current.fullPath)
        })
    }

    /**
    * 跳转，添加历史记录
    * @param location
    * @example this.replaceState({name: 'home'})
    * @example this.replaceState('/')
    */
    replaceState(location) {
        const targetRoute = match(location, this.router.routes)

        this.transitionTo(targetRoute, () => {
        changeUrl(this.router.base, this.current.fullPath, true)
        })
    }

    go (n) {
        window.history.go(n)
    }

    function changeUrl(path, replace) {
        const href = window.location.href
        const i = href.indexOf('#')
        const base = i >= 0 ? href.slice(0, i) : href
        if (replace) {
        window.history.replaceState({}, '', `${base}#/${path}`)
        } else {
        window.history.pushState({}, '', `${base}#/${path}`)
        }
    }

### 总结hash和history模式

1. hash

随着 ajax 的流行，异步数据请求交互运行在不刷新浏览器的情况下进行。而异步交互体验的更高级版本就是 SPA —— 单页应用。单页应用不仅仅是在页面交互是无刷新的，连页面跳转都是无刷新的，为了实现单页应用，所以就有了前端路由。

类似于服务端路由，前端路由实现起来其实也很简单，就是匹配不同的 url 路径，进行解析，然后动态的渲染出区域 html 内容。但是这样存在一个问题，就是 url 每次变化的时候，都会造成页面的刷新。那解决问题的思路便是在改变 url 的情况下，保证页面的不刷新。在 2014 年之前，大家是通过 hash 来实现路由，url hash 就是类似于：

    http://www.xxx.com/#/login

这种 #。后面 hash 值的变化，并不会导致浏览器向服务器发出请求，浏览器不发出请求，也就不会刷新页面。另外每次 hash 值的变化，还会触发hashchange 这个事件，通过这个事件我们就可以知道 hash 值发生了哪些变化。然后我们便可以监听hashchange来实现更新页面部分内容的操作：

    function matchAndUpdate () {
    // todo 匹配 hash 做 dom 更新操作
    }

    window.addEventListener('hashchange', matchAndUpdate)


2. history

4年后，因为HTML5标准发布。多了两个 API，pushState 和 replaceState，通过这两个 API 可以改变 url 地址且不会发送请求。同时还有 popstate 事件.调用history.pushState()或者history.replaceState()不会触发popstate事件. popstate事件只会在浏览器某些行为下触发, 比如点击后退、前进按钮(或者在JavaScript中调用history.back()、history.forward()、history.go()方法).。

通过这些就能用另一种方式来实现前端路由了，但原理都是跟 hash 实现相同的。用了 HTML5 的实现，单页路由的 url 就不会多出一个#，变得更加美观。但因为没有 # 号，所以当用户刷新页面之类的操作时，浏览器还是会给服务器发送请求。为了避免出现这种情况，所以这个实现需要服务器的支持，需要把所有路由都重定向到根页面。

    function matchAndUpdate () {
    // todo 匹配路径 做 dom 更新操作
    }

    window.addEventListener('popstate', matchAndUpdate)



