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
  };

  const getSignedUrl = async () => {
    const accessTokenId = 'a0abcf55-b8c4-4527-8363-c036ef093196';
    const secretKey = '71b2d7f0-ac73-4388-bc9c-6568be59edc2';
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
        setSignedUrl(data?.data?.url);
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
    
    const url = await getSignedUrl();
    if (!url) return;

    const uploader = Uploader.init({
      endpoint: url,
      file: selectedFile,
      chunkSize: chunkSize * 1024,
    });

    setFileUploader(uploader);

    uploader.on("progress", (event) => {
      console.log("Upload Progress:", event.detail);
      setUploadProgress(event.detail.progress);
      setUploadStatus(`Uploading: ${Math.round(event.detail.progress)}%`);
    });

    uploader.on("error", (event) => {
      console.error("Upload Error:", event.detail.message);
      setUploadStatus(`Error: ${event.detail.message}`);
    });

    uploader.on("success", (event) => {
      setUploadStatus('Upload Completed Successfully');
      setIsUploadComplete(true);
    });

    uploader.on("attempt", (event) => {
      console.log("Chunk Upload Attempt:", event.detail);
    });

    uploader.on("chunkAttemptFailure", (event) => {
      console.log("Chunk Attempt Failure:", event.detail);
      setUploadStatus('Chunk upload failed, retrying...');
    });

    uploader.on("chunkSuccess", (event) => {
      console.log("Chunk Successfully Uploaded:", event.detail);
    });

    uploader.on("offline", (event) => {
      setUploadStatus(event.detail.message);
    });
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
          <p className="status">{uploadStatus}</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <div className="control-buttons-container">
            {uploadProgress > 0 && uploadProgress < 100 && !isAborted && (
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
            {(isUploadComplete || isAborted) && (
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