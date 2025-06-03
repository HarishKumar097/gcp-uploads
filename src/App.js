import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import './App.css';

function App() {
  const [chunkSize, setChunkSize] = useState(5);

  const handleChunkSizeChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setChunkSize(5);
    } else {
      setChunkSize(parseInt(value));
    }
  };

  return (
    <div className="App">
      <div className="chunk-size-container">
        <label htmlFor="chunk-size">Chunk Size (MB):</label>
        <input
          type="text"
          id="chunk-size"
          onChange={handleChunkSizeChange}
          className="chunk-size-input"
        />
        <small className="chunk-size-hint">Range: 5MB - 500MB</small>
      </div>
      <FileUploader chunkSize={chunkSize} />
      <FileUploader chunkSize={chunkSize} />
    </div>
  );
}

export default App;