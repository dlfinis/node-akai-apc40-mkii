const easymidi = require('easymidi');

const _ = require('lodash');
const {dbKeys, spFaderAndKnobsKeys} = require('./init-db');

const func = require('./functions');

const DEFAULT_IN_PREFIX = 'APC40 mkII';
const DEFAULT_OUT_PREFIX = 'MA Dot2';

const inputs = easymidi.getInputs();
const outputs = easymidi.getOutputs();

console.log('---------------------------------------------------');
console.log('Show Inputs Midi', inputs);
console.log('Show Inputs Ouputs', outputs);
console.log('---------------------------------------------------');

function findPrefix(prefix, list) {
    return list.find(item => {
        if (item.indexOf(prefix) === 0) {
            return item;
        }
    })
}

function main() {

    const tInput = findPrefix(DEFAULT_IN_PREFIX, inputs);
    const tOutput1 = findPrefix(DEFAULT_IN_PREFIX, outputs);
    const tOutput2 = findPrefix(DEFAULT_OUT_PREFIX, outputs);

    console.log('Connecting to: ' + tInput, 'Output1: ' + tOutput1, 'Output2: ' + tOutput2);
    console.log('---------------------------------------------------');

    if (inputs.length <= 0) {
        console.error('---------------------------------------------------');
        console.error("No midi device found");
        console.error('---------------------------------------------------');
        process.exit(1);
    }

    if (!tInput && !tOutput1) {
        console.error('---------------------------------------------------');
        console.error('Dont exist default MIDI conections');
        console.error('---------------------------------------------------');
        process.exit(1);
    }

    if (!tOutput2) {
        console.error('---------------------------------------------------');
        console.error('Dont exist default MIDI external - MA DOT2');
        console.error('---------------------------------------------------');
        process.exit(1);
    }

    if (!dbKeys.get('keys')) {
        console.error('---------------------------------------------------');
        console.error('Dont exist definition of DB Keys');
        console.error('---------------------------------------------------');
        process.exit(1);
    }

    const input = new easymidi.Input(tInput);

    const outputRelay = new easymidi.Output(tOutput1);
    const outputEmitter = new easymidi.Output(tOutput2);
    const execFn = new func(outputRelay, outputEmitter);

    console.log('--- Init program reception MIDI Signal ---');
        const dataKeys = dbKeys.get('keys');
    execFn.initAll(dataKeys);

    // input.on('noteon', function (params) {
    //     execFn.print('Note On', params);
    // });

    input.on('noteoff', function (params) {

        const note = params.note;
        let channel = params.channel;


        // params = {note: ..., velocity: ..., channel: ...}
        execFn.print('Note Off:', params, note, channel);

        execFn.onStateSection(params, dataKeys);
        execFn.onStateScene(params, dataKeys);
        execFn.onStateClipButton(params, dataKeys);
        execFn.onStateButtonPad(params, dataKeys);
        execFn.onStateButtonSecondaryPad(params, dataKeys);
        execFn.onStateButtonLateral(params, dataKeys);

    });


    input.on('cc', function (params) {
        //params = {channel: ..., controller: ..., value:...};
        const vCC = _.find(spFaderAndKnobsKeys, {'current': params.controller, 'channel': params.channel});
        execFn.print('ControlChanger:', 'params:', params, "vCC": vCC);

        if (vCC) {
            execFn.sendEmitter('noteon', {note: vCC.new, velocity: params.value, channel: params.channel});
        }

    });
}


main();
