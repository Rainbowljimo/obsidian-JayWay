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
	settings: MyPluginSettings;

    tumblrModal:TumblrModal;

	async onload()
    {
		await this.loadSettings();

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
	}

	async saveSettings()
    {
		await this.saveData(this.settings);
	}
}

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
	}
}
