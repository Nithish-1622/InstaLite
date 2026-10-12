"use client";

import { useState } from "react";
import Link from "next/link";
import CommentSection from "./CommentSection";
import {
  formatDate,
  likePost,
  mediaUrl,
  unlikePost,
  useCurrentUser,
} from "@/lib/api";

/**
 * One post in the feed: media (image or video), author, caption,
 * like button and the comment section.
 */
export default function PostCard({ post, onChanged }) {
  const currentUser = useCurrentUser();
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [liked, setLiked] = useState(!!post.likedByCurrentUser);
  const [showComments, setShowComments] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggleLike() {
    if (!currentUser) {
      setError("Select a user in the top bar first.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setError("");
    // Optimistic update: change the UI first, then call the API.
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      if (next) {
        await likePost(post.id, currentUser.id);
      } else {
        await unlikePost(post.id, currentUser.id);
      }
      if (onChanged) onChanged();
    } catch (err) {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const author = post.user || {};

  return (
    <article className="card">
      <div className="post-header">
        <div className="avatar">
          {author.profileImage ? (
            <img src={mediaUrl(author.profileImage)} alt={author.username} />
          ) : (
            (author.username || "?").charAt(0).toUpperCase()
          )}
        </div>
        <Link href={`/profile/${author.id}`} className="username">
          {author.username}
        </Link>
        <span className="muted" style={{ marginLeft: "auto" }}>
          {formatDate(post.createdAt)}
        </span>
      </div>

      {post.mediaType === "VIDEO" ? (
        <video
          className="post-media"
          src={mediaUrl(post.mediaUrl)}
          controls
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          className="post-media"
          src={mediaUrl(post.mediaUrl)}
          alt={post.caption || "post"}
        />
      )}

      <div className="post-actions">
        <button
          className={`btn btn-like ${liked ? "liked" : ""}`}
          onClick={toggleLike}
          disabled={busy}
          aria-label={liked ? "Unlike post" : "Like post"}
        >
          {liked ? "♥" : "♡"}
        </button>
        <span className="like-count">{likeCount} likes</span>
        <button
          className="btn btn-like"
          onClick={() => setShowComments((v) => !v)}
          aria-label="Toggle comments"
        >
          💬
        </button>
        <span className="muted">{post.commentCount} comments</span>
      </div>

      <div className="post-body">
        <p className="caption">
          <strong>{author.username}</strong>
          {post.caption}
        </p>
        <div className="post-meta">Posted {formatDate(post.createdAt)}</div>
        {error && <div className="error">{error}</div>}
      </div>

      {showComments && (
        <CommentSection postId={post.id} onCommentAdded={onChanged} />
      )}
    </article>
  );
}
