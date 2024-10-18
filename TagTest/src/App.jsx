import React from 'react';
import './App.css';  // You can keep the default App.css for styling
import TagEdit from './TagEdit';  // Import your TagEdit component
import TagExplorer from './TagExplorer'; // Import the new TagExplorer component

function App() {
  return (
   <div className="App">
      <TagEdit />  {/* Render the TagExplorer component */}
      {/* You can keep TagEdit if needed */}
      {/* <TagEdit /> */}
    </div>
  );
}

export default App;