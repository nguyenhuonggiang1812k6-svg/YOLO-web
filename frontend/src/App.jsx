import React, { useState, useRef } from 'react';
import axios from 'axios';

const css = `
.od { --bg:#eef1ee; --panel:#fff; --ink:#18241f; --muted:#5d6b64; --line:#d7ded9; --accent:#0f766e; --accent-d:#0b5a54; --warn:#b42318;
  min-height:100vh; background:var(--bg); color:var(--ink); font-family:'Inter','Segoe UI',system-ui,sans-serif; padding:32px 20px; box-sizing:border-box; }
.od *, .od *::before, .od *::after { box-sizing:border-box; }
.od-wrap { max-width:1100px; margin:0 auto; }
.od-head { margin-bottom:24px; }
.od-head h1 { margin:0 0 6px; font-size:28px; font-weight:700; letter-spacing:-0.02em; }
.od-head p { margin:0; color:var(--muted); font-size:15px; }
.od-grid { display:grid; grid-template-columns:320px 1fr; gap:20px; align-items:start; }
.od-panel { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:20px; }
.od-side { display:flex; flex-direction:column; gap:22px; }
.od-label { display:block; font-size:14px; font-weight:600; margin-bottom:10px; }
.od-drop { border:1.5px dashed #9fb0a8; border-radius:8px; padding:26px 14px; text-align:center; cursor:pointer; background:#f7f9f7; transition:border-color .15s, background .15s; }
.od-drop:hover, .od-drop.over { border-color:var(--accent); background:#eaf5f3; }
.od-drop:focus-visible, .od-btn:focus-visible, .od-range:focus-visible { outline:3px solid #5eead4; outline-offset:2px; }
.od-drop strong { display:block; font-size:14px; margin-bottom:4px; }
.od-drop span { font-size:13px; color:var(--muted); word-break:break-all; }
.od-row { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:10px; }
.od-row .od-label { margin:0; }
.od-val { font-variant-numeric:tabular-nums; font-weight:700; color:var(--accent); font-size:18px; }
.od-range { width:100%; accent-color:var(--accent); cursor:pointer; }
.od-hint { display:flex; justify-content:space-between; font-size:12px; color:var(--muted); margin-top:6px; }
.od-help { font-size:13px; color:var(--muted); margin:8px 0 0; line-height:1.5; }
.od-btn { width:100%; padding:13px 16px; font-size:15px; font-weight:600; border:0; border-radius:8px; background:var(--accent); color:#fff; cursor:pointer; transition:background .15s; }
.od-btn:hover:not(:disabled) { background:var(--accent-d); }
.od-btn:disabled { background:#a8bdb8; cursor:not-allowed; }
.od-btn.ghost { background:transparent; color:var(--accent); border:1px solid var(--accent); padding:8px 14px; width:auto; font-size:13px; text-decoration:none; display:inline-block; }
.od-btn.ghost:hover { background:#eaf5f3; }
.od-err { background:#fef3f2; border:1px solid #fecdca; color:var(--warn); border-radius:8px; padding:10px 12px; font-size:13px; line-height:1.5; }
.od-status { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; min-height:34px; }
.od-time { font-size:14px; color:var(--muted); }
.od-time b { color:var(--ink); font-variant-numeric:tabular-nums; }
.od-views { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.od-view h3 { margin:0 0 8px; font-size:14px; font-weight:600; }
.od-frame { border:1px solid var(--line); border-radius:8px; background:#f2f5f3; min-height:280px; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative; }
.od-frame img { max-width:100%; max-height:420px; display:block; }
.od-empty { color:var(--muted); font-size:14px; padding:20px; text-align:center; }
.od-busy { position:absolute; inset:0; background:rgba(255,255,255,.8); display:flex; align-items:center; justify-content:center; flex-direction:column; gap:10px; font-size:14px; color:var(--accent-d); }
.od-spin { width:28px; height:28px; border:3px solid #cfe5e1; border-top-color:var(--accent); border-radius:50%; animation:odspin .8s linear infinite; }
@keyframes odspin { to { transform:rotate(360deg); } }
@media (prefers-reduced-motion:reduce) { .od-spin { animation-duration:2s; } }
@media (max-width:860px) { .od-grid { grid-template-columns:1fr; } .od-views { grid-template-columns:1fr; } }
`;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [confidence, setConfidence] = useState(0.25);
  const [loading, setLoading] = useState(false);
  const [inferenceTime, setInferenceTime] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  // Xử lý khi người dùng chọn file ảnh
  const loadFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultImage(null);
      setInferenceTime(null);
      setError(null);
    }
  };

  const handleFileChange = (e) => {
    loadFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    loadFile(e.dataTransfer.files[0]);
  };

  // Gửi ảnh sang Backend FastAPI (cổng 8000) — logic giữ nguyên
  const handleDetect = async () => {
    if (!selectedFile) {
      setError("Vui lòng chọn một bức ảnh trước!");
      return;
    }

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("conf_threshold", confidence);

    try {
      const response = await axios.post("http://127.0.0.1:8000/detect", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setResultImage(response.data.image_result);
      setInferenceTime(response.data.time);
    } catch (error) {
      console.error("Lỗi khi kết nối Backend:", error);
      setError("Không thể kết nối đến Backend hoặc xử lý thất bại! Hãy đảm bảo FastAPI đang chạy ở port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const resultSrc = resultImage
    ? (resultImage.startsWith('data:') ? resultImage : `data:image/jpeg;base64,${resultImage}`)
    : null;

  return (
    <div className="od">
      <style>{css}</style>
      <div className="od-wrap">
        <header className="od-head">
          <h1>Nhận diện vật thể</h1>
          <p>Tải ảnh lên, chọn độ tin cậy và xem YOLO đánh dấu các vật thể trong ảnh.</p>
        </header>

        <div className="od-grid">
          {/* Khu vực điều khiển */}
          <aside className="od-panel od-side">
            <div>
              <span className="od-label">Hình ảnh</span>
              <div
                className={`od-drop${dragOver ? ' over' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <strong>{selectedFile ? "Đổi ảnh khác" : "Chọn hoặc kéo thả ảnh vào đây"}</strong>
                <span>{selectedFile ? selectedFile.name : "JPG, PNG, WEBP"}</span>
              </div>
              <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />
            </div>

            <div>
              <div className="od-row">
                <label className="od-label" htmlFor="conf">Độ tin cậy tối thiểu</label>
                <span className="od-val">{confidence.toFixed(2)}</span>
              </div>
              <input
                id="conf"
                className="od-range"
                type="range"
                min="0.05"
                max="1.0"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
              />
              <div className="od-hint"><span>Nhiều vật thể</span><span>Chính xác hơn</span></div>
              <p className="od-help">Chỉ hiển thị vật thể có độ tin cậy từ mức này trở lên.</p>
            </div>

            {error && <div className="od-err" role="alert">{error}</div>}

            <button className="od-btn" onClick={handleDetect} disabled={loading || !selectedFile}>
              {loading ? "Đang phân tích…" : "Phát hiện vật thể"}
            </button>
          </aside>

          {/* Kết quả */}
          <section className="od-panel" aria-live="polite">
            <div className="od-status">
              <div className="od-time">
                {inferenceTime ? <>Xử lý trong <b>{inferenceTime}</b> giây</> : "Chưa có kết quả"}
              </div>
              {resultSrc && (
                <a className="od-btn ghost" href={resultSrc} download="ket-qua-nhan-dien.jpg">Tải ảnh kết quả</a>
              )}
            </div>

            <div className="od-views">
              <div className="od-view">
                <h3>Ảnh gốc</h3>
                <div className="od-frame">
                  {previewUrl
                    ? <img src={previewUrl} alt="Ảnh gốc" />
                    : <div className="od-empty">Ảnh bạn chọn sẽ hiện ở đây.</div>}
                </div>
              </div>

              <div className="od-view">
                <h3>Kết quả YOLO</h3>
                <div className="od-frame">
                  {resultSrc
                    ? <img src={resultSrc} alt="Kết quả nhận diện" />
                    : <div className="od-empty">Nhấn “Phát hiện vật thể” để xem kết quả.</div>}
                  {loading && (
                    <div className="od-busy"><div className="od-spin" />Đang chạy mô hình</div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
