import { slog } from "./slog"; // Import our custom logging module, named slog

/**
 * Declare names and types of environment variables.
 */
declare const process: {
  env: {
    DATABASE_HOST: string; // Host of the database, e.g., "http://localhost"
    DATABASE_PATH: string; // Path to the specific database resource, e.g., "/api/v1/db"
    AUTH_PATH: string; // Path to the authentication service, e.g., "/auth/login"
  };
};

/**
 * Main entry point of the application.
 * This function will log information about the database being used when the application starts.
 */
function main(): void {
  // Use the slog.info function to log a message about the database in use.
  // The message includes the database host and path by combining `DATABASE_HOST` and `DATABASE_PATH`.
  slog.info("Using database", [
    "database",
    `${process.env.DATABASE_HOST}${process.env.DATABASE_PATH}`, // Concatenate host and path to form the full URL.
  ]);
}

/*
 * Register an event listener that runs after the HTML document is fully loaded.
 * `DOMContentLoaded` is a built-in browser event that fires once the HTML document has been completely loaded and parsed.
 * Once the document is ready, we call the `main` function to initialize the app.
 */
document.addEventListener("DOMContentLoaded", () => {
  main();
});
