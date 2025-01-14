import PostAdapter from "../Adapters/PostAdapter";
import ErrorView from "./ErrorView";
import StarView from "./StarView";

class PostView extends HTMLElement {
  private postList: HTMLUListElement; // Reference to the list of posts
  private messageInput: HTMLInputElement; // Reference to the input message in the message box
  private sendButton: HTMLButtonElement; // Reference to the send button to send post
  private postTitle: HTMLElement; // Reference to the post title to display
  private adapter: PostAdapter; // Reference to the adapter
  private errorView: ErrorView; // Reference to the error view to display error messages
  private currentReplyParentPath: string | null = null; // Reference to the parent for replies
  private starView: StarView; // Reference to the star view for extension capabilities

  constructor(adapter: PostAdapter) {
    super();
    this.attachShadow({ mode: "open" });

    // Initialize the adapter with a new instance of PostAdapter
    this.adapter = adapter;
    this.errorView = new ErrorView();
    document.body.appendChild(this.errorView);
    this.starView = new StarView();
    document.body.appendChild(this.starView);

    // Define the HTML structure and styles within the shadow DOM
    this.shadowRoot!.innerHTML = `
      <style>
        #post-dialog {
          position: absolute;
          top: 95px;
          right: 0;
          bottom: 0;
          left: 300px;
          width: calc(100% - 320px);
          background: white;
          text-align: center;
          display: flex;
          flex-direction: column;
          border-radius: 8px;
          overflow-y: auto;
          padding-bottom: 20px;
          background-color: rgb(227, 222, 243);
          transition: width 0.3s ease, left 0.3s ease;
        }
        #post-title {
          font-size: clamp(1.2em, 2vw, 1.5em);
          color: black;
          position: absolute;
          left: 50%; /* Move to the center */
          transform: translateX(-50%); /* Adjust for centering */
          margin-bottom: 15px;
          margin-top: 25px;

        }
        #post-list {
          list-style: none;
          padding: 0 20px;
          flex-grow: 1;
          overflow-y: auto;
          margin-bottom: 10px;
          margin-left: 20px;
          max-height: 100%;
        }
        .post-item, .reply-item {
          padding: clamp(4px, 1.3vw, 12px);
          background-color: #f9f9f9;
          border: 1px solid #e0e0e0;
          margin-bottom: 12px;
          border-radius: 4px;
          text-align: left;
          box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1);
          font-size: clamp(0.8em, 1vw, 1em);
        }
        .reply-item {
          background-color: #f3f3f3;
        }
        #message-box {
          display: flex;
          align-items: center;
          padding: 0 20px;
          padding-top: 10px;
          margin-top: 10px;
          border-top: 1px solid #ccc;
          font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        }
        #message-input {
          flex-grow: 1;
          padding: 8px;
          font-size: clamp(0.8em, 1vw, 1em);
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-right: 8px;
          height: 80px; 
          width: 100%;
          font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        }
        #send-button {
          padding: clamp(6px, 1vw, 12px) clamp(8px, 1.3vw, 12px);
          font-size: clamp(0.9em, 1vw, 1.2em);
          background-color: #221f74;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-left: 10px;
          font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
        }

        #send-button:hover {
          background-color: #0a04b8;
        }

        .icon-container {
          margin-top: clamp(4px, 1vw, 12px);
          display: flex;
          flex-wrap: wrap;
          gap: clamp(4px, 2vw, 16px);
          justify-content: flex-start;
          align-items: center; 
        }
        iconify-icon {
          cursor: pointer;
          font-size: clamp(1em, 1.6vw, 2.2em);
          transition: transform 0.2s ease-in-out;
        }

        iconify-icon.active {
          color: #4946b0;
        }

        #formatting-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0 20px;
          justify-content: space-between;
        }

        .format-btn, .emoji-btn {
          padding: clamp(2px, 0.5vw, 10px) clamp(4px, 1vw, 16px);
          font-size: clamp(0.8em, 1vw, 1em); 
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
          background-color: #5350b4;
          color: white;
        }

        .emoji-btn {
          padding: clamp(2px, 0.5vw, 10px) clamp(4px, 1vw, 16px);
          font-size: clamp(0.8em, 1vw, 1em); 
          background-color: #f9f9f9;
          border: 1px solid #ccc;
          color: black;
          margin-left: 6px;
        }

        .format-btn:hover {
          background-color: #312e88; 
        }

        .emoji-btn:hover {
          background-color: rgb(209, 197, 247);
        }

        #post-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          padding: 0 20px;
          margin-bottom: 10px;
        }

        #filter-starred-button {
          font-size: clamp(0.6em, 1.5vw, 1em);
          background-color: transparent;
          color: #5350b4;
          border: 2px solid #5350b4;
          border-radius: 4px;
          padding: clamp(1px, 0.6vw, 10px) clamp(1px, 1.0vw, 20px);
          cursor: pointer;
          font-weight: bold;
          margin-top: clamp(5px, 1.5vw, 20px);
          font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        #filter-starred-button:hover {
          background-color: #5350b4; 
          color: white; 
        }
      </style>
      <section id="post-dialog">
        <header id="post-header">
          <h1 id="post-title">Posts</h1>
          <button id="filter-starred-button">Show Starred Posts</button>
        </header>
        <ul id="post-list"></ul>
        <section id="formatting-buttons">
      </section>
        <footer id="message-box">
          <textarea id="message-input" placeholder="Type your message here..." /></textarea>
          <button id="bold-button" class="format-btn"><strong><iconify-icon icon="proicons:text-bold"></iconify-icon></strong></button>
          <button id="italic-button" class="format-btn"><em><iconify-icon icon="tabler:italic"></iconify-icon></em></button>
          <button id="link-button" class="format-btn"><iconify-icon icon="material-symbols:link"></iconify-icon></button>
          <button id="like-button" class="emoji-btn"><iconify-icon icon="solar:like-broken"></iconify-icon></button>
          <button id="smile-button" class="emoji-btn"><iconify-icon icon="line-md:emoji-smile"></iconify-icon></button>
          <button id="frown-button" class="emoji-btn"><iconify-icon icon="line-md:emoji-frown"></iconify-icon></button>
          <button id="celebrate-button" class="emoji-btn"><iconify-icon icon="emojione-monotone:party-popper"></iconify-icon></button>
          <button id="send-button">Send</button>
        </footer>
    `;

    this.postList = this.shadowRoot!.querySelector("#post-list")!;
    this.messageInput = this.shadowRoot!.querySelector("#message-input")!;
    this.sendButton = this.shadowRoot!.querySelector("#send-button")!;
    this.postTitle = this.shadowRoot!.querySelector("#post-title")!;
  }

  connectedCallback() {
    console.log("PostView connected to the DOM");

    // Set up the filter button to show starred messages
    const filterButton = this.shadowRoot!.querySelector(
      "#filter-starred-button",
    ) as HTMLButtonElement;
    filterButton.addEventListener("click", () => this.filterStarredMessages());
    // Add event listeners for markdown formatting buttons
    this.shadowRoot!.querySelector("#bold-button")!.addEventListener(
      "click",
      () => this.insertMarkdown("**"),
    );
    this.shadowRoot!.querySelector("#italic-button")!.addEventListener(
      "click",
      () => this.insertMarkdown("*"),
    );
    this.shadowRoot!.querySelector("#link-button")!.addEventListener(
      "click",
      () => this.insertMarkdown("[]()"),
    );

    this.shadowRoot!.querySelector("#smile-button")!.addEventListener(
      "click",
      () => this.insertText(":smile:"),
    );
    this.shadowRoot!.querySelector("#like-button")!.addEventListener(
      "click",
      () => this.insertText(":like:"),
    );
    this.shadowRoot!.querySelector("#frown-button")!.addEventListener(
      "click",
      () => this.insertText(":frown:"),
    );
    this.shadowRoot!.querySelector("#celebrate-button")!.addEventListener(
      "click",
      () => this.insertText(":celebrate:"),
    );
    // Add event listener for the send button
    this.sendButton.addEventListener("click", () => this.handleSendMessage());

    // Listen for `post-update` events to update posts dynamically
    document.addEventListener("post-update", (event: Event) => {
      const customEvent = event as CustomEvent;
      const { workspace, channel, data } = customEvent.detail;
      console.log(
        `Updating posts for workspace: ${workspace}, channel: ${channel}`,
        data,
      );

      // Ensure this PostView is responsible for the relevant channel
      const currentChannel = this.getAttribute("channel-path")?.split("/")[3];
      if (currentChannel === channel) {
        this.updatePosts([data]);
      }
    });

    // Add a keydown event listener for handling Enter and Shift+Enter in the message input
    this.messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && event.shiftKey) {
        event.preventDefault(); // Prevent the default behavior of Enter (submitting the form)
        const cursorPosition = this.messageInput.selectionStart || 0;
        const value = this.messageInput.value;

        this.messageInput.value =
          value.slice(0, cursorPosition) + "\n" + value.slice(cursorPosition);

        this.messageInput.setSelectionRange(
          cursorPosition + 1,
          cursorPosition + 1,
        );
      } else if (event.key === "Enter") {
        event.preventDefault(); // Prevent the default behavior of Enter
        this.handleSendMessage();
      }
    });
  }

  /**
   * Inserts markdown syntax into the message input field.
   * @param wrapper - The markdown syntax wrapper (e.g., "**" for bold).
   */
  private insertMarkdown(wrapper: string): void {
    const input = this.messageInput;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const selectedText = input.value.slice(start, end);

    let newText: string;

    // Handle special case for link syntax
    if (wrapper === "[]()") {
      newText = selectedText ? `[${selectedText}]()` : `[]()`;
    } else {
      newText = selectedText
        ? `${wrapper}${selectedText}${wrapper}`
        : `${wrapper}${wrapper}`;
    }

    input.setRangeText(newText, start, end, "end");
  }

  /**
   * Inserts text (e.g., emoji) into the message input field.
   * @param emoji - The text or emoji to insert.
   */
  private insertText(emoji: string): void {
    const input = this.messageInput;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;

    input.setRangeText(emoji, start, end, "end");
  }

  /**
   * Sets the channel name in the post view's title.
   * @param channelName - The name of the channel.
   */
  public setChannelName(channelName: string) {
    this.postTitle.textContent = channelName;
  }

  /**
   * Clears the channel name, resetting it to "Posts".
   */
  public clearChannelName() {
    this.postTitle.textContent = "Posts";
  }

  /**
   * Loads posts into the post view for the given channel.
   * @param posts - An array of posts to display.
   * @param channelName - The name of the channel.
   */
  public loadPosts(
    posts: Array<{
      path: string;
      doc: {
        msg: string;
        parent?: string;
        reactions?: { [reactionName: string]: string[] };
        extensions?: { [extensionName: string]: string[] };
      };
      meta: {
        createdAt: bigint;
        createdBy: string;
        lastModifiedAt?: bigint;
        lastModifiedBy?: string;
      };
    }> | null,
    channelName: string,
  ) {
    console.log(`Loading posts for channel: ${channelName}`);

    // Preserve the message box if it already exists
    const existingMessageBox = this.shadowRoot!.querySelector(
      "#message-box",
    ) as HTMLElement;

    this.postList.innerHTML = "";
    this.setChannelName(channelName);

    const filterButton = this.shadowRoot!.querySelector(
      "#filter-starred-button",
    ) as HTMLButtonElement;
    filterButton.textContent = "Show Starred Posts";

    if (!posts || posts.length === 0) {
      this.displayNoPostsMessage();
      return;
    }

    // Organize posts and replies by ID
    const postsById = new Map<string, HTMLElement>();
    const repliesByParentId = posts.reduce(
      (acc, post) => {
        if (post.doc.parent) {
          if (!acc[post.doc.parent]) acc[post.doc.parent] = [];
          acc[post.doc.parent].push(post);
        }
        return acc;
      },
      {} as Record<
        string,
        Array<{
          path: string;
          doc: {
            msg: string;
            parent?: string;
            reactions?: { [reactionName: string]: string[] };
            extensions?: { [extensionName: string]: string[] };
          };
          meta: {
            createdAt: bigint;
            createdBy: string;
            lastModifiedAt?: bigint;
            lastModifiedBy?: string;
          };
        }>
      >,
    );

    // Sort replies for each parent post by creation date
    for (const parentId in repliesByParentId) {
      repliesByParentId[parentId].sort(
        (a, b) => Number(a.meta.createdAt) - Number(b.meta.createdAt),
      );
    }

    // Get top-level posts (no parent) and sort by creation date
    const parentPosts = posts
      .filter((post) => !post.doc.parent)
      .sort((a, b) => Number(a.meta.createdAt) - Number(b.meta.createdAt));

    // Recursive function to add a post and its replies
    const addPostWithReplies = (
      post: {
        path: string;
        doc: {
          msg: string;
          parent?: string;
          reactions?: { [reactionName: string]: string[] };
          extensions?: { [extensionName: string]: string[] };
        };
        meta: {
          createdAt: bigint;
          createdBy: string;
          lastModifiedAt?: bigint;
          lastModifiedBy?: string;
        };
      },
      indentLevel = 0,
    ) => {
      const postItem = this.createPostItem(post, indentLevel);
      this.postList.appendChild(postItem);
      postsById.set(post.path, postItem);

      // If this post has replies, add them recursively in the correct order
      const replies = repliesByParentId[post.path];
      if (replies) {
        replies.forEach((reply) => addPostWithReplies(reply, indentLevel + 1));
      }
    };

    // Render all top-level posts with their replies
    parentPosts.forEach((post) => addPostWithReplies(post));
    console.log("All posts and replies added to PostView in correct order");

    // Reattach the message box at the end if it exists
    if (this.currentReplyParentPath && existingMessageBox) {
      const postElement = this.shadowRoot!.querySelector(
        `li[data-path="${this.currentReplyParentPath}"]`,
      );
      if (postElement) {
        postElement.appendChild(existingMessageBox);
        existingMessageBox.style.removeProperty("display");
        existingMessageBox.style.removeProperty("visibility");
      }
    } else if (existingMessageBox) {
      // Ensure the message box is in its default position
      this.shadowRoot!.querySelector("#post-dialog")?.appendChild(
        existingMessageBox,
      );
      existingMessageBox.style.removeProperty("display");
      existingMessageBox.style.removeProperty("visibility");
    }
  }

  private createPostItem(
    post: {
      path: string;
      doc: {
        msg: string;
        parent?: string;
        reactions?: { [reactionName: string]: string[] };
        extensions?: { [reactionName: string]: string[] };
      };
      meta: {
        createdAt: bigint;
        createdBy: string;
        lastModifiedAt?: bigint;
        lastModifiedBy?: string;
      };
    },
    indentLevel: number,
  ): HTMLLIElement {
    const li = document.createElement("li");
    li.classList.add(indentLevel === 0 ? "post-item" : "reply-item");
    li.style.marginLeft = `${indentLevel * 35}px`;

    li.setAttribute("data-path", post.path);

    const header = document.createElement("header");
    header.style.fontSize = "0.9em";
    header.style.fontWeight = "bold";
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.lineHeight = "0.1";

    const userInfo = document.createElement("article");
    userInfo.style.display = "flex";
    userInfo.style.gap = "10px";

    // Use a paragraph for the username
    const username = document.createElement("p");
    username.textContent = post.meta.createdBy;
    username.style.display = "inline";
    userInfo.appendChild(username);

    // Use a paragraph for the timestamp
    const timestamp = document.createElement("p");
    timestamp.style.display = "inline";
    timestamp.style.marginLeft = "10px";
    timestamp.style.fontSize = "clamp(0.8em, 1vw, 1em)";
    timestamp.style.color = "gray";
    timestamp.style.marginTop = "12px";
    timestamp.style.whiteSpace = "nowrap";
    const date = new Date(Number(post.meta.createdAt));
    timestamp.textContent = date.toLocaleString();
    userInfo.appendChild(timestamp);

    header.appendChild(userInfo);

    const starIcon = document.createElement("iconify-icon");

    // Set the icon based on the current starred status
    if (
      !post.doc.extensions?.p2group61 ||
      post.doc.extensions.p2group61.length === 0
    ) {
      starIcon.setAttribute("icon", "mdi:star-outline");
      starIcon.style.color = "gray";
    } else {
      starIcon.setAttribute("icon", "mdi:star");
      starIcon.style.color = "gold";
    }

    // Add tabindex to make the star icon tabbable
    starIcon.setAttribute("tabindex", "0");
    starIcon.setAttribute("aria-label", "Toggle Star");
    starIcon.style.cursor = "pointer";
    starIcon.style.fontSize = "20px";
    starIcon.style.marginRight = "6px";

    // Add click functionality to toggle the star
    starIcon.addEventListener("click", async () => {
      const isCurrentlyStarred =
        post.doc.extensions?.p2group61 &&
        post.doc.extensions.p2group61.length > 0;
      const postPath = post.path;
      const success = await this.adapter.toggleStar(
        postPath,
        !isCurrentlyStarred,
      );

      if (success) {
        // Update icon and style based on the new star status
        const newStarStatus = !isCurrentlyStarred;

        if (!post.doc.extensions) post.doc.extensions = {};
        if (!post.doc.extensions.p2group61) post.doc.extensions.p2group61 = [];

        if (newStarStatus) {
          post.doc.extensions.p2group61 = ["starred"];
          starIcon.setAttribute("icon", "mdi:star");
          starIcon.style.color = "gold";
        } else {
          post.doc.extensions.p2group61 = [];
          starIcon.setAttribute("icon", "mdi:star-outline");
          starIcon.style.color = "gray";
        }
      } else {
        console.error("Failed to toggle the star status.");
        this.errorView.showError(
          "Failed to toggle star. Please refresh and try again.",
        );
      }
    });

    // Add keyboard interaction for the star icon
    starIcon.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        starIcon.click();
      }
    });

    // Append the star icon to the header or container
    header.appendChild(starIcon);

    li.appendChild(header);

    // Use an article for the content
    const content = document.createElement("article");
    content.innerHTML = this.formatMessage(post.doc.msg);
    li.appendChild(content);

    // Add action icons (like, reply, heart, dislike)
    const actionContainer = document.createElement("section");
    actionContainer.style.display = "flex";
    actionContainer.style.justifyContent = "space-between";
    actionContainer.style.alignItems = "center";
    actionContainer.style.marginTop = "8px";

    // Ensure the emoji container exists
    const emojiContainer = document.createElement("aside");
    emojiContainer.style.display = "flex";
    emojiContainer.style.gap = "8px";
    emojiContainer.classList.add("emoji-container");

    // Define the reactions and their corresponding icons
    const reactions = [
      { reaction: ":like:", icon: "solar:like-broken" },
      { reaction: ":smile:", icon: "line-md:emoji-smile" },
      { reaction: ":frown:", icon: "line-md:emoji-frown" },
      { reaction: ":celebrate:", icon: "emojione-monotone:party-popper" },
    ];

    // Iterate over reactions and add them only once
    reactions.forEach(({ reaction, icon: iconName }) => {
      // Check if the emoji already exists in the container
      let icon = emojiContainer.querySelector(
        `iconify-icon[aria-label="${reaction}"]`,
      ) as HTMLElement;

      if (!icon) {
        // Create a new icon if it doesn't exist
        icon = document.createElement("iconify-icon");
        icon.setAttribute("icon", iconName);
        icon.setAttribute("aria-label", reaction);
        icon.setAttribute("tabindex", "0");

        // Add reaction functionality
        this.addReactionFunctionality(icon, post, reaction, emojiContainer);

        // Add keyboard interaction for emojis
        icon.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            icon.click();
          }
        });
      }
    });

    // Append the emoji container to the action container
    actionContainer.appendChild(emojiContainer);

    // Reply Section (on the right side)
    const replyContainer = document.createElement("section");
    replyContainer.style.display = "flex";
    replyContainer.style.alignItems = "center";
    replyContainer.style.gap = "4px";
    replyContainer.style.cursor = "pointer";
    replyContainer.setAttribute("tabindex", "0");

    const replyIcon = document.createElement("iconify-icon");
    replyIcon.setAttribute("icon", "mdi:reply-outline");
    replyIcon.setAttribute("aria-label", "reply");
    replyIcon.style.color = "gray";
    replyIcon.style.fontSize = "30px";

    // Use a paragraph for the reply text
    const replyText = document.createElement("p");
    replyText.textContent = "Reply";
    replyText.style.color = "gray";
    replyText.style.fontSize = "1.2em";

    replyContainer.appendChild(replyIcon);
    replyContainer.appendChild(replyText);

    // Add keyboard interaction for the reply button
    replyContainer.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        replyContainer.click();
      }
    });

    replyContainer.addEventListener("click", () => this.startReply(post.path));

    actionContainer.appendChild(replyContainer);

    // Append the action container to the post
    li.appendChild(actionContainer);

    return li;
  }

  private addReactionFunctionality(
    icon: HTMLElement,
    post: {
      path: string;
      doc: { reactions?: { [reactionName: string]: string[] } };
    },
    reaction: string,
    container: HTMLElement,
  ) {
    const username = this.adapter.getModel().getUsername() || "Unknown User";

    // Initialize the reaction array if not already present
    if (!post.doc.reactions) post.doc.reactions = {};
    if (!post.doc.reactions[reaction]) post.doc.reactions[reaction] = [];

    const reactionBox = document.createElement("section");
    reactionBox.style.display = "flex";
    reactionBox.style.alignItems = "center";
    reactionBox.style.justifyContent = "center";
    reactionBox.style.gap = "4px";
    reactionBox.style.padding = "4px 8px";
    reactionBox.style.border = "1px solid #ccc";
    reactionBox.style.borderRadius = "4px";
    reactionBox.style.backgroundColor = "#f9f9f9";
    reactionBox.style.marginRight = "8px";

    const tooltip = document.createElement("article");
    tooltip.className = "reaction-tooltip";
    tooltip.style.position = "absolute";
    tooltip.style.padding = "10px";
    tooltip.style.borderRadius = "6px";
    tooltip.style.fontSize = "14px";
    tooltip.style.color = "black";
    tooltip.style.backgroundColor = "#dfdef6";
    tooltip.style.boxShadow = "0 8px 8px rgba(0, 0, 0, 0.4)";
    tooltip.style.whiteSpace = "nowrap";
    tooltip.style.zIndex = "1000";
    tooltip.style.display = "none";

    document.body.appendChild(tooltip);

    const updateTooltipContent = () => {
      const reactions = post.doc.reactions || {};
      const usernames = reactions[reaction] || [];
      tooltip.innerHTML = `
        <iconify-icon icon="${icon.getAttribute("icon")}" style="vertical-align: middle; margin-right: 5px;"></iconify-icon>
        ${usernames.length > 0 ? `Reacted by:<br>${usernames.map((username) => `<p>${username}</p>`).join("")}` : "No reactions yet"}
      `;
    };

    reactionBox.addEventListener("mouseenter", (event: MouseEvent) => {
      updateTooltipContent();
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      tooltip.style.left = `${rect.left - 350}px`;
      tooltip.style.top = `${rect.bottom - 80}px`;
      tooltip.style.display = "block";
    });

    reactionBox.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });

    reactionBox.appendChild(tooltip);

    // Count Display
    const reactionCount = document.createElement("p");
    reactionCount.textContent = post.doc.reactions[reaction].length.toString();
    reactionCount.style.margin = "0";
    reactionCount.style.marginLeft = "1px";

    // Check if the user has already reacted and highlight the icon
    const hasReacted = post.doc.reactions[reaction].includes(username);
    if (hasReacted) {
      icon.classList.add("active");
      reactionBox.style.backgroundColor = "#dfdef6";
    }

    // Add click event
    icon.addEventListener("click", async () => {
      const reactionsArray = post.doc.reactions![reaction];
      const userhasReacted = reactionsArray.includes(username);

      let success: boolean;

      if (userhasReacted) {
        // Remove reaction
        post.doc.reactions![reaction] = reactionsArray.filter(
          (user) => user !== username,
        );

        // Update the backend
        success = await this.adapter.deleteReactions(post.path, {
          [reaction]: [username],
        });

        // Update the UI if successful
        if (success) {
          reactionBox.style.backgroundColor = "white";
          reactionCount.textContent =
            post.doc.reactions![reaction].length.toString();
          icon.classList.remove("active");
        }

        updateTooltipContent();
      } else {
        // Add reaction
        post.doc.reactions![reaction].push(username);

        // Update the backend
        success = await this.adapter.updateReactions(post.path, {
          [reaction]: [username],
        });

        // Update the UI if successful
        if (success) {
          reactionBox.style.backgroundColor = "#e0f7fa";
          reactionCount.textContent =
            post.doc.reactions![reaction].length.toString();
          icon.classList.add("active");
        }

        updateTooltipContent();
      }

      // Handle failure
      if (!success) {
        console.error(`Failed to update reactions for post: ${post.path}`);
        this.errorView.showError(
          "Failed to update reactions for the post. Please refresh and try again.",
        );
      }
    });

    reactionBox.appendChild(icon);
    reactionBox.appendChild(reactionCount);
    container.appendChild(reactionBox);
  }

  private startReply(parentPath: string) {
    const messageBox = this.shadowRoot!.querySelector(
      "#message-box",
    ) as HTMLElement;

    // Use a section for replyIndicator
    const replyIndicator = document.createElement("section");
    replyIndicator.id = "reply-indicator";
    replyIndicator.style.display = "flex";
    replyIndicator.style.justifyContent = "space-between";
    replyIndicator.style.alignItems = "center";
    replyIndicator.style.marginBottom = "5px";
    replyIndicator.style.color = "gray";

    // Use a paragraph for replyText
    const replyText = document.createElement("p");
    // replyText.textContent = `Replying: `;
    replyText.style.margin = "0"; // Remove default paragraph margin
    replyIndicator.appendChild(replyText);

    const cancelReplyButton = document.createElement("button");
    cancelReplyButton.textContent = "Cancel";
    cancelReplyButton.style.marginLeft = "4px";
    cancelReplyButton.style.marginRight = "8px";
    cancelReplyButton.style.background = "#78736b";
    cancelReplyButton.style.color = "white";
    cancelReplyButton.style.border = "none";
    cancelReplyButton.style.fontSize = "14px";
    cancelReplyButton.style.borderRadius = "4px";
    cancelReplyButton.style.fontFamily =
      "'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif";
    cancelReplyButton.style.cursor = "pointer";
    cancelReplyButton.style.padding = "8px 16px";
    //cancelReplyButton.style.height = "31px";
    cancelReplyButton.classList.add("send-button");
    cancelReplyButton.addEventListener("click", () => this.cancelReply());
    replyIndicator.appendChild(cancelReplyButton);

    // Ensure only one reply indicator exists
    const existingIndicator =
      this.shadowRoot!.querySelector("#reply-indicator");
    if (existingIndicator) existingIndicator.remove();

    messageBox.prepend(replyIndicator);

    // Store the parent path
    this.currentReplyParentPath = parentPath;
    this.messageInput.setAttribute("data-parent", parentPath);

    // Move the input box to the post being replied to
    const postElement = this.shadowRoot!.querySelector(
      `li[data-path="${parentPath}"]`,
    );
    if (postElement && messageBox) {
      postElement.appendChild(messageBox);
      postElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  /**
   * Cancels the reply action and resets the message input field.
   */
  private cancelReply() {
    // Move the message box back to its original container
    const messageBox = this.shadowRoot!.querySelector("#message-box");
    const originalContainer = this.shadowRoot!.querySelector("#post-dialog");

    if (messageBox && originalContainer) {
      originalContainer.appendChild(messageBox);
    }

    // Remove the reply indicator if it exists
    const replyIndicator = this.shadowRoot!.querySelector("#reply-indicator");
    if (replyIndicator) {
      replyIndicator.remove();
    }

    this.currentReplyParentPath = null;
    this.messageInput?.removeAttribute("data-parent");
    this.messageInput.value = "";
  }

  /**
   * Formats the given message string to include HTML for markdown and emoji.
   * @param message - The raw message string.
   * @returns A formatted string with markdown and emoji replaced by HTML.
   */
  private formatMessage(message: string): string {
    message = message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    message = message.replace(/\*(.*?)\*/g, "<em>$1</em>");
    message = message.replace(
      /\[(.*?)\]\((.*?)\)/g,
      `<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>`,
    );
    // Map emojis to their HTML representations
    const emojiMap: { [key: string]: string } = {
      ":smile:": '<iconify-icon icon="line-md:emoji-smile"></iconify-icon>',
      ":like:": '<iconify-icon icon="solar:like-broken"></iconify-icon>',
      ":frown:": '<iconify-icon icon="line-md:emoji-frown"></iconify-icon>',
      ":celebrate:":
        '<iconify-icon icon="emojione-monotone:party-popper"></iconify-icon>',
    };
    message = message.replace(
      /:([a-zA-Z0-9_+-]+):/g,
      (match) => emojiMap[match] || match,
    );
    message = message.replace(/\n/g, "<br>");
    return message;
  }

  /**
   * Displays a message indicating there are no posts in the current channel.
   */
  public displayNoPostsMessage() {
    this.postList.innerHTML = "";
    const message = document.createElement("p");
    message.textContent = "No posts available in this channel.";
    message.style.color = "gray";
    message.style.fontStyle = "italic";
    message.id = "no-posts-message";
    this.postList.appendChild(message);
  }

  /**
   * Handles sending a message by creating a new post.
   */
  private async handleSendMessage() {
    this.errorView.clearErrorDialog();

    // Validate the input message
    const message = this.messageInput.value.trim();
    if (!message) {
      this.errorView.showError("Please type a message before sending.");
      return;
    }
    // Validate the selected channel
    const channelPath = this.getAttribute("channel-path");
    if (!channelPath) {
      alert("No channel selected!");
      return;
    }

    const parentPath = this.messageInput.getAttribute("data-parent") || null;

    try {
      // Attempt to create the post
      const newPost = await this.adapter.createPost(
        channelPath,
        message,
        parentPath,
      );

      if (newPost) {
        // Remove "No posts available" message if it exists
        const noPostsMessage =
          this.shadowRoot!.querySelector("#no-posts-message");
        if (noPostsMessage) {
          noPostsMessage.remove();
        }

        // Remove the reply indicator if it exists
        const replyIndicator =
          this.shadowRoot!.querySelector("#reply-indicator");
        if (replyIndicator) {
          replyIndicator.remove();
        }

        this.messageInput.removeAttribute("data-parent");
        this.cancelReply();

        const pathParts = channelPath.split("/");
        const workspaceId = pathParts[1];
        const channelId = pathParts[3];

        // Dispatch a `post-update` event with the new post's details
        const event = new CustomEvent("post-update", {
          detail: { workspace: workspaceId, channel: channelId, data: newPost },
        });
        document.dispatchEvent(event);
        console.log("CustomEvent 'post-update' dispatched:", event);
      } else {
        this.errorView.showError(
          "Failed to create the post. Please refresh and try again.",
        );
      }
    } catch (error) {
      console.error("Error creating post:", error);
      this.errorView.showError(
        "An error occurred while creating the post. Please refresh and try again.",
      );
    } finally {
      this.messageInput.value = "";
    }
  }

  /**
   * Clears all posts from the post list.
   */
  public clearPosts() {
    this.postList.innerHTML = "";
  }

  /**
   * Updates the posts displayed in the post view.
   * @param updatedPosts - The new list of posts to display.
   */
  public async updatePosts(
    updatedPosts: Array<{
      path: string;
      doc: {
        msg: string;
        parent?: string;
        reactions?: { [reactionName: string]: string[] };
        extensions?: { [extensionName: string]: string[] };
      };
      meta: {
        createdAt: bigint;
        createdBy: string;
        lastModifiedAt?: bigint;
        lastModifiedBy?: string;
      };
    }>,
  ) {
    this.errorView.clearErrorDialog();

    const channelPath = this.getAttribute("channel-path");
    if (!channelPath) {
      console.error("No channel path specified.");
      return;
    }

    try {
      // Refresh the posts by fetching the latest data
      console.log("Refreshing posts by calling loadPosts...");
      const posts = await this.adapter.fetchPosts(channelPath); // Fetch posts for loadPosts
      this.loadPosts(posts, channelPath.split("/")[3] || "Posts");
    } catch (error) {
      console.error("Error refreshing posts using loadPosts:", error);
      this.errorView.showError(
        "Error refreshing posts. Please refresh and try again.",
      );
    }
  }

  /**
   * Filters and displays only the starred posts.
   */
  private async filterStarredMessages() {
    this.errorView.clearErrorDialog();
    const channelPath = this.getAttribute("channel-path");
    if (!channelPath) {
      alert("No channel selected!");
      return;
    }

    try {
      const posts = await this.adapter.fetchPosts(channelPath);
      if (!posts) {
        console.error("Failed to fetch posts");
        this.errorView.showError(
          "Failed to fetch posts. Please refresh and try again.",
        );
        return;
      }

      // Filter top-level starred posts and starred replies
      const starredPosts = posts.filter((post) =>
        post.doc.extensions?.p2group61.includes("starred"),
      );

      // Prepare data for modal
      const starredPostData = starredPosts.map((post) => ({
        msg: post.doc.msg,
        createdBy: post.meta.createdBy,
        createdAt: Number(post.meta.createdAt),
        isReply: Boolean(post.doc.parent),
      }));

      // Show modal with the prepared data
      this.starView.show(starredPostData);
    } catch (error) {
      console.error("Error fetching starred posts:", error);
      this.errorView.showError(
        "An error occurred while fetching starred posts. Please try again.",
      );
    }
  }
}

customElements.define("post-view", PostView);

export default PostView;
