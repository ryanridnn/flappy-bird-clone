// colors that will be used

const COLORS = {
	SKY: '#1acdfeff',
	SOIL: '#b25f1fff'
}

// Canvas Related variable

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

// this var will adjust the size of the element
// based on client screen size
let propScale = 1

// setting canvas responsiveness
if(window.innerWidth >= 540) {
	canvas.width = 480
	canvas.height = 640
} else {
	canvas.width = window.innerWidth - 40
	canvas.height = (window.innerWidth - 40) * 4 / 3
	propScale = Math.ceil(window.innerWidth / 60) / 10

}

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

		this.image.onload = () => {
			this.width = this.image.naturalWidth
			this.height = this.image.naturalHeight
			this.loaded = true

			if(autoRendered) this.render()
		} 
	}

	// functionality: update the properties and the render it to the screen
	update(props) {
		const { x, y, scale, rotationAngle } = props
		this.x = x ? x : this.x
		this.y = y ? y : this.y
		this.scale = scale ? scale : this.scale
		this.rotationAngle = rotationAngle ? rotationAngle : this.rotationAngle

		this.render()
	}

	// functionality: render the image to the screen
	render() {
		ctx.save()
		ctx.translate(this.x + this.width / 2, this.y + (this.sourceHeight ? this.sourceHeight / 100 * canvas.height : this.height) / 2)

		ctx.rotate(Math.PI / 180 * this.rotationAngle)
		ctx.translate(-this.x - this.width / 2, -this.y - (this.sourceHeight ? this.sourceHeight / 100 * canvas.height : this.height) / 2)

		if(!this.sourceHeight) {
			ctx.drawImage(this.image, this.x, this.y, this.width * this.scale, this.height * this.scale)
		}
		else {
			const destX = this.rotationAngle === 180? this.x + this.width * (1 - propScale) : this.x
			ctx.drawImage(this.image, 0, this.height - this.sourceHeight / 100 * canvas.height / propScale, this.width, this.sourceHeight / 100 * canvas.height / propScale, destX, this.y, this.width * propScale, this.sourceHeight / 100 * canvas.height * this.scale)
		}
		ctx.restore()
	}

	// functionality: if user call this method, the callback provided will be called after the image is loaded
	onload(callback) {
		this.image.addEventListener('load', callback)
	}
}

// Below are 5 class, that represent what will be shown in the canvas

class Bird{
	constructor() {
		this.x = canvas.width * .2
		this.y = canvas.height * .2
		this.speed = 2
		this.liftSpeed = 0
		this.gravity = .1
		this.image = new CanvasImage({
			imagePath: './img/bird1.png',
			x: this.x,
			y: this.y,
			scale:  propScale,
			autoRendered: false
		})
		this.images = [
			this.image,
			new CanvasImage({
				imagePath: './img/bird2.png',
				x: this.x,
				y: this.y,
				scale:  propScale,
				autoRendered: false
			}),
			new CanvasImage({
				imagePath: './img/bird3.png',
				x: this.x,
				y: this.y,
				scale:  propScale,
				autoRendered: false
			})
		]

		this.diagonal = {
			vertical: this.images[0].height * this.image.scale,
			horizontal: this.images[0].width * this.image.scale
		}

		this.images[0].onload(() => {
			this.diagonal = {
				vertical: this.images[0].height * this.image.scale,
				horizontal: this.images[0].width * this.image.scale
			}
		})
	}

	// functionality: update the vertical position of the instance and handle the gravity effect
	update() {
		this.speed += this.gravity
		this.liftSpeed = this.liftSpeed <= 0 ? 0 : this.liftSpeed - this.gravity
		this.y += (this.speed - this.liftSpeed) * 2 * propScale

		this.image.update({
			y: this.y,
			rotationAngle: this.rotationAngle
		})
	}

	// functionality: lift the bird to higher vertical position
	lift() {
		this.speed = 0
		this.liftSpeed = 4
	}

	// functionality: check if the bird collided with any pipe
	checkPipeCollision(pipe) {
		const pipeVerticalBoundaries = [pipe.topPipe.sourceHeight / 100 * canvas.height, pipe.bottomPipe.y]

		if((this.x + this.diagonal.horizontal >= pipe.x + 20
			&& this.x <= pipe.x + pipe.topPipe.width * propScale - 20)
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

	// functionality: check if the bird fell and crushed the soil
	checkSoilCollision(soil) {
		if (this.y + this.diagonal.vertical >= soil.y) {
			return true
		} else {
			return false
		}
	}

	// functionality: check if the bird passed the pipe
	checkPassed(pipe) {
		if(this.x > pipe.x + 20 && !pipe.passed) {
			pipe.passed = true 
			return true
		} else {
			return false
		}
	}

	// functionality: animate the flapping motion of the bird
	cycleImage(frameCount) {
		if(frameCount % 9 === 3) {
			this.image = this.images[1]
		} else if(frameCount % 9 === 6) {
			this.image = this.images[2]
		} else if(frameCount % 9 === 0) {
			this.image = this.images[0]
		}
	}

	// functionality: render the bird
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

	// functionality: get random pipe heights 
	getPipeHeights() {
		const min = 20
		const max = 75
		const gap = 25 - (1 - propScale) * 10

		const topPipeHeight = Math.random() * (max - gap - min) + min
		const bottomPipeHeight = 100 - topPipeHeight - gap

		return { topPipeHeight, bottomPipeHeight }
	}

	// functionality: handle the pipe movement to the left side of the screen
	moveToLeft() {
		this.x -= 2.8 * propScale
		this.topPipe.update({
			x: this.x
		})

		this.bottomPipe.update({
			x: this.x
		})
	}

	// functionality: render the pipe to the screen
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
	}

	// functionality: render the soil to the screen
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
			scale: propScale,
			autoRendered: false
		})
	}

	// functionality: handle the ground movement to the left side of the screen
	update() {
		this.x -= 2.8 * propScale
		this.image.update({
			x: this.x
		})
	}

	// functionality: render the ground to the screen
	render() {
		this.image.render()
	}
}

class Cloud{
	constructor() {
		this.image = new CanvasImage({
			imagePath: './img/cloud.png', 
			x: 0, 
			y: canvas.height * .67, 
			scale: .5 * propScale,
		})
	}

	// functionality: render the cloud to the screen
	render() {
		this.image.render()
	}
}

// this class handles the creation of each game and the functionality of it

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

		this.score = 0
		this.frameCount = 0

		this.eventHandlers = {}
		this.addEventListener()
	}

	// functionality: create animation loop, render the element sequentially, 
	animation() {
		// request the animation
		const req = requestAnimationFrame(t => this.animation(t))

		this.frameCount++

		// make bird image cycle
		this.bird.cycleImage(this.frameCount)

		//clear the canvas, and set the background again
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		setBackground()

		// start rendering things
		this.cloud.render()
		this.bird.update()

		// if the bird collided with soil the game is over, so animation will be terminated
		if(this.bird.checkSoilCollision(this.soil)) {
			this.over = true
			toggleHelperText(!this.over)
			cancelAnimationFrame(req)
		}

		// render every single pipe
		this.pipes.forEach((pipe, index) => {
			// if the bird collided with the pipe, disable the lift method, the game is over when the bird crushed the soil
			if(this.bird.checkPipeCollision(pipe)) {
				if(!this.hit) {
					ctx.clearRect(0, 0, canvas.width, canvas.height)
				}

				this.hit = true			
			}

			if(!this.hit) pipe.moveToLeft()
			else pipe.render()

			// remove a pipe if it is out of screen
			if(pipe.x + pipe.topPipe.width <= -10) {
				setTimeout(() => {
					this.pipes.splice(index, 1)
				}, 0)
			}

			// check if the bird passed this pipe
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

			// if the ground is already pushed a lot to the left, append a new ground to the array
			if(lastGround.x + lastGround.image.width * lastGround.image.scale <= canvas.width + 50 && index === this.grounds.length - 1) {
				this.grounds.push(new Ground(lastGround.x + lastGround.image.width * lastGround.image.scale))
			} 

			// remove a ground if it is out of screen
			if(ground.x + lastGround.image.width * lastGround.image.scale <= -10) {
				setTimeout(() => this.grounds.splice(index, 1), 0)
			}
		})
	}

	// functionality: start a game
	start() {
		this.started = true

		// hide the helperText and set the score to 0
		toggleHelperText(this.started)
		setScore(this.score)

		// start to animate
		this.animation()

		// wait for 2s until adding the first pipe to the array 
		setTimeout(() => {
			if(!this.over && !this.hit) this.pipes.push(new Pipe(canvas.width))

			// add a new pipe every 2s
			const interval = setInterval(() => {
				if(this.over || this.hit) {
					clearInterval(interval)
					return true
				}

				this.pipes.push(new Pipe(canvas.width))
			}, 2000)
		}, 2000)
	}

	// functionality: make a new game after one is over
	newGame() {
		// clear the canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		// clear the previous event listener
		canvas.removeEventListener('click', this.eventHandlers.clickHandler)
		window.removeEventListener('keypress', this.eventHandlers.keypressHandler)

		// start a new game
		const game = new Game()
		game.start()
	}

	// add the click and spacebar keypress event listener
	addEventListener() {
		// these two function below needed to be stored in variable
		// so it can be removed after

		const clickHandler = e => {
			if(!this.started) this.start()
			else if(!this.hit && !this.over) this.bird.lift()
			else if(this.over) this.newGame() 
		}

		const keypressHandler = e => {
			e.preventDefault()
			if(e.code === 'Space')
				clickHandler(e)
		}

		// listen to click and keypress event
		// lift the bird if such events is emitted

		canvas.addEventListener('click', clickHandler)
		window.addEventListener('keypress', keypressHandler)

		this.eventHandlers.clickHandler = clickHandler
		this.eventHandlers.keypressHandler = keypressHandler
	}
}

// query some element needed to inform user
const helperText = document.querySelector('.canvas-overlay .helper-text')
const scoreEl = document.querySelector('.score')

// functionality: make helperText appear or dissapear based on the game is started or not
const toggleHelperText = state => {
	if(state) helperText.classList.remove('show')
	else helperText.classList.add('show')
}

// functionality: update the score when the bird pass through a pipe
const setScore = score => {
	scoreEl.innerText = score
}

// instantiate a game
const game = new Game()
// set the score to nothing, so it wouldn't appear on starting screen
setScore('')


