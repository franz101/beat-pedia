import { generateKick, generateClapSample,generateCYSample,generateSnareSample,generateOHSample ,generateCHSample,generateHiTom, generateCH, generateOH } from './generator.js' 

import { templates } from './templates.js';






const seq = {
    kick: [1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    clap: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ch: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0],
    oh: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    hitom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    cymbal: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};
const bpmToTimeout = (bpm) => parseFloat(15000 / bpm);

let bpm = document.getElementById('bpm').value
let currentStep = 0;
let stepsCount=16;
// let stepSize=4;
let timerID = null;
let isPlaying = false;
let context = new (window.AudioContext || window.webkitAudioContext)();
let nextNoteTime=0;

let scheduleAheadTime=0.1;
let schedulerTimeoutVal=bpmToTimeout(bpm);
// let stepDuration= ((bpm/2)/bpm)/stepSize;
let stepDuration= 0.125;


const keys = { c: 'kick', x: 'snare', b: 'clap', z: 'ch', v: 'oh', n: 'hitom' };

const soundGenerators = {
    kick: generateKick, snare: generateSnareSample, clap: generateClapSample,
    oh: generateOHSample, ch: generateCHSample, hitom: generateHiTom,
    cymbal: generateCYSample
 };


const playSound = (sound, generator, context, isSingle = false) => (seq[sound][currentStep] || isSingle) && generator(context);

const createSeqSteps = () => {
    Object.keys(seq).forEach((drum) => {
        const stepsContainer = document.getElementById(`${drum}-steps`);
        stepsContainer.innerHTML = '';

        seq[drum].forEach((_, i) => {
            const step = document.createElement('div');
            step.classList.add('step', 'w-6', 'h-6', 'border', 'border-gray-700', 'mr-1', 'cursor-pointer');
            step.classList.toggle('active', seq[drum][i]);
            step.dataset.sound = drum;
            step.dataset.step = i;
        
            step.addEventListener('click', () => {
                seq[drum][i] = !seq[drum][i];
                step.classList.toggle('active', seq[drum][i]);
            });
        
            stepsContainer.appendChild(step);
        });
        
    });
};

const createIndicatorSteps = () => {
    const indicator = document.getElementById('indicator-steps');
    indicator.innerHTML = '';

    Array.from({ length: stepsCount }).forEach((_, i) => {
        const step = document.createElement('div');
        step.classList.add('step', 'w-6', 'h-6', 'border', 'border-gray-700', 'mr-1', 'cursor-pointer');
        step.classList.toggle('activeIndicator', i === currentStep);
    
        indicator.appendChild(step);
    });
    
};

const playSequence = () => {
    const currentTime = context.currentTime;
    ['kick', 'snare', 'hitom', 'oh', 'ch', 'clap',"cymbal"].forEach(sound => playSound(sound, soundGenerators[sound], context));
    currentStep = (currentStep + 1) % stepsCount;

    const indicatorSteps = document.querySelectorAll('#indicator .step');
    indicatorSteps.forEach((step, index) => step.classList.toggle('activeIndicator', index === currentStep));
    nextNoteTime = currentTime + stepDuration;
}

const scheduler = () => {
    while (nextNoteTime < context.currentTime + scheduleAheadTime) {
        playSequence();
    }
    timerID = setTimeout(scheduler, schedulerTimeoutVal);
}

const togglePlayback = () => {
    context = new (window.AudioContext || window.webkitAudioContext)();
    isPlaying = !isPlaying;
    const playButton = document.getElementById('togglePlayback');

    playButton.textContent = "Pause";
    if (isPlaying) {
        if (context.state === "suspended") {
            context.resume();
        }
        nextNoteTime = context.currentTime;

        scheduler();
    } else {
        clearTimeout(timerID);
        playButton.textContent = "Play"; 
    }
};

const toggleStep = (drum, step) => seq[drum][step] = seq[drum][step] === 1 ? 0 : 1;

const handleKeyPress = (event) => {
    const key = event.key;
    if (keys[key]) playSound(keys[key], soundGenerators[keys[key]], context, true);
    else if (key === ' ') togglePlayback();
};


const buttons = document.querySelectorAll('.drum-machine button[data-sound]');
buttons.forEach(button => {
    button.addEventListener('click', () => {
        const sound = button.dataset.sound;
        playSound(sound, soundGenerators[sound], context, true);
    });
});

document.getElementById('togglePlayback').addEventListener('click', togglePlayback);
document.getElementById('bpm').addEventListener('input', (event) => {
    bpm = event.target.value;
    schedulerTimeoutVal = bpmToTimeout(bpm);
});

window.addEventListener('keydown', handleKeyPress);

createSeqSteps();
createIndicatorSteps();


const mapTextToSound = {
    'BD': 'kick',
    'SN': 'snare',
    'CH': 'ch',
    'HH': 'ch',
    'HT': 'hitom',
    'CP': 'clap',
    'OH': 'oh',
    "CY": 'cymbal'
};

const resetSeq = () => {
    seq["ch"] = Array(16).fill(0);
    seq["oh"] = Array(16).fill(0);
    seq["hitom"] = Array(16).fill(0);
    seq["kick"] = Array(16).fill(0);
    seq["snare"] = Array(16).fill(0);
    seq["clap"] = Array(16).fill(0);
    seq["cymbal"] = Array(16).fill(0);
}

const barParser = (lines) => {
    
    // change the values in seq
    // first split the pattern and map it to the instrument
    // then remove all I,l or | character
    // then map the value to 1 or 0

    lines.forEach(line => {
        const instrument = line.substring(0, 2);
        const pattern = line.substring(3).replace(/\||I|l/g, '');
        console.log(pattern)
        const sound = mapTextToSound[instrument];
        if (!sound) return;
        const steps = pattern.replace(/[I,l]/g, '').split('').map(char => char.toLowerCase() === 'x' ? 1 : 0);
        console.log(steps)
        seq[sound] = steps;
        // update the UI
        createSeqSteps();
    });
}

const commaParser = (lines) => {
    lines.forEach(line => {
        const [instrument, pattern] = line.trim().split(':');
        const sound = mapTextToSound[instrument];
        if (!sound) return;
        const steps = pattern.split(',').map(Number);
        seq[sound] = Array(16).fill(0);
        steps.forEach(step => seq[sound][step - 1] = 1);
        createSeqSteps();
    })
}



  document.getElementById("play-pattern").addEventListener("click", () => {
    /*
    Example pattern
    BD |X---|----|X---|----|
    SN |----|X---|----|X---|
    HH |X-X-|X-X-|X-X-|X-X-|
    */
    // OR
    /*
    BD:1,3,4,7,11
    SN:5,8,13,16
    */
    const patternElement = document.getElementById('pattern');
    const pattern = patternElement.value;
    const parser = pattern.includes('|') ? barParser : commaParser;
    const lines = pattern.split('\n').map(line => line.trim());
    resetSeq();
    parser(lines)

   

  })

// add templates options to templates (name, pattern)
// on change of the template, update use the comma parser
const templateSelect = document.getElementById('templates');
templates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.name;
    option.textContent = template.name;
    templateSelect.appendChild(option);
})
// on change of the template, update use the comma parser
templateSelect.addEventListener('change', (event) => {
    const template = templates.find(template => template.name === event.target.value);
    const lines = template.pattern.split('\n');
    resetSeq();
    commaParser(lines);
    patternElement.value = template.pattern;
})
