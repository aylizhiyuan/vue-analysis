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