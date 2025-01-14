// / <reference types="cypress" />
import { setupDatabase } from "./setup";

const host: string = Cypress.env("DATABASE_HOST");
const database: string = Cypress.env("DATABASE_PATH");

describe("Workspace Tests", () => {
  before(() => {
    // Setup the database once before all tests in this describe block.
    setupDatabase(host, database);
  });

  beforeEach(() => {
    cy.visit("/");
    cy.login("workspaceTester");
  });

  it ("should create a workspace", () => {
    cy.createWorkspace("NewWorkspace");
    cy.contains("NewWorkspace").should("exist");
  });

  it ("should create workspaces sequentially", () => {
    cy.createWorkspace("NewWS2");
    cy.get('workspace-view').scrollIntoView();
    cy.contains("NewWS2").should("exist");

    cy.createWorkspace("NewWS3");
    cy.get('workspace-view').scrollIntoView();
    cy.contains("NewWS3").should("exist");

    cy.createWorkspace("NewWS4");
    cy.get('workspace-view').scrollIntoView();
    cy.contains("NewWS4").should("exist");
  });

  it ("should not create a workspace with an empty name", () => {
    cy.get(".create-workspace-btn").click();
    cy.get("#create-workspace-dialog").within(() => {
      cy.get("#submit-workspace-btn").click(); 
    });
    cy.contains("Please enter the name for the workspace.").should("exist");
  });

  it ("should not create a workspace with a duplicate name", () => {
    cy.createWorkspace("NewWorkspace");
    cy.contains("This workspace exists. Choose a new name and try again.");
  });

  it("should open a workspace", () => {
    // Use the updated openWorkspace command
    cy.openWorkspace("NewWorkspace");
  
    // Verify that the channel view becomes visible with the title
    cy.get("channel-view").shadow().within(() => {
      cy.get("#channel-title").should("exist");
    });
  });

    it("should delete a workspace", () => {
      cy.deleteWorkspace("NewWS2");
      cy.contains("NewWS2").should("not.exist");
    });
});

