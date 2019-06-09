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