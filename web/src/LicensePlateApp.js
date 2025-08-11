import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function LicensePlateRecognition() {
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [annotated, setAnnotated] = useState(null);
  const [resultText, setResultText] = useState("");
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [streamSrc, setStreamSrc] = useState(null);
  const [themeDark, setThemeDark] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const webcamImgRef = useRef(null);
  const detectingRef = useRef(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const imageURL = URL.createObjectURL(file);
      setPreview(imageURL);
      setStreamSrc(null);
      setAnnotated(null);
      setResultText("");
      setGallery([]);
      setConfidence(null);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      setStreamSrc(videoURL);
      setImage(null);
      setPreview(null);
      setAnnotated(null);
      setResultText("");
      setGallery([]);
      setConfidence(null);
    }
  };

  const handleSubmit = async () => {
    if (!image) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", image);

    try {
      const res = await axios.post(`http://localhost:8000/detect`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnnotated(`data:image/jpeg;base64,${res.data.annotated_image}`);
      setResultText(res.data.text);
      setGallery(res.data.gallery);
      setConfidence(res.data.confidence);
      setStreamSrc(null);
    } catch (err) {
      alert("Lỗi xử lý từ API /detect: " + err);
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setResetting(true);
    setDisabled(true);
    setTimeout(() => {
      setImage(null);
      setVideo(null);
      setPreview(null);
      setResultText("");
      setGallery([]);
      setAnnotated(null);
      setStreamSrc(null);
      setLoading(false);
      setResetting(false);
      setDisabled(false);
      setConfidence(null);
      detectingRef.current = false;
    }, 1000);
  };

  useEffect(() => {
    let animationFrameId;

    const detectFrame = async () => {
      if (
        videoRef.current &&
        !videoRef.current.paused &&
        !videoRef.current.ended &&
        !detectingRef.current &&
        streamSrc.startsWith("blob:")
      ) {
        detectingRef.current = true;
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (!blob || resetting) {
            detectingRef.current = false;
            return;
          }
          const formData = new FormData();
          formData.append("image", blob, "frame.jpg");
          try {
            const res = await axios.post(`http://localhost:8000/detect`, formData);
            setAnnotated(`data:image/jpeg;base64,${res.data.annotated_image}`);
            setResultText(res.data.text);
            setGallery(res.data.gallery);
            setConfidence(res.data.confidence);

            // Pause video nếu có kết quả detect biển số
            if (res.data.text && res.data.text.trim().length > 0 && videoRef.current) {
              // videoRef.current.pause();
            }
          } catch (err) {
            console.error("Video frame detection error", err);
          } finally {
            detectingRef.current = false;
          }
        }, "image/jpeg");
      }
      animationFrameId = requestAnimationFrame(detectFrame);
    };

    if (streamSrc && streamSrc.startsWith("blob:")) {
      animationFrameId = requestAnimationFrame(detectFrame);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [streamSrc, resetting]);

  useEffect(() => {
    if (webcamImgRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const draw = () => {
        if (!webcamImgRef.current || !canvasRef.current) return;
        ctx.drawImage(webcamImgRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        requestAnimationFrame(draw);
      };
      draw();
    }
  }, [streamSrc]);

  return (
    <div className={`${themeDark ? "bg-gray-900 text-white" : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800"} min-h-screen p-6`}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Nhận Diện Biển Số Xe
        </h1>

        <div className="flex flex-wrap justify-center gap-4 mb-8 items-center">
          <label htmlFor="upload">
            <div className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow transition-all cursor-pointer ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
              📷 Chọn Ảnh
            </div>
          </label>
          <input
            type="file"
            id="upload"
            accept="image/*"
            onChange={handleImageChange}
            hidden
            disabled={disabled}
          />

          <button
            onClick={handleSubmit}
            disabled={loading || disabled}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full shadow transition-all"
          >
            {loading ? "⏳ Đang xử lý ảnh..." : "⚙️ Xử lý Ảnh"}
          </button>

          <label htmlFor="video-upload">
            <div className={`bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full shadow transition-all cursor-pointer ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
              🎥 Chọn Video
            </div>
          </label>
          <input
            type="file"
            id="video-upload"
            accept="video/mp4"
            onChange={handleVideoChange}
            hidden
            disabled={disabled}
          />

          <button
            onClick={() => {
              setStreamSrc("http://localhost:8000/webcam");
              setAnnotated(null);
              setResultText("");
              setGallery([]);
              setPreview(null);
              setConfidence(null);
            }}
            disabled={loading || disabled}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full shadow transition-all"
          >
            📹 Webcam
          </button>

          <button
            onClick={resetAll}
            className={`relative flex items-center gap-2 ${themeDark ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-700 hover:bg-gray-800"} text-white px-4 py-2 rounded-full shadow transition-all ${resetting ? "animate-spin" : ""}`}
          >
            {resetting ? "🔄 Đang reset..." : "🔁 Khởi Động Lại"}
          </button>

          <button
            onClick={() => setThemeDark(!themeDark)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full shadow transition-all"
          >
            {themeDark ? "🌞 Chế độ Sáng" : "🌙 Dark Mode"}
          </button>
        </div>

        {preview && annotated && (
          <div className="flex flex-col md:flex-row justify-center items-start gap-8 mt-6 mb-10">
            {/* Ảnh gốc */}
            <div className="text-center w-full md:w-1/2">
              <p className="text-sm mb-2 font-medium text-gray-600 dark:text-gray-300">Ảnh Được Chọn:</p>
              <img
                src={preview}
                alt="Ảnh được chọn"
                className="rounded-xl shadow-lg max-h-72 w-full object-contain border border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* Annotated */}
            <div className="text-center w-full md:w-1/2">
              <p className="text-sm mb-2 font-medium text-gray-600 dark:text-gray-300">Kết Quả Nhận Diện:</p>
              <img
                src={annotated}
                alt="Annotated Result"
                className="rounded-xl shadow-lg max-h-72 w-full object-contain border border-green-500"
              />
              {confidence !== null && (
                <p className="text-green-600 dark:text-green-400 font-semibold mt-2">
                  Độ chính xác: {confidence.toFixed(2)}%
                </p>
              )}
            </div>
          </div>
        )}

        {(resultText || gallery.length > 0) && (
          <div className="flex flex-col md:flex-row justify-center items-start gap-8 mb-10 w-full">
            {/* Text kết quả */}
            {resultText && (
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md w-full md:w-1/3 border border-gray-200 dark:border-gray-600">
                <p className="font-semibold text-sm mb-2 text-gray-800 dark:text-white">Kết Quả Biển Số:</p>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {resultText}
                </div>
              </div>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="w-full md:w-2/3">
                <h2 className="text-xl font-semibold mb-4 text-center text-gray-800 dark:text-white">
                  Danh Sách Biển Số Nhận Diện:
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {gallery.map((item, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-2 border border-gray-200 dark:border-gray-600"
                    >
                      <img
                        src={`data:image/jpeg;base64,${item.image}`}
                        alt={`plate-${i}`}
                        className="rounded-lg mb-2 w-full object-contain"
                      />
                      <p className="text-sm text-center font-medium text-gray-800 dark:text-gray-200">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}



        {streamSrc && streamSrc.startsWith("blob:") && (
          <div className="mt-4 text-center">
            <p className="text-sm mb-1">Video Đang Chạy:</p>
            <video
              ref={videoRef}
              src={streamSrc}
              controls
              autoPlay
              muted
              className="rounded-lg shadow-md max-h-72 mx-auto"
            />
          </div>
        )}

        {streamSrc === "http://localhost:8000/webcam" && (
          <div className="mt-4 text-center">
            <p className="text-sm mb-1">Webcam Stream:</p>
            <div className="relative inline-block">
              <img
                ref={webcamImgRef}
                src={streamSrc}
                alt="Webcam Stream"
                className="hidden"
                onLoad={() => {
                  if (canvasRef.current && webcamImgRef.current) {
                    canvasRef.current.width = webcamImgRef.current.naturalWidth;
                    canvasRef.current.height = webcamImgRef.current.naturalHeight;
                  }
                }}
              />
              <canvas ref={canvasRef} className="rounded-lg shadow-md max-h-96 mx-auto border border-gray-300" />
            </div>
          </div>
        )}



      </div>
    </div>
  );
}