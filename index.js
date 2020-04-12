class Helper
{
    static getRandomInt(min, max)
    {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static _timestamp()
    {
        return window.performance && window.performance.now ? window.performance.now() : new Date().getTime();
    }

    /*
    Delete an element from an array without
    having to create a new array in the process
    to keep garbage collection at a minimum
    */
    static removeIndex(array, index)
    {
        if (index >= array.length || array.length <= 0)
        {
            return;
        }

        array[index] = array[array.length - 1];
        array[array.length - 1] = undefined;
        array.length = array.length - 1;
    }
}

class Canvas
{
    constructor(container, width, height)
    {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        document.getElementById(container).appendChild(this.canvas);
        this.context = this.canvas.getContext('2d');
    }
}

class Background
{
    constructor(color, context)
    {
        this.ctx = context;
        this.color = color;
    }

    draw()
    {
        this.ctx.beginPath();
        this.ctx.fillStyle = this.color;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}

class Person
{
    static COLORS = {
        recovered: '#A1DE93',
        infected : '#F47C7C',
        healthy  : '#70A1D7'
    }

    constructor(x, y, speed, radius, color, context)
    {
        this.ctx = context;
        this.radius = radius;
        this.startangle = 0;
        this.endangle = Math.PI * 2;
        this.x = x;
        this.y = y;
        this.dx = speed;
        this.dy = speed;
        this.color = color;
    }

    update()
    {
        this.y += this.dy
        this.x += this.dx
        this.checkBorderCollision();
    }

    draw()
    {
        this.ctx.save()
        this.ctx.beginPath()
        this.ctx.fillStyle = this.color;
        this.ctx.arc(this.x, this.y, this.radius, this.startangle, this.endangle)
        this.ctx.fill()
        this.ctx.closePath()
        this.ctx.restore()
    }

    checkBorderCollision()
    {
        if ((this.y + this.radius > this.ctx.canvas.height && this.dy > 0) || this.y - this.radius < 0 && this.dy < 0)
        {
            this.dy = -this.dy
        }

        if ((this.x + this.radius > this.ctx.canvas.width && this.dx > 0) || (this.x - this.radius < 0 && this.dx < 0))
        {
            this.dx = -this.dx
        }
    }

    _getNewDirections(dx, dy)
    {
        const angle = Math.atan2(dy, dx)

        return [
            Math.cos(angle),
            Math.sin(angle)
        ]
    }

    collisionResponse(object)
    {
        const dx = object.x - this.x;
        const dy = object.y - this.y;
        let newX, newY;

        if(this._collidesWith(dx, dy, this.radius * 2))
        {
            [newX, newY] = this._getNewDirections(dx, dy);
            this.dx -= newX;
            this.dy -= newY;
            object.dx = newX;
            object.dy = newY;
        }
    }

    _collidesWith(dx, dy, diameter)
    {
        return this._distanceBetween(dx, dy) < diameter * diameter;
    }

    _distanceBetween(dx, dy)
    {
        return dx * dx + dy * dy
    }
}

class Simulator
{
    constructor(canvas)
    {
        this.running = false;
        this.fps = 30;
        this.step = 1 / this.fps;
        this.now = 0;
        this.lastTime = Helper._timestamp();
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.delay = 1000;
        this.timer = 0;
        this.ctx = canvas.context;
        this.persons = [];
        this.background = new Background('#F3FAF1', this.ctx)
    }

    start()
    {
        if (this.running)
        {
            return false;
        }

        this.running = true;
        this._createPerson(50);
        this._animate();
    }

    _animate()
    {
        this.now = Helper._timestamp();
        this.elapsedTime = this.now - this.lastTime;
        this.deltaTime = this.deltaTime + Math.min(1, this.elapsedTime / this.delay);
        this.timer += this.elapsedTime;

        while (this.deltaTime > this.step)
        {
            this.deltaTime = this.deltaTime - this.step;
            this._create();
            this._update();
        }

        this._draw();
        this.lastTime = this.now;

        // Tick
        if (this.timer > this.delay)
        {
            this.timer = 0;
            this._tick();
        }

        requestAnimationFrame(() => this._animate());
    }

    _create()
    {

    }

    _update()
    {
        this.background.draw();

        for (const person of this.persons)
        {
            for (const other of this.persons)
            {
                if (person !== other)
                {
                    person.collisionResponse(other);
                }
            }

            person.update();
            person.draw();
        }
    }

    _draw()
    {
    }

    _tick()
    {
    }

    _createPerson(amount)
    {
        let radius = 6;
        let speed, x, y;

        while (amount--)
        {
            speed = Helper.getRandomInt(0, 1) * 0.5;
            x = Helper.getRandomInt(radius, this.ctx.canvas.width - radius);
            y = Helper.getRandomInt(radius, this.ctx.canvas.height - radius);
            this.persons.push(new Person(x, y, speed, radius, Person.COLORS.healthy, this.ctx))
        }
    }
}

let canvas = new Canvas('wrapper', 700, 400);
(new Simulator(canvas)).start();