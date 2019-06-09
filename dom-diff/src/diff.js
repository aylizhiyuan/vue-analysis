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