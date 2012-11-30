
__resources__["/switcheractor.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var Klass = require("base").Klass
,   Trait = require("oo").Trait
,   debug = require("debug")
,   Actor = require("node").Actor
,   getAllPS = require("ps").getAllPS
,   m = require("model")

var SwitcherActor = Actor.extend(
  undefined,
  {
    initialize:function(param)
    {
      this.execProto("initialize", param);

      this.slot("_switcher", param.switcher);
      
      this.exec("addEventListener", 
                "mouseClicked", 
                (function()
                 {
                   this.slot("_switcher").doSwitch();

                 }).bind(this));
      
      this.exec("addEventListener",
                "mouseOut",
                (function()
                {
                  //change cursor to hand
                  var painter = require("director").director().exec("defaultPainter");
                  var canvas = painter.exec("sketchpad").canvas;

                  canvas.style.cursor = "default";
                }).bind(this));

      this.exec("addEventListener",
                "mouseOver",
                (function()
                 {
                   //change cursor to hand
                   var painter = require("director").director().exec("defaultPainter");
                   var canvas = painter.exec("sketchpad").canvas;

                   canvas.style.cursor = "pointer";
                 }).bind(this));

      
    },
  });

var createAllSwitcherActors = function(ps, level)
{
  var pses = getAllPS(ps);
  
  var switcherModel = m.ConvexModel.create({vertexes: [{x:0,y:0}, {x:70, y:0}, {x:70, y:70}, {x:0, y:70}],
                                            stroke:"rgb(0, 50, 0)"});
  switcherModel = m.moveRelative(-0.5, -0.5, switcherModel);

  return Object.keys(pses)
    .map(function(k)
         {
           return pses[k];
         })
    .filter(function(ps)
            {
              return ps.type == "switcher";
            })
    .map(function(switcher)
         {
           var a = SwitcherActor.create({model:switcherModel, level:level, switcher:switcher});
           var jointPoint = switcher.getJointPoint();
           a.exec("translate", jointPoint.x, jointPoint.y, -1);

           return a;
         });
};

exports.SwitcherActor = SwitcherActor;
exports.createAllSwitcherActors = createAllSwitcherActors;

}};