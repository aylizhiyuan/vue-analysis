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