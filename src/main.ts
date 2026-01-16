<<<<<<< HEAD:main.ts
import { App, Notice, Plugin, PluginSettingTab, Setting, TFile, Modal } from 'obsidian';
import { TumblrModal } from "./tumblrmodal";

// --- Plugin Settings ---
export interface MyPluginSettings
{
	localPath: string;      // Local path to your vault (for getting absolute paths)
	serverPath: string;     // Full server path, e.g., "user@192.168.0.231:/srv/JayWay_Published/"
	serverPassword: string; // SSH password for the server
}

const DEFAULT_SETTINGS: MyPluginSettings =
{
	localPath: '',
	serverPath: '',
	serverPassword: ''
};

// --- Main Plugin ---
export default class MyPlugin extends Plugin
{
=======
import {App, Editor, MarkdownView, Modal, Notice, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, MyPluginSettings, SampleSettingTab} from "./settings";

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
>>>>>>> dc2fa22c4d279199fb07a205a0c11eb155641f3d:src/main.ts
	settings: MyPluginSettings;

    tumblrModal:TumblrModal;

	async onload()
    {
		await this.loadSettings();

<<<<<<< HEAD:main.ts
        this.tumblrModal = new TumblrModal(this.app, this.settings);

		// --- New Tumblr Button ---
		this.addRibbonIcon('book-type', 'Tumblr: Publish', async () =>
        {
            this.tumblrModal.setPublishImages(false);
            this.tumblrModal.open();
		});

        this.addRibbonIcon('book-image', 'Tumblr: Publish Images', async () => {
            this.tumblrModal.setPublishImages(true);
            this.tumblrModal.open();
		});

		// --- Add Settings Tab ---
		this.addSettingTab(new PublishSettingTab(this.app, this));
	}

	async loadSettings()
    {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
=======
		// This creates an icon in the left ribbon.
		this.addRibbonIcon('dice', 'Sample', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status bar text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Open modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'replace-selected',
			name: 'Replace selected content',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				editor.replaceSelection('Sample editor command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-modal-complex',
			name: 'Open modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
				return false;
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			new Notice("Click");
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<MyPluginSettings>);
>>>>>>> dc2fa22c4d279199fb07a205a0c11eb155641f3d:src/main.ts
	}

	async saveSettings()
    {
		await this.saveData(this.settings);
	}
}

<<<<<<< HEAD:main.ts
// --- Settings Tab ---
class PublishSettingTab extends PluginSettingTab
{
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Publish Settings' });

		new Setting(containerEl)
			.setName('Local Path')
			.setDesc('Full local path to your Obsidian vault (used for publishing).')
			.addText(text => text
				.setPlaceholder('/path/to/ObsidianVault/')
				.setValue(this.plugin.settings.localPath)
				.onChange(async (value) => {
					this.plugin.settings.localPath = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Server Path')
			.setDesc('Full path to your server folder, e.g., user@192.168.0.231:/srv/JayWay_Published/')
			.addText(text => text
				.setPlaceholder('user@server:/path/to/folder')
				.setValue(this.plugin.settings.serverPath)
				.onChange(async (value) => {
					this.plugin.settings.serverPath = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Server Password')
			.setDesc('Password for your server SSH login.')
			.addText(text => text
				.setPlaceholder('Enter server password')
				.setValue(this.plugin.settings.serverPassword)
				.onChange(async (value) => {
					this.plugin.settings.serverPassword = value;
					await this.plugin.saveSettings();
				})
			);
=======
class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
>>>>>>> dc2fa22c4d279199fb07a205a0c11eb155641f3d:src/main.ts
	}
}
