'use strict';

class FieldBase {
    constructor(...args) {
        this.elem = null;

        this.setParams(...args);
        this.setDefaultFieldSizes();

        const loadFunction = parseFloat;
        const dumpFunction = x => x + 'px';

        this.bindCssVar('size', loadFunction, dumpFunction);
        this.bindCssVar('spacing', loadFunction, dumpFunction);
        this.timeout = parseFloat(getRootCssVar('transition')) * 1000;
        this.timeoutMove = parseFloat(getRootCssVar('transition-move')) * 1000;
        this.messageTimeout = 1000;
    }

    setParams(params, appearance) {
        this.params = applyCustomParams(
            defaultParams,
            this.params,
            params
        );
        this.appearance = applyCustomParams(
            defaultAppearance,
            this.appearance,
            appearance
        );
    }

    setDefaultFieldSizes() {
        this.defaultFieldSizes = {};
        for (let direction of ['height', 'width']) {
            this.defaultFieldSizes[direction] = fieldSize(this.params[direction],
            parseFloat(getRootCssVar('default-size')),
            parseFloat(getRootCssVar('default-spacing')));
        }
    }

    bindCssVar(name, loadFunction, dumpFunction) {
        Object.defineProperty(this, name, {
            get: () => loadFunction(getRootCssVar(name)),
            set: value => setRootCssVar(name, dumpFunction(value))
        })
    }

    makeBGField() {
        let field = createDivClass('field', 'bg');

        setRootCssVar('width', this.params.width);
        setRootCssVar('height', this.params.height);

        for (let i = 0; i < this.params.width * this.params.height; i++) {
            let block = createDivClass('block');
            field.append(block);
        }

        return field;
    }

    makeField() {
        let field = createDivClass('field');

        return field;
    }

    makeMessage() {
        let message = createDivClass('message', 'hidden');
        return message;
    }

    makeFieldContainer() {
        let container = createDivClass('field-container');

        let bgField = this.makeBGField(this.params.width, this.params.height);
        let field = this.makeField(this.params.width, this.params.height);
        let message = this.makeMessage();

        this.field = field;
        this.message = message;

        container.append(bgField);
        container.append(field);
        container.append(message);

        return container;
    }

    makeContainer() {
        let container = createDivClass('container');

        this.menu = createDivClass('horizontal-menu');
        let leftButtons = createDivClass('horizontal-menu');
        let rightButtons = createDivClass('horizontal-menu');

        let newGameButton = createDivClass('button');
        newGameButton.addEventListener('click', () => {
            this.newGame({});
        });
        newGameButton.innerText = 'New game';

        this.backButton = createDivClass('button');
        this.backButton.innerText = 'Back';
        this.backButton.addEventListener('click', () => {
            if (this.backButton.classList.contains('disabled'))
                return;

            this.back();
            this.backButton.classList.add('disabled');
        });

        let settingsButton = createDivClass('button');
        settingsButton.innerText = 'Settings';
        settingsButton.addEventListener('click', () => this.settings());

        leftButtons.append(newGameButton, this.backButton);

        rightButtons.append(settingsButton);

        this.menu.append(leftButtons, rightButtons);

        let fieldContainer = this.makeFieldContainer();
        container.append(this.menu, fieldContainer);

        return container;
    }

    addRandomBlocks() {
        for (let i = 0; i < this.params.startCount; i++)
            this.addRandomBlock();
    }

    makeBlocks() {
        this.blocks = empty2DArray(this.params.width, this.params.height, null);
    }

    newGame(...args) {
        this.clear();

        this.setParams(...args);
        this.setDefaultFieldSizes();

        let newElem = this.makeContainer();

        this.new = [];
        this.messageShownType = null;
        this.settingsOpened = false;

        if (!this.elem) { // first game
            this.elem = newElem;
            this.lastStep = getJSONItem('lastStep') || [];
            this.backPressed = getJSONItem('backPressed') || 0;
            this.won = getJSONItem('won') || false;
            let oldBlocks = getJSONItem('blocks');
            if (oldBlocks) this.fillWithBlocks(oldBlocks);
            else this.addRandomBlocks();
        } else {
            this.elem.replaceWith(newElem);
            this.elem = newElem;
            this.lastStep = [];
            this.backPressed = 0;
            this.won = false;
            this.makeBlocks();
            this.addRandomBlocks();
        }

        this.hideMessage();

        if (this.lastStep.length == 0)
            this.backButton.classList.add('disabled');

        setTimeout(() => this.adjustWindowSize(), 0);

        return this.elem;
    }
}
