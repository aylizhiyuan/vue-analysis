# 实现一个MVVM框架

## 1. 数据双向绑定的写法

    <div id="app">
        <input type="text" v-model="message">
        {{message}}
    </div>
    <script>
        var vm = new Vue({
            el:"#app",
            data:{
                message:"hello world"
            }
        })
    </script>

思考一下是如何实现当数据变化的时候视图变化？当视图变化的时候如何让数据改变

> Vue实现数据双向绑定的方法：1.模板的编译 2.数据劫持 Object.defineProperty 3.watcher,总的来说就是数据劫持+发布订阅

## 2. 数据劫持

    //Vue实现数据双向绑定的原理是通过数据劫持 + 发布订阅
    let obj = {};
    //定义一个属性
    Object.defineProperty(obj,'name',{
        configurable:ture, //是否可以被删除
        //writable:true,//是否可以修改
        enumerable:true,//是否可枚举
        //value:'lzy',
        get(){
            //当你要获取属性值的时候
        },
        set(){
            //当你要设置属性值的时候
        }
    })

## 3. 发布订阅

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
    function Watcher(fn){
        this.fn = fn;
    }
    Watcher.prototype.update = function(){
        this.fn();
    }
    let watcher = new Watcher(function(){
        alert(1);
    });

    let dep = new Dep();
    dep.addSub(watcher);//添加订阅
    dep.notify();//分发订阅

## 4.模板编译

        var parser = new SimpleHtmlParser();
        var html = '<div id="app">\n<p v-show="show">hello parser</p>\n<!--my-comment-->\n</div>';
        console.log(html)
        // 处理器
        var handler = {
            startElement: function (sTagName, oAttrs) {
                console.log(sTagName, oAttrs)
            },
            endElement: function (sTagName) {
                console.log(sTagName, 'end')
            },
            characters: function (s) {
                console.log(s, 'characters')
            },
            comment: function (s) {
                console.log(s, 'comment')
            }
        };
        // parse
        parser.parse(html, handler);

        

