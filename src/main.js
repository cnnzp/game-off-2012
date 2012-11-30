
__resources__["/main.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {
var h = require("helper");
var d = require('director');
var p = require("painter");
var m = require("model");
var ani = require("animate");
var Level = require('level').Level;
var Actor = require("node").Actor;
var isometricView = require("view/isometricview").isometricView;
var extendObjectByTrait = require("oo").extendObjectByTrait;
var createPs = require("ps").createPs;
var Train = require("train").Train;
var TrainModel = require("trainmodel").TrainModel;
var createAllSwitcherActors = require("switcheractor").createAllSwitcherActors;
var geo = require("geometry");
var Level1 = require("level1").Level1;
var levelTrans = require("leveltransition");
var OpenLevel = require("openlevel").OpenLevel;


var levels = [];
var curLevel = 0;
var svgDocs;

var nodelist2Array = function(nl)
{
  var ret = [];

  for (var i = 0; i<nl.length; i++)
  {
    ret.push(nl[i]);
  }
  
  return ret;
};

var getMapDatas = function()
{
  if (!svgDocs)
  {
    var objects = nodelist2Array(document.getElementsByTagName("svg"));
    svgDocs = objects.map(function(object)
                          {
                            //return object.contentDocument;
                            return object;
                          });

    //remove all objects from page
    objects.forEach(function(object)
                    {
                      object.parentNode.removeChild(object);
                    });
    document.getElementById("br").parentNode.removeChild(document.getElementById("br"));
  }
};

var createAllLevels = function()
{

  levels =  svgDocs.map(function(svgDoc)
                        {
                          return Level1.create({svgDoc:svgDoc});
                        });

  return levels;
};

var runNextLevel = function()
{
  document.getElementById("des").style.visibility = "visible";

  var director = require("director").director();

  if (levels.length == 0 || isLastLevel())
  {
    createAllLevels();
    curLevel = 0;
  }
  else
    curLevel += 1;

  if (levels.length == 0)
    return;


  var leaveFun = levelTrans.leaveLevelTransGenerator(director, "left2right");
  var enterFun = levelTrans.enterLevelTransGenerator(director, "left2right");
  var transInfo = levelTrans.SetLevelSequenceTransition.create({ enterTrans:enterFun, leaveTime:1, enterTime:1000}); 
  director.exec("setLevel", levels[curLevel], transInfo);
};

var runCurLevelAgain = function()
{
  var director = require("director").director();

  levels[curLevel] = Level1.create({svgDoc:svgDocs[curLevel]});
  
  var leaveFun = levelTrans.leaveLevelTransGenerator(director, "left2right");
  var enterFun = levelTrans.enterLevelTransGenerator(director, "left2right");
  var transInfo = levelTrans.SetLevelSequenceTransition.create({ enterTrans:enterFun, leaveTime:1, enterTime:1000}); 
  director.exec("setLevel", levels[curLevel], transInfo);
};

var isLastLevel = function()
{
  return curLevel == (levels.length - 1)
};

function main()
{
  var skch = h.createSketchpad(640,480);
//  skch.style.float = "left";

  var gpainter = p.HonestPainter.create(skch);
  var gdirector = d.director({painter: gpainter});

  /*
  var svgDoc1 = document.getElementById("level1").contentDocument;
  var svgDoc2 = document.getElementById("level2").contentDocument;

  document.getElementById("level1").parentNode.removeChild(document.getElementById("level1"));
  document.getElementById("level2").parentNode.removeChild(document.getElementById("level2"));

  var glevel = Level1.create({svgDoc:svgDoc1});
  var gscene = glevel.exec("scene");
  
  
  gdirector.exec("setLevel", glevel); 
   // glevel.exec("start");

  levels.push(glevel);
  levels.push(Level1.create({svgDoc:svgDoc2}));
  
  */
  getMapDatas();

   var ol = OpenLevel.create();
   gdirector.exec("setLevel", ol);
   //runNextLevel();

  var lastTime = Date.now();
  var gclock = 0;
  var dt = 0;

  var times = 0;
  var elapsed = 0;
  function loop()
  {
    var now = Date.now();
    // 这次循环和上次循环的间隔时间，以毫秒为单位
    var dt = now - lastTime;
    //var dt = 30;
    // 游戏世界的绝对时间，以毫秒为单位

    elapsed += dt;
    times ++;

    if (elapsed > 2000)
    {
//      document.getElementById("fps").innerHTML = Math.floor(times * 1000 / elapsed) + "";
      
      elapsed = 0;
      times = 0;
    }

    gclock += dt;
    // 游戏的主更新函数
    gdirector.exec("update", gclock);
    lastTime = now;
  }

  // 确保第一次调用游戏的主更新函数时传递的值是0,0
  gdirector.exec("update", gclock);

  // 以50帧每秒(即每隔20毫秒)的帧率来驱动loop函数
  setInterval(loop, 10);
}

exports.main = main;
exports.isLastLevel = isLastLevel;
exports.runNextLevel = runNextLevel;
exports.runCurLevelAgain = runCurLevelAgain;

}};