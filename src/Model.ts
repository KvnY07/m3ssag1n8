class Model {
  /**
   * Saves the authentication token and username to the browser's sessionStorage.
   * @param token - The authentication token to be saved.
   * @param username - The username associated with the authentication token.
   */
  saveCredentials(token: string, username: string) {
    sessionStorage.setItem("authToken", token); // Store the token in sessionStorage
    sessionStorage.setItem("username", username); // Store the username in sessionStorage
  }

  /**
   * Retrieves the username from sessionStorage.
   * @returns The stored username if it exists, or null if not found.
   */
  getUsername(): string | null {
    return sessionStorage.getItem("username"); // Return the username from sessionStorage
  }

  /**
   * Retrieves the authentication token from sessionStorage.
   * @returns The stored token if it exists, or null if not found.
   */
  getToken(): string | null {
    return sessionStorage.getItem("authToken"); // Return the token from sessionStorage
  }

  /**
   * Clears the authentication token and username from sessionStorage.
   * Useful for logging out the user or resetting credentials.
   */
  clearToken(): void {
    sessionStorage.removeItem("authToken"); // Remove the token from sessionStorage
    sessionStorage.removeItem("username"); // Remove the username from sessionStorage
  }
}

export default Model;
