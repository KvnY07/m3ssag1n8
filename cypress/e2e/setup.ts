/// <reference types="cypress" />

export function setupDatabase(host: string, database: string): void {
    // Remove the trailing slash.
    const dburl = host + database.slice(0, -1);

    // Delete entire database in case it was modified in previous tests.
    // Allow this to fail, as the database might not exist yet.
    cy.request({
      method: "DELETE",
      url: dburl,
      headers: {
        Authorization: `Bearer user1token`,
      },
      failOnStatusCode: false,
    });
  
    cy.request({
      method: "PUT",
      url: dburl,
      headers: {
        Authorization: `Bearer user1token`,
      },
    });

    cy.request({
      method: "PUT",
      url: `${dburl}/COMP 318`,
      headers: {
        Authorization: "Bearer user1token",
      },
      body: {},
    });

    cy.request({
      method: "PUT",
      url: `${dburl}/Messaging`,
      headers: {
        Authorization: "Bearer user1token",
      },
      body: {},
    });

    cy.request({
      method: "PUT",
      url: `${dburl}/Messaging/channels/`,
      headers: {
        Authorization: "Bearer user1token",
      },
    });

    

    cy.request({
      method: "PUT",
      url: `${dburl}/COMP 318/channels/`,
      headers: {
        Authorization: "Bearer user1token",
      },
    });
  
    cy.request({
      method: "PUT",
      url: `${dburl}/COMP 318/channels/Project 1`,
      headers: {
        Authorization: "Bearer user1token",
      },
      body: {},
    });

    cy.request({
      method: "PUT",
      url: `${dburl}/COMP 318/channels/Project 1/posts/`,
      headers: {
        Authorization: "Bearer user1token",
      },
      body: {},
    });
  
    cy.request({
      method: "POST",
      url: `${dburl}/COMP 318/channels/Project 1/posts/`,
      headers: {
        Authorization: "Bearer user1token",
      },
      body: {
        msg: "This post should appear first",
      },
    });

    cy.request({
      method: "PUT",
      url: `${dburl}/COMP 318/channels/Project 2`,
      headers: {
        Authorization: "Bearer user1token",
      },
      body: {},
    });

    cy.request({
      method: "PUT",
      url: `${dburl}/COMP 318/channels/Project 2/posts/`,
      headers: {
        Authorization: "Bearer user1token",
      },
      body: {},
    });

    cy.request({
      method: "PUT",
      url: `${dburl}/COMP 318/channels/Tutorials`,
      headers: {
        Authorization: "Bearer user1token",
      },
      body: {},
    });
  
    cy.request({
      method: "PUT",
      url: `${dburl}/COMP 318/channels/Tutorials/posts/`,
      headers: {
        Authorization: "Bearer user1token",
      },
      body: {},
    });
  
    cy.request({
      method: "POST",
      url: `${dburl}/COMP 318/channels/Tutorials/posts/`,
      headers: {
        Authorization: "Bearer user1token",
      },
      body: {
        msg: "No response?",
      },
    });
  
  }