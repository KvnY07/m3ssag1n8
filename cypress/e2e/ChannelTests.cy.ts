/// <reference types="cypress" />
import { setupDatabase } from "./setup";

const host: string = Cypress.env("DATABASE_HOST");
const database: string = Cypress.env("DATABASE_PATH");

describe("Channel Tests", () => {
  before(() => {
    setupDatabase(host, database);
    cy.login("testUser");
    cy.createWorkspace("TestWorkspace");
    cy.openWorkspace("TestWorkspace");
  });

  beforeEach(() => {
    cy.login("testUser");
    cy.openWorkspace("TestWorkspace");
  });

  it("should create a new channel", () => {
    const channelName = "General";
    cy.createChannel(channelName);

    // Verify that the channel appears in the list
    cy.get("channel-view").shadow().contains(".channel-item", channelName).should("exist");
  });

  it("should show an error when trying to create a channel with an empty name", () => {
    cy.get(".create-channel-btn").click();
    cy.get("#channel-name") .type("{enter}"); // Press enter without typing a name

    // Expect an error message
    cy.contains("Please enter a name for the channel").should("be.visible");

    // Close the dialog
    cy.get("#close-dialog-btn").click();
  });

  it("should not allow duplicate channel names", () => {
    const channelName = "DuplicateChannel";
    cy.createChannel(channelName);

    // Try creating the same channel again
    cy.createChannel(channelName);

    // Expect an error message for duplicate channel
    cy.contains("This channel exists. Choose a new name and try again.").should("be.visible");
  });

  it("should open an existing channel", () => {
    const channelName = "OpenTestChannel";
    cy.createChannel(channelName);
    cy.openChannel(channelName);
    // Ensure the channel is selected
    cy.get("channel-view")
      .shadow()
      .contains(".channel-item.selected-channel", channelName)
      .should("exist");
  });

  it("should delete an existing channel", () => {
    cy.openWorkspace("TestWorkspace");
    
    const channelName = "DeleteTestChannel";
    cy.createChannel(channelName);

    // Verify channel exists
    cy.get("channel-view").shadow().contains(".channel-item", channelName).should("exist");

    // Delete the channel
    cy.deleteChannel(channelName);

    cy.get("channel-view").shadow().contains(".channel-item", channelName).should("not.exist");
  });
  
});
