"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CommentSection from "./CommentSection";
import {
  BookmarkIcon,
  CommentIcon,
  HeartIcon,
  MoreIcon,
  PersonIcon,
  SendIcon,
} from "./Icons";
import {
  formatDate,
  likePost,
  mediaUrl,
  unlikePost,
  useCurrentUser,
} from "@/lib/api";

/**
 * One post in the feed, laid out like an Instagram post:
 * header -> media -> actions -> likes -> caption -> comments -> timestamp.
 */
export default function PostCard({ post, onChanged }) {
  const currentUser = useCurrentUser();
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [liked, setLiked] = useState(!!post.likedByCurrentUser);
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // Keep the local like state in sync when the feed is re-fetched, e.g. after
  // the demo user switched or a like/comment request finished.
  useEffect(() => {
    setLiked(!!post.likedByCurrentUser);
    setLikeCount(post.likeCount || 0);
  }, [post.likedByCurrentUser, post.likeCount]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2400);
    return () => clearTimeout(timer);
  }, [notice]);

  async function toggleLike() {
    if (!currentUser) {
      setError("Pick an account in the More menu first.");
      return;
    }
    if (busy) return;
    setBusy(true);
    setError("");
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
  const caption = post.caption || "";
  const longCaption = caption.length > 90;

  return (
    <article className="post">
      <header className="post-header">
        <span className="ring">
          <Link href={`/profile/${author.id}`} className="avatar">
            {author.profileImage ? (
              <img src={mediaUrl(author.profileImage)} alt={author.username} />
            ) : (
              <PersonIcon size={18} />
            )}
          </Link>
        </span>
        <Link href={`/profile/${author.id}`} className="post-username">
          {author.username}
        </Link>
        <span className="post-sep">•</span>
        <span className="post-ago">{formatDate(post.createdAt)}</span>
        <button
          className="post-more"
          aria-label="More options"
          onClick={() => setNotice("More options are not part of this demo.")}
        >
          <MoreIcon />
        </button>
      </header>

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
          alt={caption || "post"}
        />
      )}

      <div className="post-actions">
        <button
          onClick={toggleLike}
          disabled={busy}
          aria-label={liked ? "Unlike post" : "Like post"}
          title={liked ? "Unlike" : "Like"}
        >
          <HeartIcon filled={liked} />
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          aria-label="Toggle comments"
          title="Comment"
        >
          <CommentIcon />
        </button>
        <button
          onClick={() => setNotice("Sharing is not part of this demo.")}
          aria-label="Share post"
          title="Share"
        >
          <SendIcon />
        </button>
        <button
          className="save"
          onClick={() => setSaved((v) => !v)}
          aria-label={saved ? "Remove from saved" : "Save"}
          title="Save"
        >
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      <div className="post-likes">{likeCount} likes</div>

      <div className="post-caption">
        <span className="user">{author.username}</span>
        <span className={`text ${!expanded && longCaption ? "clamped" : ""}`}>
          {caption}
        </span>
        {longCaption && (
          <button className="more" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "less" : "more"}
          </button>
        )}
      </div>

      {post.commentCount > 0 && !showComments && (
        <button
          className="post-viewall"
          onClick={() => setShowComments(true)}
        >
          View all {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
        </button>
      )}

      <div className="post-time">{formatDate(post.createdAt)}</div>

      {error && (
        <div style={{ padding: "8px 14px 0" }}>
          <div className="error">{error}</div>
        </div>
      )}

      {showComments && (
        <CommentSection postId={post.id} onCommentAdded={onChanged} onClose={() => setShowComments(false)} />
      )}

      {notice && <div className="toast">{notice}</div>}
    </article>
  );
}
