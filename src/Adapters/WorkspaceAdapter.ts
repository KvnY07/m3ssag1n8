import { typedFetch } from "../Fetch";
import ChannelAdapter from "./ChannelAdapter";
import Model from "../Model";
import { isWorkspaces } from "../Validators";

// Define the WorkspaceAdapter class, which serves as an intermediary between the view and the model
class WorkspaceAdapter {
  private model: Model; // Private property to hold a reference to the WorkspaceModel instance

  // Constructor that accepts a WorkspaceModel instance, allowing the adapter to access model data and methods
  constructor(model: Model) {
    this.model = model;
  }

  /**
   * Fetches a list of workspaces from the backend.
   * @returns A promise that resolves to an array of workspace objects (each with a `path` property) or null if an error occurs
   */
  async fetchWorkspaces(): Promise<Array<{ path: string }> | null> {
    try {
      // Retrieve the authentication token from the model to authorize the request
      const token = this.model.getToken();

      // Send a GET request to the backend to fetch workspaces
      const rawData = await typedFetch<Array<{ path: string }>>(
        `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Validate data
      if (isWorkspaces(rawData)) {
        console.log("Validated workspaces data:", rawData);
        return rawData;
      } else {
        console.error("Validation failed for workspaces data:", rawData);
        return null;
      }
    } catch (error) {
      // Catch and log any unexpected errors during the fetch operation
      console.error("Error loading workspaces:", error);
      return null; // Return null to indicate an error occurred
    }
  }

  /**
   * Creates a new workspace in the backend.
   * @param workspaceName - The name of the workspace to be created.
   */
  async createWorkspace(workspaceName: string): Promise<void> {
    const token = this.model.getToken();
    const path = `${process.env.DATABASE_PATH}`;
    const parsedPath = path.replace(/\/$/, "");

    try {
      // Retrieve the authentication token from the model to authorize the request
      const url = `${process.env.DATABASE_HOST}${parsedPath}/${workspaceName}?mode=nooverwrite`;

      console.log("Creating workspace with URL:", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: workspaceName }),
      });

      console.log("Response after mode=nooverwrite", response);

      if (response.ok) {
        console.log("Workspace successfully created");
        // Dispatch a custom event to update the WorkspaceView
        const workspaceView = document.querySelector("workspace-view");
        if (workspaceView) {
          workspaceView.dispatchEvent(new Event("workspace-created"));
        } else {
          console.error("Unable to create workspace", response.status);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData);
      }
    } catch (error: any) {
      console.error("Error creating workspace:", error.message);
      throw new Error(error.message);
      return;
    }

    try {
      const url = `${process.env.DATABASE_HOST}${parsedPath}/${workspaceName}/channels/`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: workspaceName }),
      });

      if (response.ok) {
        console.log("Channels collection successfully created");
      } else {
        console.error("Unable to create channels collection", response.status);
      }
    } catch (error) {
      console.error("Error creating channels collection:", error);
    }
  }

  /**
   * Deletes a workspace from the backend, along with its associated channels.
   * @param workspacePath - The path of the workspace to be deleted.
   */
  async deleteWorkspace(workspacePath: string): Promise<void> {
    try {
      const token = this.model.getToken();
      const encodedPath = encodeURIComponent(workspacePath.slice(1));
      // Fetch associated channels before deleting the workspace
      const channelAdapter = new ChannelAdapter(this.model);
      const channels = await channelAdapter.fetchChannels(workspacePath);
      if (channels) {
        for (const channel of channels) {
          await channelAdapter.deleteChannel(channel.path);
        }
      }
      // Delete the workspace
      const url = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${encodedPath}`;
      console.log("URL", url);
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log("Workspace successfully deleted");
      } else {
        console.error("Failed to delete workspace", response.status);
        alert("Failed to delete workspace. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting workspace:", error);
      alert("An error occurred while deleting the workspace.");
    }
  }
}

export default WorkspaceAdapter;
