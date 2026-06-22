const { St, Clutter, GLib } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

let progressBar, progressContainerPeriod, progressBarFillPeriod, labelPeriod;
let progressContainerDay, progressBarFillDay, labelDay;
let tsBeginDay, tsEndDay;
let updateTimeoutId = null;
let currentPhase = 'workday';

let dayPhases = ['workday', 'day', 'soiree'];
let phaseTimes = {
    'workday': { start: [9, 0], end: [17, 45], label: 'wk' },
    'day':     { start: [6, 0], end: [23, 30], label: 'day' },
    'soiree':  { start: [18, 0], end: [23, 30], label: 'soir' }
};

function init() {}

function enable() {
    progressBar = new PanelMenu.Button(0.0, 'Progress Bars', false);

    progressContainerPeriod = new St.BoxLayout({
        style_class: 'progress-bar-container-period',
        x_expand: true,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    progressBarFillPeriod = new St.Widget({
        style_class: 'progress-bar-fill-period',
        x_expand: false,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    progressContainerPeriod.add(progressBarFillPeriod);

    labelPeriod = new St.Label({
        style_class: 'progress-label',
        text: '',
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    progressContainerDay = new St.BoxLayout({
        style_class: 'progress-bar-container-day',
        x_expand: true,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    progressBarFillDay = new St.Widget({
        style_class: 'progress-bar-fill-day',
        x_expand: false,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    progressContainerDay.add(progressBarFillDay);

    labelDay = new St.Label({
        style_class: 'progress-label',
        text: '',
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    let progressBox = new St.BoxLayout({ vertical: true, style_class: 'progress-box' });
    let periodBox = new St.BoxLayout({ vertical: false });
    periodBox.add(progressContainerPeriod);
    periodBox.add(labelPeriod);
    let dayBox = new St.BoxLayout({ vertical: false });
    dayBox.add(progressContainerDay);
    dayBox.add(labelDay);

    progressBox.add(periodBox);
    progressBox.add(dayBox);

    progressBar.actor.add_child(progressBox);

    Main.panel.addToStatusArea('progress-bars', progressBar);

    dayPhases.forEach((phase) => {
        let MenuItem = new PopupMenu.PopupMenuItem('Set ' + phase);
        MenuItem.connect('activate', () => {
            initializeDayTimer(phase);
        });
        progressBar.menu.addMenuItem(MenuItem);
    });

    updateTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
        updateProgress();
        return true;
    });

    initializeDayTimer('workday');
}

function disable() {
    if (updateTimeoutId !== null) {
        GLib.source_remove(updateTimeoutId);
        updateTimeoutId = null;
    }
    if (progressBar) {
        progressBar.destroy();
        progressBar = null;
    }
    progressContainerPeriod = null;
    progressBarFillPeriod = null;
    labelPeriod = null;
    progressContainerDay = null;
    progressBarFillDay = null;
    labelDay = null;
}

function initializeDayTimer(phase) {
    if (!phaseTimes.hasOwnProperty(phase)) {
        log('Invalid phase specified');
        return;
    }

    currentPhase = phase;
    let now = new Date();
    tsBeginDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), phaseTimes[phase].start[0], phaseTimes[phase].start[1], 0);
    tsEndDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), phaseTimes[phase].end[0],   phaseTimes[phase].end[1],   0);
    log(`Timer initialized for ${phase}: Start at ${tsBeginDay}, End at ${tsEndDay}`);
}

function updateProgress() {
    let now = new Date();
    let seconds = now.getSeconds();
    let minutes = now.getMinutes();
    let hours = now.getHours();

    // Barre rouge : avancement dans la demi-heure en cours
    let elapsedPeriod = (hours * 3600) + (minutes * 60) + seconds;
    let periodStart = Math.floor(elapsedPeriod / 1800) * 1800;
    let percentagePeriod = ((elapsedPeriod - periodStart) / 1800) * 100;

    if (progressBarFillPeriod)
        progressBarFillPeriod.set_style(`width: ${percentagePeriod.toFixed(1)}%;`);

    let remainingSecondsPeriod = 1800 - (elapsedPeriod - periodStart);
    labelPeriod.set_text(`${Math.floor(remainingSecondsPeriod / 60)}mn`);

    // Barre bleue : avancement dans la phase journée
    let elapsedDay = now - tsBeginDay;
    let totalDay = tsEndDay - tsBeginDay;
    let percentageDay = Math.min(100, Math.max(0, (elapsedDay / totalDay) * 100));

    if (progressBarFillDay)
        progressBarFillDay.set_style(`width: ${percentageDay.toFixed(1)}%;`);

    let phaseLabel = phaseTimes[currentPhase].label;
    let remainingTimeDay = totalDay - elapsedDay;
    if (remainingTimeDay <= 0) {
        labelDay.set_text(`${phaseLabel} fin`);
    } else {
        let remainingHours = Math.floor(remainingTimeDay / 3600000);
        let remainingMins  = Math.floor((remainingTimeDay % 3600000) / 60000);
        labelDay.set_text(`${phaseLabel} ${remainingHours}h${remainingMins.toString().padStart(2, '0')}`);
    }
}
