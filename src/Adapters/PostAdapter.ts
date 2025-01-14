import Model from "../Model";
import { isPost } from "../Validators";
import { typedFetch } from "../Fetch";

// PostAdapter serves as an intermediary between PostModel and external APIs, handling posts data.
class PostAdapter {
  private model: Model;

  /**
   * Constructor initializes the PostAdapter with PostModel and LoginModel instances.
   * @param model - Instance of PostModel for managing post data.
   */
  constructor(model: Model) {
    this.model = model;
  }

  /**
   * Retrieves the LoginModel instance associated with the adapter.
   * @returns The LoginModel instance.
   */
  getModel(): Model {
    return this.model;
  }

  /**
   * Fetches posts for a specific channel from the backend.
   *
   * @param channelPath - The path of the channel to fetch posts from.
   * @returns A promise that resolves to an array of post objects if successful,
   *          or null if an error occurs.
   */
  async fetchPosts(channelPath: string): Promise<Array<{
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
  }> | null> {
    try {
      const token = this.model.getToken();
      const encodedPath = encodeURIComponent(channelPath.slice(1));
      const url = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${encodedPath}/posts/`;
      console.log("fetching posts");

      // Send a GET request to the backend to fetch posts
      const rawData = await typedFetch<
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
      >(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Fetched posts:", rawData);

      // Handle an empty array as a valid response
      if (Array.isArray(rawData) && rawData.length === 0) {
        console.log("No posts found.");
        return [];
      }

      // Validate non-empty response
      if (Array.isArray(rawData) && rawData.every(isPost)) {
        console.log("Validated posts data:", rawData);
        return rawData;
      } else {
        console.error("Validation failed for posts data:", rawData);
        return null;
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      return null;
    }
  }

  /**
   * Creates a new post within a specific channel.
   * @param channelPath - The path of the channel.
   * @param message - The content of the post.
   * @param parentPath - Optional parent post path (for threaded posts).
   * @returns The created post object or null if an error occurs.
   */
  async createPost(
    channelPath: string,
    message: string,
    parentPath: string | null = null,
  ): Promise<{
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
  } | null> {
    // Retrieve the user authentication token
    const token = this.model.getToken();
    // Retrieve the username or use a default value
    const username = this.model.getUsername() || "Unknown User";
    console.log(username);
    const postID = Math.random().toString(36).substring(2, 12);
    const encodedPath = encodeURIComponent(channelPath.slice(1));
    const url = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${encodedPath}/posts/${postID}`;

    // Prepare the request body with the post's content and metadata
    const postBody = {
      doc: { msg: message, parent: parentPath || undefined },
      meta: {
        createdAt: Date.now(),
        createdBy: username,
        lastModifiedAt: Date.now(),
        lastModifiedBy: username,
      },
    };

    try {
      // Send a PUT request to create the post
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          msg: postBody.doc.msg,
          parent: postBody.doc.parent,
        }),
      });

      const createdPost = await response.json();

      if (createdPost.uri) {
        // Fetch the full details of the created post
        const fullPost = await typedFetch<{
          path: string;
          doc: { msg: string; parent?: string };
          meta: {
            createdAt: bigint;
            createdBy: string;
            lastModifiedAt: bigint;
            lastModifiedBy: string;
          };
        }>(`${process.env.DATABASE_HOST}${createdPost.uri}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        return fullPost;
      }
      console.error("No URI returned in the response");
      return null;
    } catch (error) {
      console.error("Error creating post:", error);
      return null;
    }
  }

  /**
   * Updates reactions on a specific post.
   * @param postPath - The path of the post.
   * @param reactions - An object representing reactions to add.
   * @returns A boolean indicating whether the operation succeeded.
   */
  async updateReactions(
    postPath: string,
    reactions: { [reactionName: string]: string[] },
  ): Promise<boolean> {
    // Retrieve the user authentication token
    const token = this.model.getToken();
    const postPathSliced = encodeURIComponent(postPath.slice(1));
    const url = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${postPathSliced}`;

    // Prepare a series of patch operations to add reactions
    const patchOperations: Array<{
      op: string;
      path: string;
      value?: any;
    }> = [];

    const ReactionsObject = {
      op: "ObjectAdd",
      path: `/reactions`,
      value: {},
    };
    patchOperations.push(ReactionsObject);

    for (const [reaction, usernames] of Object.entries(reactions)) {
      const ReactionArray = {
        op: "ObjectAdd",
        path: `/reactions/${reaction}`,
        value: [],
      };
      patchOperations.push(ReactionArray);

      for (const username of usernames) {
        const UsernameArray = {
          op: "ArrayAdd",
          path: `/reactions/${reaction}`,
          value: username,
        };
        patchOperations.push(UsernameArray);
      }
    }

    try {
      // Send a PATCH request to update reactions
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patchOperations),
      });

      const responseBody = await response.json();
      if (response.ok) {
        console.log(`Reactions updated successfully for post: ${postPath}`);
        console.log("Response Body:", responseBody);
        return true;
      } else {
        console.error(`Failed to update reactions for post: ${postPath}`);
        console.error("Response Status:", response.status);
        console.error("Response Body:", responseBody);
        return false;
      }
    } catch (error) {
      console.error("Error updating reactions:", error);
      return false;
    }
  }

  /**
   * Deletes specific reactions from a post.
   * @param postPath - The path of the post.
   * @param reactions - An object representing reactions to delete.
   * @returns A boolean indicating whether the operation succeeded.
   */
  async deleteReactions(
    postPath: string,
    reactions: { [reactionName: string]: string[] },
  ): Promise<boolean> {
    const token = this.model.getToken();
    const postPathSliced = encodeURIComponent(postPath.slice(1));
    const url = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${postPathSliced}`;

    // Prepare a series of patch operations to remove reactions
    const patchOperations: Array<{
      op: string;
      path: string;
      value?: any;
    }> = [];

    // Create patch operations to remove usernames from the reaction arrays
    for (const [reaction, usernames] of Object.entries(reactions)) {
      for (const username of usernames) {
        const removeOperation = {
          op: "ArrayRemove",
          path: `/reactions/${reaction}`,
          value: username,
        };
        patchOperations.push(removeOperation);
      }
    }

    try {
      // Send a PATCH request to delete reactions
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patchOperations),
      });

      const responseBody = await response.json();
      if (response.ok) {
        console.log(`Reactions deleted successfully for post: ${postPath}`);
        console.log("Response Body:", responseBody);
        return true;
      } else {
        console.error(`Failed to delete reactions for post: ${postPath}`);
        console.error("Response Status:", response.status);
        console.error("Response Body:", responseBody);
        return false;
      }
    } catch (error) {
      console.error("Error deleting reactions:", error);
      return false;
    }
  }

  /**
   * Toggles the "starred" status of a post by sending a PATCH request to the database.
   * @param postPath - The path of the post to update.
   * @param isStarred - Boolean indicating whether to add or remove the "starred" status.
   * @returns A promise that resolves to a boolean indicating success or failure of the operation.
   */
  async toggleStar(postPath: string, isStarred: boolean): Promise<boolean> {
    // Retrieve the authentication token from the model.
    const token = this.model.getToken();

    // Encode the post path to ensure it's URL-safe.
    const postPathSliced = encodeURIComponent(postPath.slice(1));

    // Construct the full URL for the API request.
    const url = `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}${postPathSliced}`;

    // Initialize an array to store the patch operations to be sent in the request body.
    const patchOperations: Array<{
      op: string;
      path: string;
      value?: any;
    }> = [];

    // If the post is being starred, create patch operations to add "starred" metadata.
    if (isStarred) {
      // Add an empty "extensions" object if it doesn't exist.
      const ReactionsObject = {
        op: "ObjectAdd",
        path: `/extensions`,
        value: {},
      };
      patchOperations.push(ReactionsObject);

      // Add a "p2group61" array under "extensions" to hold reaction values.
      const ReactionsObject2 = {
        op: "ObjectAdd",
        path: `/extensions/p2group61`,
        value: [],
      };
      patchOperations.push(ReactionsObject2);

      // Add the "starred" value to the "p2group61" array.
      const ReactionArray = {
        op: "ArrayAdd",
        path: `/extensions/p2group61`,
        value: "starred",
      };
      patchOperations.push(ReactionArray);
    } else {
      // If the post is being unstarred, create a patch operation to remove "starred".
      const deleteOperation = {
        op: "ArrayRemove",
        path: `/extensions/p2group61`,
        value: "starred",
      };
      patchOperations.push(deleteOperation);
    }

    try {
      // Send the PATCH request to the database with the constructed operations.
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Include the authentication token.
        },
        body: JSON.stringify(patchOperations), // Serialize the patch operations as JSON.
      });

      // Parse the response body as JSON.
      const responseBody = await response.json();

      if (response.ok) {
        // Log success message and response if the request was successful.
        console.log(
          `Star status updated successfully (starred: ${isStarred}) for post: ${postPath}`,
        );
        console.log("Response Body:", responseBody);
        return true;
      } else {
        // Log error details if the request failed.
        console.error(`Failed to update star status for post: ${postPath}`);
        console.error("Response Status:", response.status);
        console.error("Response Body:", responseBody);
        return false;
      }
    } catch (error) {
      // Handle and log any errors that occur during the request.
      console.error("Error updating star status:", error);
      return false;
    }
  }
}

export default PostAdapter;
