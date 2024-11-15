let dragged;
const safePairs = new Map();
const parentTags = new Map();
const activePairs = new Map();
let currentTag;

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
      let draggedText = dragged.textContent.trim();
      const tagName = dragged.getAttribute('data-tag-name');
      const tagId = dragged.getAttribute('data-tag-id');
      const valueId = dragged.getAttribute('data-subtag-id');
      
      if(dragged.getAttribute('any-tag')){
        draggedText = tagName;
      }


      // Check for existing tags in the dropzone
      const existingTags = Array.from(dropzone.getElementsByClassName("tag-badge"));
      const tagExists = existingTags.some(tag => tag.id === draggedText);
      
      if (!tagExists) {
        let newTag;
        if(draggedText.includes("\n")){
          newTag = createTag(tagName, tagName);
        } else {
          newTag = createTag(draggedText, tagName);
        }
        
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
    console.log(draggedText);
  } else {
    newTag.textContent = draggedText;
  }
  //  if (Array.isArray(draggedText) | draggedText.includes("\n")){
  //   newTag.textContent = tagName;
  //   draggedText = tagName;
  //   console.log("text");
  //  } else if(!(draggedText == tagName)) {
  //   newTag.textContent = tagName + ": " + draggedText;
  //   console.log(draggedText);
  //  }

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
  if(draggedText == tagName | draggedText.includes('\n')){
    console.log('dupe added : ' + parentId + "booo: " + valueId);
    parentTags.set(tagName, parentId);
  } else {
    console.log("subtag added");
    safePairs.set(tagId, tagName);
    activePairs.set(draggedText, valueId)
  }
  console.log("Actve Pairs" + Array.from(activePairs.entries()));
  console.log("Parent tags" + Array.from(parentTags.entries()));

}

const handleQuery = async () => {
// Create list of selected tag/value pairs for the query from map
const tagValuePairs = Array.from(safePairs.entries()).map(([tagId, tagName]) => {
  return { tag_name: tagName, tag_value: tagId }; // Adjust based on your desired structure
});
const parentTagPairs = Array.from(parentTags.entries()).map(([tagName, type]) => {
  return { tag_name: tagName, tag_value: type }; // Adjust based on your desired structure
});

console.log(tagValuePairs);
console.log(parentTagPairs);

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
    console.log(data);
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
  console.log("Parent tags " + JSON.stringify( Array.from(parentTags.entries()).map(subArray => subArray[1]) ));
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
    // console.log('Files found:', data);
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
    // console.log('Response data:', data); 

    if (Array.isArray(data)) {
      const fileIds = data.map(item => item.file_id);
      // console.log(fileIds);
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
  console.log("THIS IS DATAAA:");
  console.log(data);
  data.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item row';

    // Creating columns for file information
    const fileNameCol = document.createElement('div');
    fileNameCol.className = 'col-4';

    const fileLink = document.createElement('a');
    fileLink.href = `open/${file.file_path.split('/').pop()}`;
    fileLink.textContent = file.file_path.split('/').pop();
    fileNameCol.appendChild(fileLink);

    const dateModifiedCol = document.createElement('div');
    dateModifiedCol.className = 'col-3';
    dateModifiedCol.textContent = file.metadata.modifiedDate ? new Date(file.metadata.modifiedDate).toLocaleDateString() : "N/A"; // Ensure valid date format

    const typeCol = document.createElement('div');
    typeCol.className = 'col-3';
    typeCol.textContent = getFileType(file.file_path); 

    const sizeCol = document.createElement('div');
    sizeCol.className = 'col-2';
    sizeCol.textContent = file.metadata.size < 1024 ? file.metadata.size + " bytes" : (file.metadata.size / 1024).toFixed(2) + " KB" || "0 KB"; 
    
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

function getDateModified(){
  return(Math.floor(Math.random() * 28) + 1) + "/" + (Math.floor(Math.random() * 12) + 1) + "/" + (Math.floor(Math.random() * 24) + 2001);
}

document.querySelectorAll('.dropdown-btn').forEach(button => {
  button.addEventListener('click', function () {
    // Toggle the display of the related dropdown content
    const dropdownContent = this.nextElementSibling;
    dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
  });
});

let selectedValues = [];

// Function to handle the value selection
function selectValue(tagName, value) {
  const formattedValue = `${tagName}: ${value}`;

  // Check if the value has already been selected
  if (selectedValues.includes(formattedValue)) {
    alert('This value has already been selected!');
    return; // Do not add it again
  }

  // Add the selected value to the list
  selectedValues.push(formattedValue);

  // Create a new element to display the selected tag
  const tagContainer = document.getElementById('tag-container');
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

    // Also remove the value from the selectedValues array
    const index = selectedValues.indexOf(formattedValue);
    if (index > -1) {
      selectedValues.splice(index, 1); // Remove the value
    }
  });

  // Append the remove button to the tag element
  tagElement.appendChild(removeButton);

  // Append the new tag to the container
  tagContainer.appendChild(tagElement);
}

function addTagOnClick(tagType, id, parentTag, tagText){
  console.log("clcikeddddd!!");
  console.log(tagType + " : " + id);
  let attribute = "data-tag-subtag";
  dragged = document.querySelector(`[${attribute}="${id}"]`);
  // const draggedText = dragged.textContent.trim();
  // const tagName = dragged.getAttribute('data-tag-name');
  // const tagId = dragged.getAttribute('data-tag-id');
  // const valueId = dragged.getAttribute('data-subtag-id');
  



  // Check for existing tags in the dropzone
  const existingTags = Array.from(dropzone.getElementsByClassName("tag-badge"));
  const tagExists = existingTags.some(tag => tag.id === tagText);
  
  if (!tagExists) {
    let newTag;
    if(tagText.includes("\n")){
      newTag = createTag(parentTag, parentTag);
    } else {
      newTag = createTag(tagText, parentTag);
    }
    
    dropzone.querySelector('.tag-container').appendChild(newTag);
    if(tagType == "subtag"){
      updatesafePairs(newTag.id, parentTag, tagText, id, null);
    } else if (tagType == "tag"){
      updatesafePairs(newTag.id, parentTag, tagText, null, id);
    }
    
    handleQuery();
  } else {
    alert("This tag is already added!");
  }
}