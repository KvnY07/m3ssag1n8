class StarView extends HTMLElement {
  private dialog: HTMLDivElement;
  private closeButton: HTMLButtonElement;
  private postContainer: HTMLDivElement;

  constructor() {
    super();
    // Attach a shadow DOM to encapsulate the component's styles and structure
    this.attachShadow({ mode: "open" });

    // Define the inner HTML and styles of the component
    this.shadowRoot!.innerHTML = `
        <style>
        /* Modal container styling */
        #star-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80%;
          max-width: 800px;
          background: rgb(227, 222, 243);
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
          z-index: 1001;
          padding: 20px;
          display: none; /* Initially hidden */
          font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
          color: #3b3b3b;
        }

        #star-modal.active {
          display: block; /* Show modal when active */
        }

        /* Overlay background */
        #overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: none;
        }

        #overlay.active {
          display: block;
        }

        /* Header styling */
        #modal-header {
          display: flex;
          justify-content: center; 
          align-items: center; 
          font-size: 1.5em;
          font-weight: bold;
          color: #3b3b3b;
          margin-bottom: 20px;
          font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
          position: relative;
        }

        /* Close button styling */
        #close-button {
          position: absolute; 
          right: 0; 
          top: 50%; 
          transform: translateY(-50%); 
          background: none;
          border: none;
          font-size: 0.6em;
          cursor: pointer;
          color: gray;
        }
  
        #close-button:hover {
          color: black;
        }

        /* Post container styling */
        #post-container {
          list-style: none;
          max-height: 60vh;
          overflow-y: auto;
          font-size: 1em;
        }

        .post-item {
          padding: 15px;
          margin-bottom: 15px;
          border: 1px solid #d3cfff;
          border-radius: 8px;
          background: white;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
          font-size: clamp(0.8em, 1vw, 1em);
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
        }

        .post-header strong {
          font-size: 1.1em;
        }

        .post-footer {
          margin-top: 10px;
          text-align: right;
          font-size: 0.9em;
          color: gray;
        }

        .reply-note {
          font-size: 0.9em;
          color: gray;
          font-style: italic;
          margin-top: 10px;
          font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
        }
      </style>

      <aside id="overlay"></aside> 
      <article id="star-modal">
       <header id="modal-header"> 
        <iconify-icon icon="line-md:star-alt-filled" style="vertical-align: middle; color: #ffcc00; font-size: 1.2em; margin-bottom: 3px;"></iconify-icon> 
        Starred Posts <iconify-icon icon="line-md:star-alt-filled" style="vertical-align: middle; color: #ffcc00; font-size: 1.2em; margin-bottom: 3px;"></iconify-icon> 
        <button id="close-button">X</button> 
       </header> 
       <section id="post-container"> 
       <!-- Starred posts will be dynamically added here --> 
       </section> 
      </article>
    `;

    // Get references to key elements for future manipulation
    this.dialog = this.shadowRoot!.querySelector("#star-modal")!;
    this.closeButton = this.shadowRoot!.querySelector("#close-button")!;
    this.postContainer = this.shadowRoot!.querySelector("#post-container")!;
  }

  connectedCallback() {
    // Add close button functionality
    this.closeButton.addEventListener("click", () => this.hide());

    // Add overlay click functionality
    const overlay = this.shadowRoot!.querySelector("#overlay")!;
    overlay.addEventListener("click", () => this.hide());
  }

  /**
   * Shows the modal and populates it with starred posts.
   * @param posts Array of posts to display.
   */
  public show(
    posts: Array<{
      msg: string;
      createdBy: string;
      createdAt: number;
      isReply: boolean;
    }>,
  ) {
    this.postContainer.innerHTML = ""; // Clear previous content

    // Display a message if there are no posts
    if (posts.length === 0) {
      const message = document.createElement("p");
      message.textContent = "No starred posts available.";
      message.style.textAlign = "center";
      message.style.color = "gray";
      this.postContainer.appendChild(message);
    } else {
      // Sort posts by creation date and add them to the modal
      posts.sort((a, b) => a.createdAt - b.createdAt);
      posts.forEach((post) => {
        const li = document.createElement("li");
        li.classList.add("post-item");
        li.style.padding = "10px";
        li.style.marginBottom = "10px";
        li.style.border = "1px solid #ccc";
        li.style.borderRadius = "4px";

        // Post content
        const content = document.createElement("article");
        content.innerHTML = `
              <p>
                <strong>${post.createdBy}</strong>
                <strong style="color: gray; margin-left: 10px;">
                  ${new Date(post.createdAt).toLocaleString()}
                </strong>
              </p>
              <p>${post.msg}</p>
            `;

        li.appendChild(content);

        // Add "This is a reply" note if the post is a reply
        if (post.isReply) {
          const divider = document.createElement("hr");
          divider.style.border = "none";
          divider.style.borderTop = "1px dashed #ccc";
          divider.style.marginBottom = "1px";
          divider.style.margin = "5px 0";

          const replyNote = document.createElement("p");
          replyNote.textContent = "This post is a reply";
          replyNote.style.fontSize = "0.9em";
          replyNote.style.color = "gray";
          replyNote.style.fontStyle = "italic";
          replyNote.style.marginTop = "1px";

          li.appendChild(divider);
          li.appendChild(replyNote);
        }
        this.postContainer.appendChild(li);
      });
    }

    this.dialog.classList.add("active");
    const overlay = this.shadowRoot!.querySelector("#overlay")!;
    overlay.classList.add("active");
  }

  /**
   * Hides the modal.
   */
  public hide() {
    this.dialog.classList.remove("active");
    const overlay = this.shadowRoot!.querySelector("#overlay")!;
    overlay.classList.remove("active");
  }
}

customElements.define("star-view", StarView);

export default StarView;
