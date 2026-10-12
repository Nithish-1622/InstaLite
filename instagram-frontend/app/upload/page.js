"use client";

import { useState } from "react";
import Link from "next/link";
import { uploadPost, useCurrentUser } from "@/lib/api";

/**
 * Upload page: pick an image or short video, add a caption, publish.
 * The file goes to Spring Boot as multipart/form-data.
 */
export default function UploadPage() {
  const currentUser = useCurrentUser();
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function handleFile(event) {
    const selected = event.target.files && event.target.files[0];
    setFile(selected || null);
    setMessage("");
    setError("");
    if (!selected) {
      setPreview("");
      return;
    }
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!currentUser) {
      setError("Select or create a user in the top bar first.");
      return;
    }
    if (!file) {
      setError("Please choose an image or a short video.");
      return;
    }

    setBusy(true);
    try {
      const post = await uploadPost({
        file,
        caption,
        userId: currentUser.id,
      });
      setMessage(`Post #${post.id} published!`);
      setFile(null);
      setCaption("");
      setPreview("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="page-title">Upload Media</h1>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Posting as</label>
            <span className="muted">
              {currentUser ? currentUser.username : "no user selected yet"}
            </span>
          </div>

          <div className="form-row">
            <label htmlFor="file">Photo or short video</label>
            <input
              id="file"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
              onChange={handleFile}
            />
            <span className="muted">JPG, PNG, GIF, WEBP, MP4, WEBM, MOV - max 50 MB</span>
            {preview &&
              (file && file.type.startsWith("video/") ? (
                <video className="preview" src={preview} controls />
              ) : (
                <img className="preview" src={preview} alt="preview" />
              ))}
          </div>

          <div className="form-row">
            <label htmlFor="caption">Caption</label>
            <textarea
              id="caption"
              rows={3}
              maxLength={500}
              placeholder="Write a caption…"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {error && <div className="error">{error}</div>}
          {message && (
            <div className="success">
              {message} <Link href="/">Go to the feed →</Link>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Uploading…" : "Publish post"}
          </button>
        </form>
      </div>
    </>
  );
}
