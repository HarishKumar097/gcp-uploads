import React, { useState, useCallback, useEffect } from 'react';
import { Uploader } from 'gcp-res-upload';
import './FileUploader.css';

const FileUploader = ({ chunkSize = 5, uploaderId, title }) => {
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
    const accessTokenId = 'e9c1948a-cf6d-466d-8631-706c82e61fc2';
    const secretKey = '4b2f893e-05e7-498f-af0f-67d37354e861';
    const url = 'https://venus-v1.fastpix.dev/on-demand/uploads/v2';
    const requestData = {
      "corsOrigin": "*",
      "pushMediaSettings": {
        "metadata": {
          "key1": "value1"
        },
        "accessPolicy": "public",
        "maxResolution": "1080p"
      }
    };

    const encodedCredentials = btoa(`${accessTokenId}:${secretKey}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${encodedCredentials}`,
          'Content-Type': 'application/json',
          'X-Client-Type': 'web-browser'
        },
        body: JSON.stringify(requestData)
      });
      const data = await response.json();
      if (data?.success) {
        return data?.data?.url;
      }
    } catch (error) {
      setUploadStatus('Error getting signed URL');
      setHasError(true);
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
        delayRetry: 0
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
  }, [chunkSize]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, [chunkSize]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileUpload(droppedFile);
  }, [chunkSize]);

  const handleFileInput = (e) => {
    const selectedFile = e.target.files[0];
    handleFileUpload(selectedFile);
  };

  return (
    <div className="file-uploader">
      <h3 className="uploader-title">{title}</h3>
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
              id={`file-input-${uploaderId}`}
              onChange={handleFileInput}
              accept="video/*"
              style={{ display: 'none' }}
            />
            <label 
              htmlFor={`file-input-${uploaderId}`} 
              className="upload-button"
            >
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
                  className={`control-button ${isPaused ? 'resume' : 'pause'}`}
                  onClick={isPaused ? handleResume : handlePause}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  className={`control-button abort`}
                  onClick={handleAbort}
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