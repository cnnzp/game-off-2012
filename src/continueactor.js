
__resources__["/continueactor.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var Actor = require("node").Actor;
var m = require("model");
var debug =require("debug");
var geo = require("geometry");

var StarModel = m.Model.extend(
  [],
  {
    initialize:function(param)
    {
      debug.assert(param.r != undefined && param.fill != undefined, "param error");
      
      this.execProto("initialize", param);

      this.slot("type", "star");
    },
  });

function drawStar(ctx,r){
  ctx.save();
  ctx.beginPath()
  ctx.moveTo(r,0);
  for (var i=0;i<9;i++){
    ctx.rotate(Math.PI/5);
    if(i%2 == 0) {
      ctx.lineTo((r/0.525731)*0.200811,0);
    } else {
      ctx.lineTo(r,0);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

var drawStarModel = function(m, painter)
{
  var ctx = painter.exec("sketchpad");

  ctx.save();
  
  ctx.fillStyle = m.slot("fill");
  
  drawStar(ctx, m.slot("r"));

  ctx.restore();
};

require('painter').HonestPainter.register('star', {bbox:function(){return new geo.Rect(0, 0, 0, 0);}, draw:drawStarModel, inside:function(){return false;}});

var continueActorCtor = function(level, star, continuation)
{
  var baseModel = m.ConvexModel.create({vertexes:[{x:0, y:0}, {x:150, y:0}, {x:150, y:65}, {x:0, y:65}], stroke:"rgb(0, 0, 0)"});
  
  var sm = []
  ,   starModel = m.rotateModel(StarModel.create({r:10, fill:"red"}), -Math.PI/9.6);

  for (var i = 0; i<star; i++)
  {
    sm.push(m.translateModel(starModel, i*20, 0));
  }
  sm = m.overlap.apply(undefined, sm);

  var cmbg = m.ConvexModel.create({vertexes:[{x:0, y:0}, {x:60, y:0}, {x:60, y:30}, {x:0, y:30}], stroke:"rgb(0, 0, 0)"});
  var cmcontent = m.TextModel.create({text:"next", fill:"rgb(0, 0, 0)"});

  var cmbgbbox = require("director").director().exec("defaultPainter").exec("bbox", cmbg);
  var mc = m.overlap(cmbg, m.translateModel(m.moveRelative(-0.5, -0.7, cmcontent), cmbgbbox.size.width/2, cmbgbbox.size.height/2));

  var model = m.overlap(baseModel, m.translateModel(m.overlap(sm, m.tagModel(m.translateModel(mc, 60, -15), "next")), 20, 30));
  model = m.moveRelative(-0.5, -0.5, model);

  var mouseClickedCB = function(evt, a)
  {
    if (evt.modelPath == "next")
    {
      var painter = require("director").director().exec("defaultPainter");
      var canvas = painter.exec("sketchpad").canvas;

      switch(evt.type)
      {
      case "mouseClicked":
        continuation();
        break;
      case "mouseOver":
        canvas.style.cursor = "hand";
        break;
      case "mouseOut":
        canvas.style.cursor = "default";
        break;
      }
    }

  };

  var a = Actor.create({model:model, level:level});
  a.exec("addEventListener", "mouseClicked", mouseClickedCB);
  a.exec("addEventListener", "mouseOver", mouseClickedCB);
  a.exec("addEventListener", "mouseOut", mouseClickedCB);
  return a;
};

exports.continueActorCtor = continueActorCtor;
exports.StarModel = StarModel;

}};