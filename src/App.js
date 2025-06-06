import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import './App.css';

function App() {
  const [chunkSize, setChunkSize] = useState(5);

  const handleChunkSizeChange = (e) => {
    const value = e.target.value;
    // Allow empty input for better UX
    if (value === '') {
      setChunkSize('');
      return;
    }

    // Allow negative numbers and 0
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setChunkSize(numValue);
    }
  };

  return (
    <div className="App">
      <div className="chunk-size-container">
        <label htmlFor="chunk-size">Chunk Size (MB):</label>
        <input
          type="number"
          id="chunk-size"
          onChange={handleChunkSizeChange}
          className="chunk-size-input"
        />
        <small className="chunk-size-hint">Range: 5MB - 500MB</small>
      </div>
      <div className="uploaders-container">
        <FileUploader 
          chunkSize={chunkSize} 
          uploaderId="uploader1"
        />
        <FileUploader 
          chunkSize={chunkSize} 
          uploaderId="uploader2"
        />
      </div>
    </div>
  );
}

export default App;