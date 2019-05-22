function lzy(options = {}){
    //将所有属性挂载到了$options上
    this.$options = options;
    //data里面就是我们挂载到实例上的数据
    var data = this._data = this.$options.data;
    observe(data);
    //this就代理了this._data
    for(let key in data){
        Object.defineProperty(this,key,{
            enumerable:true,
            get(){
                return this._data[key];//this上多了一个this.a = {a:1}
            },
            set(newVal){
                this._data[key] = newVal;
            }
        })
    }
    initComputed.call(this);
    //编译我们的模板，替换{{}}里面的内容
    new Compile(options.el,this);
}
function initComputed(){
    let vm = this;
    let computed = this.$options.computed;
    Object.keys[computed].forEach(function(key){
        Object.defineProperty(vm,key,{
            get:typeof computed[key] === 'function' ? computed[key] : computed[key].get,
            set(){

            }
        })
    })
}
function Compile(el,vm){
    //el就是我们的替换内容
    vm.$el = document.querySelector(el);
    //创建对应的文档碎片
    let frament = document.createDocumentFragment();
    //循环，将我们要编译的内容放到文档碎片中来
    while(child = vm.$el.firstChild){
        frament.appendChild(child);
    }
    replace(frament);
    function replace(frament){
        //循环每一个节点
        Array.from(frament.childNodes).forEach(function(node){
            let text = node.textContent;
            let reg = /\{\{(.*)\}\}/;
            if(node.nodeType === 3 && reg.test(text)){
                let arr = RegExp.$1.split('.');
                let val = vm;
                arr.forEach(function(key){
                    val = val[key];//取this.a.a
                });
                //添加一个替换的任务
                new Watcher(vm,RegExp.$1,function(newVal){
                    node.textContent = text.replace(/\{\{(.*)\}\}/,newVal);
                })
                node.textContent = text.replace(/\{\{(.*)\}\}/,val);
            }
            if(node.nodeType === 1){
                //元素节点
                let nodeAttrs = node.attributes;
                Array.from(nodeAttrs).forEach(function(attr){
                    let name = attr.name;
                    let exp = attr.value;
                    if(name.indexOf('v-') == 0){
                        node.value = vm[exp];
                    }
                    new Watcher(vm,exp,function(newVal){
                        node.value = newVal;
                    });
                    node.addEventListener('input',function(e){
                        let newVal = e.target.value;
                        vm[exp] = newVal;
                    })
                })
            }
            if(node.childNodes){
                replace(node);
            }
        })
    }
    //把DOM再放到页面中去
    vm.$el.appendChild(frament);
}
function Observe(data){
    let dep = new Dep();
    //这里写我们的主要逻辑
    for(let key in data){
        let val = data[key];
        observe(val);
        Object.defineProperty(data,key,{
            enumerable:true,//可枚举
            get(){
                Dep.target&&dep.addSub(Dep.target);
                return val;
            },
            set(newVal){
                //当你在更改值的时候，如果跟val值不同的话
                //那么需要更新试图
                if(newVal === val){
                    return ;
                }
                val = newVal;//如果以后再获取值的时候，用新值
                observe(val);
                dep.notify();//让所有的函数执行
            }
        })
    }

}
function observe(data){
    if(typeof data !== 'object') return;
    //观察对象，给对象添加objectDefineProperty
    return new Observe(data);
}

//发布订阅
//发布订阅模式
function Dep(){
    this.subs = [];
}
Dep.prototype.addSub = function(sub){
    this.subs.push(sub);//订阅
}
Dep.prototype.notify = function(){
    this.subs.forEach(sub=>sub.update());
}
//这是我们订阅的事件，每一个事件就是一个new Watcher
function Watcher(vm,exp,fn){
    this.vm = vm;
    this.exp = exp;
    this.fn = fn;
    Dep.target = this;
    let val = vm;
    let arr = exp.split('.');
    arr.forEach(function(key){
        val = val[key];
    })
    Dep.target = null;

}
Watcher.prototype.update = function(){
    let val = this.vm;
    let arr = this.exp.split('.');
    arr.forEach(function(key){
        val = val[key];
    })
    this.fn(val);
}

