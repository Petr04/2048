'use strict';

class FieldOperate extends FieldResize {
    constructor(...args) {
        super(...args);
        this.makeBlocks();
    }

    isValidCoord(x, y) {
        return _.zipWith([this.params.width, this.params.height], [x, y], (max, x) => ((0 <= x) && (x < max)))
            .every(x => x == true);
    }

    powToShade(pow) {
        let percents = 100 / (this.params.winPower - this.params.startPower) * (pow - this.params.startPower);
        if (percents < 0) percents = 0;
        if (percents > 100) percents = 100;
        return percents;
    }

    textToColorGrey(text) {
        let n = Number(text);
        let pow = Math.log2(n);
        let shade = this.powToShade(pow);
        return {
            bg: `hsl(0, 0%, ${shade}%)`,
            fg: shade < 50 ? 'var(--light)' : 'var(--dark)',
        };
    }

    textToColorClassic(text) {
        const powerToColor = [
            '#eee5da', // 2
            '#eee1ce', // 4
            '#f4b27e', // 8
            '#f6976b', // 16
            '#f77e69', // 32
            '#f76148', // 64
            '#edd073', // 128
            '#edcc62', // 256
            '#edc950', // 512
            '#edc53f', // 1024
            '#edc22e', // 2048
            '#ef676b', // 4096
            '#ed4d59', // 8192
            '#f33f3e', // 16384
            '#72b4d6', // 32768
            '#5ba0de', // 65536
            '#1981ce', // 131072
        ];

        let power = Math.log2(+text);
        if (power > powerToColor.length) {
            power = powerToColor.length;
        }

        const fgLight = '#f9f6f2';
        const fgDark  = '#776e65';

        return {
            bg: powerToColor[power-1],
            fg: power < 3 ? fgDark : fgLight,
        };
    }

    add(x, y, text, merge = false, logical = true) {
        let block = createDivClass('block');
        this.setBlockText(block, text);

        if (merge) block.classList.add('merge');

        this.field.append(block);

        this.move(block, x, y, false, logical);

        return block;
    }

    delete(block, logical = true, anim = null) {
        if (logical) {
            let coord = this.getBlockCoord(block);
            this.blocks[coord[0]][coord[1]] = null;
        }

        if (anim) {
            block.classList.add(anim);
            setTimeout(() => block.remove(), this.timeout);
        } else block.remove();
    }

    get(x, y) {
        return this.blocks[x][y];
    }

    has(x, y) {
        return this.isValidCoord(x, y) && this.get(x, y) != null;
    }

    clear() {
        for (let column of this.blocks) {
            for (let block of column) {
                if (block) this.delete(block);
            }
        }
    }

    hasBlock(block) {
        return this.getBlockCoord(block) != null;
    }

    getBlockCoord(block) {
        for (let i = 0; i < this.params.width; i++) {
            for (let j = 0; j < this.params.height; j++) {
                if (this.blocks[i][j] == block) return [i, j];
            }
        }

        return null;
    }

    setBlockText(block, text) {
        let {bg, fg} =
            this.appearance.theme == 'light' ? this.textToColorGrey(text)
            : this.appearance.theme == 'dark' ? this.textToColorGrey(text)
            : this.appearance.theme == 'classic' ? this.textToColorClassic(text)
            : {bg: 'black', fg: 'black'};

        block.innerText = text;
        block.style.background = bg;
        block.style.color = fg;
    }

    updateBlockTheme() {
        for (let column of this.blocks) {
            for (let block of column) {
                if (block) this.setBlockText(block, block.innerText);
            }
        }
    }

    getCoordText(x, y) {
        return this.get(x, y).innerText;
    }

    get freeCoords() {
        let ret = [];

        for (let i = 0; i < this.params.width; i++) {
            for (let j = 0; j < this.params.height; j++) {
                if (!this.has(i, j)) ret.push([i, j]);
            }
        }

        return ret;
    }

    currentFieldSize(direction) {
        return fieldSize(this.params[direction], this.size, this.spacing);
    }

    getCoordPixels(x, y) {
        return [x, y].map(coord => coord * this.size + (coord + 1) * this.spacing);
    }

    fillWithBlocks(blocks) {
        for (let i = 0; i < this.params.width; i++) {
            for (let j = 0; j < this.params.height; j++)
                if (blocks[i][j]) this.add(i, j, blocks[i][j]);
        }
    }

    saveBlocks() {
        let blocks = [];
        for (let i = 0; i < this.params.width; i++) {
            blocks.push([]);
            for (let j = 0; j < this.params.height; j++) {
                if (this.blocks[i][j]) blocks[i].push(this.blocks[i][j].innerText);
                else blocks[i].push(null);
            }
        }
        setJSONItem('blocks', blocks);
    }

    move(block, x, y, write = false, logical = true) {
        let old;
        if (logical) {
            old = this.getBlockCoord(block);
            if (old) this.blocks[old[0]][old[1]] = null;
            this.blocks[x][y] = block;
        }

        let startCoord = this.getCoordPixels(x, y);
        let endCoord = startCoord.map(x => x + this.size);
        endCoord = _.zipWith(this.getCoordPixels(this.params.width, this.params.height), endCoord, _.subtract);

        [block.style.left, block.style.top] = startCoord.map(x => x + 'px');
        [block.style.right, block.style.bottom] = endCoord.map(x => x + 'px');

        if (!logical) return;

        if (write && !_.isEqual(old, [x, y])) {
            this.newStep.push({
                type: 'move',
                old: old,
                new: [x, y]
            });
        }
    }

    merge(a, b, write = false) {
        if (a.innerText != b.innerText) return null;

        let coordA = this.getBlockCoord(a);
        let coord = this.getBlockCoord(b);
        let sum = _.sum([a, b].map(x => Number(x.innerText)));

        this.move(a, ...coord);

        setTimeout(() => this.delete(a, false), this.timeoutMove);
        let c = this.add(coord[0], coord[1], sum, true);

        setTimeout(() => this.delete(b, false), this.timeout);

        if (Math.log2(sum) == this.params.winPower) {
            this.win();
        }

        if (write) {
            this.newStep.push({
                type: 'merge',
                old: coordA,
                new: coord
            });
        }

        return c;
    }
}
