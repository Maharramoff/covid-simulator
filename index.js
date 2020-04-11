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
    }

    start()
    {
        if (this.running)
        {
            return false;
        }

        this.running = true;
        this._animate();
    }

    _animate()
    {
        this.now = Helper._timestamp();
        this.deltaTime = this.deltaTime + Math.min(1, (this.now - this.lastTime) / 1000);

        while (this.deltaTime > this.step)
        {
            this.deltaTime = this.deltaTime - this.step;
            this._create(this.step);
            this._update(this.step);
        }

        this._draw(this.deltaTime);
        this.lastTime = this.now;

        requestAnimationFrame(() => this._animate());
    }

    _create(step)
    {
    }

    _update(step)
    {
        console.log(step)
    }

    _draw(dt)
    {
    }
}

let canvas = new Canvas('wrapper', 700, 400);
(new Simulator(canvas)).start();