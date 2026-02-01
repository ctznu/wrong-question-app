	import React, { useState, useRef } from 'react';
	import { Upload, Sparkles } from 'lucide-react';
	function UploadArea({ onUpload, loading }) {
	  const [isDragging, setIsDragging] = useState(false);
	  const fileInputRef = useRef(null);
	  const handleDragOver = (e) => {
	    e.preventDefault();
	    setIsDragging(true);
	  };
	  const handleDragLeave = (e) => {
	    e.preventDefault();
	    setIsDragging(false);
	  };
	  const handleDrop = (e) => {
	    e.preventDefault();
	    setIsDragging(false);
	    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
	      handleFile(e.dataTransfer.files[0]);
	    }
	  };
	  const handleFileChange = (e) => {
	    if (e.target.files && e.target.files[0]) {
	      handleFile(e.target.files[0]);
	    }
	  };
	  const handleFile = (file) => {
	    onUpload(file);
	  };
	  return (
	    <div className={`upload-zone ${isDragging ? 'active' : ''}`}>
	      <input
	        type="file"
	        ref={fileInputRef}
	        onChange={handleFileChange}
	        style={{ display: 'none' }}
	        accept="image/*"
	      />
	      <div 
	        className="upload-content" 
	        onClick={() => !loading && fileInputRef.current.click()}
	        onDragOver={handleDragOver}
	        onDragLeave={handleDragLeave}
	        onDrop={handleDrop}
	      >
	        {loading ? (
	          <div className="loading-state">
	            <Sparkles className="animate-spin" />
	            <p>正在识别错题与知识点...</p>
	          </div>
	        ) : (
	          <>
	            <Upload size={48} className="upload-icon" />
	            <p>点击或拖拽上传试卷照片</p>
	            <small>系统将自动识别学科并生成易错点分析</small>
	          </>
	        )}
	      </div>
	    </div>
	  );
	}
	export default UploadArea;