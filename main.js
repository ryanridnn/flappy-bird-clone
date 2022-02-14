// colors that will be used

const COLORS = {
	SKY: '#00bcfaff',
	SOIL: '#965423ff'
}

// false if the game is not over
// changed to be true if the game is over 
let over = true

// let frameCount = 0

// Canvas Related variable

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

// asign canvas size

canvas.width = 480
canvas.height = 640

// functionality: set the background to blue sky

const setBackground = () =>  {
	ctx.fillStyle = COLORS.SKY
	ctx.fillRect(0, 0, canvas.width, canvas.height)
}

setBackground()

// create image class to make thing a bit easier 
// to handle image rendering

class CanvasImage{
	constructor({ imagePath, x, y, scale, rotationAngle, sourceHeight, autoRendered }) {
		this.image = new Image()
		this.image.src = imagePath

		this.x = x
		this.y = y
		this.scale = scale ? scale : 1
		this.rotationAngle = rotationAngle ? rotationAngle : 0
		this.sourceHeight = sourceHeight ? sourceHeight : 0

		this.width = this.image.naturalWidth
		this.height = this.image.naturalHeight

		this.image.onload = () => {
			// this.render()
			this.loaded = true

			if(autoRendered) this.render()
		} 
	}

	update(props) {
		const { x, y, scale } = props
		this.x = x ? x : this.x
		this.y = y ? y : this.y
		this.scale = scale ? scale : this.scale

		this.render()
	}

	render() {
		ctx.save()
		ctx.translate(this.x + this.width / 2, this.y + (this.sourceHeight ? this.sourceHeight / 100 * canvas.height : this.height) / 2)

		ctx.rotate(Math.PI / 180 * this.rotationAngle)
		ctx.translate(-this.x - this.width / 2, -this.y - (this.sourceHeight ? this.sourceHeight / 100 * canvas.height : this.height) / 2)

		if(!this.sourceHeight) 
			ctx.drawImage(this.image, this.x, this.y, this.width * this.scale, this.height * this.scale)
		else 
			ctx.drawImage(this.image, 0, this.height - this.sourceHeight / 100 * canvas.height, this.width, this.sourceHeight / 100 * canvas.height, this.x, this.y, this.width * this.scale, this.sourceHeight / 100 * canvas.height * this.scale)
		ctx.restore()
	}

}


class Bird{
	constructor() {
		this.x = canvas.width * .2
		this.y = canvas.height * .2
		this.speed = 2
		this.liftSpeed = 0
		this.gravity = .1
		this.image = new CanvasImage({
			imagePath: './img/bird.png',
			x: this.x,
			y: this.y,
			scale: .12,
			autoRendered: false
		})
		this.diagonal = {
			vertical: this.image.height * this.image.scale,
			horizontal: this.image.width * this.image.scale
		}
	}

	update() {
		this.speed += this.gravity
		this.liftSpeed = this.liftSpeed <= 0 ? 0 : this.liftSpeed - this.gravity
		this.y += (this.speed - this.liftSpeed) * 2

		this.image.update({
			y: this.y
		})
	}

	lift() {
		this.speed = 0
		this.liftSpeed = 4
	}

	checkPipeCollision(pipe) {
		const pipeVerticalBoundaries = [pipe.topPipe.sourceHeight / 100 * canvas.height * pipe.topPipe.scale, pipe.bottomPipe.y]

		if((this.x + this.diagonal.horizontal >= pipe.x + 20
			&& this.x <= pipe.x + pipe.topPipe.width - 20)
			) {

			if(this.y <= pipeVerticalBoundaries[0] || this.y + this.diagonal.vertical >= pipeVerticalBoundaries[1]) {
				return true
			}

			else {
				return false
			}

		} else {
			return false
		}
	}

	checkSoilCollision(soil) {
		if (this.y + this.diagonal.vertical >= soil.y) {
			return true
		} else {
			return false
		}
	}

	checkPassed(pipe) {
		if(this.x > pipe.x + 20 && !pipe.passed) {
			pipe.passed = true 
			return true
		} else {
			return false
		}
	}

	render() {
		this.image.render()
	}
}

class Pipe{
	constructor(x) {
		this.x = x
		this.pipeHeights = this.getPipeHeights()

		this.topPipe = new CanvasImage({
			imagePath: './img/pipe.png', 
			x: canvas.width * .5, 
			y: 0,
			sourceHeight: this.pipeHeights.topPipeHeight
		})
		this.bottomPipe = new CanvasImage({
			imagePath: './img/pipe.png', 
			x: canvas.width * .5, 
			y: canvas.height * (100 - this.pipeHeights.bottomPipeHeight) / 100,
			rotationAngle: 180, 
			sourceHeight: this.pipeHeights.bottomPipeHeight
		})
	}

	getPipeHeights() {
		const min = 20
		const max = 75
		const gap = 25

		const topPipeHeight = Math.random() * (max - gap - min) + min
		const bottomPipeHeight = 100 - topPipeHeight - gap

		return { topPipeHeight, bottomPipeHeight }
	}

	moveToLeft() {
		this.x -= 2
		this.topPipe.update({
			x: this.x
		})

		this.bottomPipe.update({
			x: this.x
		})
	}

	render() {
		this.topPipe.render()
		this.bottomPipe.render()
	}
}

class Soil{
	constructor() {
		this.x = 0
		this.y = canvas.height * .9
		this.width = canvas.width
		this.height = canvas.height * .1
		// this.render()
	}

	render() {
		ctx.fillStyle = COLORS.SOIL
		ctx.fillRect(this.x, this.y, this.width, this.height)
	}
}

class Ground{
	constructor(x) {
		this.x = x
		this.image = new CanvasImage({
			imagePath: './img/ground.png', 
			x: this.x, 
			y: canvas.height * .88,
			autoRendered: false
		})
	}

	update() {
		this.x -= 2
		this.image.update({
			x: this.x
		})
	}

	render() {
		this.image.render()
	}
}

class Cloud{
	constructor() {
		this.image = new CanvasImage({
			imagePath: './img/cloud.png', 
			x: 0, 
			y: canvas.height * .65, 
			scale: .5,
		})
	}

	render() {
		this.image.render()
	}
}

class Game{
	constructor() {
		this.bird = new Bird()
		this.cloud = new Cloud()
		this.pipes = []
		this.soil = new Soil()
		this.grounds = [new Ground(0)]

		this.started = false
		this.over = false
		this.hit = false

		this.score = -1

		this.eventHandlers = {}
		this.addEventListener()
	}

	animation() {
		const req = requestAnimationFrame(t => this.animation(t))
		// frameCount++
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		setBackground()

		this.cloud.render()
		this.bird.update()

		if(this.bird.checkSoilCollision(this.soil)) {
			this.over = true
			toggleHelperText(!this.over)
			cancelAnimationFrame(req)
		}

		this.pipes.forEach((pipe, index) => {
			if(this.bird.checkPipeCollision(pipe)) {
				if(!this.hit) {
					ctx.clearRect(0, 0, canvas.width, canvas.height)
				}

				this.hit = true			
			}

			if(!this.hit) pipe.moveToLeft()
			else pipe.render()

			if(pipe.x + pipe.topPipe.width <= -10) {
				setTimeout(() => {
					this.pipes.splice(index, 1)
				}, 0)
			}
			if(this.bird.checkPassed(pipe)) {
				this.score++
				setScore(this.score)
			}
		})
		this.soil.render()

		const lastGround = this.grounds[this.grounds.length - 1]
		this.grounds.forEach((ground, index) => {
			if(!this.hit) ground.update()
			else ground.render()

			if(lastGround.x + lastGround.image.width * lastGround.image.scale <= canvas.width + 50 && index === this.grounds.length - 1) {
				this.grounds.push(new Ground(lastGround.x + lastGround.image.width * lastGround.image.scale))
			} 

			if(ground.x + lastGround.image.width * lastGround.image.scale <= -10) {
				setTimeout(() => this.grounds.splice(index, 1), 0)
			}
		})
	}

	start() {
		this.started = true
		toggleHelperText(this.started)
		setScore(this.score)
		const dummyPipe = new Pipe(0)
		dummyPipe.x = dummyPipe.x - dummyPipe.topPipe.width
		this.pipes.push(dummyPipe)

		this.animation()

		setTimeout(() => {
			if(!this.over && !this.hit) this.pipes.push(new Pipe(canvas.width))

			const interval = setInterval(() => {
				if(this.over || this.hit) {
					clearInterval(interval)
					return true
				}

				this.pipes.push(new Pipe(canvas.width))
			}, 2000)
		}, 2000)
	}

	preview() {
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		setBackground()

		const previewBird = new Bird()
		previewBird.image.x = canvas.width * .43
		previewBird.image.y = canvas.height * .7
		previewBird.image.image.onload = () => {
			previewBird.render()
		}
	}

	addEventListener() {
		const clickHandler = e => {
			if(!this.started) this.start()
			else if(!this.hit && !this.over) this.bird.lift()
			else if(this.over) this.newGame() 
		}

		const keypressHandler = e => {
			if(e.code === 'Space')
				clickHandler(e)
		}

		// listen to click and keypress event
		// lift the bird if such events is emitted

		window.addEventListener('click', clickHandler)
		window.addEventListener('keypress', keypressHandler)

		this.eventHandlers.clickHandler = clickHandler
		this.eventHandlers.keypressHandler = keypressHandler
	}

	newGame() {
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		window.removeEventListener('click', this.eventHandlers.clickHandler)
		window.removeEventListener('keypress', this.eventHandlers.keypressHandler)

		const game = new Game()
		game.start()
	}
}

const helperText = document.querySelector('.canvas-overlay .helper-text')
const scoreEl = document.querySelector('.score')

const toggleHelperText = state => {
	if(state) helperText.classList.remove('show')
	else helperText.classList.add('show')

	console.log(helperText.classList)
}

const setScore = score => {
	scoreEl.innerText = score
}

const game = new Game()
game.preview()
setScore('')
// game.start()


// if(!over) pipes.push(new Pipe(canvas.width))


