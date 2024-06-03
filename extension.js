const { St, Clutter, GLib, GObject } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;

let progressBar, progressContainer, progressBarFill, progressLabel;
let progress = 0;

function init() {}

function enable() {
    // Create a panel button for the progress bar
    progressBar = new PanelMenu.Button(0.0, 'Progress Bar', false);
    
    // Create a container for the progress bar
    progressContainer = new St.BoxLayout({
        style_class: 'progress-bar-container',
        x_expand: true,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    // Create the progress bar fill element
    progressBarFill = new St.Widget({
        style_class: 'progress-bar-fill',
        x_expand: false, // Changed to false as we will control the width manually
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    // Create the progress label element
    progressLabel = new St.Label({
        text: ' 0%',
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER
    });

    // Add the fill element to the container
    progressContainer.add(progressBarFill);

    // Create a box to hold both the progress bar and the label
    let progressBox = new St.BoxLayout();
    progressBox.add(progressContainer);
    // progressBox.add(progressLabel);

    // Add the box to the panel button
    progressBar.actor.add_child(progressBox);

    // Add the panel button to the status area
    Main.panel.addToStatusArea('progress-bar', progressBar);

    // Add a menu item to reset the progress
    let resetMenuItem = new PopupMenu.PopupMenuItem('Reset Progress');
    resetMenuItem.connect('activate', () => {
        resetProgress();
    });
    progressBar.menu.addMenuItem(resetMenuItem);

    // Add a menu item to reset the progress
    let resetMenuItem2 = new PopupMenu.PopupMenuItem('Set one hour');
    resetMenuItem2.connect('activate', () => {
        setOneHour();
    });
    progressBar.menu.addMenuItem(resetMenuItem2);

    // Simulate progress update
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
        updateProgress();
        return true; // Repeat timeout
    });
}

function disable() {
    if (progressBar) {
        progressBar.destroy();
        progressBar = null;
    }
}

function updateProgress() {
    progress += 1;
    if (progress > 100) progress = 0;
    
    // Update the width of the progress bar fill
    let progressWidth = Math.round(progressContainer.width * (progress / 100));
    // progressBarFill.set_width(progressWidth);
    progressBarFill.set_size(progressWidth, progressContainer.height);
    log(`Progress: ${progress}, Width: ${progressWidth}`);
    log(`progressContainer: ${progressContainer.width}, progressBarFill: ${progressBarFill.width}`);
    
    // Update the progress label
    // progressLabel.set_text(' ' + progress + '%' + progressWidth);

    progressBarFill.set_style('background-color: red; width: ' + progressWidth + 'px;');

}

function resetProgress() {
    progress = 0;
    updateProgress();
}

function setOneHour() {
    progress = 50;
    updateProgress();
}