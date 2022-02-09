// colors that will be used

const COLORS = {
	SKY: '#00bcfaff',
	SOIL: '#965423ff'
}

// false if the game is not over
// changed to be true if the game is over 
let over = false

let frameCount = 0

// Canvas Related variable

const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

// asign canvas size

canvas.width = 480
canvas.height = 640

// functionality: set the background to blue sky

function setBackground() {
	ctx.fillStyle = COLORS.SKY
	ctx.fillRect(0, 0, canvas.width, canvas.height)
}

setBackground()

// create image class to make thing a bit easier 
// to handle image rendering

class CanvasImage{
	constructor(imagePath, x, y, scale, rotationAngle = 0, sourceHeight = false) {
		this.image = new Image()
		this.image.src = imagePath

		this.x = x
		this.y = y
		this.scale = scale
		this.rotationAngle = rotationAngle
		this.sourceHeight = sourceHeight

		this.width = this.image.naturalWidth
		this.height = this.image.naturalHeight

		this.image.onload = () => {
			this.render()
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
		this.y = canvas.height * .44
		this.speed = 2
		this.liftSpeed = 0
		this.gravity = .1
		this.image = new CanvasImage('./img/bird.png', this.x, this.y, .12)
		this.diagonal = {
			vertical: this.image.height * this.image.scale,
			horizontal: this.image.width * this.image.scale
		}
	}

	update() {
		this.speed += this.gravity
		this.liftSpeed = this.liftSpeed <= 0 ? 0 : this.liftSpeed - this.gravity
		this.y += this.speed - this.liftSpeed


		this.image.update({
			y: this.y
		})
	}

	lift() {
		this.speed = 0
		this.liftSpeed = 5
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
		if (bird.y + this.diagonal.vertical >= soil.y) {
			return true
		} else {
			return false
		}
	}
}

class Pipe{
	constructor(x) {
		this.x = x
		this.pipeHeights = this.getPipeHeights()

		this.topPipe = new CanvasImage('./img/pipe.png', canvas.width * .5, 0, 1, 0, this.pipeHeights.topPipeHeight)
		this.bottomPipe = new CanvasImage('./img/pipe.png', canvas.width * .5, canvas.height * (100 - this.pipeHeights.bottomPipeHeight) / 100, 1, 180, this.pipeHeights.bottomPipeHeight)
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
		this.x -= 1
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
		this.render()
	}

	render() {
		ctx.fillStyle = COLORS.SOIL
		ctx.fillRect(this.x, this.y, this.width, this.height)
	}
}

class Ground{
	constructor(x) {
		this.x = x
		this.image = new CanvasImage('./img/ground.png', this.x, canvas.height * .88, 1, 0)
	}

	update() {
		this.x -= 1
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
		this.image = new CanvasImage('./img/cloud.png', 0, canvas.height * .65, .5)
	}

	render() {
		this.image.render()
	}
}

const bird = new Bird()
const pipes = []
const soil = new Soil()
const grounds = [new Ground(0)]
const cloud = new Cloud()

// functionality: make animation loop

const animationLoop = () => {
	const req = requestAnimationFrame(animationLoop)
	console.log('animate')
	frameCount++
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	setBackground()

	// if(bird.y >= canvas.height * .8) {
	// 	bird.lift()
	// 	bird.lift()
	// }

	cloud.render()
	bird.update()

	if(bird.checkSoilCollision(soil)) {
		over = true
		cancelAnimationFrame(req)
	}

	pipes.forEach((pipe, index) => {

		if(bird.checkPipeCollision(pipe)) {
			if(!over) {
				ctx.clearRect(0, 0, canvas.width, canvas.height)
			}

			over = true			
		}

		if(!over) pipe.moveToLeft()
		else pipe.render()

		if(pipe.x + pipe.topPipe.width <= 0) {
			setTimeout(() => {
				pipes.splice(index, 1)
			}, 0)
		}
	})
	soil.render()

	const lastGround = grounds[grounds.length - 1]
	grounds.forEach((ground, index) => {
		if(!over) ground.update()
		else ground.render()

		if(lastGround.x + lastGround.image.width * lastGround.image.scale <= canvas.width + 50 && index === grounds.length - 1) {
			grounds.push(new Ground(lastGround.x + lastGround.image.width * lastGround.image.scale))
		} 

		if(ground.x + lastGround.image.width * lastGround.image.scale <= -10) {
			setTimeout(() => grounds.splice(index, 1), 0)
		}
	})
}

animationLoop()

const handleEvent = e => {
	if(!over) bird.lift() 
}

// listen to click and keypress event
// lift the bird if such events is emitted

window.addEventListener('click', handleEvent)
window.addEventListener('keypress', e => {
	if(e.code === 'Space')
		handleEvent(e)
})

setTimeout(() => {
	if(!over) pipes.push(new Pipe(canvas.width))

	const interval = setInterval(() => {
		if(over) {
			clearInterval(interval)
			return true
		}

		pipes.push(new Pipe(canvas.width))
	}, 4000)
}, 2000)
