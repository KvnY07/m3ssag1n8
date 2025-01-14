import "./Views/LoginView";
import "./Views/WorkspaceView";
import "./Views/ChannelView";
import "./Views/PostView";
import Model from "./Model";
import LoginAdapter from "./Adapters/LoginAdapter";
import WorkspaceAdapter from "./Adapters/WorkspaceAdapter";
import ChannelAdapter from "./Adapters/ChannelAdapter";
import PostAdapter from "./Adapters/PostAdapter";
import ErrorView from "./Views/ErrorView";
import { handleLogout } from "./LogoutHandler";
import WorkspaceView from "./Views/WorkspaceView";
import ChannelView from "./Views/ChannelView";
import PostView from "./Views/PostView";

// Initialize components when the "login-view" custom element is defined
customElements.whenDefined("login-view").then(() => {
  const loginDialog = document.querySelector("login-view") as HTMLElement;
  const model = new Model();
  const loginAdapter = new LoginAdapter(model);
  const workspaceAdapter = new WorkspaceAdapter(model);
  const channelAdapter = new ChannelAdapter(model);
  const errorView = new ErrorView();
  document.body.appendChild(errorView);

  if (loginDialog) {
    console.log("LoginDialog initialized");
    document.body.classList.add("dialog-active");
    document.body.classList.add("login-background-active");

    // Setup login dialog event listeners
    loginDialog.addEventListener("login-attempt", async (event) => {
      const customEvent = event as CustomEvent;
      const username = customEvent.detail.username;

      // Authenticate the user using the login adapter
      const isAuthenticated = await loginAdapter.authenticate(username);
      if (isAuthenticated) {
        loginDialog.dispatchEvent(new Event("login-success"));
        (loginDialog as any).closeDialog();

        document.body.classList.remove("dialog-active");
        document.body.classList.remove("login-background-active");

        const storedUsername = model.getUsername() || "User";
        const usernameSplit = storedUsername.split(" ");
        const firstName = usernameSplit[0][0]
          .toUpperCase()
          .concat(usernameSplit[0].substring(1));

        // Create and display the main content container
        const mainContentContainer = document.createElement("section");
        mainContentContainer.classList.add("main-content-container");
        document.body.appendChild(mainContentContainer);

        const workspaceButtonsContainer = document.createElement("section");
        workspaceButtonsContainer.classList.add("workspace-buttons-container");
        document.body.appendChild(workspaceButtonsContainer);

        // Welcome message
        const welcomeMessage = document.createElement("article");
        welcomeMessage.id = "welcome-message";
        welcomeMessage.innerHTML = `<b>Welcome, ${firstName}! <iconify-icon icon="noto:owl"></iconify-icon></b> <br> To start using our platform, <b>create</b> or <b>select</b> a workspace.`;
        mainContentContainer.appendChild(welcomeMessage);

        // Add "Create Workspace" button
        const createWorkspaceBtn = document.createElement("button");
        createWorkspaceBtn.classList.add("create-workspace-btn");
        createWorkspaceBtn.textContent = "Create Workspace";
        workspaceButtonsContainer.appendChild(createWorkspaceBtn);

        const overlayBackdrop = document.getElementById(
          "overlay-backdrop",
        ) as HTMLElement;

        let createWorkspaceDialog = document.querySelector(
          "create-workspace-dialog",
        ) as HTMLElement;
        createWorkspaceBtn.addEventListener("click", () => {
          if (!createWorkspaceDialog) {
            // Create the dialog content for creating a workspace
            createWorkspaceDialog = document.createElement("section");
            createWorkspaceDialog.innerHTML = `
              <article id="create-workspace-dialog">
                <h3>Create a New Workspace</h3>
                <form>
                  <input type="text" id="workspace-name" placeholder="Enter Workspace Name"/>
                  <button id="submit-workspace-btn" type="button">Create Workspace</button>
                  <p id="workspace-error-message" style="color: red; display: none;">Please enter a workspace name.</p>
                </form>
                <button id="close-dialog-btn" type="button">X</button>
              </article>
            `;
            document.body.appendChild(createWorkspaceDialog);

            // functionality to close the dialog
            const closeDialogBtn = createWorkspaceDialog.querySelector(
              "#close-dialog-btn",
            ) as HTMLButtonElement;
            closeDialogBtn.addEventListener("click", () => {
              errorView.clearErrorDialog();
              createWorkspaceDialog.style.display = "none";
              overlayBackdrop.classList.remove("active");
              const errorMessage = createWorkspaceDialog.querySelector(
                "#workspace-error-message",
              ) as HTMLElement;
              errorMessage.style.display = "none";
            });

            // event listener for workspace creation
            createWorkspaceDialog
              .querySelector("#submit-workspace-btn")
              ?.addEventListener("click", async () => {
                if (currentChannelPath) {
                  console.log(
                    `Unsubscribing from current channel: ${currentChannelPath}`,
                  );
                  channelAdapter.unsubscribeFromChannel(currentChannelPath);
                  currentChannelPath = null;
                }

                // Clear any existing error dialogs
                errorView.clearErrorDialog();

                const workspaceNameInput = createWorkspaceDialog.querySelector(
                  "#workspace-name",
                ) as HTMLInputElement;
                const workspaceName = workspaceNameInput.value;
                const errorMessage = createWorkspaceDialog.querySelector(
                  "#workspace-error-message",
                ) as HTMLElement;
                if (workspaceName) {
                  try {
                    await workspaceAdapter.createWorkspace(workspaceName);

                    const workspaceView = document.querySelector(
                      "workspace-view",
                    ) as HTMLElement;
                    if (workspaceView) {
                      workspaceView.dispatchEvent(new Event("load-workspaces"));
                    }

                    createWorkspaceDialog.style.display = "none";
                    overlayBackdrop.classList.remove("active");
                    errorMessage.style.display = "none";

                    // Check if the workspace view is hidden
                    const isCurrentlyHidden =
                      workspaceView.style.display === "none";
                    if (isCurrentlyHidden) {
                      workspaceView.style.display = "block";
                      console.log("show the workspace list");
                    }

                    workspaceNameInput.value = "";

                    // Ensure no workspace, channel, or posts are selected/displayed by default after creating a workspace
                    const channelView = document.querySelector(
                      "channel-view",
                    ) as HTMLElement;
                    const createChannelBtn = document.querySelector(
                      ".create-channel-btn",
                    ) as HTMLElement;
                    const postView = document.querySelector(
                      "post-view",
                    ) as HTMLElement;

                    if (channelView) {
                      channelView.style.display = "none";
                      (channelView as any).clearChannels?.();
                    }
                    if (createChannelBtn) {
                      createChannelBtn.style.display = "none";
                    }

                    if (postView) {
                      postView.style.display = "none";
                      postView.innerHTML = "";
                    }
                  } catch (error: any) {
                    if (error.message === "document already exists") {
                      errorView.showError(
                        "This workspace exists. Choose a new name and try again.",
                      );
                    } else {
                      errorView.showError(
                        "Failed to create workspace. Please try again.",
                      );
                    }
                  }
                } else {
                  // Show an error if no workspace name is provided
                  errorView.showError(
                    "Please enter the name for the workspace.",
                  );
                }
              });

            // Retrieve the workspace name input field and submit button from the dialog
            const workspaceNameInput = createWorkspaceDialog.querySelector(
              "#workspace-name",
            ) as HTMLInputElement;
            const submitWorkspaceBtn = createWorkspaceDialog.querySelector(
              "#submit-workspace-btn",
            ) as HTMLButtonElement;

            // Add an event listener to handle the Enter key
            workspaceNameInput.addEventListener("keydown", (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitWorkspaceBtn.click();
              }
            });
          } else {
            createWorkspaceDialog.style.display = "block";
          }

          overlayBackdrop.classList.add("active");

          if (welcomeMessage) {
            welcomeMessage.style.display = "none";
          }
        });

        // Ensure the workspace view is created and displayed
        let wsDialog = document.querySelector("workspace-view") as HTMLElement;
        if (!wsDialog) {
          wsDialog = new WorkspaceView(workspaceAdapter, channelAdapter);
          wsDialog.style.display = "block";
          document.body.appendChild(wsDialog);
        }

        let currentChannelPath: string | null = null;

        // Create a container for the username and logout button
        const userInfoContainer = document.createElement("section");
        userInfoContainer.classList.add("user-info-container");

        // Add owl icon
        const owlIcon = document.createElement("figure");
        owlIcon.classList.add("owl-icon");
        owlIcon.innerHTML = `<iconify-icon icon="noto:owl"></iconify-icon>`;
        userInfoContainer.appendChild(owlIcon);

        // Create the "Logout" button
        const logoutBtn = document.createElement("button");
        logoutBtn.classList.add("logout-btn");
        logoutBtn.textContent = "Logout";

        // Event listener to handle logout
        logoutBtn.addEventListener("click", () => {
          if (currentChannelPath) {
            console.log(
              `Unsubscribing from current channel: ${currentChannelPath}`,
            );
            channelAdapter.unsubscribeFromChannel(currentChannelPath);
            currentChannelPath = null;
          }
          handleLogout(model, loginDialog);
        });

        // Create the username display
        const usernameDisplay = document.createElement("p");
        usernameDisplay.classList.add("username-display");
        usernameDisplay.style.fontWeight = "bold";
        usernameDisplay.style.fontSize = "1em";
        usernameDisplay.textContent = storedUsername;

        // Append the "Logout" button and username to the container
        userInfoContainer.appendChild(logoutBtn);
        userInfoContainer.appendChild(usernameDisplay);

        // Append the user info container to the document body
        document.body.appendChild(userInfoContainer);

        // Set up the workspace dialog
        let workspaceDialog = document.querySelector(
          "workspace-view",
        ) as HTMLElement;

        workspaceDialog.addEventListener("workspace-deleted", async () => {
          try {
            // Fetch updated list of workspaces after deletion
            const workspaces = await workspaceAdapter.fetchWorkspaces();
            if (workspaces) {
              (workspaceDialog as any).renderWorkspaces(workspaces);
            }

            // Hide and clear the post view
            const postView = document.querySelector("post-view") as HTMLElement;
            if (postView) {
              postView.style.display = "none";
              postView.innerHTML = "";
            } else {
              console.warn("Post view not found in the DOM.");
            }

            // Reload the workspace list
            workspaceDialog.dispatchEvent(new Event("load-workspaces"));
          } catch (error) {
            console.error("Error handling workspace deletion:", error);
          }
        });

        // Dispatch 'load-workspaces' event
        workspaceDialog.dispatchEvent(new Event("load-workspaces"));

        let currentWorkspacePath = "";
        // Handle workspace selection for channel loading
        workspaceDialog.addEventListener(
          "workspace-selected",
          async (event) => {
            if (currentChannelPath) {
              console.log(
                `Unsubscribing from current channel: ${currentChannelPath}`,
              );
              channelAdapter.unsubscribeFromChannel(currentChannelPath);
              currentChannelPath = null;
            }

            const postView = document.querySelector("post-view") as HTMLElement;
            if (postView) {
              postView.style.display = "none";
              postView.innerHTML = "";
            }

            console.log("Receive a new selection of workspace");
            const customEvent = event as CustomEvent;
            const workspace = customEvent.detail;
            currentWorkspacePath = workspace.path;

            let channelView = document.querySelector(
              "channel-view",
            ) as HTMLElement;

            if (!channelView) {
              channelView = new ChannelView(channelAdapter);
              document.body.appendChild(channelView);
            }

            // Ensure the channel view is displayed
            if (channelView) {
              channelView.style.display = "block";

              // Access and show the "Select a Channel" message inside the shadow DOM
              const channelTitle = channelView.shadowRoot?.querySelector(
                "#channel-title",
              ) as HTMLElement;
              if (channelTitle) {
                channelTitle.style.display = "block";
              }

              // Retrieve the refresh button from the channel view's shadow DOM
              const refreshButton = channelView.shadowRoot?.querySelector(
                "#refresh-button",
              ) as HTMLElement;
              if (refreshButton) {
                refreshButton.style.display = "block";
              }
            }

            // Fetch the channels for the current workspace path
            const channels =
              await channelAdapter.fetchChannels(currentWorkspacePath);
            console.log("channels get", channels);

            if (channels) {
              (channelView as any).loadChannels(currentWorkspacePath, channels);
            }

            // Retrieve or create the "Create Channel" button
            let createChannelBtn = document.querySelector(
              ".create-channel-btn",
            ) as HTMLButtonElement;
            if (createChannelBtn) {
              // Display and make the "Create Channel" button visible
              createChannelBtn.style.display = "inline-block";
              createChannelBtn.style.visibility = "visible";
            } else {
              // Create the "Create Channel" button if it does not exist
              createChannelBtn = document.createElement("button");
              createChannelBtn.classList.add("create-channel-btn");
              createChannelBtn.textContent = "Create Channel";
              document.body.appendChild(createChannelBtn);

              let createChannelDialog = document.querySelector(
                "create-channel-dialog",
              ) as HTMLElement;
              createChannelBtn.addEventListener("click", () => {
                if (!createChannelDialog) {
                  createChannelDialog = document.createElement("section");
                  createChannelDialog.innerHTML = `
                    <article id="create-channel-dialog">
                      <h3>Create a New Channel</h3>
                      <form>
                        <input type="text" id="channel-name" placeholder="Enter Channel Name" />
                        <button id="submit-channel-btn" type="button">Create Channel</button>
                        <p id="channel-error-message" style="color: red; display: none;">Please enter a channel name.</p>
                      </form>
                      <button id="close-dialog-btn" type="button">X</button>
                    </article>
                  `;
                  document.body.appendChild(createChannelDialog);

                  // Handle closing the "Create Channel" dialog
                  const closeChDialogButton = createChannelDialog.querySelector(
                    "#close-dialog-btn",
                  ) as HTMLElement;
                  closeChDialogButton.addEventListener("click", () => {
                    errorView.clearErrorDialog();
                    createChannelDialog.style.display = "none";
                    overlayBackdrop.classList.remove("active");
                    const channelErrorMessage =
                      createChannelDialog.querySelector(
                        "#channel-error-message",
                      ) as HTMLElement;
                    channelErrorMessage.style.display = "none";
                  });

                  // Handle submitting the "Create Channel" form
                  createChannelDialog
                    .querySelector("#submit-channel-btn")
                    ?.addEventListener("click", async () => {
                      // Clear previous errors
                      errorView.clearErrorDialog();

                      const channelNameInput =
                        createChannelDialog.querySelector(
                          "#channel-name",
                        ) as HTMLInputElement;
                      const channelName = channelNameInput.value;
                      const channelErrorMessage =
                        createChannelDialog.querySelector(
                          "#channel-error-message",
                        ) as HTMLElement;
                      const postView = document.querySelector(
                        "post-view",
                      ) as HTMLElement;
                      if (channelName) {
                        try {
                          // Attempt to create the channel using the adapter
                          await channelAdapter.createChannel(
                            currentWorkspacePath,
                            channelName,
                          );

                          // Refresh the channel view with the updated list of channels
                          const channelView = document.querySelector(
                            "channel-view",
                          ) as HTMLElement;
                          if (channelView) {
                            const channels =
                              await channelAdapter.fetchChannels(
                                currentWorkspacePath,
                              );
                            (channelView as any).loadChannels(
                              currentWorkspacePath,
                              channels || [],
                            );
                          }
                          // Hide the dialog and reset its state
                          createChannelDialog.style.display = "none";
                          overlayBackdrop.classList.remove("active");
                          channelErrorMessage.style.display = "none";

                          // Clear the post view
                          if (postView) {
                            postView.style.display = "none";
                            postView.innerHTML = "";
                          }

                          channelNameInput.value = "";
                        } catch (error: any) {
                          // Handle errors specific to channel creation
                          if (error.message === "document already exists") {
                            errorView.showError(
                              "This channel exists. Choose a new name and try again.",
                            );
                          } else {
                            errorView.showError(
                              "Failed to create channel. Please try again.",
                            );
                          }
                        }
                      } else {
                        errorView.showError(
                          "Please enter a name for the channel.",
                        );
                      }
                    });

                  // Add focus trapping logic
                  const focusableElements =
                    createChannelDialog.querySelectorAll<HTMLElement>(
                      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
                    );
                  const firstFocusableElement = focusableElements[0];
                  const lastFocusableElement =
                    focusableElements[focusableElements.length - 1];

                  createChannelDialog.addEventListener("keydown", (e) => {
                    if (e.key === "Tab") {
                      if (e.shiftKey) {
                        // Shift + Tab
                        if (document.activeElement === firstFocusableElement) {
                          e.preventDefault();
                          lastFocusableElement.focus();
                        }
                      } else {
                        // Tab
                        if (document.activeElement === lastFocusableElement) {
                          e.preventDefault();
                          firstFocusableElement.focus();
                        }
                      }
                    }
                  });

                  const channelNameInput = createChannelDialog.querySelector(
                    "#channel-name",
                  ) as HTMLInputElement;
                  const submitChannelBtn = createChannelDialog.querySelector(
                    "#submit-channel-btn",
                  ) as HTMLButtonElement;

                  channelNameInput.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      submitChannelBtn.click();
                    }
                  });
                  // Show the dialog and trap focus
                  createChannelDialog.style.display = "block";
                  overlayBackdrop.classList.add("active");
                  if (firstFocusableElement) {
                    firstFocusableElement.focus();
                  }

                  // Restore functionality after closing the dialog
                  createChannelDialog
                    .querySelector("#close-btn")
                    ?.addEventListener("click", () => {
                      createChannelDialog.style.display = "none";
                      overlayBackdrop.classList.remove("active");
                    });
                } else {
                  createChannelDialog.style.display = "block";
                }
                overlayBackdrop.classList.add("active");
              });
            }
            channelView.addEventListener("channel-deleted", async (event) => {
              const customEvent = event as CustomEvent;
              const deletedChannelPath = customEvent.detail.channelPath;

              const channels =
                await channelAdapter.fetchChannels(currentWorkspacePath);
              if (channels) {
                (channelView as any).loadChannels(
                  currentWorkspacePath,
                  channels,
                );
              }

              // Clear post view and reset current channel if it matches the deleted channel
              const postView = document.querySelector(
                "post-view",
              ) as HTMLElement;
              if (postView) {
                currentChannelPath = postView.getAttribute("channel-path");
                if (currentChannelPath === deletedChannelPath) {
                  console.log(
                    `Clearing post view for deleted channel: ${deletedChannelPath}`,
                  );
                  postView.style.display = "none";
                  postView.innerHTML = "";
                  postView.removeAttribute("channel-path");
                }
                if (
                  currentChannelPath &&
                  currentChannelPath === deletedChannelPath
                ) {
                  console.log(
                    `Unsubscribing from deleted channel: ${deletedChannelPath}`,
                  );
                  await channelAdapter.unsubscribeFromChannel(
                    currentChannelPath,
                  );
                  currentChannelPath = null;
                }
              }
            });

            // Handle `channel-selected` event
            channelView.addEventListener("channel-selected", async (event) => {
              const customEvent = event as CustomEvent;
              const channel = customEvent.detail;
              console.log(`Selected channel: ${channel.path}`);
              const postAdapter = new PostAdapter(model);

              // Unsubscribe from the currently active channel
              if (currentChannelPath) {
                console.log(
                  `Unsubscribing from previous channel: ${currentChannelPath}`,
                );
                channelAdapter.unsubscribeFromChannel(currentChannelPath);
              }

              // Retrieve or create the post view
              let postView = document.querySelector("post-view") as HTMLElement;
              if (!postView) {
                // If the post view does not exist, create a new one
                postView = new PostView(postAdapter);
                document.body.appendChild(postView);
              }

              postView.style.display = "block";
              postView.setAttribute("channel-path", channel.path);

              const posts = await postAdapter.fetchPosts(channel.path);
              if (posts) {
                console.log("Posts received:", posts);
                (postView as any).loadPosts(posts, channel.path.split("/")[3]);
              } else {
                // if no posts are fetched
                console.error("No posts were fetched");
                (postView as any).displayNoPostsMessage();
              }

              // Log the channel subscription activity
              console.log(
                `Subscribing to updates for channel: ${channel.path}`,
              );
              currentChannelPath = channel.path;
              console.log("current channel path", currentChannelPath);
              await channelAdapter.subscribeToChannel(channel.path);
            });

            // Listen for the "channel-created" event
            document.addEventListener("channel-created", async (event) => {
              const customEvent = event as CustomEvent;
              const workspacePath = customEvent.detail.workspacePath;
              const postView = document.querySelector(
                "post-view",
              ) as HTMLElement;

              // Clear and hide the post view when a new channel is created
              if (postView) {
                console.log(
                  "channel path related",
                  postView.getAttribute("channel-path"),
                );
                postView.style.display = "none";
                postView.innerHTML = "";
                postView.removeAttribute("channel-path");
              }
              // Reload channels
              const channels =
                await channelAdapter.fetchChannels(workspacePath);
              const channelView = document.querySelector(
                "channel-view",
              ) as HTMLElement;
              if (channels) {
                (channelView as any).loadChannels(workspacePath, channels);
              }
            });
          },
        );
      }
    });
  }
});
