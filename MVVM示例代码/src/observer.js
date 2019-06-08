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
        Object.defineProperties(obj,key,{
            enumerable:true,
            configurable:true,
            get(){
                //当我尝试去取data里面值的时候
                return value;
            },
            set(newValue){
                //当我尝试修改data里面值的时候
                if(newValue != value){
                    this.observe(newValue);//如果是新对象的话，继续劫持
                    value = newValue;
                }
            }
        })
    }
}