import ErrorView from "./ErrorView";

// Define a custom HTML element for the login view
class LoginView extends HTMLElement {
  private dialog: HTMLDialogElement; // Reference to the dialog element
  private loginInput: HTMLInputElement; // Reference to the username input element
  private loginButton: HTMLButtonElement; // Reference to the login button
  private errorView: ErrorView; // Reference to error view for error messages

  constructor() {
    super();
    // Attach a Shadow DOM to the custom element for encapsulated styles and structure
    this.attachShadow({ mode: "open" });

    this.errorView = new ErrorView();
    document.body.appendChild(this.errorView);

    // Define the HTML structure and styles within the shadow DOM
    this.shadowRoot!.innerHTML = `
            <style>
                /* Styling for the login dialog */
                #login-dialog {
                    width: 300px;
                    padding: 20px;
                    border: none;
                    border-radius: 8px;
                    background: white;
                    top: 41%;
                    left: -1%;
                    height: 145px;
                    font-family:'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
                }

                #error-message { 
                    color: red; 
                    font-size: 0.9em; 
                    margin-top: 10px; 
                    display: none; 
                }    
                
                /* Styling for the title within the dialog */
                #login-title {
                    font-size: 1.5em;
                    color: black;
                    text-align: center;
                    margin-bottom: 15px;
                    margin-top: 5px;
                }

                /* Styling for the input field */
                #login-input {
                    width: 93%;
                    padding: 8px;
                    margin-bottom: 10px;
                    font-size: 16px;
                    font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
                }

                /* Styling for the login button */
                #login-button {
                    width: 100%;
                    padding: 10px;
                    font-size: 16px;
                    cursor: pointer;
                    color: white;
                    background-color: #5350b4;
                    border: none;
                    font-family:'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
                }

                #login-button:hover {
                  background-color: #312e88; 
                }
            </style>

            <!-- HTML structure for the dialog box -->
            <section id="backdrop">
                <dialog id="login-dialog" open>
                    <h2 id="login-title">Welcome to M3ssag1n8!</h2>
                    <input id="login-input" placeholder="Enter username" />
                    <button id="login-button">Login</button>
                    <p id="error-message">Please enter a username</p>
                </dialog>
            </section>
        `;

    // Select the dialog, input, and button elements from the shadow DOM
    this.dialog = this.shadowRoot!.querySelector("#login-dialog")!;
    this.loginInput = this.shadowRoot!.querySelector("#login-input")!;
    this.loginButton = this.shadowRoot!.querySelector("#login-button")!;
  }

  // Called when the element is added to the DOM
  connectedCallback() {
    // Add a click event listener to the login button to trigger login logic
    this.loginButton.addEventListener("click", () => this.handleLogin());
    this.loginInput.addEventListener("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.handleLogin();
      }
    });
  }

  /**
   * Handles the login attempt when the login button is clicked or "Enter" is pressed.
   */
  private async handleLogin() {
    const username = this.loginInput.value.trim(); // Get the trimmed username from the input
    if (!username) {
      // Check if the username is empty
      this.errorView.showError("Please enter a username.");
      return;
    }

    // Dispatch a custom event named 'login-attempt' with the username as event data
    const loginEvent = new CustomEvent("login-attempt", {
      detail: { username },
    });
    this.dispatchEvent(loginEvent); // Fire the event to notify listeners (like the adapter) of the login attempt
    this.errorView.clearErrorDialog();
  }

  /**
   * Closes the login dialog and removes the backdrop.
   */
  public closeDialog() {
    this.dialog.close(); // Close the dialog element
    const backdrop = this.shadowRoot!.getElementById("backdrop"); // Select the backdrop element
    if (backdrop) {
      backdrop.remove(); // Remove the backdrop from the DOM to hide the dialog completely
    }
  }
}

// Define the custom element in the DOM with the tag name 'login-view'
customElements.define("login-view", LoginView);
export default LoginView;
