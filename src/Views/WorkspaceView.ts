import ChannelAdapter from "../Adapters/ChannelAdapter";
import WorkspaceAdapter from "../Adapters/WorkspaceAdapter";
import ErrorView from "./ErrorView";

// Define the WorkspaceView class, a custom HTML element for displaying a list of workspaces
class WorkspaceView extends HTMLElement {
  private workspaceList: HTMLUListElement; // Reference to the list element that will contain workspaces
  private workspaceAdapter: WorkspaceAdapter; // Reference to workspace adapter
  private channelAdapter: ChannelAdapter; // Reference to channel adapter
  private errorView: ErrorView; // Reference to the error view to display error messages

  constructor(
    workspaceAdapter: WorkspaceAdapter,
    channelAdapter: ChannelAdapter,
  ) {
    super();
    // Attach a Shadow DOM to the element for encapsulated styles and structure
    this.attachShadow({ mode: "open" });
    this.workspaceAdapter = workspaceAdapter;
    this.channelAdapter = channelAdapter;
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

                #workspace-title {
                  position: relative;
                  font-size: 1.05em;
                  color: black;
                  margin-left: 20px;
                  margin-bottom: 15px;
                  padding: 10px 0;
                  background-color: rgb(227, 222, 243);
                  position: sticky; 
                  top: 0;
                  z-index: 1; 
                  align: center;
                }

                #refresh-button {
                  margin-bottom: 0px;
                  margin-left: 2px;
                  margin-top: 5px;
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

                #workspace-dialog {
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
                    overflow: hidden;
                    margin-top: 0;
                }

                #workspace-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    margin-top: 0px;
                    max-height: 190px;
                    overflow-y: auto;
                }
                /* Styling for each individual workspace item */
                .workspace-item {
                    cursor: pointer;
                    color: white;
                    padding: 8px;
                    border: 1px solid #ccc;
                    margin-bottom: 8px;
                    border-radius: 4px;
                    background-color: #5350b4;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                }

                .workspace-item:focus {
                  outline: 2px solid #221f74; /* Adds a visible focus indicator */
                  outline-offset: 2px;
                }
                
                .workspace-item.selected-workspace {
                  font-weight: bold;
                  background-color: #221f74; /* Distinct color for selected workspaces */
                }

                .workspace-name {
                  position: absolute;
                  left: 50%;
                  transform: translateX(-50%);
                  font-weight: bold;
                }

                .delete-btn {
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

                .selected-workspace {
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
              <section id="workspace-dialog">
              <header class="title-container">
                <h2 id="workspace-title">Select a Workspace</h2>
                <button id="refresh-button">
                  <iconify-icon icon="ic:outline-refresh"></iconify-icon>
                </button>
              </header>
              <button class="scroll-arrow up" aria-label="Scroll up">▲</button>
              <ul id="workspace-list"></ul>
              <button class="scroll-arrow down" aria-label="Scroll down">▼</button>
            </section>

            <dialog id="delete-dialog">
              <h3>Are you sure you want to delete this workspace?</h3>
              <footer class="dialog-buttons">
                <button type="button" class="dialog-btn confirm">Yes</button>
                <button type="button" class="dialog-btn cancel">No</button>
              </footer>
            </dialog>
        `;

    // Reference to the <ul> element in the shadow DOM where workspace items will be appended
    this.workspaceList = this.shadowRoot!.querySelector("#workspace-list")!;
  }

  // Lifecycle method called when the element is added to the DOM
  connectedCallback() {
    console.log("WorkspaceView connected to the DOM");
    // Dispatch a `load-workspaces` event to signal that workspaces should be loaded
    this.dispatchEvent(new Event("load-workspaces"));

    const upArrow = this.shadowRoot!.querySelector(
      ".scroll-arrow.up",
    ) as HTMLElement;
    const downArrow = this.shadowRoot!.querySelector(
      ".scroll-arrow.down",
    ) as HTMLElement;
    const refreshButton = this.shadowRoot!.querySelector("#refresh-button")!;

    upArrow.style.display = "none";
    downArrow.style.display = "none";

    upArrow.addEventListener("click", () => this.scrollWorkspaceList("up"));
    downArrow.addEventListener("click", () => this.scrollWorkspaceList("down"));
    refreshButton.addEventListener("click", () => this.refreshWorkspaces());

    this.addEventListener("workspace-created", async () => {
      console.log("Workspace created event received. Reloading workspaces...");
      await this.loadWorkspaces();
    });

    this.loadWorkspaces();
  }

  /**
   * Scrolls the workspace list in the specified direction.
   * @param direction - "up" to scroll up, "down" to scroll down.
   */
  private scrollWorkspaceList(direction: "up" | "down") {
    const scrollAmount = 50; // Amount to scroll
    if (direction === "up") {
      this.workspaceList.scrollBy({ top: -scrollAmount, behavior: "smooth" });
    } else if (direction === "down") {
      this.workspaceList.scrollBy({ top: scrollAmount, behavior: "smooth" });
    }
  }

  /**
   * Refreshes the list of workspaces by reloading them from the backend.
   */
  private async refreshWorkspaces() {
    this.errorView.clearErrorDialog();
    console.log("Refreshing workspaces...");
    try {
      await this.loadWorkspaces();
    } catch (error) {
      console.error("Error refreshing workspaces:", error);
      this.errorView.showError(
        "Failed to refresh workspaces. Please try again.",
      );
    }
  }

  /**
   * Loads the list of workspaces from the backend and updates the view.
   */
  private async loadWorkspaces() {
    this.errorView.clearErrorDialog();
    try {
      console.log("Loading workspaces...");
      const workspaces = await this.workspaceAdapter.fetchWorkspaces();
      const upArrow = this.shadowRoot!.querySelector(
        ".scroll-arrow.up",
      ) as HTMLElement;
      const downArrow = this.shadowRoot!.querySelector(
        ".scroll-arrow.down",
      ) as HTMLElement;
      if (workspaces && workspaces.length > 0) {
        this.renderWorkspaces(workspaces);

        if (workspaces.length > 1) {
          upArrow.style.display = "flex";
          downArrow.style.display = "flex";
        } else {
          upArrow.style.display = "none";
          downArrow.style.display = "none";
        }

        // Check if there is any workspace selected
        const selectedWorkspace = this.shadowRoot!.querySelector(
          ".selected-workspace",
        );
        const channelView = document.querySelector(
          "channel-view",
        ) as HTMLElement;
        const createChannelBtn = document.querySelector(
          ".create-channel-btn",
        ) as HTMLElement;

        if (selectedWorkspace) {
          if (channelView) {
            channelView.style.display = "block";
          }
          if (createChannelBtn) {
            createChannelBtn.style.display = "inline-block";
          }
        } else {
          // Hide the channel section and button if no workspace is selected
          if (channelView) {
            channelView.style.display = "none";
          }
          if (createChannelBtn) {
            createChannelBtn.style.display = "none";
          }
        }
      } else {
        this.clearWorkspaces();

        upArrow.style.display = "none";
        downArrow.style.display = "none";

        // Hide the elements if no workspaces exist
        const channelView = document.querySelector(
          "channel-view",
        ) as HTMLElement;
        if (channelView) {
          channelView.style.display = "none";
        }

        const postView = document.querySelector("post-view") as HTMLElement;
        if (postView) {
          postView.style.display = "none";
          postView.innerHTML = "";
        }

        const createChannelBtn = document.querySelector(
          ".create-channel-btn",
        ) as HTMLElement;
        if (createChannelBtn) {
          createChannelBtn.style.display = "none";
        }
      }
    } catch (error) {
      console.error("Error loading workspaces:", error);
      this.errorView.showError(
        "Failed to load workspaces. Please check your connection.",
      );
    }
  }

  /**
   * Clears all workspaces from the view.
   */
  public clearWorkspaces() {
    this.workspaceList.innerHTML = ""; // Clear the workspace list
    console.log("Workspaces cleared from view");
  }

  /**
   * Renders a list of workspaces in the dialog.
   * @param workspaces - An array of workspace objects to display, each with a `path` property
   */
  public renderWorkspaces(workspaces: Array<{ path: string }>) {
    console.log("Rendering workspaces:", workspaces);
    // Clear any existing workspace items from the list
    this.workspaceList.innerHTML = "";
    let selectedWorkspace: HTMLElement | null = null;
    const channelView = document.querySelector("channel-view") as HTMLElement;
    const createChannelBtn = document.querySelector(
      ".create-channel-btn",
    ) as HTMLElement;

    // If no workspace is selected, ensure the channel view is hidden
    if (!selectedWorkspace) {
      if (channelView) channelView.style.display = "none";
      if (createChannelBtn) createChannelBtn.style.display = "none";
    }

    workspaces.forEach((workspace) => {
      // Create an <li> element for each workspace
      const li = document.createElement("li");
      li.classList.add("workspace-item");
      li.setAttribute("role", "button"); // ARIA role for button-like behavior
      li.setAttribute("tabindex", "0"); // Make the <li> focusable for keyboard navigation

      const workspaceName = document.createElement("p");
      workspaceName.textContent = workspace.path.slice(1); // Display the workspace path (excluding the first character if necessary)
      workspaceName.style.margin = "0"; // Remove default margins

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.classList.add("delete-btn");

      deleteButton.addEventListener("click", async (event) => {
        event.stopPropagation(); // Prevents triggering the workspace selection on delete
        this.showDeleteDialog(workspace.path, workspaceName.textContent || "");
      });

      // Add a click event listener to each workspace item
      const selectWorkspace = () => {
        console.log(`Workspace clicked: ${workspace.path}`);
        if (selectedWorkspace) {
          selectedWorkspace.classList.remove("selected-workspace");
        }

        selectedWorkspace = li;
        li.classList.add("selected-workspace");

        // Display the channel view when a workspace is selected
        if (channelView) {
          channelView.style.display = "block";

          // Load channels for the selected workspace
          const channelAdapter = this.channelAdapter;
          channelAdapter.fetchChannels(workspace.path).then((channels) => {
            if (channels && channels.length > 0) {
              (channelView as any).loadChannels(workspace.path, channels);
            } else {
              (channelView as any).displayNoChannelsMessage();
            }
          });
        }

        if (createChannelBtn) {
          createChannelBtn.style.display = "inline-block";
        }

        // Clear any posts or channel names in the post view
        const postView = document.querySelector("post-view") as HTMLElement & {
          clearPosts: () => void;
          clearChannelName: () => void;
        };
        if (postView) {
          if (typeof postView.clearPosts === "function") {
            console.log(
              "Clearing posts from post-view due to workspace selection",
            );
            postView.clearPosts(); // Call the clearPosts method if it exists
          }

          if (typeof postView.clearChannelName === "function") {
            console.log(
              "Clearing channel name from post-view due to workspace selection",
            );
            postView.clearChannelName(); // Call the clearChannelName method if it exists
          }
        }

        // Dispatch a custom `workspace-selected` event
        this.dispatchEvent(
          new CustomEvent("workspace-selected", { detail: workspace }),
        );
      };

      li.addEventListener("click", selectWorkspace);

      // Add a keydown listener for Enter key functionality
      li.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          selectWorkspace();
        }
      });

      // Append the workspace name and delete button to the list item
      li.appendChild(workspaceName);
      li.appendChild(deleteButton);

      // Append the workspace <li> element to the workspace list
      this.workspaceList.appendChild(li);
    });
  }

  /**
   * Displays a confirmation dialog for deleting a workspace and handles the deletion process.
   *
   * @param {string} workspacePath - The unique path of the workspace to be deleted.
   * @param {string} workspaceName - The name of the workspace to display in the dialog.
   * @returns {void} - This function does not return a value.
   */
  private showDeleteDialog(workspacePath: string, workspaceName: string): void {
    const dialog =
      this.shadowRoot!.querySelector<HTMLDialogElement>("#delete-dialog")!;
    const confirmButton = dialog.querySelector<HTMLButtonElement>(".confirm")!;
    const cancelButton = dialog.querySelector<HTMLButtonElement>(".cancel")!;

    // Show the dialog
    dialog.showModal();

    // Remove previous event listeners to prevent stacking
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    cancelButton.replaceWith(cancelButton.cloneNode(true));

    const updatedConfirmButton =
      dialog.querySelector<HTMLButtonElement>(".confirm")!;
    const updatedCancelButton =
      dialog.querySelector<HTMLButtonElement>(".cancel")!;

    // Define event handlers
    const handleConfirmClick = async () => {
      dialog.close();
      const channelView = document.querySelector(
        "channel-view",
      ) as HTMLElement & {
        clearChannels: () => void;
      };

      const postView = document.querySelector("post-view") as HTMLElement & {
        clearPosts: () => void;
        clearChannelName: () => void;
      };
      if (channelView) {
        channelView.clearChannels?.();
      }
      if (postView) {
        postView.style.display = "none";
        postView.innerHTML = ""; // Clear the post view content
        postView.clearPosts?.();
        postView.clearChannelName?.();
      }
      try {
        await this.workspaceAdapter.deleteWorkspace(workspacePath);
        this.dispatchEvent(
          new CustomEvent("workspace-deleted", {
            detail: { workspacePath },
          }),
        );
      } catch (error) {
        console.error("Error deleting workspace:", error);
        this.errorView.showError(
          "Failed to delete workspace. Please refresh and try again.",
        );
      }
      await this.loadWorkspaces();
    };

    const handleCancelClick = () => {
      dialog.close();
    };

    // Attach event listeners
    updatedConfirmButton.addEventListener("click", handleConfirmClick);
    updatedCancelButton.addEventListener("click", handleCancelClick);
  }
}

// Register the custom element with the tag name 'workspace-view' so it can be used in HTML
customElements.define("workspace-view", WorkspaceView);

export default WorkspaceView;
