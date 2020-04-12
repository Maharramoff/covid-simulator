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

class Person
{
    constructor(x, y, dx, dy, radius, context)
    {
        this.ctx = context;
        this.radius = radius;
        this.startangle = 0;
        this.endangle = Math.PI * 2;
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
    }

    move()
    {

    }

    draw()
    {
        this.ctx.save()
        this.ctx.beginPath()
        this.ctx.arc(this.x, this.y, this.radius, this.startangle, this.endangle)
        this.ctx.lineWidth = 3
        this.ctx.strokeStyle = 'lime';
        this.ctx.stroke()
        this.ctx.fillStyle = 'lime';
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
        this.ctx = canvas.context;
        this.persons = [];
    }

    start()
    {
        if (this.running)
        {
            return false;
        }

        this.running = true;
        this._createPerson(2);
        this._animate();
    }

    _animate()
    {
        this.now = Helper._timestamp();
        this.deltaTime = this.deltaTime + Math.min(1, (this.now - this.lastTime) / 1000);

        while (this.deltaTime > this.step)
        {
            this.deltaTime = this.deltaTime - this.step;
            this._create();
            this._update();
        }

        this._draw();
        this.lastTime = this.now;

        requestAnimationFrame(() => this._animate());
    }

    _create()
    {

    }

    _update()
    {
    }

    _draw()
    {
        this._drawPersons();
    }

    _createPerson(amount)
    {
        let radius = 5;
        let dx = 5;
        let dy = 10;
        let x, y;

        while (amount--)
        {
            x = Helper.getRandomInt(radius, this.ctx.canvas.width - radius);
            y = Helper.getRandomInt(radius, this.ctx.canvas.height - radius);
            this.persons.push(new Person(x, y, dx, dy, radius, this.ctx))
        }
    }

    _drawPersons()
    {
        for (const person of this.persons)
        {
            person.draw();
        }
    }
}

let canvas = new Canvas('wrapper', 700, 400);
(new Simulator(canvas)).start();