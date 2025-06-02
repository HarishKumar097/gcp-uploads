import React, { useState, useCallback, useEffect } from 'react';
import { Uploader } from 'gcp-res-upload';
import './FileUploader.css';

const FileUploader = ({ chunkSize = 5 }) => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [signedUrl, setSignedUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [fileUploader, setFileUploader] = useState(null);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [isAborted, setIsAborted] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [chunkInfo, setChunkInfo] = useState({ currentChunk: 0, totalChunks: 0 });
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const resetStates = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadStatus('');
    setSignedUrl('');
    setIsDragging(false);
    setIsPaused(false);
    setFileUploader(null);
    setIsUploadComplete(false);
    setIsAborted(false);
    setIsOffline(!navigator.onLine);
    setChunkInfo({ currentChunk: 0, totalChunks: 0 });
    setHasError(false);
  };

  const getSignedUrl = async () => {
    const accessTokenId = 'a2fb727c-ea5b-4af8-8c14-873cefa809a6';
    const secretKey = 'e0afd2b4-89ac-418b-b679-a66d4b0ea7ff';
    const url = 'https://venus-v1.fastpix.dev/on-demand/uploads/v2';
    const requestData = {
      corsOrigin: "*",
      pushMediaSettings: {
        accessPolicy: "public",
        createSubtitles: {
          name: "name",
          metadata: {
            key1: "value1"
          },
          languageCode: "en-us"
        },
        optimizeAudio: true,
        maxResolution: "1080p"
      }
    };

    const encodedCredentials = btoa(`${accessTokenId}:${secretKey}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${encodedCredentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      const data = await response.json();
      if (data?.success) {
        return data?.data?.url;
      }
    } catch (error) {
      setUploadStatus('Error getting signed URL');
    }
  };

  const handleFileUpload = async (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadStatus('Getting signed URL...');
    setHasError(false);
    
    const url = await getSignedUrl();
    if (!url) return;
    
    try {
    const uploader = Uploader.init({
      endpoint: url,
      file: selectedFile,
      chunkSize: isNaN(chunkSize) ? 5 * 1024 : chunkSize * 1024,
    });

    setFileUploader(uploader);

    uploader.on("progress", (event) => {
      setUploadProgress(event.detail.progress);
      setUploadStatus(`Uploading: ${Math.round(event.detail.progress)}%`);
    });

    uploader.on("error", (event) => {
      setUploadStatus(`${event.detail.message}`);
      setHasError(true);
    });

    uploader.on("success", (event) => {
      setUploadStatus('Upload Completed Successfully');
      setIsUploadComplete(true);
    });

    uploader.on("chunkAttempt", (event) => {

      setChunkInfo({
        currentChunk: event.detail.chunkNumber,
        totalChunks: event.detail.totalChunks
      });
    });

    uploader.on("offline", (event) => {
      setUploadStatus(event.detail.message);
    });
    } catch (error) {
      setUploadStatus(error.message ?? 'Error uploading file');
      setHasError(true);
    }
  };

  const handlePause = () => {
    if (fileUploader && !isOffline) {
      fileUploader.pause();
      setIsPaused(true);
      setUploadStatus('Upload Paused');
    }
  };

  const handleResume = () => {
    if (fileUploader && !isOffline) {
      fileUploader.resume();
      setIsPaused(false);
      setUploadStatus('Upload Resumed');
    }
  };

  const handleAbort = () => {
    if (fileUploader && !isOffline) {
      fileUploader.abort();
      setIsAborted(true);
      setUploadStatus('Upload Aborted');
    }
  };

  const handleUploadAgain = () => {
    if (fileUploader) {
      fileUploader.retryUpload();
      resetStates();
    } else {
      resetStates();
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileUpload(droppedFile);
  }, []);

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    handleFileUpload(selectedFile);
  };

  return (
    <div className="file-uploader">
      {!file ? (
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="upload-content">
            <p className="drag-text">Drag and drop Video file here to upload</p>
            <p className="or-text">or</p>
            <input
              type="file"
              id="file-input"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
            <label htmlFor="file-input" className="upload-button">
              Upload
            </label>
          </div>
        </div>
      ) : (
        <div className="upload-info">
          <p className="file-name">Selected file: {file.name}</p>
          <p className={`status ${hasError ? 'error' : ''}`}>{uploadStatus}</p>
          {chunkInfo.totalChunks > 0 && (
            <p className="chunk-info">
              Chunk {chunkInfo.currentChunk} / {chunkInfo.totalChunks}
            </p>
          )}
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="control-buttons-container">
            {uploadProgress > 0 && uploadProgress < 100 && !isAborted && !hasError && (
              <>
                <button 
                  className={`control-button ${isPaused ? 'resume' : 'pause'} ${isOffline ? 'disabled' : ''}`}
                  onClick={isPaused ? handleResume : handlePause}
                  disabled={isOffline}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button 
                  className={`control-button abort ${isOffline ? 'disabled' : ''}`}
                  onClick={handleAbort}
                  disabled={isOffline}
                >
                  Abort
                </button>
              </>
            )}
            {(isUploadComplete || isAborted || hasError) && (
              <button 
                className="control-button upload-again"
                onClick={handleUploadAgain}
              >
                Upload Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader; 