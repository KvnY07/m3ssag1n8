import Model from "../Model";
import { typedFetch } from "../Fetch";

class LoginAdapter {
  private model: Model; // Private property to hold a reference to the LoginModel instance

  // Constructor accepts a LoginModel instance, allowing the adapter to access and modify the model's data
  constructor(model: Model) {
    this.model = model;
  }

  /**
   * Authenticates the user by sending a POST request with the username to the backend.
   * If authentication is successful, it saves the token and username in the model.
   * @param username - The username to authenticate
   * @returns A promise that resolves to true if authentication is successful, false otherwise
   */
  async authenticate(username: string): Promise<boolean> {
    try {
      // Send a POST request to the authentication endpoint with the username as JSON data
      const data = await typedFetch<{ token: string }>(
        `${process.env.DATABASE_HOST}${process.env.AUTH_PATH}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        },
      );

      // Extract the token from the response and save credentials in the model
      const token = data.token;
      this.model.saveCredentials(token, username);
      return true;
    } catch (error) {
      // Handle any unexpected errors, such as network issues
      alert("An unexpected error occurred during login");
      return false; // Return false to indicate unsuccessful login due to an error
    }
  }
}

export default LoginAdapter;
