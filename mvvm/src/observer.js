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