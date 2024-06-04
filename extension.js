const { St, Clutter, GLib } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

let progressBar, progressContainerPeriod, progressBarFillPeriod, labelPeriod;
let progressContainerDay, progressBarFillDay, labelDay;
let tsBeginDay, tsEndDay;

function init() {}

function enable() {
    // Create a panel button for the progress bars
    progressBar = new PanelMenu.Button(0.0, 'Progress Bars', false);

    // Create a container for the period progress bar (red)
    progressContainerPeriod = new St.BoxLayout({
        style_class: 'progress-bar-container-period',
        x_expand: true,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    // Create the period progress bar fill element (red)
    progressBarFillPeriod = new St.Widget({
        style_class: 'progress-bar-fill-period',
        x_expand: false,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    // Add the fill element to the container
    progressContainerPeriod.add(progressBarFillPeriod);

    // Create a label for the period progress bar
    labelPeriod = new St.Label({
        style_class: 'progress-label',
        text: '',
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    // Create a container for the day progress bar (blue)
    progressContainerDay = new St.BoxLayout({
        style_class: 'progress-bar-container-day',
        x_expand: true,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    // Create the day progress bar fill element (blue)
    progressBarFillDay = new St.Widget({
        style_class: 'progress-bar-fill-day',
        x_expand: false,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    // Add the fill element to the day container
    progressContainerDay.add(progressBarFillDay);

    // Create a label for the day progress bar
    labelDay = new St.Label({
        style_class: 'progress-label',
        text: '',
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    // Create a box to hold both progress bars and their labels
    let progressBox = new St.BoxLayout({ vertical: true, style_class: 'progress-box' });
    let periodBox = new St.BoxLayout({ vertical: false });
    periodBox.add(progressContainerPeriod);
    periodBox.add(labelPeriod);
    let dayBox = new St.BoxLayout({ vertical: false });
    dayBox.add(progressContainerDay);
    dayBox.add(labelDay);

    progressBox.add(periodBox);
    progressBox.add(dayBox);

    // Add the box to the panel button
    progressBar.actor.add_child(progressBox);

    // Add the panel button to the status area
    Main.panel.addToStatusArea('progress-bars', progressBar);

    let MenuItem;
    dayPhases.forEach((phase) => {
        MenuItem = new PopupMenu.PopupMenuItem('Set ' + phase);
        MenuItem.connect('activate', () => {
            initializeDayTimer(phase);
        });
        progressBar.menu.addMenuItem(MenuItem);
    });

    // Initialize the progress update
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
        updateProgress();
        return true; // Repeat timeout
    });

    // Initialize the day timer
    initializeDayTimer('workday');
}

function disable() {
    if (progressBar) {
        progressBar.destroy();
        progressBar = null;
    }
}

let dayPhases = ['workday', 'day', 'soiree'];
let phaseTimes = {
    'workday': { start: [9, 0], end: [17, 45] },
    'day': { start: [6, 0], end: [23, 30] },
    'soiree': { start: [18, 0], end: [23, 30] }
};

function initializeDayTimer(phase) {
    if (!phaseTimes.hasOwnProperty(phase)) {
        log('Invalid phase specified');
        return;
    }

    let now = new Date();
    tsBeginDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), phaseTimes[phase].start[0], phaseTimes[phase].start[1], 0);
    tsEndDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), phaseTimes[phase].end[0], phaseTimes[phase].end[1], 0);
    log(`Timer initialized for ${phase}: Start at ${tsBeginDay}, End at ${tsEndDay}`);
}

function updateProgress() {
    let now = new Date();
    let seconds = now.getSeconds();
    let minutes = now.getMinutes();
    let hours = now.getHours();

    // Calculate progress for the period as a percentage of 30 minutes (1800 seconds)
    let elapsedPeriod = (hours * 3600) + (minutes * 60) + seconds;
    let periodStart = Math.floor(elapsedPeriod / 1800) * 1800; // Nearest lower 30-minute mark
    let percentagePeriod = ((elapsedPeriod - periodStart) / 1800) * 100;


    // Update the width of the period progress bar (red)
    let progressWidthPeriod = Math.round(progressContainerPeriod.width * (percentagePeriod / 100));
    progressBarFillPeriod.set_size(progressWidthPeriod, progressContainerPeriod.height);

    // Calculate remaining minutes for the period
    let remainingSecondsPeriod = 1800 - (elapsedPeriod - periodStart);
    let remainingMinutesPeriod = Math.floor(remainingSecondsPeriod / 60);
    labelPeriod.set_text(`${remainingMinutesPeriod}mn`);
    //log(`Period progress: ${percentagePeriod}% - Reste ${remainingMinutesPeriod} minutes`);

    // Calculate progress for the day as a percentage of the total day
    let elapsedDay = now - tsBeginDay;
    let totalDay = tsEndDay - tsBeginDay;
    let percentageDay = (elapsedDay / totalDay) * 100;
    if (percentageDay > 100) percentageDay = 100;

    // Update the width of the day progress bar (blue)
    let progressWidthDay = Math.round(progressContainerDay.width * (percentageDay / 100));
    progressBarFillDay.set_size(progressWidthDay, progressContainerDay.height);

    // Update the tooltip for the day progress bar
    let remainingTimeDay = totalDay - elapsedDay;
    let remainingHoursDay = Math.floor(remainingTimeDay / 3600000);
    let remainingMinutesDay = Math.floor((remainingTimeDay % 3600000) / 60000);
    if (remainingHoursDay < 0) {
        remainingHoursDay = 0;
        remainingMinutesDay = 0;
    }
    labelDay.set_text(`${remainingHoursDay}h${remainingMinutesDay.toString().padStart(2, '0')}`);
    //log(`Day progress: ${percentageDay}% - Reste ${remainingHoursDay} heures et ${remainingMinutesDay} minutes`);
}
