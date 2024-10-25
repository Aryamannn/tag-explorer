let dragged;
const activePairs = new Map();

document.addEventListener("DOMContentLoaded", () => {
  const draggables = document.querySelectorAll(".draggable, .nav-link"); // Include parent tags
  const dropzone = document.getElementById("dropzone");

  // Make draggables functional
  draggables.forEach(draggable => {
    draggable.addEventListener("dragstart", (event) => {
      dragged = event.target;
      event.target.classList.add("dragging");
    });

    draggable.addEventListener("dragend", (event) => {
      event.target.classList.remove("dragging");
    });
  });

  // Allow drop on the dropzone
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault(); // Allow drop
  });

  dropzone.addEventListener("dragenter", (event) => {
    event.target.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", (event) => {
    event.target.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    event.target.classList.remove("dragover");

    if (dragged) {
      const draggedText = dragged.textContent.trim();
      const tagName = dragged.getAttribute('data-tag-name');

      // Check for existing tags in the dropzone
      const existingTags = Array.from(dropzone.getElementsByClassName("tag-badge"));
      const tagExists = existingTags.some(tag => tag.id === draggedText);

      if (!tagExists) {
        const newTag = createTag(draggedText, tagName);
        dropzone.querySelector('.tag-container').appendChild(newTag);
        updateActivePairs(newTag.id, tagName);
      } else {
        alert("This tag is already added!");
      }
    }
  });
});

// Function to create a new tag
function createTag(draggedText, tagName) {
  const newTag = document.createElement("span");
  newTag.className = "tag-badge";
  newTag.id = draggedText;
  newTag.textContent = draggedText;

  const closeBtn = document.createElement("span");
  closeBtn.className = "close-btn";
  closeBtn.textContent = "×";
  closeBtn.onclick = () => {
    newTag.remove();
    activePairs.delete(draggedText); // Remove from activePairs on deletion
  };

  newTag.appendChild(closeBtn);
  return newTag;
}

// Function to update active pairs
function updateActivePairs(tagId, tagName) {
  activePairs.set(tagId, tagName);
  console.log(Array.from(activePairs.entries()));
}
