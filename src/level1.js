
__resources__["/level1.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var m = require("model");
var Actor = require("node").Actor;
var Level = require("level").Level;
var collide = require("collide").collide;
var createPs = require("ps").createPs;
var Train = require("train").Train;
var TrainModel = require("trainmodel").TrainModel;
var createAllSwitcherActors = require("switcheractor").createAllSwitcherActors;
var getAllPS = require("ps").getAllPS;
var util = require("util");
var Button = require("gui/button").Button;
var continueActorCtor = require("continueactor").continueActorCtor;
var ani = require("animate");
var debug = require("debug");

//获取所有需要放置train的path
var getTrainPaths = function(ps)
{
  var paths = getAllPS(ps);

  return paths
    .filter(function(p)
            {
              return p.type == "path";
            })
    .filter(function(path)
            {
              return path.svgPathEle.userProps.train != undefined;
            });
};

//根据train number获取这个train初始放在哪个path上
var getTrainPath = function(ps, number)
{
  var paths = getAllPS(ps);
  
  var p;
  
  paths
    .filter(function(p)
            {
              return p.type == "path";
            })
    .some(function(path)
          {
            if (path.svgPathEle.userProps.train == number)
            {
              p = path;
              return true;
            }
            return false;
          });
  
  return p;
};

var getLevelStar = function(level)
{
  var star = 0;

  level.slot("_trains").forEach(function(train)
                                {
                                  if (train.exec("state") == "success")
                                    star ++;
                                });

  return star;
};

var genOnClickStartButton = function(level)
{
  return function(evt, button)
  {
    switch(evt.type)
    {
    case 'mouseClicked':
      level.exec("start");
      break;
    default:
      break;
    }
  };
};

var genOnNext = function(level)
{
  return function()
  {
    var ca = level.slot("_ca");

    var showingSani = ani.scaleToByTime([0, {x:1, y:1}, 'sine'], [1500, {x:0, y:0}, 'linear']);
    var showingRani = ani.rotateToByTime([0, Math.PI*4, 'sine'], [1500, 0, 'linear']);
    ca.exec("addAnimation", showingSani);
    ca.exec("addAnimation", showingRani);
    
    showingSani.exec("regCBByPercent", 
                     1,
                     function()
                     {
                       level.exec("scene").exec("removeActor", ca);
                       require("main").runNextLevel();
                     });
  };
};

var genAgain = function(level)
{
  return function()
  {
    var ca = level.slot("_ca");

    var showingSani = ani.scaleToByTime([0, {x:1, y:1}, 'sine'], [1500, {x:0, y:0}, 'linear']);
    var showingRani = ani.rotateToByTime([0, Math.PI*4, 'sine'], [1500, 0, 'linear']);
    ca.exec("addAnimation", showingSani);
    ca.exec("addAnimation", showingRani);
    
    showingSani.exec("regCBByPercent", 
                     1,
                     function()
                     {
                       level.exec("scene").exec("removeActor", ca);
                       require("main").runCurLevelAgain();
                     });
  };
};

var createAllTrain = function(level, ps)
{
  //paths is object not array
  var paths = getTrainPaths(ps);
  
  
  return paths.reduce(function(trains, path)
                      {
                        var trainId = path.svgPathEle.userProps.train;
                        var trainColor = path.svgPathEle.userProps.traincolor;
                        var trainSpeed = path.svgPathEle.userProps.speed;
                        
                        var train = Train.create({id:trainId, speed:trainSpeed, level:level, path:path, color:trainColor});
                        var trainModel = TrainModel.create({pipe:train.exec("pipe"), color:trainColor, clocker:train.slot("clocker")});
                        train.exec("setModel", trainModel);

                        trains[trainId] = train;

                        return trains;
                      },
                      []
                     );
};

var Level1 = Level.extend(
  [],
  {
    initialize:function(param)
    {
      this.execProto("initialize", param);
      
      var scene = this.exec("scene");
      
      debug.assert(param.svgDoc != undefined, "parameter error");

      //create map
      var pathmodel = m.Model.create({type:"ps", ps:createPs(param.svgDoc)});
      var psActor = Actor.create({model:pathmodel});
      scene.exec("addActor", psActor);
      
      createAllSwitcherActors(pathmodel.slot("ps"), this)
        .forEach(function(sa)
                 {
                   scene.exec("addActor", sa);
                 });

      //create train
      var trains = createAllTrain(this, pathmodel.slot("ps"));
      trains.forEach(function(train)
                     {
                       scene.exec("addActor", train, psActor);
                       //collide.addTrain(train);

                       //将train放在合适的位置
                       var path = getTrainPath(pathmodel.slot("ps"), train.exec("id"));
                       var bOpposite = path.svgPathEle.userProps.opposite;
                       var pstn = bOpposite ? path.svgPathEle.getEndPstn() : path.svgPathEle.getStartPstn();
                       var otherPstn = bOpposite ? path.svgPathEle.getPointAtLength(path.svgPathEle.getTotalLength() - 5) : path.svgPathEle.getPointAtLength(5);

                       train.exec("triggerEvent");

                       if (bOpposite)
                       {
                         var pstn1 = path.svgPathEle.getPointAtLength(path.svgPathEle.getTotalLength() - 0.1);

                         train.exec("translate", pstn.x, pstn.y);
                         train.exec("triggerEvent");

                         train.exec("translate", pstn1.x, pstn1.y);
                         train.exec("triggerEvent");


                         
                       }
                       else
                       {
                         var pstn1 = path.svgPathEle.getPointAtLength(0.1);
                         
                         train.exec("translate", pstn.x, pstn.y);
                         train.exec("triggerEvent")
                         
                         train.exec("translate", pstn1.x, pstn1.y);
                         train.exec("triggerEvent");
                       }
                     });

      this.slot("_trains", trains);
      
      this.slot("_ps", psActor);

      this.slot("_state", "waiting");

      //create start button
      var start = Button.create({level:this, cb:genOnClickStartButton(this), normalModel:m.TextModel.create({text:"start", fill:"rgb(255, 0, 0)"})});
      scene.exec("addActor", start);
      this.slot("_startActor", start);
      start.exec("translate", 100, 20);

      var s = ani.scaleToByTime(
        [0, {x:1.4, y:1.4}, 'linear'], 
        [1000, {x:2, y:2}, 'linear'], 
        [2000, {x:1.4, y:1.4}, 'linear']
/*        [3000, {x:1.2, y:1.2}, 'linear'], 
        [4000,{x:1, y:1}, 'linear']*/
        );
      start.exec("addAnimation", ani.times(s, Infinity));
      start.exec("scale", 1.4,1.4);

      start.exec("addEventListener",
                "mouseOut",
                (function()
                 {
                   //change cursor to hand
                   var painter = require("director").director().exec("defaultPainter");
                   var canvas = painter.exec("sketchpad").canvas;

                   canvas.style.cursor = "default";
                 }).bind(start));

      start.exec("addEventListener",
                "mouseOver",
                (function()
                 {
                   //change cursor to hand
                   var painter = require("director").director().exec("defaultPainter");
                   var canvas = painter.exec("sketchpad").canvas;

                   canvas.style.cursor = "hand";
                 }).bind(start));

    },
    
    update:function(t, dt)
    {
      this.execProto("update", t, dt);
      
      if (this.slot("_state") == "running")
        collide.resolve();

      if (this.exec("isGameOver") && undefined == this.slot("_ca"))
      {
        //trains 的id从1开始，所以数组的长度要减去1
        var ca = continueActorCtor(this, getLevelStar(this), this.slot("_trains").length-1, genOnNext(this), genAgain(this));
        this.exec("scene").exec("addActor", ca);
        ca.exec("translate", 200, 200, 100);
        ca.exec("scale", 0, 0);

        var showingSani = ani.scaleToByTime([0, {x:0, y:0}, 'sine'], [1500, {x:1, y:1}, 'linear']);
        var showingRani = ani.rotateToByTime([0, 0, 'sine'], [1500, Math.PI*4, 'linear']);
        ca.exec("addAnimation", showingSani);
        ca.exec("addAnimation", showingRani);

        this.slot("_ca", ca);
      }
    },
    
    start:function()
    {
      if (this.slot("_state") != "waiting")
        return;

      this.slot("_trains")
        .forEach(function(train)
                 {
                   var path = train.slot("startPath");
                   path.drive(train, undefined, path.svgPathEle.userProps.opposite);

                   collide.addTrain(train);
                 });

      this.slot("_state", "running");

      this.exec("scene").exec("removeActor", this.slot("_startActor"));
    },

    isGameOver:function()
    {
      var isSomeTrainRunning = 
        this.slot("_trains").some(function(train)
                                  {
                                    var trainState = train.exec("state");
                                    return !(trainState == "died" || trainState == "success");
                                  });

      return !isSomeTrainRunning;
    },
    
    trainDied:function(train)
    {
      collide.rmTrain(train);
    },
    
    trainSuccess:function(train)
    {
      collide.rmTrain(train);
    }
  });
  
exports.Level1 = Level1;

}};