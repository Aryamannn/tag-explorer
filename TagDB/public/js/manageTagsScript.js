// Function to initialize dropdown toggle functionality
function initializeDropdowns() {
    document.querySelectorAll('.dropdown-btn').forEach(button => {
      button.addEventListener('click', function () {
        // Toggle the display of the related dropdown content
        const dropdownContent = this.nextElementSibling;
        dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
        
        // Optional: Toggle active class for rotation (if using rotating arrow)
        this.classList.toggle('active');
      });
    });
  }
  
  // Call the function to initialize dropdowns
  initializeDropdowns();
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

// Bind the selectValue function to each link in the dropdown
document.querySelectorAll('.dropdown-content a').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault(); // Prevent default anchor behavior
    const tagName = this.closest('.dropdown-content').previousElementSibling.querySelector('span').textContent; // Get the tag name from the button
    const value = e.target.textContent; // Get the value from the clicked link
    selectValue(tagName, value); // Call the function to handle the selection
  });
});

// Detect when the search input is cleared
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', function () {
  if (this.value.trim() === '') {
    resetDropdowns(); // Reset dropdowns to normal state when search is cleared
  } else {
    filterTags(); // Otherwise, filter the tags based on the input
  }
});