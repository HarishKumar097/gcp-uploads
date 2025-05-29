import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import './App.css';

function App() {
  const [chunkSize, setChunkSize] = useState(5); // Default 5MB

  const handleChunkSizeChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setChunkSize(value);
    }
  };

  return (
    <div className="App">
      <div className="chunk-size-container">
        <label htmlFor="chunk-size">Chunk Size (MB):</label>
        <input
          type="number"
          id="chunk-size"
          value={chunkSize}
          onChange={handleChunkSizeChange}
          min="5"
          step="1"
          className="chunk-size-input"
        />
        <small className="chunk-size-hint">Minimum: 5MB</small>
      </div>
      <FileUploader chunkSize={chunkSize} />
      <FileUploader chunkSize={chunkSize} />
    </div>
  );
}

export default App;