/// <reference types="cypress" />
import { setupDatabase } from "./setup";

const host: string = Cypress.env("DATABASE_HOST");
const database: string = Cypress.env("DATABASE_PATH");

describe("Post Tests", () => {
    before(() => {
      setupDatabase(host, database);
      cy.login("testUser");
      cy.createWorkspace("PostWorkspace");
      cy.openWorkspace("PostWorkspace");
      cy.createChannel("PostChannel");
      cy.openChannel("PostChannel");
    });
  
    beforeEach(() => {
      // Log in and navigate to the test workspace and channel before each test
      cy.login("testUser");
      cy.openWorkspace("PostWorkspace");
      cy.openChannel("PostChannel");
    });
  
    it("should create a new post", () => {
      const postText = "This is a new post";
      cy.createPost(postText);
      cy.get("post-view").shadow().contains(".post-item", postText).should("exist");
    });
  
    it("should retrieve a post by text", () => {
      cy.getPost("This is a new post").should("exist").and("contain.text", "This is a new post");
    });
  
    it("should reply to a post", () => {
      cy.getPost("This is a new post").replyToPost("This is a reply");

      // Confirm that the reply is visible
      cy.contains("This is a reply").should("exist");
    });
    
    it("should react to a post", () => {
      cy.getPost("This is a new post").reactToPost(":smile:");

      // Confirm that a reaction count of 1 is visible
      cy.contains("1").should("exist");
    });

    it("should remove reaction to a post", () => {
      cy.getPost("This is a new post").reactToPost(":smile:");

      // Confirm that a reaction count of 0 is visible
      cy.contains("0").should("exist");
    });
      
  
    it("should handle empty posts gracefully", () => {
      cy.wait(2000);
      // Attempt to create an empty post
      cy.get("post-view").shadow().within(() => {
        cy.get("#message-input").should("not.be.disabled").type("{enter}");
      });
  
      // Verify an error message appears
      cy.contains("Please type a message before sending.").should("be.visible");
    });

    // it("should star a post", () => {
    //   const postText = "This is a new post";
    
    //   cy.get("post-view").shadow().contains(".post-item", postText).within(() => {
    //     cy.get("iconify-icon[aria-label='Toggle Star']")
    //       .first()
    //       .as("starIcon")
    //       .should("have.attr", "icon", "mdi:star-outline")
    //       .click();
    //   });

    //   cy.wait(2000);
    
    //   cy.get("post-view").shadow().contains(".post-item", postText).within(() => {
    //     cy.get("@starIcon").should("have.attr", "icon", "mdi:star");
    //   });
    // });

    // it("should filter starred posts", () => {
    //   // Click the "Show Starred Posts" button
    //   cy.get("post-view").shadow().find("#filter-starred-button").click();
  
    //   // Verify only the starred post is visible
    //   cy.get("post-view").shadow().contains(".post-item", "This is a new post").should("exist");
    // });

    // it("should unstar a post", () => {
    //   const postText = "This is a new post";
    
    //   cy.get("post-view").shadow().contains(".post-item", postText).within(() => {
    //     cy.get("iconify-icon[aria-label='Toggle Star']")
    //       .first()
    //       .as("starIcon")
    //       .should("have.attr", "icon", "mdi:star")
    //       .click();
    //   });

    //   cy.wait(2000);
    
    //   cy.get("post-view").shadow().contains(".post-item", postText).within(() => {
    //     cy.get("@starIcon").should("have.attr", "icon", "mdi:star-outline");
    //   });
    // });
  });
  