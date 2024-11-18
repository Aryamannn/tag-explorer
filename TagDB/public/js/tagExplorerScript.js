let dragged;
const safePairs = new Map();
const parentTags = new Map();
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
      const tagId = dragged.getAttribute('data-tag-id');
      const valueId = dragged.getAttribute('data-subtag-id');
      



      // Check for existing tags in the dropzone
      const existingTags = Array.from(dropzone.getElementsByClassName("tag-badge"));
      const tagExists = existingTags.some(tag => tag.id === draggedText);

      if (!tagExists) {
        const newTag = createTag(draggedText, tagName);
        dropzone.querySelector('.tag-container').appendChild(newTag);
        updatesafePairs(newTag.id, tagName, draggedText, valueId, tagId);
        handleQuery();
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
  if (!(draggedText == tagName)){
    newTag.textContent = tagName + ": " + draggedText;
  } else{
    newTag.textContent = draggedText;
  }


  const closeBtn = document.createElement("span");
  closeBtn.className = "close-btn";
  closeBtn.textContent = "×";
  closeBtn.onclick = () => {
    newTag.remove();
    safePairs.delete(draggedText); // Remove from safePairs on deletion
    parentTags.delete(draggedText);
    activePairs.delete(draggedText);
    handleQuery();
  };

  newTag.appendChild(closeBtn);
  return newTag;
}

// Function to update active pairs
function updatesafePairs(tagId, tagName, draggedText, valueId, parentId) {
  if(draggedText == tagName){
    console.log('dupe added');
    parentTags.set(tagName, parentId);
  } else {
    safePairs.set(tagId, tagName);
    activePairs.set(draggedText, valueId)
  }
  // console.log(Array.from(activePairs.entries()));
  // console.log(Array.from(parentTags.entries()));

}

const handleQuery = async () => {
// Create list of selected tag/value pairs for the query from map
const tagValuePairs = Array.from(safePairs.entries()).map(([tagId, tagName]) => {
  return { tag_name: tagName, tag_value: tagId }; // Adjust based on your desired structure
});
const parentTagPairs = Array.from(parentTags.entries()).map(([tagName, type]) => {
  return { tag_name: tagName, tag_value: type }; // Adjust based on your desired structure
});

// console.log(tagValuePairs);
// console.log(parentTagPairs);

// If no values are selected, do not perform the query
if (tagValuePairs.length === 0 && parentTagPairs.length === 0) {
  console.log('No tags selected for query.');
  try {
    const response = await fetch('http://localhost:3000/allFiles', { // Update to your correct API endpoint
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    setQueryResults(data);  // Call setQueryResults with the fetched data
    console.log("helllppp");
    // console.log(data);
  } catch (error) {
    console.error('Error querying files', error);
  }
    
} else if (tagValuePairs.length > 0){
  try {
  const response = await fetch('http://localhost:3000/files/tags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tagValuePairs })
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  setQueryResults(data);  // You need to define how to handle the results
  // console.log(data);
  console.log("hellooo");
} catch (error) {
  console.error('Error querying files', error);
}} else if(parentTagPairs.length > 0 && tagValuePairs.length === 0){
  // console.log("Parent tags " + JSON.stringify( Array.from(parentTags.entries()).map(subArray => subArray[1]) ));
  try {
    const response = await fetch('http://localhost:3000/files/searchByTagId', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tagIds: Array.from(parentTags.entries()).map(subArray => subArray[1]), // Example tag_ids // Example value_ids
        })
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    // console.log('Files found:', data); // Process the data as needed
    setQueryResults(data);
} catch (error) {
    console.error('Error searching for files:', error);
}

} else {
  try {
    const response = await fetch('http://localhost:3000/files/combineTags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tagIds: Array.from(parentTags.entries()).map(subArray => subArray[1]), // Example tag_ids
        valueIds: Array.from(activePairs.entries()).map(subArray => subArray[1]), // Example value_ids
      }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    // console.log('Response data:', data); // Log the entire response

    if (Array.isArray(data)) {
      const fileIds = data.map(item => item.file_id);
      // console.log(fileIds); // Now this should print
    } else {
      console.error('Unexpected response format:', data);
    }
  } catch (error) {
    console.error('Error querying files', error);
  }
}

// const response = await fetch('http://localhost:3000/files/combineTags', {
//   method: 'POST',
//   headers: {
//       'Content-Type': 'application/json',
//   },
//   body: JSON.stringify({
//       tagIds: [1, 2, 3], // Example tag_ids
//       valueIds: [4, 5],  // Example value_ids
//   }),
// });

// const data = await response.json();
// console.log(data); // Process the response data

};


// Function to set the "results" DIV with the filtered files
function setQueryResults(data) {
  const resultsContainer = document.getElementById('results');

  // Clear previous results except the header
  const existingResults = resultsContainer.querySelectorAll('.file-item');
  existingResults.forEach(result => result.remove());

  // Populate the results container with new data
  data.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item row';

    // Creating columns for file information
    const fileNameCol = document.createElement('div');
    fileNameCol.className = 'col-4';
    fileNameCol.textContent = file.file_path.split('/').pop();

    const dateModifiedCol = document.createElement('div');
    dateModifiedCol.className = 'col-3';
    dateModifiedCol.textContent = file.date_modified || 'N/A';

    const typeCol = document.createElement('div');
    typeCol.className = 'col-3';
    typeCol.textContent = getFileType(file.file_path); 

    const sizeCol = document.createElement('div');
    sizeCol.className = 'col-2';
    sizeCol.textContent = file.size || "0 KB"; 


    
    fileItem.appendChild(fileNameCol);
    fileItem.appendChild(dateModifiedCol);
    fileItem.appendChild(typeCol);
    fileItem.appendChild(sizeCol);

    
    resultsContainer.appendChild(fileItem);
  });
}

function getFileType(filePath) {
  const extension = filePath.split('.').pop().toLowerCase();
  switch (extension) {
      case 'pdf':
          return 'PDF Document';
      case 'doc':
      case 'docx':
          return 'Word Document';
      case 'xls':
      case 'xlsx':
          return 'Excel Spreadsheet';
      case 'ppt':
      case 'pptx':
          return 'PowerPoint Presentation';
      case 'txt':
          return 'Text File';
      case 'jpg':
      case 'jpeg':
          return 'JPEG Image';
      case 'png':
          return 'PNG Image';
      case 'gif':
          return 'GIF Image';
      case 'zip':
      case 'rar':
          return 'Compressed File';
      case 'mp4':
          return 'Multimedia Video';
      default:
          return 'Unknown File Type';
  }
}

function clearTags(){
  const resultsContainer = document.getElementById('tag-container');
  resultsContainer.innerHTML = '<span class="tag-badge">Tags</span>';
  parentTags.clear();
  activePairs.clear();
  safePairs.clear();
  handleQuery();
}

// Display context menu on right click of a tag or value
let selectedFileName;
function showContextMenu(e) {
  e.preventDefault();
  const contextMenu = document.getElementById("contextMenu");

  // Get the file name from the clicked file element
  const fileItem = e.target.closest(".file-item");
  if (fileItem) {
    selectedFileName = fileItem.querySelector(".col-4").textContent;

    const fileId = fileItem.getAttribute('data-file-id');
    console.log("Right clicked on file with ID:", fileId);

    // Fetch tags for the selected file
    fetch(`/files/${fileId}/tags`)
    .then(response => response.json())
    .then(tags => {
      console.log("Tags and values for file ID " + fileId + ":", tags);
    })
    .catch(error => {
      console.error("Error fetching tags:", error);
    });
  }

  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;

  contextMenu.style.display = "block";
}

// Hide context menu on outside click
window.addEventListener("click", function (e) {
  const contextMenu = document.getElementById("contextMenu");
  if (!contextMenu.contains(e.target)) {
    contextMenu.style.display = "none";
  }
});

document.getElementById('results').addEventListener("contextmenu", function (e) {
  if (e.target.closest(".file-item")) {
    showContextMenu(e);
  }
});

// Listen for Manage Tags click in the context menu
document.getElementById("manageTags").addEventListener("click", function () {
  const modalElement = document.getElementById("manageTagsModal");
  const modal = new bootstrap.Modal(document.getElementById('manageTagsModal'));

  const modalHeader = modalElement.querySelector(".modal-header");

  // Apply header style to the file name
  const headerElement = document.createElement('h4');
  headerElement.textContent = `Manage Tags for: ${selectedFileName}`;

  // modalHeader.textContent = '';

  // Append the h2 element to the modal header
  modalHeader.appendChild(headerElement);

  modal.show();
});

var modal = document.getElementById("manageTagsModal");
// Close modal on outside click
window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}

// Close modal on 'X' click
document.getElementsByClassName("close")[0].onclick = function () {
  modal.style.display = "none";
}

// Dropdown toggle functionality insdie modal window
document.querySelectorAll('.dropdown-btn').forEach(button => {
  button.addEventListener('click', function () {
    // Toggle the display of the related dropdown content
    const dropdownContent = this.nextElementSibling;
    dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
  });
});

document.getElementById("saveChangesBtn").onclick = function () {
  // modal.style.display = "none";
  alert("Changes confirmed");
}

// Prevent 'Enter' key from closing the modal window
document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
});

// Function to filter tags and values based on search input
// Renamed this function for clarity to differentiate between what interface we are searching in
function filterTagsInWindow() {
  const searchInput = document.getElementById('searchInput').value.toLowerCase();
  const tagButtons = document.querySelectorAll('.dropdown-btn');  // Filter based on dropdown buttons
  const tagLinks = document.querySelectorAll('.dropdown-content a');  // Filter based on tag values in dropdown content

  tagButtons.forEach(button => {
    const tagName = button.querySelector('span').innerText.toLowerCase();  // Get the tag name
    const matchingTagValues = Array.from(button.nextElementSibling.querySelectorAll('a')).filter(link => {
      const tagValue = link.textContent.toLowerCase();
      return tagValue.includes(searchInput);  // Check if the tag value matches the search term
    });

    // Show or hide the tag button and the corresponding dropdown items
    if (tagName.includes(searchInput) || matchingTagValues.length > 0) {
      button.style.display = 'block'; // Show matching tag
      button.nextElementSibling.style.display = 'block'; // Show the dropdown content if it has matching values
    } else {
      button.style.display = 'none'; // Hide non-matching tag
      button.nextElementSibling.style.display = 'none'; // Hide dropdown content if no values match
    }
  });
}