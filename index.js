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

    static RECOVERY_PERIOD = 15; // days

    constructor(x, y, speed, radius, status, atHome, context)
    {
        this.ctx = context;
        this.radius = radius;
        this.status = status;
        this.atHome = atHome;
        this.startangle = 0;
        this.endangle = Math.PI * 2;
        this.x = x;
        this.y = y;
        this.dx = speed * (~~(Math.random() * 2) ? -1 : 1);
        this.dy = speed * (~~(Math.random() * 2) ? -1 : 1);
        this.infectedDays = 0;
        this.setColor(this.status);
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

        if (this._collidesWith(dx, dy, this.radius * 2))
        {
            [newX, newY] = this._getNewDirections(dx, dy);
            this.dx -= newX;
            this.dy -= newY;
            object.dx = newX;
            object.dy = newY;
            this._checkContagion(object);
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

    _checkContagion(otherPerson)
    {
        if (otherPerson.status === 'infected' && this.status === 'healthy')
        {
            this.status = 'infected';
            this.setColor(this.status);
        }

        if (otherPerson.status === 'healthy' && this.status === 'infected')
        {
            otherPerson.status = 'infected';
            otherPerson.setColor(otherPerson.status);
        }
    }

    setColor(status)
    {
        this.color = Person.COLORS[status];
    }

    updateDay()
    {
        if (this.status === 'infected')
        {
            if (this.infectedDays >= Person.RECOVERY_PERIOD)
            {
                this.status = 'recovered';
                this.setColor(this.status);
            }

            this.infectedDays++;
        }
    }

    rearrange()
    {
        this.x = Helper.getRandomInt(this.radius, this.ctx.canvas.width - this.radius);
        this.y = Helper.getRandomInt(this.radius, this.ctx.canvas.height - this.radius);
    }
}

class Simulator
{
    constructor(canvas)
    {
        this.running = false;
        this.fps = 30;
        this.step = 1 / this.fps;
        this.ctx = canvas.context;
        this.background = new Background('#F3FAF1', this.ctx)
        this.maxDays = 0; // if set to 0 sim. ends if all infected recovered
        this.stayAtHome = false;
        addEventListener('resize', () =>
        {
            this._updateScreenSize();
        })
        this.init();
    }

    init()
    {
        this.now = 0;
        this.lastTime = Helper._timestamp();
        this.deltaTime = 0;
        this.elapsedTime = 0;
        this.delay = 1000;
        this.timer = 0;
        this.persons = [];
        this.day = 0;
        this.screenResized = false;
        this.totalPerson = 100;
        this.totalInfected = 1;
        this.totalRecovered = 0;
        this.totalHealthy = this.totalPerson - this.totalInfected;
        this.screenWidth = document.documentElement.clientWidth;
        this._updateScreenSize();
        document.getElementsByClassName('sim-replay-icon')[0].classList.remove('show');
        document.getElementsByTagName('canvas')[0].classList.remove('fadeout');
    }

    restart(stayAtHome)
    {
        if (stayAtHome !== null)
        {
            this._stop();
            this.stayAtHome = stayAtHome;
        }
        this.persons.length = 0;
        this.init();
        this.start();
    }

    start()
    {
        if (this.running)
        {
            return false;
        }

        this.running = true;
        this._updateSummaries();
        this._createPerson(this.totalPerson, this.totalInfected, this.stayAtHome ? 75 : 0);
        this._animate();
    }

    _animate()
    {
        if (!this.running)
        {
            return;
        }

        this.now = Helper._timestamp();
        this.elapsedTime = this.now - this.lastTime;
        this.deltaTime = this.deltaTime + Math.min(1, this.elapsedTime / this.delay);
        this.timer += this.elapsedTime;

        while (this.deltaTime > this.step)
        {
            this.deltaTime = this.deltaTime - this.step;
            this._create();
            // Tick
            if (this.timer > this.delay)
            {
                this.timer = 0;
                this._tick();
                this._update(true);
            }
            else
            {
                this._update(false);
            }
        }

        this._draw();
        this.lastTime = this.now;

        requestAnimationFrame(() => this._animate());
    }

    _create()
    {

    }

    _update(tick)
    {
        this.background.draw();

        this.totalInfected = 0;
        this.totalRecovered = 0;

        for (const person of this.persons)
        {
            for (const other of this.persons)
            {
                if (person !== other)
                {
                    person.collisionResponse(other);
                }
            }

            if(this.screenResized)
            {
                person.rearrange();
            }

            if (tick)
            {
                person.updateDay();
            }

            if (person.status === 'infected')
            {
                this.totalInfected++;
            }
            else if (person.status === 'recovered')
            {
                this.totalRecovered++;
            }

            this.totalHealthy = this.totalPerson - (this.totalInfected + this.totalRecovered);

            if (!person.atHome)
            {
                person.update();
            }

            person.draw();
        }

        this.screenResized = false;

        this._updateSummaries();
    }

    _draw()
    {
    }

    _tick()
    {
        this._updateDay();
    }

    _createPerson(amount, infected, totalAtHome)
    {
        let radius = 6;
        let speed, x, y, status, atHome;

        while (amount--)
        {
            speed = 1;
            atHome = false;
            status = 'healthy';
            x = Helper.getRandomInt(radius, this.ctx.canvas.width - radius);
            y = Helper.getRandomInt(radius, this.ctx.canvas.height - radius);

            if (totalAtHome > 0)
            {
                atHome = true;
                totalAtHome--;
            }

            if (infected > 0)
            {
                status = 'infected'
                atHome = false;
                infected--;
            }

            this.persons.push(new Person(x, y, speed, radius, status, atHome, this.ctx))
        }
    }

    _updateDay()
    {
        document.getElementById('day').innerText = '' + ++this.day;

        if ((this.day >= this.maxDays && this.maxDays >= 1) || this.totalInfected === 0 || this.totalHealthy === 0)
        {
            this._stop();
        }
    }

    _updateSummaries()
    {
        document.getElementById('recovered-count').innerText = this.totalRecovered;
        document.getElementById('infected-count').innerText = this.totalInfected;
        document.getElementById('healthy-count').innerText = this.totalHealthy;
    }

    _stop()
    {
        this.running = false;
        document.getElementsByTagName('canvas')[0].classList.add('fadeout');
        document.getElementsByClassName('sim-replay-icon')[0].classList.add('show');
    }

    _updateScreenSize()
    {
        let screenWidth = document.documentElement.clientWidth;

        if(screenWidth === this.screenWidth) return;

        if (screenWidth < 720)
        {
            this.ctx.canvas.width = screenWidth - 20;
            this.ctx.canvas.height = 1100 - (screenWidth - 20);
        }
        else
        {
            this.ctx.canvas.width = 700;
            this.ctx.canvas.height = 400;
        }

        this.screenWidth = screenWidth;
        this.screenResized = true;
    }
}

const canvas = new Canvas('wrapper', 700, 400);
const simulator = new Simulator(canvas);
simulator.start();