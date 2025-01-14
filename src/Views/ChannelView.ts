import ChannelAdapter from "../Adapters/ChannelAdapter";
import ErrorView from "./ErrorView";

// Define the ChannelView class, a custom HTML element for displaying a list of channels
class ChannelView extends HTMLElement {
  private channelList: HTMLUListElement; // Reference to the list element that will contain channels
  private adapter: ChannelAdapter; // Adapter to handle channel-related operations
  private deleteDialog: HTMLDialogElement; // Reference to the dialog for channel deletion confirmation
  private dialogConfirmButton: HTMLButtonElement | null = null; // Confirm button in the delete dialog
  private dialogCancelButton: HTMLButtonElement | null = null; // Cancel button in the delete dialog
  private channelToDelete: {
    workspacePath: string;
    channelPath: string;
  } | null = null; // Stores the channel to be deleted
  private selectedWorkspacePath: string | null = null; // Stores the currently selected workspace path
  private errorView: ErrorView;

  constructor(adapter: ChannelAdapter) {
    super();
    // Attach a Shadow DOM to the element for encapsulated styles and structure
    this.attachShadow({ mode: "open" });
    this.adapter = adapter;
    this.errorView = new ErrorView();
    document.body.appendChild(this.errorView);

    // Define the HTML structure and CSS styles within the Shadow DOM
    this.shadowRoot!.innerHTML = `
              <style>
                  .scroll-arrow {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    text-align: center;
                    cursor: pointer;
                    font-size: 7px;
                    color: #5350b4;
                    z-index: 2;
                    background: rgba(255, 255, 255, 0.7);
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                  }
                  .scroll-arrow.up {
                    top: 30%;
                    left: 96%;
                    right: 0;
                    background: rgba(255, 255, 255, 0.7);
                    padding: 5px 0;
                    border-radius: 4px 4px 0 0;
                  }
                  .scroll-arrow.down {
                    bottom: 5%;
                    left: 96%;
                    right: 0;
                    background: rgba(255, 255, 255, 0.7);
                    padding: 5px 0;
                    border-radius: 0 0 4px 4px;
                  }
                  .scroll-arrow:hover {
                    background: rgba(83, 80, 180, 0.9);
                    color: white;
                  }
                  
                  .title-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 0px;
                  }

                  /* Styling for the channel title */
                  h2#channel-title {
                    position: relative;
                    font-size: 1.05em;
                    color: black;
                    margin-left: 35px;
                    margin-bottom: 15px;
                    padding: 10px 0;
                    background-color: rgb(227, 222, 243);
                    position: sticky; 
                    top: 0;
                    z-index: 1; 
                    align: center;
                  }

                  #refresh-button {
                    margin: 10px;
                    margin-bottom: 5px;
                    margin-left: 5px;
                    margin-top: 10px;
                    background-color: rgb(227, 222, 243);
                    border: none;
                    cursor: pointer;
                    font-size: 1.3em;
                    color: grey;
                  }

                  #refresh-button:hover {
                    font-weight: bolder;
                    color: black;
                  }

                  section#channel-dialog {
                      position: relative;
                      width: 240px;
                      padding: 5px 10px;
                      border: none;
                      border-radius: 8px;
                      background: white;
                      text-align: center;
                      background-color: rgb(227, 222, 243);
                      flex-direction: column;
                      height: 100%;
                      overflow-y: hidden;
                      margin-top: 10px;
                  }

                  ul#channel-list {
                      list-style: none;
                      padding: 0;
                      margin: 0;
                      max-height: 190px;
                      overflow-y: auto;
                  }
                  /* Styling for each individual channel item */
                  li.channel-item {
                      color: white;
                      cursor: pointer;
                      padding: 8px;
                      border: 1px solid #ccc;
                      margin-bottom: 8px;
                      border-radius: 4px;
                      background-color: #5350b4;
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                  }

                  .channel-item:focus {
                    outline: 2px solid #221f74; /* Adds a visible focus indicator */
                    outline-offset: 2px;
                  }
                  
                  .channel-item.selected-channel {
                    font-weight: bold;
                    background-color: #221f74; /* Highlight selected channel */
                  }
  

                  button.delete-btn {
                      background-color: #78736b;
                      color: white;
                      border: none;
                      padding: 4px 8px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
                  } 

                  .delete-btn:hover {
                  background-color: #524f4b; 
                  }

                  li.channel-item.selected-channel {
                      font-weight: bold;
                      color: white;
                      background-color: #221f74;
                  }

                  dialog {
                    position: fixed;
                    top: 15%;
                    left: 28%;
                    transform: translate(-50%, -50%);
                    width: 300px;
                    padding: 20px;
                    background-color: white;
                    border-radius: 8px;
                    border: 1px solid #ccc;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                  }

                  dialog::backdrop {
                    background-color: rgba(0, 0, 0, 0.5);
                  }

                  dialog h3 {
                    font-size: 1.2em;
                    margin: 0 0 15px;
                    text-align: center;
                    font-weight: normal;
                  }

                  dialog .dialog-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                  }

                  button.dialog-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
                  }

                  button.dialog-btn.confirm {
                    background-color: #5350b4;
                    color: white;
                  }
                  
                  button.dialog-btn.confirm:hover {
                    background-color: #312e88; 
                  }

                  button.dialog-btn.cancel {
                    background-color: #78736b;
                    color: white;
                  }

                  button.dialog-btn.cancel:hover {
                    background-color: #524f4b; 
                  }

              </style>
              <section id="channel-dialog">
              <header class="title-container">
                <h2 id="channel-title">Select a Channel</h2>
                <button id="refresh-button">
                  <iconify-icon icon="ic:outline-refresh"></iconify-icon>
                </button>
              </header>
              <button class="scroll-arrow up" aria-label="Scroll up">▲</button>
              <ul id="channel-list"></ul>
              <button class="scroll-arrow down" aria-label="Scroll down">▼</button>
              </section>

              <dialog id="delete-channel-dialog">
                <h3>Are you sure you want to delete this channel?</h3>
                <footer class="dialog-buttons">
                  <button type="button" class="dialog-btn confirm">Yes</button>
                  <button type="button" class="dialog-btn cancel">No</button>
                </footer>
              </dialog>
        `;
    // Reference to the <ul> element in the shadow DOM where channel items will be appended
    this.channelList = this.shadowRoot!.querySelector("#channel-list")!;
    this.deleteDialog = this.shadowRoot!.querySelector(
      "#delete-channel-dialog",
    )!;
    this.dialogConfirmButton = this.shadowRoot!.querySelector("button.confirm");
    this.dialogCancelButton = this.shadowRoot!.querySelector("button.cancel");
  }

  // Lifecycle method called when the element is added to the DOM
  connectedCallback() {
    console.log("ChannelView connected to the DOM");
    if (this.dialogConfirmButton && this.deleteDialog) {
      this.dialogConfirmButton.addEventListener("click", async () => {
        try {
          this.errorView.clearErrorDialog();
          if (this.channelToDelete) {
            const { channelPath } = this.channelToDelete;
            await this.adapter.deleteChannel(channelPath);
            this.deleteDialog.close();
            this.dispatchEvent(
              new CustomEvent("channel-deleted", {
                detail: { channelPath },
              }),
            );
          }
        } catch (error) {
          this.errorView.showError(
            "Failed to delete the channel. Please refresh and try again.",
          );
          console.error("Error deleting channel:", error);
        }
      });
    }

    const upArrow = this.shadowRoot!.querySelector(
      ".scroll-arrow.up",
    ) as HTMLElement;
    const downArrow = this.shadowRoot!.querySelector(
      ".scroll-arrow.down",
    ) as HTMLElement;
    const refreshButton = this.shadowRoot!.querySelector("#refresh-button")!;

    upArrow.style.display = "none";
    downArrow.style.display = "none";

    upArrow.addEventListener("click", () => this.scrollChannelList("up"));
    downArrow.addEventListener("click", () => this.scrollChannelList("down"));
    refreshButton.addEventListener("click", () => this.refreshChannels());

    if (this.dialogCancelButton && this.deleteDialog) {
      this.dialogCancelButton.addEventListener("click", () => {
        this.deleteDialog.close();
      });
    }
  }

  /**
   * Scrolls the channel list in the specified direction.
   * @param direction - "up" to scroll up, "down" to scroll down.
   */
  private scrollChannelList(direction: "up" | "down") {
    const scrollAmount = 50; // Amount to scroll
    if (direction === "up") {
      this.channelList.scrollBy({ top: -scrollAmount, behavior: "smooth" });
    } else if (direction === "down") {
      this.channelList.scrollBy({ top: scrollAmount, behavior: "smooth" });
    }
  }

  /**
   * Loads and displays a list of channels in the dialog.
   * @param workspacePath - Path of the selected workspace.
   * @param channels - An array of channel objects to display, each with a `path` property.
   */
  public loadChannels(
    workspacePath: string,
    channels: Array<{ path: string }>,
  ) {
    this.errorView.clearErrorDialog();

    try {
      this.selectedWorkspacePath = workspacePath;
      this.channelList.innerHTML = "";

      const upArrow = this.shadowRoot!.querySelector(
        ".scroll-arrow.up",
      ) as HTMLElement;
      const downArrow = this.shadowRoot!.querySelector(
        ".scroll-arrow.down",
      ) as HTMLElement;

      if (channels.length === 0) {
        this.displayNoChannelsMessage();

        // Hide scroll arrows as there are no channels
        upArrow.style.display = "none";
        downArrow.style.display = "none";

        return;
      }

      if (channels.length > 1) {
        upArrow.style.display = "flex";
        downArrow.style.display = "flex";
      } else {
        upArrow.style.display = "none";
        downArrow.style.display = "none";
      }

      let selectedChannel: HTMLElement | null = null;

      // Iterate through each channel and create a list item for it
      channels.forEach((channel) => {
        const li = document.createElement("li");

        // Extract the channel name from the path
        const channelName = channel.path.split("/")[3];
        li.textContent = channelName;
        li.classList.add("channel-item");
        li.setAttribute("role", "button");
        li.setAttribute("tabindex", "0");

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-btn");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async (event) => {
          event.stopPropagation();
          this.channelToDelete = { workspacePath, channelPath: channel.path };
          this.deleteDialog?.showModal();
        });

        // Add a click event listener to each channel item
        const selectChannel = () => {
          if (selectedChannel) {
            selectedChannel.classList.remove("selected-channel");
          }

          selectedChannel = li;
          li.classList.add("selected-channel");

          this.dispatchEvent(
            new CustomEvent("channel-selected", { detail: channel }),
          );
        };

        li.addEventListener("click", selectChannel);

        // Add a keydown listener for Enter key functionality
        li.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            selectChannel();
          }
        });

        // Append the channel <li> element to the channel list
        li.appendChild(deleteButton);
        this.channelList.appendChild(li);
      });
    } catch (error) {
      this.errorView.showError(
        "Failed to load channels. Please refresh and try again.",
      );
      console.error("Error loading channels:", error);
    }
  }

  /**
   * Refreshes the list of channels for the currently selected workspace.
   */
  private async refreshChannels() {
    this.errorView.clearErrorDialog();
    if (!this.selectedWorkspacePath) {
      console.error("No workspace selected");
      return;
    }

    // Take a local snapshot of the currently selected workspace
    const currentWorkspacePath = this.selectedWorkspacePath;
    try {
      console.log("before fetchChannels", currentWorkspacePath);
      const channels = await this.adapter.fetchChannels(currentWorkspacePath);
      console.log("after fetchChannels", channels);

      // Verify the selected workspace hasn't changed during the fetch
      if (this.selectedWorkspacePath !== currentWorkspacePath) {
        console.warn(
          `Workspace switched during channel refresh. Ignoring results for ${currentWorkspacePath}`,
        );
        return;
      }

      if (channels) {
        this.loadChannels(currentWorkspacePath, channels);
      }
    } catch (error) {
      this.errorView.showError(
        "Failed to refresh channels. Please try again later.",
      );
      console.error("Failed to refresh channels:", error);
    }
  }

  /**
   * Displays a message indicating no channels are available in the workspace.
   */
  public displayNoChannelsMessage() {
    // Clear any existing content in the channel list
    this.channelList.innerHTML = "";

    // Create a paragraph element to display the no channels message
    const message = document.createElement("p");
    message.textContent = "No channels available in this workspace.";
    message.style.color = "gray";
    message.style.fontStyle = "italic";

    // Append the message to the channel list
    this.channelList.appendChild(message);
  }

  /**
   * Clears the list of channels displayed in the view.
   * This method removes all child elements from the `channelList` element,
   * effectively resetting the displayed list of channels.
   */
  public clearChannels() {
    this.channelList.innerHTML = "";
    console.log("Channels cleared from view");
  }
}

// Register the custom element with the tag name 'channel-view' so it can be used in HTML
customElements.define("channel-view", ChannelView);

export default ChannelView;
