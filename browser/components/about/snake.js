var gameSession = null;

const DEFAULT_SNAKE_CONFIG = {
  gridSize: 30,  
  preferWidth: true,
  roundEdges: 0,
  base: '.screen',
  initialSpeed: 2,
  growAmount: 2,
  speedBump: 1.2,
  bgColour: '#222222',
  snakeColour: 'red',
  targetColour: 'blue',
  edgeColour: 'green'
};

const svgNS = "http://www.w3.org/2000/svg";


class GridSnake {
  
  constructor(options = {}) {    
    const config = { ...DEFAULT_SNAKE_CONFIG, ...options };
    
    this.config = config;
    this.animatorID = -1;
    this.xdirection = 0;
    this.ydirection = 0;
    this.moving = 0;

    this.hostObject = null;
    this.screenWidth = 0;
    this.screenHeight = 0;
    this.snakeParts = [];
    this.pixelsWide = 30;
    this.pixelsHigh = 30;
    this.pixelWidth = 0;
    this.pixelHeight = 0;
    this.xmargin = 10;
    this.ymargin = 10;

    this.RoughTime = 0;
    this.CoarseTime = 0;
    this.LastTimeUpdate = 0;
    this.TimeResolution = 1;
    this.lastTime = 0;

    this.alive = true;

  }

  start() {
    this.registerWindowEvents();
    this.setupScreen();
  }

  reset() {
    this.moving = false;
    this.alive = true;
    this.setupScreen();
  }

  //Register Window Handlers
  registerWindowEvents() {
        window.addEventListener('resize',function () {
            console.log("Resized Parent Window");
            setupScreen();
        })    

        window.addEventListener('keydown',(ev) => {
            if ((ev.code == 'ArrowRight') || (ev.code == "KeyD"))
            {
                this.xdirection = 1;
                this.ydirection = 0;
                this.moving = true;
            }

            if ((ev.code == 'ArrowLeft') || (ev.code == "KeyA"))
            {
                this.xdirection = -1;
                this.ydirection = 0;
                this.moving = true;
            }

            if ((ev.code == 'ArrowUp') || (ev.code == "KeyW"))
            {
                this.xdirection = 0;
                this.ydirection = -1;
                this.moving = true;
            }

            if ((ev.code == 'ArrowDown') || (ev.code == "KeyS"))
            {
                this.xdirection = 0;
                this.ydirection = 1;
                this.moving = true;
            }

            if (ev.code == "KeyR")
            {
                this.reset();
            }

            if (ev.code == "KeyO")
            {
                this.TimeResolution *= 0.8;
            }

            if (ev.code == "KeyP")
            {
                this.TimeResolution *= 1.2;
            }
        })
    }

    setupScreen() {
        this.hostObject = document.querySelector(this.config.base);
        var bounds = this.hostObject.getBoundingClientRect();
        var screenWidth = bounds.width - 20;// - (this.xmargin*2);
        var screenHeight = bounds.height - 20;// - (this.ymargin*2);

        var xw = screenWidth / this.config.gridSize;
        var yw = screenHeight / this.config.gridSize;

        if (xw > yw)
        {
            this.pixelHeight = yw;
            this.pixelWidth = yw;
            this.xmargin = (screenWidth - (yw * this.config.gridSize))/2;
            this.ymargin = 10;            
        }
        else
        {
            this.pixelHeight = xw;
            this.pixelWidth = xw;
            this.ymargin = (screenHeight - (xw * this.config.gridSize))/2;
            this.xmargin = 10;            
        }      
        
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.TimeResolution = this.config.initialSpeed;

        this.hostObject.replaceChildren();
        this.createMainElements();
    }

    createMainElements() {

        this.stopGame();

        //Background
        const bg = document.createElementNS(svgNS,"rect");
        bg.setAttribute("x",0);
        bg.setAttribute("y",0);
        bg.setAttribute("width",this.screenWidth);
        bg.setAttribute("height",this.screenHeight);
        bg.setAttribute("fill",this.config.bgColour);

        this.hostObject.appendChild(bg);

        //Margin
        const mar = document.createElementNS(svgNS,"rect");
        mar.setAttribute("x",this.xmargin);
        mar.setAttribute("y",this.ymargin);
        mar.setAttribute("width",this.screenWidth-(this.xmargin*2));
        mar.setAttribute("height",this.screenHeight-(this.ymargin*2));
        mar.setAttribute("stroke",this.config.edgeColour);
        mar.setAttribute("stroke-width",3);
        mar.setAttribute("fill","none");

        this.hostObject.appendChild(mar);

        this.target = this.createTargetPiece();        

        //Snake
        this.snakeParts = [];

        const p = {};
        p.x = 1;
        p.y = 1;
        p.piece = this.createSnakePiece(1,1);
        this.snakeParts.push(p);    
        this.updateSnake();

        this.headX = 1;
        this.headY = 1;

        this.spawnTarget();
        
        this.animatorID = requestAnimationFrame(this.animate);
        this.currentHead = 0;
    }

    spawnTarget() {        

        var tries = 0;
        var valid = false;
        while(valid == false)
        {
            //Time-out / Brute Force if no space can be found.
            tries++;
            if (tries > 100) 
            {
                this.gameWon();
                break;
            }

            //Make new random position
            var tx = Math.floor(Math.random() * this.config.gridSize);
            var ty = Math.floor(Math.random() * this.config.gridSize);
            
            valid = true;
            //Check for snake at location...
            for(var x=0;x<this.snakeParts.length;x++)
            {
                if (this.snakeParts[x].x == tx)
                {
                    if (this.snakeParts[x].y == ty)
                    {
                        valid = false;
                        break;
                    }
                    if (valid == false) break;
                }
            }            
            if (tx == this.config.gridSize) valid = false;
            if (ty == this.config.gridSize) valid = false;
        }

        this.target.setAttribute("cx",((tx+0.5) * this.pixelWidth)+this.xmargin);
        this.target.setAttribute("cy",((ty+0.5) * this.pixelHeight)+this.ymargin);

        this.targetX = tx;
        this.targetY = ty;
    }

    createSnakePiece(x,y) {
        const p = document.createElementNS(svgNS,"rect");        
        p.setAttribute("width",this.pixelWidth);
        p.setAttribute("height",this.pixelHeight);
        p.setAttribute("fill",this.config.snakeColour);

        this.hostObject.appendChild(p);
        return p;
    }

    createTargetPiece(x,y) {
        const p = document.createElementNS(svgNS,"circle");        
        p.setAttribute("r",this.pixelWidth/2);        
        p.setAttribute("fill",this.config.targetColour);

        this.hostObject.appendChild(p);        
        return p;
    }

    frame(tm) {
        if (!this.lastTime) {
            this.lastTime = tm;
        }

        // 2. Calculate delta time in seconds (ms / 1000)
        const deltaTime = (tm - this.lastTime) / 1000;    
        this.CoarseTime += deltaTime * this.TimeResolution;
        this.RoughTime = Math.floor(this.CoarseTime);

        if ((this.moving == true) && (this.alive == true))
        {
            if (this.RoughTime != this.LastTimeUpdate)
            {
                this.headX += this.xdirection;
                this.headY += this.ydirection;                

                for(var q=0;q<this.snakeParts.length;q++) {
                    if (this.snakeParts[q].x == this.headX)
                    {
                        if (this.snakeParts[q].y == this.headY)
                        {
                            this.dead();
                        }
                    }
                }

                if (this.headX < 0) this.dead();
                if (this.headY < 0) this.dead();
                if (this.headX > this.config.gridSize) this.dead();
                if (this.headY > this.config.gridSize) this.dead();
                //console.log(this.headX + ", " + this.headY);

                //Move to the next segment...
                var prevHead = this.currentHead;
                var nextHead = (this.currentHead+1)%this.snakeParts.length;                

                this.snakeParts[nextHead].x = this.headX;
                this.snakeParts[nextHead].y = this.headY;                

                this.snakeParts[nextHead].piece.setAttribute("x",(this.headX*this.pixelWidth) + this.xmargin);
                this.snakeParts[nextHead].piece.setAttribute("y",(this.headY*this.pixelHeight) + this.ymargin);

                if ((this.headX == this.targetX) && (this.headY == this.targetY))
                {
                    for(var q=0;q<this.config.growAmount;q++)
                    {
                        var p = {};
                        p.x = this.targetX;
                        p.y = this.targetY;
                        p.piece = this.createSnakePiece();
                        p.piece.setAttribute("x",(this.headX*this.pixelWidth) + this.xmargin);
                        p.piece.setAttribute("y",(this.headY*this.pixelHeight) + this.ymargin);
                        this.snakeParts.splice(this.prevHead,0,p);
                    }

                    this.TimeResolution *= this.config.speedBump;
                    this.spawnTarget();
                }

                this.currentHead = nextHead;

                //this.updateSnake();
            }
        }

        this.lastTime = tm;
        this.LastTimeUpdate = this.RoughTime;
        this.animatorID = requestAnimationFrame(this.animate);
    }

    animate(tm) {
        gameSession.frame(tm);
    }    

    updateSnake() {
        for(var q=0;q<this.snakeParts.length;q++) {
                this.snakeParts[0].piece.setAttribute("x",(this.snakeParts[0].x*this.pixelWidth) + this.xmargin);
                this.snakeParts[0].piece.setAttribute("y",(this.snakeParts[0].y*this.pixelHeight) + this.ymargin);
        }
    }

    stopGame() {
        if (this.animatorID != -1)
        {
            cancelAnimationFrame(this.animatorID);
        }
    }

    dead() {
        console.log("Dead!");
        this.reset();
    }
}