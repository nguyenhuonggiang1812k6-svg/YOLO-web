import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [confidence, setConfidence] = useState(0.25);
  const [loading, setLoading] = useState(false);
  const [inferenceTime, setInferenceTime] = useState(null);

  // Xử lý khi người dùng chọn file ảnh
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultImage(null);
      setInferenceTime(null);
    }
  };

  // Gửi ảnh sang Backend FastAPI (cổng 8000)
  const handleDetect = async () => {
    if (!selectedFile) {
      alert("Vui lòng chọn một bức ảnh trước!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("conf_threshold", confidence);

    try {
      const response = await axios.post("http://127.0.0.1:8000/detect", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Nhận kết quả từ Backend
      setResultImage(response.data.image_result); // dạng base64 hoặc url ảnh
      setInferenceTime(response.data.time);
    } catch (error) {
      console.error("Lỗi khi kết nối Backend:", error);
      alert("Không thể kết nối đến Backend hoặc xử lý thất bại! Hãy đảm bảo FastAPI đang chạy ở port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "30px auto", fontFamily: "Arial, sans-serif", padding: "20px" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>Hệ Thống Nhận Diện Ảnh YOLOv8</h1>

      {/* Khu vực tải ảnh & cấu hình */}
      <div style={{ background: "#f8f9fa", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
        <div style={{ marginBottom: "15px" }}>
          <label><b>Chọn file ảnh (JPG, PNG): </b></label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label><b>Độ tin cậy (Confidence Threshold): {confidence}</b></label>
          <br />
          <input 
            type="range" 
            min="0.05" 
            max="1.0" 
            step="0.05" 
            value={confidence} 
            onChange={(e) => setConfidence(parseFloat(e.target.value))} 
            style={{ width: "100%", marginTop: "5px" }}
          />
        </div>

        <button 
          onClick={handleDetect} 
          disabled={loading || !selectedFile}
          style={{
            padding: "10px 24px",
            fontSize: "16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Đang xử lý..." : "Phát hiện đối tượng"}
        </button>
      </div>

      {inferenceTime && (
        <p style={{ textAlign: "center", color: "#28a745", fontWeight: "bold" }}>
          Thời gian xử lý: {inferenceTime}s
        </p>
      )}

      {/* Hiển thị 
ảnh gốc và ảnh kết quả song song */}
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
        {previewUrl && (
          <div style={{ flex: "1", minWidth: "300px", textAlign: "center" }}>
            <h3>Ảnh gốc</h3>
            <img src={previewUrl} alt="Ảnh gốc" style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "6px" }} />
          </div>
        )}

        {resultImage && (
          <div style={{ flex: "1", minWidth: "300px", textAlign: "center" }}>
            <h3>Ảnh kết quả phát hiện</h3>
            <img 
              src={resultImage.startsWith('data:') ? resultImage : `data:image/jpeg;base64,${resultImage}`} 
              alt="Kết quả" 
              style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "6px" }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
    
