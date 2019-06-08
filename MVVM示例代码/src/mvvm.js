class MVVM{
    constructor(options){
        //一上来，先把可用的东西挂载到实例上去
        this.$el = options.el;
        this.$data = options.data;
        //如果有要编译的模板就开始编译
        if(this.$el){
            //用数据和dom进行编译
            new Compile(this.$el,this);
        }
    }
}