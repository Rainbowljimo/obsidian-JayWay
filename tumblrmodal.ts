import * as crypto from "crypto";
import OAuth from "oauth-1.0a";
import { App, Modal, Notice, TFile } from "obsidian";
import { createClient } from "tumblr.js";
import { MyPluginSettings } from "./main";
import { AtpAgent } from "@atproto/api";

// --- Tumblr Credentials Modal ---
export class TumblrModal extends Modal
{
    blogIdentifier:string = "BLOGNAME";

    oAuthConsumerKey:string = "CONSUMERKEY";
    oAuthConsumerSecret:string = "CONSUMERSECRET";

    oAuthToken:string = "OAUTHTOKEN";
	oAuthTokenSecret:string = "OAUTHTOKENSECRET";

	blueskyIdentifier:string = "BLUESKYappNAME";
	blueskyPassword:string = "BLUESKYappPASSWORD";

    settings: MyPluginSettings;

	client: ReturnType<typeof createClient>;
	agent: AtpAgent;

    publishImages:boolean;

    IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

    constructor(app: App, settings:MyPluginSettings)
    {
        super(app);
        this.settings = settings;
        this.publishImages = false;

        this.client = createClient({
            consumer_key: this.oAuthConsumerKey,
            consumer_secret: this.oAuthConsumerSecret,
            token: this.oAuthToken,
            token_secret: this.oAuthTokenSecret,
		});
		this.agent = new AtpAgent({ service: "https://bsky.social" });
    }

    onOpen()
    {
        const { contentEl } = this;

        contentEl.createEl('h3', { text: 'Publish to Tumblr' });
        contentEl.createEl('p', { text: 'Enter your Tumblr credentials. They will not be stored.' });

        const button = contentEl.createEl('button', { text: 'Publish' });
        button.onclick = () =>
        {
            let activeNote = this.app.workspace.getActiveFile();
            if (activeNote == null)
            {
                new Notice("No active note.");
                this.close();
                return;
            }

            if (this.publishImages)
            {
                this.publishNoteWithImages(activeNote);
            }
            else
            {
                this.publishNote(activeNote);
            }
            this.close();
        };
    }

    onClose()
    {
        this.contentEl.empty();
    }

    public setPublishImages(val:boolean) { this.publishImages = val; }
    
    // --- Tumblr Publishing Function ---

    async publishNoteWithImages(file: TFile)
    {
        // Helper to check if a file is an image
        const isImageFile = (f: TFile) => {
            const ext = f.extension.toLowerCase();
            return this.IMAGE_EXTENSIONS.includes(ext);
        }

        try
        {
            const formData = new FormData();
            formData.append("type", "photo");
            formData.append("caption", ""); // optional

            if (isImageFile(file))
            {
                const binaryData = await this.app.vault.readBinary(file);
                const blob = new Blob([binaryData], { type: `image/${file.extension.toLowerCase()}` });
                formData.append("data[]", blob, file.name);
            }
            else
            {
                const markdown = await this.app.vault.read(file);

                const lines = markdown.split(/\r?\n/);

                const cached = this.app.metadataCache.getFileCache(file);
                const linkCache = cached?.links || [];
    
                for (const line of lines)
                {
                    const imageMatch = line.match(/!\[\[(.+?)\]\]/);
                    if (imageMatch)
                    {
                        const imageName = imageMatch[1];
                        const resolvedFile = this.app.metadataCache.getFirstLinkpathDest(imageName, file.path) as TFile;
                        if (resolvedFile && isImageFile(resolvedFile))
                        {
                            const binaryData = await this.app.vault.readBinary(resolvedFile);
                            const blob = new Blob([binaryData], { type: `image/${resolvedFile.extension.toLowerCase()}` });
                            formData.append("data[]", blob, resolvedFile.name);
                        }
                    }
                }
            }

            // 3. Publish as a text post
            // OAuth setup
            const oauth = new OAuth({
                consumer: { key: this.oAuthConsumerKey, secret: this.oAuthConsumerSecret },
                signature_method: 'HMAC-SHA1',
                hash_function(base_string: string, key: string) {
                    return crypto.createHmac('sha1', key).update(base_string).digest('base64');
                },
            });
        // Your request data
            const requestData = {
                url: `https://api.tumblr.com/v2/blog/${this.blogIdentifier}.tumblr.com/post`,
                method: 'POST'
            };
             
            // OAuth token (user-specific)
            const token = { key: this.oAuthToken, secret: this.oAuthTokenSecret };
        // Generate headers with proper OAuth signature
            const headers = {
                ...oauth.toHeader(oauth.authorize(requestData, token)),
            };
        // 4️⃣ Make the fetch request
            const response = await fetch(requestData.url,
            {
                method: "POST",
                headers: headers, // only OAuth headers
                body: formData,
            })
            .then(async (response) =>
            {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                new Notice("Published note to Tumblr!");
                return response.json();
            });
        }
        catch (err:any)
        {
            console.error("Tumblr publish failed:", err);
            new Notice(`Failed: ${err.message}`);
        }

    }

	async publishNote(activeNote: TFile) {
		try {
			// Read Markdown content
			let content = await this.app.vault.read(activeNote);

			// Extract tags from YAML frontmatter
			let tumblrTags: string[] = [];
			let blueTags: string[] = [];
			let blueMsg: string = "";
			const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
			if (frontmatterMatch)
			{
				const frontmatter = frontmatterMatch[1];
				const tumblrTagsLineMatch = frontmatter.match(/^hashtagsTumblr:\s*(.+)$/m);
				if (tumblrTagsLineMatch) 
				{
					tumblrTags = tumblrTagsLineMatch[1]
						.split(',')
						.map(tag => tag.trim())
						.filter(tag => tag.length > 0);
				}

				const blueTagsLineMatch = frontmatter.match(/^hashtagsBlue:\s*(.+)$/m);
				if (blueTagsLineMatch)
				{
					blueTags = blueTagsLineMatch[1]
						.split(",")
						.map((t) => t.trim())
						.filter((t) => t.length > 0);
				}

				const msgBlueLineMatch = frontmatter.match(/^msgBlue:\s*(.+)$/m);
				if (msgBlueLineMatch)
				{
					blueMsg = msgBlueLineMatch[1];
				}
			}

			// Remove YAML frontmatter
			content = content.replace(/^---\n[\s\S]*?\n---\n/, '');

			// Remove Obsidian Image links if exist
			content = content.replace(/!\[\[(.+?)\]\]/g, '');

			// Publish as a text post
			const postid = await new Promise<string>((resolve, reject) => {
				this.client.createLegacyPost(
					this.blogIdentifier,
					{
						type: 'text',
						body: content,
						format: 'markdown',
						tags: tumblrTags.join(',')
					},
					(err, resp) => {
						if (err) {
							reject(err);
						} else {
							console.log("Tumblr response:", resp);
							new Notice("Published note to Tumblr!" + resp?.id_string);
							resolve(resp?.id_string);
						}
					}
				);
			});

			await this.publishToBlueskyWithUrl(`https://${this.blogIdentifier}.tumblr.com/post/${postid}`,blueMsg,blueTags);
		} catch (err) {
			console.error(err);
			new Notice("Failed to publish note to Tumblr!");
		}
	}

	async publishToBlueskyWithUrl(tumblrUrl: string, msg:string, tags: string[])
	{
		try
		{
			// Build Bluesky post text
			let postText = msg + "\n\n" + tumblrUrl;
			if (tags.length > 0) {
				postText += "\n\n" + tags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ");
			}
			if (postText.length > 300) {
				postText = postText.slice(0, 297) + "...";
			}

			// Build the facets to mark that part of the text as a link

			const facets: any[] = [];
			facets.push(
				{
					index: {
						byteStart: postText.indexOf(tumblrUrl),
						byteEnd: postText.indexOf(tumblrUrl) + tumblrUrl.length,
					},
					features: [
						{
							$type: "app.bsky.richtext.facet#link",
							uri: tumblrUrl,
						},
					],
				},
			);

			// Mark each hashtag as a tag
			for (const tag of tags)
			{
				const hashToken = `#${tag}`;
				const start = postText.indexOf(hashToken);
				if (start !== -1)
				{
					facets.push({
						index: {
							byteStart: start,
							byteEnd: start + hashToken.length,
						},
						features: [
							{
								$type: "app.bsky.richtext.facet#tag",
								tag: tag, // without the '#'
							},
						],
					});
				}
			}

			// Authenticate & post
			await this.agent.login({
				identifier: this.blueskyIdentifier,
				password: this.blueskyPassword,
			});

			await this.agent.post({
				$type: "app.bsky.feed.post",
				text: postText,
				facets: facets,
				createdAt: new Date().toISOString(),
			});

			new Notice("Also published link to Bluesky!");
		} catch (err: any) {
			console.error("Bluesky publish failed:", err);
			new Notice(`Bluesky failed: ${err.message}`);
		}
	}
}

