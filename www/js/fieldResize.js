class FieldResize extends FieldBase {
    constructor(...args) {
        super(...args);
        this.lastIsTextAbsolute = null;
        this.defaultValuesSet = false;
    }

    fieldWidth(n) {
        return fieldSize(n,
            parseInt(getRootCssVar('size')),
            parseInt(getRootCssVar('spacing'))
        );
    }

    alignBlocks() {
        for (let i = 0; i < this.params.width; i++) {
            for (let j = 0; j < this.params.height; j++) {
                if (this.blocks[i][j])
                    this.move(this.blocks[i][j], i, j);
            }
        }
    }

    textResize(newFieldSize, direction) {
        const isTextAbsolute = Math.min(window.innerWidth, window.innerHeight) >= 494;

        if (isTextAbsolute != this.lastIsTextAbsolute) {
            if (isTextAbsolute) {
                setRootCssVar('interface-spacing', '13px');
            } else {
                setRootCssVar('interface-spacing', '2.6vmin');
            }
        }
        this.lastIsTextAbsolute = isTextAbsolute;
    }

    resize(newFieldSize, direction) {
        const ratio = newFieldSize / this.currentFieldSize(direction);

        const names = ['size', 'spacing'];

        for (let name of names) {
            // maybe it's better not to round
            this[name] = _.round(this[name] * ratio, 1);
        }

        this.alignBlocks();
    }

    getWidthByHeight(height) {
        const ratio = this.defaultFieldSizes.width
            / this.defaultFieldSizes.height;

        return ratio * height;
    }

    adjustWindowSize() {
        const paddingRatio = .06;
        // Differencies between window and field (with buttons) sizes
        const diffs = {
            width: window.innerWidth * paddingRatio,
            height: window.innerHeight * paddingRatio
                + this.menu.offsetHeight,
        };

        let dir;
        let minWidth = Infinity;
        let newFieldSize;
        for (let direction in diffs) {
            const windowSize = window['inner' + _.capitalize(direction)];
            const currentNewFieldSize = windowSize - diffs[direction];

            let width;
            if (direction == 'width') {
                width = currentNewFieldSize;
            } else {
                width = this.getWidthByHeight(currentNewFieldSize);
            }

            if (width < minWidth) {
                minWidth = width;
                newFieldSize = currentNewFieldSize;
                dir = direction;
            }
        }

        this.textResize(newFieldSize, dir);

        const minDimension = Math.min(window.innerWidth, window.innerHeight);
        this.resize(Math.min(
            fieldSize(this.params[dir], minDimension * 0.202, minDimension * 0.026),
            newFieldSize,
            this.defaultFieldSizes[dir]),
        dir);
    }
}
