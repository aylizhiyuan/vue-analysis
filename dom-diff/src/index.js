import { createElement,render,Element,renderDom } from './elemnt'
import diff from './diff'
import patch from './patch'
let vertualDom1 = createElement('ul',{class:'list'},[
    createElement('li',{class:'item'},['a']),
    createElement('li',{class:'item'},['b']),
    createElement('li',{class:'item'},['c']),
])
let vertualDom2 = createElement('ul',{class:'list-group'},[
    createElement('li',{class:'item'},['1']),
    createElement('li',{class:'item'},['b']),
    createElement('li',{class:'item'},['3']),
])
let el = render(vertualDom1);
renderDom(el,window.root);
let patches = diff(vertualDom1,vertualDom2);
//给元素打补丁，重新更新视图
patch(el,patches);



//dom-diff是比较两个虚拟dom的区别,比较两个对象的区别
//dom-diff的作用根据两个虚拟dom创建出补丁。描述改变的内容
//将这个补丁用来更新dom

