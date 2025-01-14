class ErrorView extends HTMLElement {
  private dialog: HTMLDivElement; // The container for the error dialog
  private errorMessageText: HTMLElement; // Element to display the error message text
  private closeButton: HTMLButtonElement; // Button to close the error dialog

  constructor() {
    super();
    // Attach Shadow DOM for encapsulated styling and structure
    this.attachShadow({ mode: "open" });

    // Define HTML structure and styles within the Shadow DOM
    this.shadowRoot!.innerHTML = `
              <style>
                  /* Dialog styling */
                  #error-dialog {
                      position: absolute;
                      top: 70px; /* Adjust as needed */
                      right: 50px; /* Adjust as needed */
                      padding: 10px 15px;
                      border: 1px solid #1A202C;
                      border-radius: 6px;
                      background: #FFF4C3;
                      color: #1A202C;
                      font-size: 1.1em;
                      font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
                      box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
                      z-index: 1000;
                      display: none; /* Initially hidden */
                      position: fixed; /* Ensure it floats */
                      opacity: 1; 
                      transition: opacity 0.3s ease, transform 0.3s ease; 
                  }

                  #error-dialog.hidden {
                      opacity: 0; 
                      transform: translateY(-10px); 
                  }
  
                  #error-message {
                      margin: 0;
                      padding-right: 10px;
                  }
  
                  #close-button {
                      position: absolute;
                      top: 2px;
                      right: 5px;
                      background: none;
                      border: none;
                      color: #4B4B4B;
                      font-size: 1em;
                      font-weight: bold;
                      cursor: pointer;
                      margin-left: 14px;
                  }

                  #close-button:focus {
                    outline: 2px solid #2F2F2F;
                  }
  
                  #close-button:hover {
                      color: #2F2F2F;
                  }
              </style>
  
              <section id="error-dialog">
                  <p id="error-message">An error occurred</p>
                  <button id="close-button">&times;</button>
              </section>
          `;

    // Select elements from Shadow DOM
    this.dialog = this.shadowRoot!.querySelector("#error-dialog")!;
    this.errorMessageText = this.shadowRoot!.querySelector("#error-message")!;
    this.closeButton = this.shadowRoot!.querySelector("#close-button")!;
  }

  connectedCallback() {
    // Add event listener to the close button to handle click events.
    // When the button is clicked, it will call the `clearErrorDialog` method to close the dialog.
    this.closeButton.addEventListener("click", () => this.clearErrorDialog());

    // Add event listener for keyboard interactions with the close button.
    // This allows users to press the Enter key to close the dialog, improving accessibility.
    this.closeButton.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.clearErrorDialog();
    });
  }

  /**
   * Displays the error message dialog with the provided message.
   * @param message The error message to display.
   */
  public showError(message: string) {
    this.errorMessageText.innerHTML = "";

    // Create the iconify-icon element
    const icon = document.createElement("iconify-icon");
    icon.setAttribute("icon", "material-symbols:error-outline");
    icon.setAttribute(
      "style",
      "margin-right: 4px; vertical-align: middle; width: 22px; height: 22px;",
    );
    icon.setAttribute("scale", "2");

    // Append the icon and the message text to the error message container
    this.errorMessageText.appendChild(icon);
    this.errorMessageText.appendChild(document.createTextNode(message));

    // Display the dialog with the updated message
    this.dialog.style.display = "block";
    this.dialog.classList.remove("hidden");
    this.dialog.focus();
  }

  /**
   * Clears the error dialog by hiding it and resetting its content.
   */
  clearErrorDialog() {
    this.dialog.classList.add("hidden");
    this.dialog.addEventListener(
      "transitionend",
      () => {
        this.dialog.style.display = "none";
        this.errorMessageText.textContent = "";
      },
      { once: true },
    );
  }
}

customElements.define("error-view", ErrorView);
export default ErrorView;
