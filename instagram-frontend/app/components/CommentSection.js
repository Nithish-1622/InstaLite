"use client";

import { useEffect, useState } from "react";
import { addComment, formatDate, getComments, useCurrentUser } from "@/lib/api";

/**
 * Comments for a single post: loads them from
 * GET /api/posts/{id}/comments and posts new ones to
 * POST /api/posts/{id}/comments.
 */
export default function CommentSection({ postId, onCommentAdded }) {
  const currentUser = useCurrentUser();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

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
      setError("Select a user in the top bar to comment.");
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
      {loading && <div className="muted">Loading comments…</div>}
      {error && <div className="error">{error}</div>}

      {!loading && comments.length === 0 && !error && (
        <div className="muted">No comments yet. Be the first.</div>
      )}

      {comments.map((comment) => (
        <div className="comment" key={comment.id}>
          <div className="avatar">
            {(comment.user?.username || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{comment.user?.username}</strong> {comment.text}
            <div className="muted">{formatDate(comment.createdAt)}</div>
          </div>
        </div>
      ))}

      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          maxLength={500}
          placeholder="Add a comment…"
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn btn-primary btn-small" type="submit" disabled={sending}>
          {sending ? "…" : "Post"}
        </button>
      </form>
    </div>
  );
}
