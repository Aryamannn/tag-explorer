let dragged;
// 3 Maps to help keep track of current tags that are selected
const safePairs = new Map();
const parentTags = new Map();
const activePairs = new Map();
const recentTagMap = new Map();

let currentTag;

//Event listener that runs after webpage has loaded 
// Adds event listeners to all elements needed to be dragged
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

  // Allow drop on the Selected Area
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault(); // Allow drop
  });

  dropzone.addEventListener("dragenter", (event) => {
    event.target.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", (event) => {
    event.target.classList.remove("dragover");
  });

  //Event that happens when draggable is dropped into the Selected Area
  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    event.target.classList.remove("dragover");

    // Checks if there is a value assigned to dragged
    // There should be a value assigned to dragged if an element is currently being dragged
    if (dragged) {
      //Gets attribute info from element being dragged
      let draggedText = dragged.textContent.trim();
      const tagName = dragged.getAttribute('data-tag-name');
      const tagId = dragged.getAttribute('data-tag-id');
      const valueId = dragged.getAttribute('data-subtag-id');
      
      //Changes "Any" from Nav Bar to parent tag name if "Any" was selected
      if(dragged.getAttribute('any-tag')){
        draggedText = tagName;
      }


      // Check for existing tags in the selected area
      const existingTags = Array.from(dropzone.getElementsByClassName("tag-badge"));
      const tagExists = existingTags.some(tag => tag.id === draggedText);
      
      //If the tag does not already exist in the selected area
      if (!tagExists) {
        let newTag;
        if(draggedText.includes("\n")){
          newTag = createTag(tagName, tagName);
        } else {
          newTag = createTag(draggedText, tagName);
        }
        
        //Adds tag element to selected area
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
  // If text of subtag does not match name of parent tag
  // Ex. !(Brad Pitt == Actor)
  if (!(draggedText == tagName)){
    //Make text content of new tag (Parent Tag name: subtag name)
    // Content type: Video
    newTag.textContent = tagName + ": " + draggedText;
    // console.log(draggedText);
  } else {
    //Make text content of new tag in Selected Area the name of parent tag
    // Actor
    newTag.textContent = draggedText;
  }

  //Creating the remove "x" button for tag in Selected Area
  const closeBtn = document.createElement("span");
  closeBtn.className = "close-btn";
  closeBtn.textContent = "X";
  // Delete tag from Selected Area and from maps
  closeBtn.onclick = () => {
    newTag.remove();
    // Attmept to remove tag's text from every map 
    // Helps keep track when a tag is no longer being used
    safePairs.delete(draggedText); 
    parentTags.delete(draggedText);
    activePairs.delete(draggedText);
    handleQuery();
  };

  newTag.appendChild(closeBtn);
  return newTag;
}

// Function to update active pairs
function updatesafePairs(tagId, tagName, draggedText, valueId, parentId) {
  // Text of tags not yet selected will have a '\n' if they are a parent tag
  // This is because of the dropdown arrow next to the parent tag 
  if(draggedText == tagName | draggedText.includes('\n')){
    // console.log('dupe added : ' + parentId + "booo: " + valueId);
    parentTags.set(tagName, parentId);
  } else {
    // console.log("subtag added");
    safePairs.set(tagId, tagName);
    activePairs.set(draggedText, valueId)
  }
  // console.log("Actve Pairs" + Array.from(activePairs.entries()));
  // console.log("Parent tags" + Array.from(parentTags.entries()));

}

const handleQuery = async () => {
// Create list of selected tag/value pairs for the query from map
const tagValuePairs = Array.from(safePairs.entries()).map(([tagId, tagName]) => {
  return { tag_name: tagName, tag_value: tagId }; // subtags in created array will have the format Actor: Brad Pitt
});
const parentTagPairs = Array.from(parentTags.entries()).map(([tagName, type]) => {
  return { tag_name: tagName, tag_value: type };  // parent tags in created array will have the format Actor: (Id of parent tag)
});

// console.log(tagValuePairs);
// console.log(parentTagPairs);

// If no values are selected, do not perform the query
if (tagValuePairs.length === 0 && parentTagPairs.length === 0) {
  // console.log('No tags selected for query.');
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
    // console.log("helllppp");
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
  // console.log("hellooo");
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

};


// Function to set the "file results" area with the filtered files 
function setQueryResults(data) {
  const resultsContainer = document.getElementById('results');

  // Clear previous results except the header
  const existingResults = resultsContainer.querySelectorAll('.file-item');
  let count = 0;
  existingResults.forEach(result => result.remove());
//  console.log("Count"  + count +1)
  // Populate the results container with new data
  // console.log("THIS IS DATAAA:");
  // console.log(data);
  data.forEach(file => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item row';

    // Creating columns for file information
    const fileNameCol = document.createElement('div');
    fileNameCol.className = 'col-4';

    // Creating link to open file
    const fileLink = document.createElement('a');
    fileLink.href = `open/${file.file_path.split('/').pop()}`;
    fileLink.textContent = file.file_path.split('/').pop();
    fileNameCol.appendChild(fileLink);

    // Date modified column
    const dateModifiedCol = document.createElement('div');
    dateModifiedCol.className = 'col-3';
    dateModifiedCol.textContent = file.metadata.modifiedDate ? new Date(file.metadata.modifiedDate).toLocaleDateString() : "N/A"; // Ensure valid date format

    //File type column
    const typeCol = document.createElement('div');
    typeCol.className = 'col-3';
    typeCol.textContent = getFileType(file.file_path); 

    //File size column
    const sizeCol = document.createElement('div');
    sizeCol.className = 'col-2';
    sizeCol.textContent = file.metadata.size < 1024 ? file.metadata.size + " bytes" : (file.metadata.size / 1024).toFixed(2) + " KB" || "0 KB"; 
    
    fileItem.appendChild(fileNameCol);
    fileItem.appendChild(dateModifiedCol);
    fileItem.appendChild(typeCol);
    fileItem.appendChild(sizeCol);
    
    resultsContainer.appendChild(fileItem);
    count++; 
  });
  // console.log("Count: " + count);
  document.querySelector("#count").innerText = "Result: " + count; // Set the count
  
}

// Function to change file type after file name with full name
// jpeg or jpg is renamed to "JPEG Image"
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


// Function to reset and clear all tags in selected area
// Only element in select area will just be the default text: "Tags"
function clearTags(){
  const resultsContainer = document.getElementById('tag-container');
  resultsContainer.innerHTML = '<span class="tag-badge">Tags</span>';
  parentTags.clear();
  activePairs.clear();
  safePairs.clear();
  handleQuery();
}

//Depeciated function to get a random date
function getDateModified(){
  return(Math.floor(Math.random() * 28) + 1) + "/" + (Math.floor(Math.random() * 12) + 1) + "/" + (Math.floor(Math.random() * 24) + 2001);
}

function addTagOnClick(tagType, id, parentTag, tagText){

  const clickedElement = event.target;

  // Retrieve tag ID from the clicked element's data attribute
  const tagId = clickedElement.getAttribute('data-tag-id');




  // console.log("clcikeddddd!!");
  // console.log(tagType + " : " + id);
  let attribute = "data-tag-subtag";
  //Assign whatever tag that was clicked to the dragged variable
  dragged = document.querySelector(`[${attribute}="${id}"]`);

  // Check for existing tags in the dropzone
  const existingTags = Array.from(dropzone.getElementsByClassName("tag-badge"));
  const tagExists = existingTags.some(tag => tag.id === tagText);
  
  // Slightly tweaked code from "drop" event listener
  // See lines 47 - 80
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
     // Store the selected tag in localStorage
   
      console.log("Tag Type: " + tagType + ", ID: " + id + ", Tag Name: " + parentTag + ", Selected Value: " + tagText + ", Tag ID from clicked element:"  + tagId);
    console.log("testtttttttttttttttt")
     storeTagInLocalStorage(tagType, id, parentTag, tagText, tagId);
  


  } else {
    alert("This tag is already added!");
  }
}

// Tamana code 
// Dropdown toggle functionality
document.querySelectorAll('.dropdown-btn').forEach(button => {
  button.addEventListener('click', function () {
    // Toggle the display of the related dropdown content
    const dropdownContent = this.nextElementSibling;
    dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
  });
});


// Function to filter tags and values based on search input
function filterTags() {
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

// Function to reset dropdowns to their normal state when search is cleared
// Function to reset dropdowns to their normal state when search is cleared
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


// Detect when the search input is cleared
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', function () {
  if (this.value.trim() === '') {
    resetDropdowns(); // Reset dropdowns to normal state when search is cleared
  } else {
    filterTags(); // Otherwise, filter the tags based on the input
  }
});

// browser local storage  part

const RECENT_TAGS_KEY = "recentSelections";  // Key to store recent tags in local storage
const MAX_RECENT_TAGS = 10;  // Maximum number of recent tags to store

// Function to store a tag in local storage

function storeTagInLocalStorage(tagType, id, parentTag, tagText) {
  let recentSelections = JSON.parse(localStorage.getItem(RECENT_TAGS_KEY)) || [];

  const tagObject = { tagType, id, parentTag, tagText };

  // Avoid storing duplicates
  const isDuplicate = recentSelections.some(
    selection => selection.id === id && selection.tagType === tagType
  );
  if (isDuplicate) {
    console.log("Duplicate tag detected; skipping storage.");
    return;
  }
  // If the number of favorites exceeds the maximum limit, remove the oldest
  if (recentSelections.length >= MAX_RECENT_TAGS) {
    recentSelections.shift();  // Remove the oldest tag to make space
  }

  recentSelections.push(tagObject);
  localStorage.setItem(RECENT_TAGS_KEY, JSON.stringify(recentSelections));
  console.log("Tag added:", tagObject);

  // Update the dropdown
  renderRecentTags();
}

function renderRecentTags() {
  const dropdown = document.getElementById("recentTagsDropdown");
  if (!dropdown) return;

  // Clear existing content
  dropdown.innerHTML = "";

  const recentSelections = JSON.parse(localStorage.getItem("recentSelections")) || [];

  // Add each tag as a link (`<a>` element)
  recentSelections.forEach(tag => {
    const link = document.createElement("a");
    link.className = "draggable";
    link.href = "#subitem1";
    link.draggable = true;
    link.dataset.tagName = tag.parentTag;
    link.dataset.tagValue = tag.tagText;
    link.dataset.tagId = tag.tagId;
    link.dataset.subtagId = tag.id;
    link.onclick = () =>
      addTagOnClick(tag.tagType, tag.id, tag.parentTag, tag.tagText);

    link.textContent = tag.tagText;
    dropdown.appendChild(link);
  });

  console.log("Dropdown updated with recent tags.");
}
function clearRecentTags() {
  localStorage.removeItem("recentSelections");
  alert("Click OK to delete all your recent favorite tags. ")
  renderRecentTags();
  console.log("Recent tags cleared.");
}
// // Toggle popup visibility
// function togglePopup() {
//     const popup = document.getElementById("popup");
//     popup.classList.toggle("d-none");
//     clearRecentTags()
// }

const FAVORITE_TAGS_KEY = "favoriteTags";  // Key to store favorite tags in localStorage
const MAX_FAVORITE_TAGS = 10;  // Maximum number of favorite tags to store

// Function to store a tag in local storage
function storeFavoriteTagInLocalStorage(tagType, id, parentTag, tagText, tagId) {
  // Retrieve the existing favorite selections or initialize an empty array
  let favoriteSelections = JSON.parse(localStorage.getItem(FAVORITE_TAGS_KEY)) || [];

  // Create the tag object
  const tagObject = {
    tagType: tagType,
    id: id,
    parentTag: parentTag,
    tagText: tagText,
    tagId: tagId
  };

  console.log("Tag Type: " + tagType + ", ID: " + id + ", Tag Name: " + parentTag + ", Selected Value: " + tagText + ", Tag ID from clicked element:" + tagId);

  // Avoid storing duplicates
  const isDuplicate = favoriteSelections.some(
    selection => selection.id === id && selection.tagType === tagType
  );
  if (isDuplicate) {
    console.log("Duplicate tag detected; skipping storage.");
    return;
  }

  // If the number of favorites exceeds the maximum limit, remove the oldest
  if (favoriteSelections.length >= MAX_FAVORITE_TAGS) {
    favoriteSelections.shift();  // Remove the oldest tag to make space
  }

  // Add the new tag object to the favorite selections
  favoriteSelections.push(tagObject);

  // Store the updated array back into localStorage
  localStorage.setItem(FAVORITE_TAGS_KEY, JSON.stringify(favoriteSelections));

  console.log("Tag added to favorite selections:", tagObject);

  // Update the favorite tags dropdown
  renderFavoriteTags();
}

// Function to render favorite tags in the dropdown
function renderFavoriteTags() {
  const dropdown = document.getElementById("favoriteTagsDropdown");
  if (!dropdown) return;

  // Clear existing content
  dropdown.innerHTML = "";

  // Retrieve the favorite selections from localStorage
  const favoriteSelections = JSON.parse(localStorage.getItem(FAVORITE_TAGS_KEY)) || [];

  // Add each tag as a link (`<a>` element) in the dropdown
  favoriteSelections.forEach(tag => {
    const link = document.createElement("a");
    link.className = "draggable";
    link.href = "#subitem1";
    link.draggable = true;
    link.dataset.tagName = tag.parentTag;
    link.dataset.tagValue = tag.tagText;
    link.dataset.tagId = tag.tagId;
    link.dataset.subtagId = tag.id;
    link.onclick = () =>
      addTagOnClick(tag.tagType, tag.id, tag.parentTag, tag.tagText);

    link.textContent = tag.tagText;
    dropdown.appendChild(link);
  });

  console.log("Dropdown updated with favorite tags.");
}

// Function to add a tag to the favorite list (triggered by clicking the star icon)
// Function to add a tag to the favorite list (triggered by clicking the star icon)
// Function to add a tag to the favorite list (triggered by clicking the star icon)
function addTagToFavorite(tagType, id, parentTag, tagText) {
  // Store the tag in localStorage
  storeFavoriteTagInLocalStorage(tagType, id, parentTag, tagText, id);

  // Get the star element by its ID
  const starElement = document.getElementById(`star-${id}`);
  
  if (starElement) {
    // Change the star to a filled state
    if (starElement.classList.contains("bi-star")) {
      starElement.classList.remove("bi-star");
      starElement.classList.add("bi-star-fill");
    } else {
      // Toggle back to empty state if already filled (optional behavior)
      starElement.classList.remove("bi-star-fill");
      starElement.classList.add("bi-star");
    }
  }
}
// Function to remove a tag from the favorite list (triggered by clicking the filled star icon)
function removeTagFromFavorite(tagId) {
  let favoriteSelections = JSON.parse(localStorage.getItem(FAVORITE_TAGS_KEY)) || [];
  
  // Remove the tag with the given tagId
  favoriteSelections = favoriteSelections.filter(tag => tag.tagId !== tagId);

  // Save the updated list back to localStorage
  localStorage.setItem(FAVORITE_TAGS_KEY, JSON.stringify(favoriteSelections));

  // Update the UI
  const starElement = document.getElementById(`star-${tagId}`);
  starElement.classList.remove("bi-star-fill");
  
  // Re-render the favorite tags dropdown
  renderFavoriteTags();
}

document.addEventListener("DOMContentLoaded", function() {
  const favoriteSelections = JSON.parse(localStorage.getItem(FAVORITE_TAGS_KEY)) || [];
  favoriteSelections.forEach(fav => {
    const starElement = document.getElementById(`star-${fav.id}`);
    if (starElement) {
      starElement.classList.add("bi-star-fill");
      starElement.classList.remove("bi-star");
    }
  });
});

// function clearFavoriteTags() {
//   localStorage.removeItem("favoriteTags");
//   alert("cleared favorite ")
//   renderFavoriteTags();
//   console.log("Recent tags cleared.");
// }


function toggleFavoriteTag(tagType, id, parentTag, tagText) {
  const starElement = document.getElementById(`star-${id}`);
  const isFilled = starElement.classList.contains("bi-star-fill");

  if (isFilled) {
    // If the star is filled, remove the tag from favorites
    removeTagFromFavorite(id);
    starElement.classList.remove("bi-star-fill");
    starElement.classList.add("bi-star");
  } else {
    // If the star is empty, add the tag to favorites
    storeFavoriteTagInLocalStorage(tagType, id, parentTag, tagText, id);
    starElement.classList.add("bi-star-fill");
    starElement.classList.remove("bi-star");
  }

  // Update the favorite tags dropdown
  renderFavoriteTags();
}

document.addEventListener("DOMContentLoaded", function() {
  renderRecentTags();  // Render recent tags from localStorage on page load
  renderFavoriteTags();  // Render favorite tags from localStorage on page load
});

