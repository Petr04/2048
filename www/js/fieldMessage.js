'use strict';

class FieldMessage extends FieldOperate {
    sendMessage(container, {hideDelay = 0, showDelay = 0, type = 'other'}) {
        setTimeout(() => {
            this.messageShownType = type;

            this.message.innerHTML = '';
            this.message.append(container);
            this.message.classList.remove('hidden');
        }, showDelay);

        if (hideDelay) setTimeout(() => this.hideMessage(), showDelay + hideDelay);
    }

    hideMessage() {
        if (this.messageShownType == 'settings') {
            this.saveMeta();
        }

        this.messageShownType = null;
        this.settingsOpened = false;
        this.message.classList.add('hidden');
    }

    dialog(headerText, text, buttonsFuncs, kwargs) {
        let container = createDivClass('message-container');

        let header = document.createElement('h1');
        header.innerText = headerText;
        container.append(header);
        if (text)
            container.append(document.createTextNode(text));

        let buttons = createDivClass('horizontal-menu', 'buttons');

        for (let buttonText in buttonsFuncs) {
            let button = createDivClass('button');
            button.innerText = buttonText;
            button.addEventListener('click', buttonsFuncs[buttonText]);
            button.addEventListener('click', () => this.hideMessage());
            buttons.append(button);
        }

        container.append(buttons);

        this.sendMessage(container, kwargs);
    }

    lose() {
        this.dialog('Game over!', '', {
            'New game': () => this.newGame({}),
        }, {});
    }

    win() {
        if (this.won) return;

        let backMessage = this.backPressed == 0
            ? 'You never pressed Back!'
            : `You pressed back ${this.backPressed} times`;

        this.dialog('You win!', backMessage, {
            'New game': () => this.newGame({}),
            'Continue': () => {},
        }, {type: 'win'});

        this.won = true;
    }

    setMenuBarTheme() {
        if (this.appearance.darkTheme) {
            StatusBar.styleBlackOpaque();
        } else {
            StatusBar.styleDefault();
        }
    }

    settings() {
        if (this.messageShownType == 'settings') {
            this.hideMessage();
            return;
        }

        let container = createDivClass('message-container');

        let settings = document.createElement('form');
        settings.classList.add('settings');
        settings.name = 'settings';
        settings.innerHTML = 
`
<div class="horizontal-menu">
    <div>Size</div>
    <div class="horizontal-menu">
        <input type="number" name="width" value="${this.params.width}"> ×
        <input type="number" name="height" value="${this.params.height}">
    </div>
</div>
`;

        let namesToText = {
            startPower: 'Start power',
            winPower: 'Win power',
            startCount: 'Tiles count at start',
        };

        let names = ['width', 'height'];
        for (let name in namesToText) names.push(name);

        for (let name in namesToText) {
            let newElem = createDivClass('horizontal-menu');
            newElem.innerHTML =
`
<div>${namesToText[name]}</div>
<input type="number" name="${name}" value="${this.params[name]}">
`;
            settings.append(newElem);
        }

        let darkTheme = createDivClass('horizontal-menu');
        darkTheme.innerHTML =
`
<div>Theme</div>
<input type="checkbox" class="theme-switcher" id="theme-switcher" name="darkTheme">
<label for="theme-switcher"></label>
`;
        settings.append(darkTheme);
        settings.darkTheme.checked = this.appearance.darkTheme;
        settings.darkTheme.addEventListener('click', () => {
            this.appearance.darkTheme = settings.darkTheme.checked;
            if (this.appearance.darkTheme) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
            this.setMenuBarTheme();
        });

        let buttons = createDivClass('horizontal-menu', 'buttons');

        let saveButton = createDivClass('button');
        saveButton.innerText = 'Save';
        saveButton.addEventListener('click', () => {
            let newParams = {};
            for (let name of names) {
                newParams[name] = +settings[name].value;
            }

            if (_.isEqual(this.params, newParams)) this.hideMessage();
            else this.newGame(newParams);

            this.saveMeta();
        });

        let defaultsButton = createDivClass('button');
        defaultsButton.innerText = 'Set defaults';
        defaultsButton.addEventListener('click', () => {
            for (let name of names) {
                settings[name].value = defaultParams[name];
            }
        });

        let closeButton = createDivClass('button');
        closeButton.innerText = 'Close';
        closeButton.addEventListener('click', () => this.hideMessage());

        buttons.append(saveButton, defaultsButton, closeButton);

        container.append(settings, buttons);

        this.sendMessage(container, {type: 'settings'});
    }
}
