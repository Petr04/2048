function zipSum(arr1, arr2) {
	return _.zipWith(arr1, arr2, _.add);
}

let directionToDelta = {
	up:    [0, -1],
	down:  [0,  1],
	left:  [-1, 0],
	right: [1,  0],
}

class Field extends FieldOperate {
	constructor(...args) {
		super(...args);
		this.lost = false;
	}

	merge(a, b) {
		if (a.innerText != b.innerText) return null;

		let coord = this.getBlockCoord(b);
		let sum = _.sum([a, b].map(x => Number(x.innerText)));

		this.move(a, ...coord);

		this.delete(a);
		let c = this.add(coord[0], coord[1], sum, true);

		let timeout = parseFloat(
			getComputedStyle(document.documentElement)
			.getPropertyValue('--transition')) * 1000;

		setTimeout(() => this.delete(b, false), timeout);

		return c;
	}

	getObstacleCoord(block, dx, dy) {
		let lastCoord = this.getBlockCoord(block);
		while (true) {
			let newCoord = zipSum(lastCoord, [dx, dy]);

			if (
				!this.isValidCoord(...newCoord) ||
				this.has(...newCoord)
			) return newCoord;

			lastCoord = newCoord;
		}
	}

	moveUntilMerge(block, dx, dy) {
		let coord = this.getObstacleCoord(block, dx, dy);
		let preCoord = zipSum(coord, [dx, dy].map(x => x * -1));

		let merged = false;
		let moved = !_.isEqual(this.getBlockCoord(block), preCoord);

		if (this.has(...coord)) merged = this.merge(block, this.get(...coord)) != null;
		if (!merged) this.move(block, ...preCoord);

		return merged || moved;
	}

	addRandomBlock() {
		let free = this.freeCoords;
		if (free.length == 0) return false;

		let coord = free[_.random(0, free.length-1)];
		let digit = _.random(1, 10) == 1 ? '4' : '2';

		this.add(...coord, digit);

		return true;
	}

	sendMessage(text, timeout) {
		this.message.innerText = text;
		this.message.classList.remove('hidden');
		if (timeout) setTimeout(() => this.hideMessage(), timeout);
	}

	hideMessage() {
		this.message.classList.add('hidden');
	}

	isMergeable(x, y) {
		let text;
		if (this.has(x, y)) text = this.getCoordText(x, y);
		else return false;

		let ret = false;
		for (let dx = -1; dx <= 1; dx++) {
			for (let dy = -1; dy <= 1; dy++) {
				if (!( [dx, dy].includes(0) && !_.isEqual([dx, dy], [0, 0]) )) continue;

				let [nx, ny] = [x + dx, y + dy];
				if (!this.has(nx, ny)) continue;
				ret = ret || text == this.getCoordText(nx, ny);
			}
		}

		return ret;
	}

	check() {
		let ret = false;

		for (let i = 0; i < this.width; i++) {
			for (let j = 0; j < this.height; j++) {
				if (this.blocks[i][j] == null) continue;
				ret = ret || this.isMergeable(i, j);
			}
		}

		return ret || this.freeCoords.length != 0;
	}

	lose() {
		this.sendMessage('Game over');
	}

	getGoSideCoords(direction) {
		let ret = [];

		let delta = directionToDelta[direction];
		let variableIndex = delta.indexOf(0);
		let constantIndex = Number(!Boolean(variableIndex));
		let limit = [this.width, this.height][delta.indexOf(0)];

		for (let i = 0; i < limit; i++) {

			let push = new Array(2);
			push[variableIndex] = i;
			push[constantIndex] = (limit-1) * (delta[constantIndex] > 0);

			ret.push( push );
		}

		return ret;
	}

	go(direction) {
		let delta = directionToDelta[direction];
		let changed = false;

		for (let startCoord of this.getGoSideCoords(direction)) {
			for (let blockCoord = startCoord; this.isValidCoord(...blockCoord);
				blockCoord = zipSum(blockCoord, delta.map(x => x * -1))) {

				if (!this.has(...blockCoord)) continue;
				let block = this.get(...blockCoord);
				let ret = this.moveUntilMerge(block, ...delta);
				changed = changed || ret;
			}
		}

		if (changed) {
			this.addRandomBlock();
			if (!this.check()) this.lose();
		}
	}
}
