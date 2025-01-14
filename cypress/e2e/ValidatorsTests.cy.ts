/// <reference types="cypress" />

import { isWorkspaces, isChannels, isPost } from "../../src/Validators";

describe("Validators Tests - Workspaces and Channels", () => {
  context("Workspaces Validation", () => {
    it("should validate a valid Workspaces object", () => {
      const validWorkspaces = [
        {
          doc: {},
          meta: {
            createdAt: 1633036800,
            createdBy: "user123",
            lastModifiedAt: 1633123200,
            lastModifiedBy: "user456",
          },
          path: "/workspaces/general",
        },
      ];

      cy.wrap(isWorkspaces(validWorkspaces)).should("eq", true);
    });

    it("should invalidate an invalid Workspaces object", () => {
      const invalidWorkspaces = [
        {
          meta: {
            createdAt: 1633036800,
            createdBy: "user123",
            lastModifiedAt: 1633123200,
            lastModifiedBy: "user456",
          },
          path: "/workspaces/general",
        },
      ];

      cy.wrap(isWorkspaces(invalidWorkspaces)).should("eq", false);
    });
  });

  context("Channels Validation", () => {
    it("should validate a valid Channels array", () => {
      const validChannels = [
        {
          doc: {},
          meta: {
            createdAt: 1633036800,
            createdBy: "user123",
            lastModifiedAt: 1633123200,
            lastModifiedBy: "user456",
          },
          path: "/channels/general",
        },
      ];

      cy.wrap(isChannels(validChannels)).should("eq", true);
    });

    it("should invalidate an invalid Channels object", () => {
      const invalidChannels = [
        {
          doc: {},
          meta: {
            createdAt: -10, // Invalid timestamp
            createdBy: "user123",
            lastModifiedAt: 1633123200,
            lastModifiedBy: "user456",
          },
          path: "/channels/general",
        },
      ];

      cy.wrap(isChannels(invalidChannels)).should("eq", false);
    });
  });

});

// Tests for validating PostSchema using the isPost function from Validators
describe("Validators Tests - Post Validation", () => {
  context("Valid Post Objects", () => {
    it("should validate a valid Post object", () => {
      const validPost = {
        doc: {
          msg: "Hello, World!",
          parent: "parent123",
          reactions: {
            ":like:": ["user123"],
          },
          extensions: {},
        },
        meta: {
          createdAt: 1633036800,
          createdBy: "user123",
          lastModifiedAt: 1633123200,
          lastModifiedBy: "user456",
        },
        path: "/posts/general",
      };

      cy.wrap(isPost(validPost)).should("eq", true);
    });
  });

  context("Invalid Post Objects", () => {
    it("should invalidate a Post object with missing required properties", () => {
      const invalidPost = {
        doc: {
          parent: "parent123", 
          reactions: {
            ":like:": ["user123"],
          },
        },
        meta: {
          createdAt: 1633036800,
          createdBy: "user123",
          lastModifiedAt: 1633123200,
          lastModifiedBy: "user456",
        },
        path: "/posts/general",
      };

      cy.wrap(isPost(invalidPost)).should("eq", false);
    });

    it("should invalidate a Post object with additional properties", () => {
      const invalidPost = {
        doc: {
          msg: "Hello, World!",
          parent: "parent123",
          reactions: {},
          extensions: {},
          extraField: "Not allowed", 
        },
        meta: {
          createdAt: 1633036800,
          createdBy: "user123",
          lastModifiedAt: 1633123200,
          lastModifiedBy: "user456",
        },
        path: "/posts/general",
      };

      cy.wrap(isPost(invalidPost)).should("eq", false);
    });

    it("should invalidate a Post object with invalid nested properties", () => {
      const invalidPost = {
        doc: {
          msg: "Hello, World!",
          parent: "parent123",
          reactions: {
            ":like:": [123], 
          },
          extensions: {},
        },
        meta: {
          createdAt: 1633036800,
          createdBy: "user123",
          lastModifiedAt: 1633123200,
          lastModifiedBy: "user456",
        },
        path: "/posts/general",
      };

      cy.wrap(isPost(invalidPost)).should("eq", false);
    });
  });
});

