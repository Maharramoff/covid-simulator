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

    constructor(x, y, dx, dy, radius, color, context)
    {
        this.ctx = context;
        this.radius = radius;
        this.startangle = 0;
        this.endangle = Math.PI * 2;
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
    }

    update()
    {
        if (this.y + this.radius > this.ctx.canvas.height || this.y - this.radius < 0)
        {
            this.dy = -this.dy
        }
        this.y -= this.dy

        if (this.x + this.radius > this.ctx.canvas.width || this.x - this.radius < 0)
        {
            this.dx = -this.dx
        }
        this.x += this.dx

        this._draw();
    }

    _draw()
    {
        this.ctx.save()
        this.ctx.beginPath()
        this.ctx.fillStyle = this.color;
        this.ctx.arc(this.x, this.y, this.radius, this.startangle, this.endangle)
        this.ctx.fill()
        this.ctx.closePath()
        this.ctx.restore()
    }
}

class Simulator
{
    constructor(canvas)
    {
        this.running = false;
        this.fps = 60;
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
        this._createPerson(10);
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
        this._updatePersons();
    }

    _draw()
    {
    }

    _tick()
    {
    }

    _createPerson(amount)
    {
        let radius = 5;
        let dx, dy, x, y;

        while (amount--)
        {
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
            x = Helper.getRandomInt(radius, this.ctx.canvas.width - radius);
            y = Helper.getRandomInt(radius, this.ctx.canvas.height - radius);
            this.persons.push(new Person(x, y, dx, dy, radius, Person.COLORS.healthy, this.ctx))
        }
    }

    _updatePersons()
    {
        for (const person of this.persons)
        {
            person.update();
        }
    }
}

let canvas = new Canvas('wrapper', 700, 400);
(new Simulator(canvas)).start();