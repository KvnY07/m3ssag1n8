/// <reference types="cypress" />
import { setupDatabase } from "./setup";

const host: string = Cypress.env("DATABASE_HOST");
const database: string = Cypress.env("DATABASE_PATH");

describe("Login and Logout Tests", () => {
  before(() => {
    // Setup the database once before all tests in this describe block.
    setupDatabase(host, database);
  });

  beforeEach(() => {
    cy.visit("/");
  });

  describe("Login Tests", () => {
    it("should login with a valid username", () => {
      // Intercept login request
      cy.intercept(
        "POST",
        `${Cypress.env("DATABASE_HOST")}${Cypress.env("AUTH_PATH")}`
      ).as("login");

      // Perform login
      cy.login("valid_user");

      // Wait for login request to complete and verify it was sent with the correct payload
      cy.wait("@login").its("request.body.username").should("eq", "valid_user");

      // Verify that the username appears on the page (excluding the input field)
      cy.contains(":not(input)", "valid_user").should("exist");
    });

    it("should not login with an empty username", () => {
      // Attempt to login without entering a username
      cy.get("login-view").shadow().within(() => {
        cy.get("#login-input").clear();
        cy.get("#login-button").click();
      });

      // Verify that an error message is displayed
      cy.contains("Please enter a username.").should("exist");
    });

    it("should allow the user to log in by pressing 'Enter'", () => {
      const username = "valid_user";
  
      // Simulate entering a username
      cy.get("login-view")
        .shadow()
        .find("#login-input")
        .type(username)
        .type("{enter}");
      
        cy.contains(username).should("exist");
    });
  
  });


  describe("Logout Tests", () => {
    beforeEach(() => {
      cy.login("logout_test_user");
      cy.contains(":not(input)", "logout_test_user").should("exist");
    });

    it("should logout successfully", () => {
      // Intercept logout request
      cy.intercept(
        "DELETE",
        `${Cypress.env("DATABASE_HOST")}${Cypress.env("AUTH_PATH")}`
      ).as("logout");

      // Perform logout
      cy.logout();

      // Verify the user is logged out and their username is no longer displayed
      cy.contains("logout_test_user").should("not.exist");

      // Confirm correct logout request was sent
      cy.wait("@logout").its("response.statusCode").should("eq", 204);
    });
  });
});
