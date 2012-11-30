
__resources__["/trainmodel.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var Trait = require("oo").Trait
,   Klass = require("base").Klass
,   helper = require("helper")
,   debug = require("debug")
,   geo = require("geometry")
,   util = require("util")
,   Model = require("model").Model
,   pipe = require("pipe")
,   m = require("model")



var createTrainHeadModel = function(color)
{
  var radius = 5;
  var brainbox = m.moveRelative(-0.5, -0.5, m.CircleModel.create({radius:radius, stroke:color}));

  var draw1 = function(m, painter)
  {
    painter.exec("drawModel", brainbox, geo.identityMatrix());
  };

  var draw = function(m, painter)
  {
    var ctx = painter.exec("sketchpad");
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    painter.exec("drawModel", brainbox, geo.identityMatrix());
    
    ctx.beginPath()
    ctx.moveTo(radius, radius);
    ctx.lineTo(2*radius, 2*radius);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(2*radius, 2*radius, 2, 0, Math.PI*2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(-radius, radius);
    ctx.lineTo(-2*radius, 2*radius);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-2*radius, 2*radius, 2, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
  };

  var bbox = function(m, painter)
  {
    return painter.exec("bbox", brainbox);
  };

  var inside = function(m, x, y, painter)
  {
    painter.exec("inside", brainbox, x, y, painter);
  };

  return m.ProcedureModel.create({draw:draw, bbox:bbox, inside:inside});
};

var TrainModel = Model.extend(
  undefined,
  {
    initialize:function(param)
    {
      debug.assert(param.pipe, "param error");
      this.execProto("initialize", param);

      this.slot("_circles", 12);
      this.slot("_radius", 12);
      
      this.slot("_color", param.color);
      
      this.slot("type", "train");

      var ports = [];
       var matrixes = [];
      var models = [];
       
      for (var i = 0; i<this.slot("_circles"); i++)
      {
         var port = pipe.createPort(pipe.delayP(param.pipe, (i)*30*2, param.clocker));
        var matrix = new geo.Matrix(1, 0, 0, 1, -1000, -1000);
         ports.push(port);
        models.push(m.moveRelative(-0.5, -0.5, m.CircleModel.create({radius:5, stroke:param.color})));
         //matrixes.push(matrix);
         matrixes.push({old:matrix, newer:matrix});
      }
      
      models[0] = createTrainHeadModel(param.color);

      this.slot("_models", models);

       this.slot("_ports", ports);
       this.slot("_matrixes", matrixes);
    },
  });

var paintTrain = function(model, painter)
{
  var ctx = painter.exec("sketchpad");

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

   var ports = model.slot("_ports");
   var matrixes = model.slot("_matrixes");
  var models = model.slot("_models");

  for (var i = 0; i<model.slot("_circles"); i++)
  {
    var port = ports[i];
    var pMsg;
    var msg;

    while (pMsg = port.query())
    {
      if (pMsg.content.type == "curMatrix")
      {
        msg = pMsg.content;

        if (msg)
        {
          matrixes[i].old = matrixes[i].newer;
          matrixes[i].newer = msg.matrix;
        }
      }
    }
    

    var p1 = {x:matrixes[i].old.tx, y:matrixes[i].old.ty}
    ,   p2 = {x:matrixes[i].newer.tx, y:matrixes[i].newer.ty};

    var radian = geo.getVectorAngle({x:1, y:0}, geo.ccpSub(p2, p1))- Math.PI/2;
    if (radian)
      painter.exec("drawModel", models[i], geo.matrixRotate(matrixes[i].newer, radian));
    //matrixes[i] = msg.matrix;
    else
      painter.exec("drawModel", model.slot("_models")[i], matrixes[i].newer);
  }
  
  ctx.restore();
};



var trainBBox = function(model, painter)
{
   var boxes = [];
   var circleBox = painter.exec("bbox", model.slot("_models")[0]);

   var matrixes = model.slot("_matrixes");
   for (var i = 0; i<model.slot("_circles"); i++)
   {
     boxes.push(geo.rectApplyMatrix(painter.exec("bbox", model.slot("_models")[i]), matrixes[i].newer));
   }
  boxes.nocache = true;

   return boxes;
};

require('painter').HonestPainter.register('train', {bbox:trainBBox, draw:paintTrain, inside:function(){return false;}});

exports.TrainModel = TrainModel;

}};