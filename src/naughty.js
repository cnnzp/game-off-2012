
__resources__["/naughty.js"] = {meta: {mimetype: "application/javascript"}, data: function(exports, require, module, __filename, __dirname) {


function Circle(x, y, r) {
  this.x = x;
  this.y = y;
  this.r = r;
  this.fateX = -10;
  this.fateY = -10;
  this.destX = -10;
  this.destY = -10;
  this.alpha = 0;
  this.vx = Math.random() - .5 * 5;
  this.vy = Math.random() - .5 * 5;
  
}

function NaughtyText(count, radius, blockSide, 
                     backCanvas, scale,
                     gatherDuration, scatterDuration)
{
  this.count = count;
  this.radius = radius;
  this.blockSide = blockSide;
  this.fadeFactor = 5;
  this.windX = Math.sin(Math.random() * 360) * 3;
  this.windY = Math.cos(Math.random() * 360) * 3;
  this.text = "";
  this.scale = scale;

  this.backCanvas = backCanvas;
  this.canvasContext = backCanvas.getContext("2d");
  var w = backCanvas.width;
  var h = backCanvas.height;

  var elementArray = new Array(count);
  for (var i = 0; i < count; ++i) 
  {
    elementArray[i] = 
      new Circle(Math.floor(Math.random() * w), 
                 Math.floor(Math.random() * h), 
                 radius);
  }
  this.elementArray = elementArray;  


  this.elapse =  0;
  this.gatherDuration  = gatherDuration;
  this.scatterDuration = scatterDuration;

  this.current = this._idleState;
}

NaughtyText.prototype._idleState = function ()
{
  if(0 <= this.elapse)
  {
    this.gather();
    this.current = this._gatherState;
  }
};
    
NaughtyText.prototype._gatherState = function ()
{
  if(this.gatherDuration <= this.elapse)
  {
    this.scatter();
    this.current = this._scatterState;
  }
};

NaughtyText.prototype._scatterState = function ()
{
  if((this.gatherDuration + this.scatterDuration) <= this.elapse)
  {
    this.elapse = 0;
    this.current = this._idleState;
  }
};

NaughtyText.prototype.drawTextTemplate = function (text, x,y) 
{
  this.text = text;
  var ctx = this.canvasContext;

  ctx.clearRect(0, 0, 
               this.backCanvas.width,
               this.backCanvas.height);
  
  ctx.fillStyle = "red";

  //ctx.font="36pt Verdana,san-serif";
  ctx.font="36pt Verdana, Courier New";
  ctx.fillText(this.text, x,y);

  var imageData = ctx.getImageData(0, 0, 
                                   this.backCanvas.width,
                                   this.backCanvas.height);

  var imageWidth = Math.floor(imageData.width);
  var imageHeight = Math.floor(imageData.height);

  var blockSide = this.blockSide; // default 4
  var area = (blockSide * blockSide);
  var centerOffset = Math.floor(blockSide / 2);
  var assignedCount = 0;
  var threshold = 60

  for (var j = 0; j < imageHeight; j = j + blockSide) 
  {
    for (var i = 0; i < imageHeight; i = i + blockSide) 
    {
      var sum = 0;
      for (var ypos = j; ypos < j + blockSide; ++ypos) 
      {
        for (var xpos = i; xpos < i + blockSide; ++xpos) 
        {
          var index = (xpos * 4) * imageData.width + (ypos * 4);
          var red = imageData.data[index];
          sum += red;
        }
      }

      var average = sum / area;
      var ea = this.elementArray;

      if (average > threshold && assignedCount < ea.length) 
      {
        ea[assignedCount].fateX = (j + centerOffset) * this.scale;
        ea[assignedCount].fateY = (i + centerOffset) * this.scale;
        ++assignedCount;
      }
    }
  }

  for (var i = assignedCount; i < ea.length; ++i) 
  {
    ea[i].fateX = -10;
    ea[i].fateY = -10;
  }
}

NaughtyText.prototype.gather = function () 
{
  var ea = this.elementArray;
  for (var i = 0; i < ea.length; ++i) 
  {
    ea[i].destX = ea[i].fateX;
    ea[i].destY = ea[i].fateY;
  }
}

NaughtyText.prototype.scatter = function () 
{
  var windForce = 5;
  this.windX = Math.sin(Math.random() * Math.PI * 2) * windForce;
  this.windY = Math.cos(Math.random() * Math.PI * 2) * windForce;
  var ea = this.elementArray;
  for (var i = 0; i < ea.length; ++i)
  {
    var angle = Math.random() * Math.PI * 2;
    ea[i].vx = (0 + Math.sin(angle)) * this.fadeFactor;
    ea[i].vy = (0 + Math.cos(angle)) * this.fadeFactor;
    ea[i].destX = -10;
    ea[i].destY = -10;
  }
}

NaughtyText.prototype._doUpdate = function () 
{
  var ea = this.elementArray;
  for (var i = 0; i < ea.length; ++i) 
  {
    var e = ea[i];

    if (e.destX >= 0) 
    {
      e.x += (e.destX - e.x) / 4 + ((e.destX - e.x) / 90 * e.vx) + this.windX;
      e.y += (e.destY - e.y) / 4 + ((e.destY - e.y) / 90 * e.vy) + this.windY;
      e.alpha += (1.0 - e.alpha) / 2;
    } 
    else 
    {
      e.x += e.vx + this.windX;
      e.y += e.vy + this.windY;
      e.vy += 1.0; // gravity
      e.alpha *= 0.95  //fade : (.5 + e.alpha) * 0.78//.98
      if (e.alpha < 0) 
      {
        e.alpha = 0;
      }
    }

    var damping = 0.9999;
    this.windX *= damping;
    this.windY *= damping;

    if (e.x < 0) 
    {
      e.x = -e.x;
      e.vx = -e.vx;
    }

    if (e.y < 0) 
    {
      e.y = -e.y;
      e.vy = -e.vy;
    };

    var w = this.backCanvas.width;
    var h = this.backCanvas.height;

    if (e.x > w)
    {
      e.x = w - (e.x - w);
      e.vx = -e.vx;
    }
    
    if (e.y > h) 
    {
      e.y = h - (e.y - h);
      e.vy = -e.vy * 0.45;
    }
  }
}

NaughtyText.prototype.update = function (dt)
{
  this.current();
  this._doUpdate();
  this.elapse += dt;
}

NaughtyText.prototype.draw = function (ctx) 
{
  
  var ea = this.elementArray;
  for (var i = 0; i < ea.length; ++i) 
  {
    var e = ea[i];
    ctx.globalAlpha = e.alpha;
    ctx.beginPath();
    ctx.fillStyle = "#7f007f";
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2, true);
    //ctx.closePath();
    ctx.fill();
  }
}

function init() {
  var ctx = document.getElementById('born_canvas').getContext("2d");
  var WIDTH = document.getElementById("born_canvas").width;
  var HEIGHT = document.getElementById("born_canvas").height;
  var texture = document.getElementById('born_canvas_hidden');

  var nt = new NaughtyText(400, 3, 4, texture, 2, 3000, 1000);
  nt.drawTextTemplate("Left or Right?", 20, 100);
  
  var dt = 33;


  var loop = function ()
  {
    nt.update(dt);
    
    ctx.clearRect(0,0,WIDTH, HEIGHT);
    nt.draw(ctx);
  }
  
  return setInterval(loop, dt)
}


exports.NaughtyText = NaughtyText;

}};