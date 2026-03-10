import { useState } from "react";
import axios from "axios";

const api_url = "https://itransitionprojectwork-production.up.railway.app";

function AvatarUpload({ currentImage, onUpload, uploadUrl }) {
  const [preview, setPreview] = useState(currentImage || null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const token = localStorage.getItem("userToken");
      const res = await axios.post(
        uploadUrl,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      );
      onUpload(res.data.imageUrl);
    } catch (err) {
      console.error("Upload failed", err);
      const msg = err.response?.data?.message || err.message || "Image upload failed";
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="d-flex flex-column align-items-center gap-2">
      <div style={{
        width: 100, height: 100, borderRadius: "50%",
        overflow: "hidden", border: "3px solid #dee2e6",
        background: "#f8f9fa", display: "flex",
        alignItems: "center", justifyContent: "center"
      }}>
        {preview
          ? <img src={preview} alt="avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 40 }}>👤</span>
        }
      </div>

      <label className="btn btn-outline-secondary btn-sm" style={{ cursor: "pointer" }}>
        {uploading
          ? <><span className="spinner-border spinner-border-sm me-1" />Uploading...</>
          : preview ? "Change photo" : "Upload photo"
        }
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      {preview && !uploading && (
        <button
          type="button"
          className="btn btn-link btn-sm text-danger p-0"
          onClick={() => { setPreview(null); onUpload(""); }}
        >
          Remove photo
        </button>
      )}
    </div>
  );
}

export default AvatarUpload;