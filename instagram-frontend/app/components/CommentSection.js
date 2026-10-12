"use client";

import { useEffect, useState } from "react";
import { EmojiIcon, HeartIcon, PersonIcon } from "./Icons";
import {
  addComment,
  formatDate,
  getComments,
  mediaUrl,
  useCurrentUser,
} from "@/lib/api";

/**
 * Comments of one post, laid out like Instagram: the list first and the
 * "Add a comment…" row pinned at the bottom of the post.
 */
export default function CommentSection({ postId, onCommentAdded, onClose }) {
  const currentUser = useCurrentUser();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState({});

  async function load() {
    setError("");
    try {
      setComments(await getComments(postId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    if (!currentUser) {
      setError("Pick an account in the More menu to comment.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await addComment(postId, currentUser.id, text.trim());
      setText("");
      await load();
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="comment-section">
      {loading && <div className="loading">Loading comments…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && comments.length === 0 && !error && (
        <div className="empty" style={{ padding: "18px 0" }}>
          No comments yet.
          <br />
          Start the conversation.
        </div>
      )}

      {comments.map((comment) => (
        <div className="comment" key={comment.id}>
          <span className="avatar">
            {comment.user?.profileImage ? (
              <img src={mediaUrl(comment.user.profileImage)} alt="" />
            ) : (
              <PersonIcon size={18} />
            )}
          </span>
          <div className="comment-body">
            <span className="user">{comment.user?.username}</span>
            {comment.text}
            <div className="comment-meta">
              <span>{formatDate(comment.createdAt)}</span>
            </div>
          </div>
          <button
            className="comment-like"
            aria-label="Like comment"
            onClick={() => setLiked((l) => ({ ...l, [comment.id]: !l[comment.id] }))}
          >
            <HeartIcon size={12} filled={!!liked[comment.id]} />
          </button>
        </div>
      ))}

      <form
        className={`add-comment ${text.trim() ? "has-text" : ""}`}
        onSubmit={handleSubmit}
      >
        <button type="button" className="emoji" aria-label="Emoji" tabIndex={-1}>
          <EmojiIcon />
        </button>
        <input
          type="text"
          value={text}
          maxLength={500}
          placeholder="Add a comment…"
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn-link" type="submit" disabled={sending}>
          {sending ? "Posting…" : "Post"}
        </button>
      </form>

      {onClose && (
        <div style={{ padding: "4px 0 6px" }}>
          <button className="btn-link" style={{ paddingLeft: 0 }} onClick={onClose}>
            Hide comments
          </button>
        </div>
      )}
    </div>
  );
}
