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
        //带v-model
        let attrs = node.attributes;
        Array.from(attrs).forEach(attr=>{
            //判断属性名字是不是包含v-
            let attrName = attr.name;
            if(this.isDirective(attrName)){
                //取到对应的值放到节点的值上面
                let expr = attr.value;
                let [,type] = attrName.split('-');
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
    compile(fragment){
        //递归
        let childNodes = fragment.childNodes;
        console.log(childNodes);
        Array.from(childNodes).forEach(node=>{
            //所有的节点(只是第一层)
            if(this.isElementNode(node)){
                //这里需要编译元素
                this.compileElement(node);
                //是元素节点
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
    getTextVal(vm,expr){
        return expr.replace(/\{\{([^}]+)\}\}/g,(...arguments)=>{
            return this.getVal(vm,arguments[1]);
        });
    },
    text(node,vm,expr){
        //文本处理
        let updateFn = this.update['updateText'];
        let value = this.getTextVal(vm,expr);
        updateFn && updateFn(node,value);
    },
    model(node,vm,expr){
        //输入框的处理
        let updateFn = this.update['updateModel']; 
        updateFn && updateFn(node,this.getVal(vm,expr));
    },
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