
__resources__["/train.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var Klass = require("base").Klass
,   Trait = require("oo").Trait
,   debug = require("debug")
,   Actor = require("node").Actor
,   TimeStamper = require('director').TimeStamper
,   pipe = require('pipe')
,   ani = require("animate")
,   bombEffectActor = require("effect").bombEffectActor
,   successEffectActor = require("effect").successEffectActor
,   StarModel = require("continueactor").StarModel
,   m = require("model")

var genTimeline = function(svgPathEle, bOpposite, totalTime)
{
   return function(t)
   {
      if (t >= totalTime)
         t = totalTime;
      
      if (bOpposite)
         t = totalTime - t;
      
      return svgPathEle.getPointAtLength(svgPathEle.getTotalLength() * t / totalTime);
   };
};

var Train = Actor.extend(
  [],
  {
    initialize:function(param)
    {
      this.execProto("initialize", param);

       var self = this;

      debug.assert(param.level != undefined  && param.id != undefined, "parameter error");
       this.slot("_level", param.level);
       
      var timeStamp = TimeStamper.create();
      var p = pipe.createEventTrigger(timeStamp);
      this.slot("_pipe", p);
      this.slot("clocker", timeStamp);

      this.slot("_id", param.id);
      this.slot("startPath", param.path);
      this.slot("_color", param.color);
 
      /*
        initialized
        traversing
        stopped
        died
        success
       */
      this.slot("_state", "initialized");

      if (typeof(param.speed) == "number")
        this.slot("_speed", param.speed);

      this.slot("_curPS", undefined);

      this.exec("regUpdate", 
                function()
                {
                  timeStamp.exec("stepForward");
                  if (self.exec("state") == "traversing")
                  {
                    pipe.triggerEvent(p, {type:"curMatrix", matrix:self.exec("matrix"), ps:self.exec("curPS")});
                  }
                });
    },

    triggerEvent:function()
    {
      this.slot("clocker").exec("stepForward", 100);
      
      pipe.triggerEvent(this.slot("_pipe"), {type:"curMatrix", matrix:this.exec("matrix"), ps:this.exec("curPS")});
    },

    pipe:function()
    {
      return this.slot("_pipe");
    },
    
    //这里状态不是为了做状态机，仅仅是为了检查错误
    state:function()
    {
      return this.slot("_state");
    },

    id:function()
    {
      return this.slot("_id");
    },

    setState:function(s)
    {
      //some assert
      debug.assert(s != "traversing" || this.exec("state") != "died", "local error");
      this.slot("_state", s);
    },

    traverse:function(ps, bOpposite)
    {
       var self = this;
       var speed = this.slot("_speed");
       
       var totalTime = ps.svgPathEle.getTotalLength() / speed;
       
       this.exec("setState", "traversing");
       //ani.moveToBySpeed([start, this.slot("_speed")], [end]);
       var traverseAni = ani.Animation.create({
                                                timeline:genTimeline(ps.svgPathEle, bOpposite, totalTime), 
                                                variable:function(val, target)
                                                {
                                                   target.exec("translate", val.x, val.y);
                                                }, 
                                                totalTime:totalTime
                                             });
      
      traverseAni.exec("regCBByPercent", 
                       1, 
                       function()
                       {
                         ps.traverseDown(self, bOpposite);
                       });
      
      this.exec("addAnimation", traverseAni);
      this.slot("_curPs", ps);
    },

    curPS:function()
    {
      return this.slot("_curPs");
    },

    stop:function()
    {
      this.exec("setState", "stopped");
    },

    eatProp:function(prop)
    {
      
    },

    die:function()
    {
      //remove move animation
      this.exec("removeAllAnimations");
      this.exec("setState", "died");
      
      this.slot("_curPs", undefined);

      var scene = this.slot("_level").exec("scene");
      //create effect
      var effectActor = bombEffectActor(this);
      scene.exec("addActor", effectActor);
      var mat = this.exec("matrix");
      effectActor.exec("pushTransform", "matrix", mat);
      effectActor.exec("applyTranslate", 0, 0, 1000);

      this.slot("_level").exec("trainDied", this);
      this.slot("_level").exec("scene").exec("removeActor", this);
    },
    
    success:function()
    {
      this.exec("setState", "success");

      var scene = this.slot("_level").exec("scene");
      
      this.slot("_level").exec("trainSuccess", this);
      //scene.exec("removeActor", this);
      
      var sm = m.rotateModel(StarModel.create({r:15, fill:this.exec("color")}));
      this.exec("setModel", sm);

      //effect
      var scene = this.slot("_level").exec("scene");
      //create effect
      var effectActor = successEffectActor(this);
      scene.exec("addActor", effectActor);
      var mat = this.exec("matrix");
      effectActor.exec("pushTransform", "matrix", mat);
      effectActor.exec("applyTranslate", 0, 0, 1000);
    },

    color:function()
    {
      return this.slot("_color");
    },
  });

exports.Train = Train;

}};