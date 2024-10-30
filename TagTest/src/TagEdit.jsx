import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TagEdit.css';  // Import your CSS file

const TagEdit = () => {
  const [tags, setTags] = useState({});
  const [newTagName, setNewTagName] = useState('');
  const [showNewTagDialog, setShowNewTagDialog] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [newTagValue, setNewTagValue] = useState('');
  const [showNewValueDialog, setShowNewValueDialog] = useState(false);
  const [selectedValues, setSelectedValues] = useState({});
  const [queryResults, setQueryResults] = useState([]);  // State to store query results

  // Fetch the tags and their values when the component mounts
  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await axios.get('http://localhost:3000/tags/with-values');
      for (let key in response.data) {
        if (response.data.hasOwnProperty(key)) {
          response.data[key].push('*');
        }
      }
      console.log(JSON.stringify(response, null, 2));
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags', error);
    }
  };

  const handleNewTag = async () => {
    try {
      await axios.post('http://localhost:3000/tags/create', { tag_name: newTagName });
      setShowNewTagDialog(false);
      setNewTagName('');
      fetchTags();  // Refresh the tags after a new tag is added
    } catch (error) {
      console.error('Error adding new tag', error);
    }
  };

  const handleAddTagValue = async () => {
    try {
      await axios.post('http://localhost:3000/tags', {
        tag_name: selectedTag,
        tag_value: newTagValue,
      });
      setShowNewValueDialog(false);
      setNewTagValue('');

      setTags(prevTags => ({
        ...prevTags,
        [selectedTag]: [...prevTags[selectedTag], newTagValue]  // Add the new value
      }));
      setSelectedValues(prevValues => ({
        ...prevValues,
        [selectedTag]: newTagValue  // Set the newly added value as selected
      }));
    } catch (error) {
      console.error('Error adding new tag value', error);
    }
  };

  const handleQuery = async () => {
    // Prepare the list of selected tag/value pairs for the query
    console.log(selectedValues);
    const tagValuePairs = Object.keys(selectedValues).reduce((pairs, tagName) => {
      const selectedValue = selectedValues[tagName];
      if (selectedValue && selectedValue !== 'add-new') {
        pairs.push({ tag_name: tagName, tag_value: selectedValue });
      }
      return pairs;
    }, []);
    console.log(tagValuePairs);
    console.log(pairs);


    // If no values are selected, do not perform the query
    if (tagValuePairs.length === 0) {
      console.log('No tags selected for query.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/files/tags', {
        tagValuePairs
      });
      setQueryResults(response.data);  // Store the query results in state
    } catch (error) {
      console.error('Error querying files', error);
    }
  };

  const handleReset = () => {
    // Reset selectedValues to empty, so that all dropdowns go back to "Click to display all values"
    setSelectedValues({});
    setQueryResults([]);  // Clear the query results on reset
  };

  return (
    <div>
      <h1>Tag Test</h1>

      {/* Button to add new tag */}
      <button onClick={() => setShowNewTagDialog(true)}>New Tag</button>

      {/* Button to query files based on selected tag values */}
      <button onClick={handleQuery}>Query</button>

      {/* Button to reset all selected tag values */}
      <button onClick={handleReset}>Reset</button>

      {/* List of tags with their values as dropdowns */}
      {Object.keys(tags).map(tagName => (
        <div className="tag-row" key={tagName}>
          <label className="tag-label">{tagName}: </label>
          <select
            className="tag-dropdown"
            value={selectedValues[tagName] || ''}
            onChange={e => {
              if (e.target.value === 'add-new') {
                setSelectedTag(tagName);
                setShowNewValueDialog(true);
                setSelectedValues(prevValues => ({
                  ...prevValues,
                  [tagName]: ''  // Reset selection to allow "Add New Value" to be clicked again
                }));
              } else {
                setSelectedValues(prevValues => ({
                  ...prevValues,
                  [tagName]: e.target.value
                }));
              }
            }}
          >
            <option value="" disabled>
              Click to display all values
            </option>
            {tags[tagName].map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
            <option value="add-new">Add New Value</option>
          </select>
        </div>
      ))}

      {/* Query results area */}
      <h2>Query Results</h2>
      <div className="query-results">
        {queryResults.length > 0 ? (
          <ul>
            {queryResults.map((file, index) => (
              <li key={index}>{file.file_path.split('/').pop()}</li>
            ))}
          </ul>
        ) : (
          <p>No results found.</p>
        )}
      </div>

      {/* Dialog to add new tag */}
      {showNewTagDialog && (
        <div className="dialog">
          <h3>Add New Tag</h3>
          <input
            type="text"
            value={newTagName}
            onChange={e => setNewTagName(e.target.value)}
            placeholder="Enter tag name"
          />
          <button onClick={handleNewTag}>OK</button>
          <button onClick={() => setShowNewTagDialog(false)}>Cancel</button>
        </div>
      )}

      {/* Dialog to add new tag value */}
      {showNewValueDialog && (
        <div className="dialog">
          <h3>Add New Value to {selectedTag}</h3>
          <input
            type="text"
            value={newTagValue}
            onChange={e => setNewTagValue(e.target.value)}
            placeholder="Enter tag value"
          />
          <button onClick={handleAddTagValue}>OK</button>
          <button onClick={() => setShowNewValueDialog(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default TagEdit;