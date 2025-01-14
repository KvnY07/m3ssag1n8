import Model from "./Model";

/**
 * Clears the token from the model and sends a request to log out the user.
 * @param model - Instance of the Model to manage authentication state.
 * @returns {Promise<boolean>} - Returns true if logout was successful, false otherwise.
 */
export async function proceedWithLogout(model: Model): Promise<boolean> {
  try {
    const token = model.getToken();
    const authUrl = `${process.env.DATABASE_HOST}${process.env.AUTH_PATH}`;

    // Send a DELETE request to the authentication endpoint with the token
    const response = await fetch(authUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      console.log("Logout successful");
      // Clear the token from the model after a successful logout
      model.clearToken();
      return true;
    } else {
      console.error("Logout failed:", response.status);
      return false;
    }
  } catch (error) {
    // Handle any errors that occur during the logout process
    console.error("Error during logout:", error);
    return false;
  }
}

/**
 * Initiates the logout process by showing a logout confirmation dialog.
 * @param model - Instance of the Model to manage authentication state.
 * @param loginDialog - The dialog element used for login/logout interactions.
 */
export function handleLogout(model: Model, loginDialog: HTMLElement) {
  showLogoutConfirmation(model, loginDialog);
}

/**
 * Displays a logout confirmation dialog with an overlay backdrop.
 * Creates the dialog and overlay if they don't already exist in the DOM.
 * @param model - Instance of the Model to manage authentication state.
 * @param loginDialog - The dialog element used for login/logout interactions.
 */
function showLogoutConfirmation(model: Model, loginDialog: HTMLElement) {
  let overlayBackdrop = document.getElementById(
    "overlay-backdrop",
  ) as HTMLElement;
  if (!overlayBackdrop) {
    overlayBackdrop = document.createElement("section");
    overlayBackdrop.id = "overlay-backdrop";
    document.body.appendChild(overlayBackdrop);
  }
  // Activate the overlay backdrop to display it
  overlayBackdrop.classList.add("active");

  let logoutConfirmationDialog = document.getElementById(
    "logout-confirmation-dialog",
  ) as HTMLElement;
  if (!logoutConfirmationDialog) {
    logoutConfirmationDialog = document.createElement("section");
    logoutConfirmationDialog.id = "logout-confirmation-dialog";
    logoutConfirmationDialog.setAttribute("role", "dialog");
    logoutConfirmationDialog.setAttribute(
      "aria-labelledby",
      "logout-dialog-title",
    );
    logoutConfirmationDialog.setAttribute(
      "aria-describedby",
      "logout-dialog-description",
    );

    // Add HTML content for the dialog
    logoutConfirmationDialog.innerHTML = `
            <article>
                <header>
                    <h2 id="logout-dialog-title">Log Out Confirmation</h2>
                </header>
                <p id="logout-dialog-description">Are you sure you want to log out?</p>
                <footer>
                    <button id="confirm-logout-btn">Yes</button>
                    <button id="cancel-logout-btn">No</button>
                </footer>
            </article>
            `;
    document.body.appendChild(logoutConfirmationDialog);
  }

  // Make the dialog visible
  logoutConfirmationDialog.style.display = "block";

  const confirmBtn = logoutConfirmationDialog.querySelector(
    "#confirm-logout-btn",
  ) as HTMLButtonElement;
  confirmBtn.onclick = async () => {
    // Hide the dialog and deactivate the overlay
    logoutConfirmationDialog.style.display = "none";
    overlayBackdrop.classList.remove("active");

    const success = await proceedWithLogout(model);
    // Reload the page if logout was successful, otherwise show an error message
    if (success) {
      window.location.reload();
    } else {
      alert("Logout failed. Please try again.");
    }
  };

  const cancelBtn = logoutConfirmationDialog.querySelector(
    "#cancel-logout-btn",
  ) as HTMLButtonElement;
  cancelBtn.onclick = () => {
    logoutConfirmationDialog.style.display = "none";
    overlayBackdrop.classList.remove("active");
  };
}
