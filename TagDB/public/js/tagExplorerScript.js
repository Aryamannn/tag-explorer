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

// Detect right click on a file
document.getElementById('results').addEventListener("contextmenu", function (e) {
  if (e.target.closest(".file-item")) {
    showContextMenu(e);
  }
});

// Display context menu on right-click of file element
// Store file name and file ID of clicked element
let selectedFileName;
let selectedFileId;
async function showContextMenu(e) {
  e.preventDefault();
  const contextMenu = document.getElementById("contextMenu");
  const fileItem = e.target.closest(".file-item");
  if (fileItem) {
    // Store selected file details for later use
    selectedFileName = fileItem.querySelector(".col-4").textContent;
    selectedFileId = fileItem.getAttribute("data-file-id");
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

// Listen for Manage Tags click in the context menu
document.getElementById("manageTags").addEventListener("click", async function () {
  await getTagsAndValues();
  const modalElement = document.getElementById("manageTagsModal");
  const modal = new bootstrap.Modal(modalElement, {
    backdrop: true,
    keyboard: true,
  });
  const modalHeader = modalElement.querySelector(".modal-header");

  // Remove any existing header elements
  const existingHeader = modalHeader.querySelector('h4');
  if (existingHeader) {
      modalHeader.removeChild(existingHeader);
  }

  // Apply header style to the file name
  const headerElement = document.createElement('h4');
  // headerElement.textContent = `Manage Tags for: ${selectedFileName}`;
  headerElement.innerHTML = `Manage Tags for: ${selectedFileName} 
  <span style="cursor: help; margin-left: 8px;" title="This window allows you to manage tags for the selected file. You can add or remove tags here. Changes won't be saved unless you click 'Save Changes'. Hover over an element to see more information.">
    <i class="bi bi-info-circle" style="font-size: 1.0rem; color: #007bff;"></i>
  </span>`;

  // Append the h2 element to the modal header
  modalHeader.appendChild(headerElement);

  // Close modal on X click
  // Clear selectedValues[], deletedValues[], clear modal content
  const closeButton = modalHeader.querySelector('.close');
  closeButton.addEventListener('click', () => {
    modal.hide();
    selectedFileName = '';
    selectedFileId = '';
    selectedValuesInWindow.length = 0;
    deletedValues.length = 0;
    const modalTagContainer = modalElement.querySelector('#modal-tag-container');
    modalTagContainer.innerHTML = '';
    headerElement.textContent = '';
  });

  // Close modal on outside click
  // Clear selectedValues[], deletedValues[], clear modal content
  modalElement.addEventListener('click', (event) => {
  if (event.target === modalElement) {
    modal.hide();
    selectedFileName = '';
    selectedFileId = '';
    selectedValuesInWindow.length = 0;
    deletedValues.length = 0;
    const modalTagContainer = modalElement.querySelector('#modal-tag-container');
    modalTagContainer.innerHTML = '';
    headerElement.textContent = '';
  }
  });

  modal.show();
});

// Dropdown toggle functionality inside modal window
document.querySelectorAll('.dropdown-btn').forEach(button => {
  button.addEventListener('click', function () {
    // Toggle the display of the related dropdown content
    const dropdownContent = this.nextElementSibling;
    dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
  });
});

// Prevent 'Enter' key from closing the modal window
document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
  }
});

// Function to filter tags and values based on search input in Manage Tags
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

// Function to reset dropdowns to their normal state when search is cleared in Manage Tags
function resetDropdowns() {
  document.querySelectorAll('.dropdown-content').forEach(dropdown => {
    dropdown.style.display = 'none'; // Reset the dropdown visibility
  });

  document.querySelectorAll('.dropdown-btn').forEach(button => {
    button.style.display = 'flex';          // Set display to flex for justify-content to work
    button.style.justifyContent = "space-between"; // Space items within each button element
    button.style.alignItems = "center";     // Optional: Align items vertically centered if needed
});
}

// Retrieve the tags and values of the file based on the file id when clicking 'Manage Tags' option
async function getTagsAndValues() {
  if (selectedFileId) {
    try {
      const response = await fetch(`/files/${selectedFileId}/tags`);
      const tags = await response.json();
      console.log("file id: ", selectedFileId);
      displayTagsAndValues(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }
}

// Send the file's tags and values to the modal-tag-container area
function displayTagsAndValues(tags) {
  tags.forEach(tag => {
    selectValueInWindow(tag.tag_name, tag.tag_value, tag.value_id);
  });
}

let selectedValuesInWindow = [];
let deletedValues = [];
// Renamed function to differentiate between values in Tag Explorer vs Manage Tags
function selectValueInWindow(tagName, value, valueId) {
  const formattedValue = `${tagName}: ${value}`;

  // Check if the value has already been selected
  if (selectedValuesInWindow.some(item => item.formattedValue === formattedValue)) {
    alert('This value has already been selected!');
    return; // Do not add it again
  }

  // Add the selected value to the list
  selectedValuesInWindow.push({ formattedValue, valueId });

  // Create a new element to display the selected tag
  const tagContainer = document.getElementById('modal-tag-container');
  const tagElement = document.createElement('span');
  tagElement.classList.add('tag-badge');
  tagElement.textContent = formattedValue;

  // Create a button (X) to remove the tag
  const removeButton = document.createElement('button');
  removeButton.classList.add('remove-tag');
  removeButton.textContent = 'X';

  // Add the remove button click handler
  removeButton.addEventListener('click', function () {
    // Remove the tag element from the tag container
    tagContainer.removeChild(tagElement);

    const index = selectedValuesInWindow.findIndex(item => item.formattedValue === formattedValue);
    if (index > -1) {
      // Store the valueId in deletedValues along with the formatted value
      deletedValues.push({ formattedValue, valueId });
      selectedValuesInWindow.splice(index, 1); // Remove the value
    }
  });

  // Append the remove button to the tag element
  tagElement.appendChild(removeButton);

  // Append the new tag to the container
  tagContainer.appendChild(tagElement);
}

// Bind the selectValue function to each link in the dropdown in Manage Tags
document.querySelectorAll('.dropdown-content a').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault(); // Prevent default anchor behavior
    const tagName = this.closest('.dropdown-content').previousElementSibling.querySelector('span').textContent; // Get the tag name from the button
    const value = e.target.textContent; // Get the value from the clicked link
    selectValueInWindow(tagName, value); // Call the function to handle the selection
  });
});

// Detect when the search input is cleared in Manage Tags
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', function () {
  if (this.value.trim() === '') {
    resetDropdowns(); // Reset dropdowns to normal state when search is cleared
  } else {
    filterTagsInWindow(); // Otherwise, filter the tags based on the input
  }
});

// Tags removed are added to an array and sent to API for removal from the file
async function removeTagsFromFile() {
  // Get existing tags applied to the file when the window is opened
  const existingResponse = await fetch(`/files/${selectedFileId}/tags`);
  if (!existingResponse.ok) {
    throw new Error(`Failed to fetch existing tags: ${existingResponse.statusText}`);
  }
  const tagsAlreadyApplied = await existingResponse.json();

  // Get value_ids from the tags
  const existingValueIds = tagsAlreadyApplied.map(tag => tag.value_id);

  // Filter deletedValues array to only include those that are actually present in existingValueIds
  // Handle case where a user opens the window, selects a tag, then removes the tag, and clicks 'Save Changes'
  // The tag that was selected and removed was never applied to the file so the user didn't actually remove that tag
  const validDeletedValues = deletedValues.filter(item => existingValueIds.includes(item.valueId));

  // Prepare the request body with the valid value_ids
  const body = {
    value_ids: validDeletedValues.map(item => item.valueId)
  };

  // Check if there are any valid deletions
  // Check if deletedValues[] is empty
  if (body.value_ids.length === 0 || deletedValues.length === 0) {
    alert("No tags were removed.");
    return;
  }

  try {
    const response = await fetch(`/files/${selectedFileId}/tags`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete tags: ${response.statusText}`);
    }

    alert("Tags successfully removed");

  } catch (error) {
    console.error("Error removing file tags:", error);
  }
}

async function addTagsToFile() {
  // Get existing tags applied to the file when the window is opened
  const existingResponse = await fetch(`/files/${selectedFileId}/tags`);
  if (!existingResponse.ok) {
    throw new Error(`Failed to fetch existing tags: ${existingResponse.statusText}`);
  }
  const existingTags = await existingResponse.json();

  // Get value_ids from the tags
  const existingValueIds = existingTags.map(tag => tag.value_id);

  // Create a mapping from tag value to value_id
  const tagValuesResponse = await fetch('/tag_values');
  if (!tagValuesResponse.ok) {
    throw new Error(`Failed to fetch tag values: ${tagValuesResponse.statusText}`);
  }
  const allTagValues = await tagValuesResponse.json();

  // Create a mapping from tag value to value_id
  const valueIdMap = {};
  allTagValues.forEach(tag => {
    valueIdMap[tag.tag_value] = tag.value_id;
  });

  // Extract value_ids from selectedValues
  const newValueIds = selectedValuesInWindow.map(item => {
    return valueIdMap[item.formattedValue.split(": ")[1]];
  });

  // Filter out any undefined value_ids
  const validNewValueIds = newValueIds.filter(valueId => valueId !== undefined);

  // Check for new tags to insert
  const newTagsToInsert = validNewValueIds.filter(valueId => !existingValueIds.includes(valueId));

  if (newTagsToInsert.length === 0) {
    alert("No new tags were selected to add to the file.");
    return;
  }

  // Prepare the request body with the newly selected value_ids
  const body = {
    value_ids: newTagsToInsert,
  };

  try {
    const response = await fetch(`/files/${selectedFileId}/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to add tags: ${response.statusText}`);
    }
    alert("Tags added successfully.");

  } catch (error) {
    console.error("Error inserting file tags:", error);
    alert("Failed to add tags.");
  }
}

// Call when the 'Save Changes' button is clicked
async function handleSaveChanges() {
  await removeTagsFromFile();
  await addTagsToFile();
}