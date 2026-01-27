import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const FileUpload = ({ user_id, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error

  const handleUpload = async () => {
    // Ensuring a file and valid User ID are present
    if (!file) return;
    if (!user_id) {
      console.error("Upload blocked: Missing Authenticated User ID");
      setStatus('error');
      return;
    }

    setStatus('uploading');
    const formData = new FormData();
    // Appending file and user_id to match FastAPI backend requirements
    formData.append('file', file); 
    formData.append('user_id', user_id); 

    try {
      // POST request to the local FastAPI upload endpoint
      const response = await axios.post("https://fintech-backend-gufe.onrender.com/upload", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.status === "success") {
        setStatus('success');
        // Success feedback and UI reset before triggering App.jsx refresh
        setTimeout(() => {
          onUploadSuccess();
          setFile(null);
          setStatus('idle');
        }, 1500);
      } else {
        throw new Error(response.data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Neural Ingestion Error:", error);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-fintech-card border border-white/5 rounded-[2.5rem] p-12 text-center shadow-2xl">
      <h2 className="text-4xl font-bold mb-4 text-white">Ingestion Portal</h2>
      <p className="text-gray-400 mb-12">Drop your bank statements (PDF/CSV) to begin the analysis</p>

      {/* The Sky Blue themed dropzone */}
      <div className="relative border-2 border-dashed border-white/10 rounded-3xl p-16 group hover:border-fintech-accent/50 transition-colors cursor-pointer bg-white/[0.02]">
        <input 
          type="file" 
          accept=".pdf,.csv"
          className="absolute inset-0 opacity-0 cursor-pointer z-20" 
          onChange={(e) => {
              setFile(e.target.files[0]);
              setStatus('idle');
          }} 
        />
        <div className="flex flex-col items-center gap-6">
          <div className="p-5 bg-fintech-accent/10 rounded-2xl text-fintech-accent group-hover:scale-110 transition-transform">
            {file ? <FileText size={48}/> : <UploadCloud size={48} />}
          </div>
          <div>
            <p className="text-xl font-semibold text-white">{file ? file.name : "Choose a file"}</p>
            <p className="text-gray-500 text-sm mt-2">Maximum file size: 25MB</p>
          </div>
        </div>
      </div>

      <button 
        onClick={handleUpload}
        disabled={!file || status === 'uploading'}
        className="mt-10 w-full py-5 bg-fintech-accent text-fintech-primary font-black text-lg rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-fintech-accent/20 disabled:opacity-50 cursor-pointer"
      >
        {status === 'uploading' ? (
          <span className="flex items-center justify-center gap-3"><Loader2 className="animate-spin"/> Syncing with Grok AI...</span>
        ) : status === 'success' ? (
          <span className="flex items-center justify-center gap-3"><CheckCircle /> Analysis Complete</span>
        ) : status === 'error' ? (
          <span className="flex items-center justify-center gap-3"><AlertCircle /> Error - Check Console</span>
        ) : (
          "Analyze Transactions"
        )}
      </button>
    </div>
  );
};

export default FileUpload;
