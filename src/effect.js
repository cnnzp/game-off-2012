
__resources__["/effect.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var Actor = require("node").Actor;
var m = require("model");
var createExplode = require("explode").createExplode;
var StarModel = require("continueactor").StarModel;

var dl = [];
var drawEmitter = function(m, painter)
{
  var emitter = m.slot("emitter");

  dl.length = 0;
  emitter.exec("outputAllModels", dl);

  painter.exec("drawDispList", dl);
};

var createEmitterModel = function(emitter)
{
  return m.ProcedureModel.create(
  {
    draw:drawEmitter,
    emitter:emitter
  });
};

var bombEffectActor = function(train)
{
  var emitter = createExplode(function()
                              {
                                return m.CircleModel.create({fill:train.exec("color"), radius:(1+Math.random())*3});
                              }, 
                              0.4,
                             400);

  var model = createEmitterModel(emitter);

  var a = Actor.create({model:model});
  var lastTime;

  a.exec("regUpdate", function(t, actor)
         {
           if (lastTime == undefined)
             lastTime = t;

           emitter.exec("update", (t - lastTime)/1000);
           lastTime = t;
         });

  return a;
};

var successEffectActor = function(train)
{
  var emitter = createExplode(function()
                              {
                                return StarModel.create({fill:train.exec("color"), r:(1+Math.random())*3});
                              }, 
                              0.4,
                             400);

  var model = createEmitterModel(emitter);

  var a = Actor.create({model:model});
  var lastTime;

  a.exec("regUpdate", function(t, actor)
         {
           if (lastTime == undefined)
             lastTime = t;

           emitter.exec("update", (t - lastTime)/1000);
           lastTime = t;
         });

  return a;
};

exports.bombEffectActor = bombEffectActor;
exports.successEffectActor = successEffectActor;
}};