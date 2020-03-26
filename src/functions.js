const Output = require('easymidi').Output;
const _ = require('lodash');


class Functions {

    constructor(outputValueRelay, outputValueEmitter) {
        this.output = outputValueRelay;
        this.outputEmitter = outputValueEmitter;
        this.COLOR_INIT = 9;
        this.COLOR_SCENE_INIT = 104;
        this.COLOR_CHECK_BASE = 46;
        this.KEY_BASE_CIRCLE_SECONDARY = 48;
        this.KEY_BASE_S_SECONDARY = 49;
        this.KEY_BASE_8_SECONDARY = 50;
        this.KEY_BASE_SECTION = 51;
        this.KEY_BASE_CLIP_COLUMN = 52;
        this.KEY_BASE_AB_SECONDARY = 66;
        this.stateCurrentSession = {
            note: 0,
            channel: 0,
            velocity: 0,
            _type: ''
        };
        this.stateCurrentLateral = {
            first: 0,
            second: 0
        }
    }

    print(message, ...optionalParams) {
        console.log('-----------------------------------');
        return console.log(message, optionalParams);
        console.log('-----------------------------------');
    }

    error(message, ...optionalParams) {
        console.log('***********************************');
        return console.error(message, optionalParams);
        console.log('***********************************');
    }

    * range(start, stop, step = 1) {
        if (typeof stop === 'undefined') {
            // one param defined
            stop = start;
            start = 0;
        }

        for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
            console.log('R:', i);
            yield i;
        }
    }

    grange(start, stop, step = 1) {
        if (typeof stop === 'undefined') {
            // one param defined
            stop = start;
            start = 0;
        }

        const response = [];

        for (let i = start; step > 0 ? i <= stop : i >= stop; i += step) {
            // console.log('R:', i);
            response.push(i);
        }
        return response;
    }

    between(x, min, max) {
        return x >= min && x <= max;
    }

    betweenStep(x, min, max, step) {
        return this.grange(min, max, step).includes(x);
    }

    toggleState(state) {
        return !state;
    }

    isNullOrEmpty(value) {
        return _.isNil(value) || _.isUndefined(value);
    }

    notNullOrEmpty(value) {
        return !this.isNullOrEmpty(value);
    }

    initState() {
        //F0 47 7f 29 60 00 04 41 09 07 01 f7
        this.sendRelay('sysex', [240, 71, 127, 41, 96, 0, 4, 65, 9, 7, 1, 247]);
        for (let channel = 0; channel <= 15; channel++) {
            for (let note = 0; note <= 127; note++) {
                this.sendRelay('noteon', this.led_off_complete(note, channel));
            }
        }
        //this.pushButton(this.KEY_BASE_SECTION, 0, 1);
    }

    initAllButtonPad(dataKeys) {
        const keyButton = this.getStateBaseButton(0, 0, dataKeys);
        for (let i = 0; i <= 40; i++) {
            this.sendRelay('noteon', this.changeColorLed(i, 0, keyButton.colorOff));
        }
    }

    initAllScenePad(dataKeys) {
        for (let i = 81; i <= 86; i++) {
            const keyButton = this.getStateBaseButton(i, 0, dataKeys);
            this.sendRelay('noteon', this.changeColorLed(keyButton.id, 0, keyButton.colorOff));
        }
    }

    initAll(dataKeys) {
        this.initState();
        this.initAllButtonPad(dataKeys);
        this.initAllScenePad(dataKeys);
    }

    led_off_complete(note, channel = 0) {
        return {
            note: note,
            velocity: 0,
            channel: channel
        };
    }

    changeColorLed(note, channel, color, on = true) {
        if (this.isNullOrEmpty(channel)) {
            channel = 0
        }

        if (this.isNullOrEmpty(color)) {
            if (on) color = this.COLOR_CHECK_BASE;
            else color = this.COLOR_INIT;
        }

        return {
            note: note,
            velocity: color,
            channel: channel
        };
    }

    sendRelay(type, msg) {
        // this.print('Output Relay:', msg);
        this.output.send(type, msg);
    }

    sendEmitter(type, msg) {
        // this.print('Output Emitter:', msg);
        this.outputEmitter.send(type, msg);

    }

    sendAll(type, msg) {
        this.sendRelay(type, msg);
        this.sendEmitter(type, msg);
    }

    checkEmptyColumnPad(data, start, stop, step) {
        var response = true;
        var list = this.grange(start, stop, step);
        for (const i in list) {
            const value = data.find({id: list[i]}).value();
            if (value && value.check) {
                response = false;
            }
        }
        return response;
    }

    isValidKey(note, channel, kMin, kMax, cMin, cMax) {
        if (this.notNullOrEmpty(kMin) && this.notNullOrEmpty(kMax)) {
            if (!this.between(note, kMin, kMax)) {
                return false;
            }
        }

        if (this.notNullOrEmpty(cMin) && this.notNullOrEmpty(cMax)) {
            if (!this.between(channel, cMin, cMax)) {
                return false;
            }
        }

        return true;
    }

    setOffButtonsByKeys(data, start, stop, step, channel = 0, emitter = true) {
        var list = this.grange(start, stop, step);
        for (const i in list) {
            const value = data.find({id: list[i]}).value();
            value.check = false;
            this.unPushButton(value.id, channel, value.colorOff, emitter);
        }
    }

    setOnButtons(dataKeys, initKey, stopKey, initCh, stopCh, emitter = true) {
        for (let key = initKey; key <= stopKey; key++) {
            this.setOffButtonsByChannels(dataKeys, initCh, stopCh, emitter);
        }
    }

    setStateButtonsKeysByChannel(dataKeys, initKey, stopKey, channel = 0, emitter = true) {
        for (let key = initKey; key <= stopKey; key++) {
            const value = this.getStateBaseButton(key, channel, dataKeys);
            // console.log('Change state', value);
            // this.unPushButton(value.id, channel, 0, emitter);
            if (value.check) {
                this.pushButton(value.id, channel, value.colorOn, emitter);
            } else {
                this.unPushButton(value.id, channel, value.colorOff, emitter);
            }
        }
    }

    setOffButtonsByChannels(dataKeys, note, start, stop, emitter = true) {
        for (let channel = 0; channel <= stop; channel++) {
            const value = dataKeys.find({id: note, channel: channel}).value();
            value.check = false;
            this.unPushButton(value.id, channel, value.colorOff, emitter);
        }
    }

    setOffClipButtons(dataKeys, currentChannel) {
        if (currentChannel > 0) {
            for (let chTemp = 0; chTemp <= 7; chTemp++) {
                this.offButtonNoteRelay(this.KEY_BASE_CLIP_COLUMN, chTemp);
            }
            this.setOffButtonsByChannels(dataKeys)
        } else {
            for (let chTemp = 0; chTemp <= 7; chTemp++) {
                this.setStateButtonsKeysByChannel(dataKeys, this.KEY_BASE_CLIP_COLUMN, this.KEY_BASE_CLIP_COLUMN, chTemp, false);
            }
        }
    }

    getChannelSceneButtonPad(note) {
        for (let channel = 0; channel <= 5; channel++) {
            const keyScene = 81 + channel;
            if (note === keyScene) {
                return channel;
            }
        }
    }


    getStateBaseButton(note, channel, dataKeys) {
        let key = dataKeys
            .find({id: note, channel: channel})
            .value();

        this.print('getStateBaseButton', key);
        if (this.isNullOrEmpty(key)) {
            this.error('Dont exist DB key:', note);
            return false;
        }

        return key;
    }

    onCheckButtonBase(note, channel, dataKeys, emitter = true) {
        if (this.isNullOrEmpty(note) || this.isNullOrEmpty(dataKeys)) {
            this.error('Dont exist data for ButtonBase');
            return;
        }

        const keyButton = this.getStateBaseButton(note, channel, dataKeys);
        if (keyButton) {
            keyButton.check = this.toggleState(keyButton.check);
            if (keyButton.check) {
                this.pushButton(note, channel, keyButton.colorOn, emitter);
            } else {
                this.unPushButton(note, channel, keyButton.colorOff, emitter);
            }
        } else {
            this.error('Dont exist id for key:', note);
        }
        // this.print('onCheckButtonBase end', keyButton);
    }

    onStateButtonBase(note, channel, dataKeys, kMin, kMax, cMin, cMax) {
        //this.print('OnStateButtonBase -> init');
        if (this.isValidKey(note, channel, kMin, kMax, cMin, cMax)) {
            this.onCheckButtonBase(note, channel, dataKeys);
        }
        //this.print('OnStateButtonBase -> continue');
    }

    onStateSection({note, channel, velocity, _type}, dataKeys) {
        this.onStateButtonBase(note, channel, dataKeys, this.KEY_BASE_SECTION, this.KEY_BASE_SECTION, 0, 7);
    }

    onStateScene({note, channel, velocity, _type}, dataKeys) {
        //this.onStateButtonBase(note, currentChannel, dataKeys, 82, 86, 0, 7);
        const currentChannel = this.getChannelSceneButtonPad(note);
        if (this.stateCurrentSession.note !== note || this.stateCurrentSession.channel !== currentChannel) {
            if (this.isValidKey(note, channel, 81, 86, 0, 0)) {
                this.stateCurrentSession = {note, channel: currentChannel, velocity, _type};
                this.setOffButtonsByKeys(dataKeys, 81, 86, 1, 0, false);
                this.setOffClipButtons(dataKeys, currentChannel);
                this.onCheckButtonBase(note, channel, dataKeys);
                this.setStateButtonsKeysByChannel(dataKeys, 0, 39, currentChannel, false);
            }
        }
    }

    onStateButtonPad({note, channel}, dataKeys) {
        const currentChannel = this.stateCurrentSession.channel;
        //this.print('onStateButtonPad', note + ' : ' + channel, currentChannel)
        this.onStateButtonBase(note, currentChannel, dataKeys, 0, 39, 0, 7);
        this.onStateColumnButtonPad(note, dataKeys);
    }

    onStateClipButton({note, channel}, dataKeys) {
        const currentChannel = this.stateCurrentSession.channel;
        if (note === this.KEY_BASE_CLIP_COLUMN && this.between(channel, 0, 7) && currentChannel === 0) {
            const keyClip = dataKeys.find({id: note, channel: channel}).value();
            if (keyClip && keyClip.check) {
                const note_min = 0 + channel;
                const note_max = 32 + channel;
                this.unPushButton(this.KEY_BASE_CLIP_COLUMN, channel, 0);
                this.setOffButtonsByKeys(dataKeys, note_min, note_max, 8, currentChannel, false);
                keyClip.check = this.toggleState(keyClip.check);
            }
        } else {
            return;
        }
    }

    onStateColumnButtonPad(note, dataKeys) {
        const keyButton = this.getStateBaseButton(note, 0, dataKeys);

        for (let index = 0; index < 8; index++) {
            const note_min = 0 + index;
            const note_max = 32 + index;
            const keyClip = dataKeys.find({id: this.KEY_BASE_CLIP_COLUMN, channel: index}).value();

            if (keyClip === undefined) {
                console.error('Dont exist db clip key');
                break;
            }

            if (keyButton.check) {
                if (this.betweenStep(note, note_min, note_max, 8) && !keyClip.check) {
                    this.onButtonNoteRelay(this.KEY_BASE_CLIP_COLUMN, index);
                    keyClip.check = this.toggleState(keyClip.check);
                }
            } else {
                if (this.checkEmptyColumnPad(dataKeys, note_min, note_max, 8) && keyClip.check) {
                    this.offButtonNoteRelay(this.KEY_BASE_CLIP_COLUMN, index);
                    keyClip.check = this.toggleState(keyClip.check);
                }
            }
        }

    }

    onStateButtonSecondaryPad({note, channel}, dataKeys) {
        if (this.isValidKey(note, channel, this.KEY_BASE_CIRCLE_SECONDARY, this.KEY_BASE_8_SECONDARY, 0, 7)
            || this.isValidKey(note, channel, this.KEY_BASE_AB_SECONDARY, 66, 0, 7)) {
            this.onCheckButtonBase(note, channel, dataKeys);
        }
    }

    onStateButtonLateral({note, channel}, dataKeys) {
        if (this.between(note, 58, 59)) {
            if (this.stateCurrentLateral.first !== note) {
                this.onCheckButtonBase(note, channel, dataKeys);
                if (this.stateCurrentLateral.first !== 0) {
                    this.onCheckButtonBase(this.stateCurrentLateral.first, channel, dataKeys, false);
                }
                this.stateCurrentLateral.first = note;

            } else {
                this.pushButton(note, channel, 127);
            }
            return;
        }
        if (this.between(note, 60, 61)) {
            if (this.stateCurrentLateral.second !== note) {
                this.onCheckButtonBase(note, channel, dataKeys);
                if (this.stateCurrentLateral.second !== 0) {
                    this.onCheckButtonBase(this.stateCurrentLateral.second, channel, dataKeys, false);
                }
                this.stateCurrentLateral.second = note;
            } else {
                this.pushButton(note, channel, 127);
            }
            return;
        }
        this.onStateButtonBase(note, channel, dataKeys, 62, 65, 0, 0);
    }

    pushButton(note, channel, color, emitter = true) {
        this.sendRelay('noteon', this.changeColorLed(note, channel, color));
        if (emitter) {
            this.sendEmitter('noteon', this.changeColorLed(note, channel, color));
        }
        this.print('Push Button:', this.changeColorLed(note));
    }

    unPushButton(note, channel, color, emitter = true) {
        this.sendRelay('noteon', this.changeColorLed(note, channel, color, false));
        if (emitter) {
            this.sendEmitter('noteoff', this.changeColorLed(note, channel, color, false));
        }
       this.print('UnPush Button Note:', this.changeColorLed(note, channel, color, false));
    }

    onButtonNoteRelay(note, channel = 0) {
        this.sendRelay('noteon', this.changeColorLed(note, channel, 1));
    }

    offButtonNoteRelay(note, channel = 0) {
        this.sendRelay('noteoff', this.changeColorLed(note, channel, 0, false));
    }

    offButtonNoteEmitter(note, channel = 0) {
        this.sendEmitter('noteoff', this.changeColorLed(note, channel, 0, false));
    }
}

module.exports = Functions;
