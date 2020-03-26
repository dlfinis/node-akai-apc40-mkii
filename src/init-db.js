const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const Memory = require('lowdb/adapters/Memory');

// const adapter = new FileSync('assets/dbKeys.json');
const adapter = new Memory();
const db = low(adapter);

const spFaderAndKnobsKeys = require('../assets/init-fader-knobs-keys');
const spColorPalette = require('../assets/color-palette');
const KEY_BASE_CIRCLE_SECONDARY = 48;
const KEY_BASE_S_SECONDARY = 49;
const KEY_BASE_8_SECONDARY = 50;
const KEY_BASE_SECTION = 51;
const KEY_BASE_CLIP_COLUMN = 52;
const KEY_BASE_AB_SECONDARY = 66;

const _ = require('lodash');

// Set some defaults (required if your JSON file is empty)


function init() {
    db.defaults({keys: [], activeKey: {}})
        .write();

    db.set({keys: [], activeKey: {}})
        .write();
}

function initKeys() {
    for (let channel = 0; channel <= 5; channel++) {
        for (let i = 0; i <= 39; i++) {
            const color = _.find(spColorPalette.keys, {level: channel})
            db.get('keys')
                .push({id: i, check: false, colorOn: color.on, colorOff: color.off, channel: channel})
                .write()
        }
    }
}

function initControlClipKey() {
    for (let i = 0; i <= 7; i++) {
        db.get('keys')
            .push({id: KEY_BASE_CLIP_COLUMN, check: false, colorOn: 1, colorOff: 0, channel: i})
            .write()
    }
}

function initSceneKey() {
    for (let channel = 0; channel <= 5; channel++) {
        for (let i = 0; i <= 5; i++) {
            const color = _.find(spColorPalette.session, {key: i});
            db.get('keys')
                .push({id: 81 + i, check: false, colorOn: color.on, colorOff: color.off, channel: channel})
                .write()
        }
    }
}

function initSectionKey() {
    // db.get('keys')
    //     .push({id: KEY_BASE_SECTION, check: true, colorOn: 127, colorOff: 0, channel: 0})
    //     .write();
    for (let i = 0; i <= 7; i++) {
        db.get('keys')
            .push({id: KEY_BASE_SECTION, check: false, colorOn: 127, colorOff: 0, channel: i})
            .write()
    }
}

function initLateralKey() {
    for (let i = 58; i <= 65; i++) {
        db.get('keys')
            .push({id: i, check: false, colorOn: 127, colorOff: 0, channel: 0})
            .write()
    }
}

function initSecondaryKey(key) {
    for (let i = 0; i <= 7; i++) {
        db.get('keys')
            .push({id: key, check: false, colorOn: 127, colorOff: 0, channel: i})
            .write()
    }
}

function initAllSecondaryKey() {
    initSecondaryKey(KEY_BASE_S_SECONDARY);
    initSecondaryKey(KEY_BASE_CIRCLE_SECONDARY);
    initSecondaryKey(KEY_BASE_8_SECONDARY);
    initSecondaryKey(KEY_BASE_AB_SECONDARY);
}

init();
initKeys();
initControlClipKey();
initSceneKey();
initSectionKey();
initAllSecondaryKey();
initLateralKey();

exports.dbKeys = db;
exports.spFaderAndKnobsKeys = spFaderAndKnobsKeys;
