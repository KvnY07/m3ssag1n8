import { fetchEventSource } from "@microsoft/fetch-event-source";
import Model from "../Model";
import { isChannels } from "../Validators";
import { typedFetch } from "../Fetch";

// Define the ChannelAdapter class, which serves as an intermediary between the view and model for channel data
class ChannelAdapter {
  private model: Model; // Private property to hold a reference to the ChannelModel instance
  private activeSubscriptions: Map<string, AbortController>; // Private property that maps channel name to abort controller

  // Constructor that accepts a ChannelModel instance, allowing the adapter to access model data and methods
  constructor(model: Model) {
    this.model = model;
    this.activeSubscriptions = new Map();
  }

  /**
   * Fetches a list of channels within a specified workspace from the backend.
   * @param workspacePath - The path of the workspace to fetch channels for
   * @returns A promise that resolves to an array of channel objects (each with a `path` property) or null if an error occurs
   */
  async fetchChannels(
    workspacePath: string,
  ): Promise<Array<{ path: string }> | null> {
    console.log("Entering fetchChannels with workspacePath:", workspacePath); // Log the workspace path for debugging
    try {
      // Retrieve the authentication token from the model to authorize the request
      const token = this.model.getToken();

      // Encode the workspace path for safe use in the URL, excluding the leading slash
      const encodedPath = encodeURIComponent(workspacePath.slice(1));
      const url = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${encodedPath}/channels/`;
      console.log("Fetching channels from URL: ", url);

      // Send a GET request to the backend to fetch channels within the specified workspace
      // Use typedFetch with the expected response type
      const rawData = await typedFetch<Array<{ path: string }>>(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Fetched channels:", rawData);

      // Validate data
      if (isChannels(rawData)) {
        console.log("Validated channels data:", rawData);
        return rawData;
      } else {
        console.error("Validation failed for channels data:", rawData);
        return null;
      }
    } catch (error) {
      // Catch and log any unexpected errors during the fetch operation
      console.error("Error loading channels:", error);
      throw error;
    }
  }

  /**
   * Creates a new channel in the specified workspace.
   * @param workspacePath - The path of the workspace
   * @param channelName - The name of the new channel to be created
   */
  async createChannel(
    workspacePath: string,
    channelName: string,
  ): Promise<void> {
    const token = this.model.getToken();
    const encodedPath = encodeURIComponent(workspacePath.slice(1));
    const channelPath = `${workspacePath}/channels/${channelName}`;
    try {
      // Unsubscribe from the channel if it already exists to prevent duplicate subscriptions
      this.unsubscribeFromChannel(channelPath);
      this.activeSubscriptions.delete(channelPath);

      // Construct the URL for creating a new channel
      const url = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${encodedPath}/channels/${channelName}?mode=nooverwrite`;
      console.log("URL in createChannel", url);

      // Send a PUT request to create the channel
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: channelName }),
      });

      if (response.ok) {
        console.log("Channel successfully created");
        document.dispatchEvent(
          new CustomEvent("channel-created", {
            detail: { workspacePath },
          }),
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData);
      }
    } catch (error: any) {
      console.error("Error creating channel:", error.message);
      throw new Error(error.message);
      return;
    }

    // Create a posts collection for the new channel
    try {
      const url = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${encodedPath}/channels/${channelName}/posts/`;
      console.log("URL in create posts collection", url);

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: channelName }),
      });

      if (response.ok) {
        console.log("Posts collection successfully created");
      } else {
        console.error("Unable to create posts collection", response.status);
      }
    } catch (error) {
      console.error("Error creating post collections:", error);
    }
  }

  /**
   * Subscribes to a channel's events using SSE (Server-Sent Events).
   * @param channelPath - The path of the channel to subscribe to
   */
  async subscribeToChannel(channelPath: string): Promise<void> {
    const token = this.model.getToken();

    // Unsubscribe from any existing subscriptions for the channel
    this.unsubscribeFromChannel(channelPath);
    this.activeSubscriptions.delete(channelPath);

    // Extract workspaceName and channelName from the channelPath
    const pathParts = channelPath.split("/");
    const workspaceName = pathParts[1];
    const channelName = pathParts[3];
    const encodedPath = encodeURIComponent(channelPath.slice(1));
    const subscribeUrl = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${encodedPath}/posts/?mode=subscribe`;

    console.log("Subscribe Request URL:", subscribeUrl);
    console.log("Extracted workspaceName:", workspaceName);
    console.log("Extracted channelName:", channelName);

    try {
      const abortController = new AbortController();
      this.activeSubscriptions.set(channelPath, abortController);

      // Use fetchEventSource to subscribe to server-sent events
      await fetchEventSource(subscribeUrl, {
        method: "GET",
        headers: {
          "Content-Type": "text/event-stream",
          // "Cache-Control": "no-cache",
          // "Connection": "keep-alive",
          Authorization: `Bearer ${token}`,
        },
        signal: abortController.signal,
        // Handle incoming messages
        onmessage(event: any) {
          console.log("Received event:", event);
          if (event.event !== "") {
            let eventData: any;
            try {
              eventData = JSON.parse(event.data);
            } catch (parseError) {
              console.error("Error parsing SSE event data:", parseError);
              return;
            }

            // Dispatch a custom event with relevant data
            const sseEvent = new CustomEvent("post-update", {
              detail: {
                workspace: workspaceName,
                channel: channelName,
                data: eventData,
              },
            });
            console.log("Dispatching post-update event", sseEvent);
            document.dispatchEvent(sseEvent);
          }
        },
        openWhenHidden: true,
        // Handle errors
        onerror(error: unknown) {
          console.error("Error during SSE:", error);
        },
      });
    } catch (error) {
      console.error("Error subscribing to channel:", error);
      this.unsubscribeFromChannel(channelPath);
    }
  }

  /**
   * Unsubscribes from a channel's events.
   * @param channelPath - The path of the channel to unsubscribe from
   */
  unsubscribeFromChannel(channelPath: string): void {
    const abortController = this.activeSubscriptions.get(channelPath);
    console.log("abort controller", abortController);

    if (abortController) {
      console.log(`Unsubscribing from channel: ${channelPath}`);
      abortController.abort();
      // Remove from active subscriptions
      this.activeSubscriptions.delete(channelPath);
    } else {
      console.log(`No active subscription found for channel: ${channelPath}`);
    }
  }

  /**
   * Deletes a channel by sending a DELETE request to the backend.
   * @param channelPath - The path of the channel to delete
   */
  async deleteChannel(channelPath: string): Promise<void> {
    try {
      const token = this.model.getToken();
      const encodedPath = encodeURIComponent(channelPath.slice(1));
      console.log("channel name", encodedPath);
      const url = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${encodedPath}`;
      console.log("DELETE URL in deleteChannel:", url);

      // Send a DELETE request to remove the channel
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log("Channel successfully deleted");
        // Unsubscribe from the channel
        this.unsubscribeFromChannel(channelPath);
        // Remove the subscription
        this.activeSubscriptions.delete(channelPath);
      } else {
        console.error("Unable to delete channel", response.status);
        alert(`Failed to delete channel. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
      alert("An error occurred while deleting the channel.");
    }
  }
}

export default ChannelAdapter;
