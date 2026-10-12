"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackIcon, MediaIcon, PersonIcon } from "../components/Icons";
import { uploadPost, useCurrentUser } from "@/lib/api";

/**
 * "Create new post" dialog, styled like Instagram:
 *   step 1 - pick a photo/video
 *   step 2 - preview + caption + Share
 */
export default function UploadPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [caption, setCaption] = useState("");
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(false);

  function handleFile(event) {
    const selected = event.target.files && event.target.files[0];
    setError("");
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStep(2);
  }

  async function share() {
    setError("");
    if (!currentUser) {
      setError("Pick an account in the More menu first.");
      return;
    }
    setBusy(true);
    try {
      await uploadPost({ file, caption, userId: currentUser.id });
      setShared(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay">
      <div className="dialog dialog-wide">
        <div className="dialog-header">
          {step === 2 && !shared && (
            <button
              className="lead"
              aria-label="Back"
              onClick={() => setStep(1)}
            >
              <BackIcon />
            </button>
          )}
          {step === 1 && !shared && (
            <button
              className="lead"
              aria-label="Close"
              onClick={() => router.push("/")}
            >
              <BackIcon />
            </button>
          )}
          Create new post
          {step === 2 && !shared && (
            <button
              className="btn-link trail"
              onClick={share}
              disabled={busy || !file}
              style={{ fontSize: 15 }}
            >
              {busy ? "Sharing…" : "Share"}
            </button>
          )}
        </div>

        {shared ? (
          <div className="dialog-body" style={{ textAlign: "center", padding: "46px 24px" }}>
            <div style={{ color: "#2e7d32", fontSize: 40, lineHeight: 1 }}>✓</div>
            <h2 style={{ fontWeight: 400, margin: "14px 0 6px" }}>
              Your post has been shared.
            </h2>
            <p className="meta-caption">It is now at the top of the home feed.</p>
            <button className="btn btn-primary" onClick={() => router.push("/")}>
              Go to the feed
            </button>
          </div>
        ) : step === 1 ? (
          <div className="dropzone">
            <MediaIcon />
            <h2>Drag photos and videos here</h2>
            <label className="btn btn-primary" style={{ cursor: "pointer" }}>
              Select from computer
              <input
                className="hidden-input"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                onChange={handleFile}
              />
            </label>
            <div className="meta-caption">
              JPG, PNG, GIF, WEBP, MP4, WEBM or MOV · max 50 MB
            </div>
            {error && <div className="error">{error}</div>}
          </div>
        ) : (
          <div className="share-step">
            <div className="share-preview">
              {file && file.type.startsWith("video/") ? (
                <video src={preview} controls playsInline />
              ) : (
                <img src={preview} alt="preview" />
              )}
            </div>
            <div className="share-caption">
              <div className="who">
                <span className="avatar" style={{ width: 28, height: 28 }}>
                  {currentUser ? <PersonIcon size={16} /> : null}
                </span>
                {currentUser ? currentUser.username : "no account"}
              </div>
              <textarea
                rows={6}
                maxLength={500}
                placeholder="Write a caption…"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              <div className="meta-caption">{caption.length}/500</div>
              {message && <div className="success">{message}</div>}
              {error && <div className="error">{error}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
