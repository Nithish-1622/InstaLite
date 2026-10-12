"use client";

import { useCallback, useEffect, useState } from "react";
import PostCard from "./PostCard";
import Stories from "./Stories";
import { getPosts, useCurrentUser } from "@/lib/api";

/**
 * The home feed (or a single user's posts when `userId` is given).
 * Loads data from GET /api/posts with fetch() and shows
 * loading / error / empty states. Reloads whenever the selected
 * demo user changes, so like buttons always match that user.
 */
export default function Feed({ userId }) {
  const currentUser = useCurrentUser();
  const [posts, setPosts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await getPosts(userId, currentUser ? currentUser.id : null);
      setPosts(data);
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    }
  }, [userId, currentUser ? currentUser.id : null]);

  useEffect(() => {
    load();
  }, [load]);

  // Show the spinner only for the very first load: later refreshes (after a
  // like or a comment) keep the current cards on screen so an open comment
  // section is not thrown away.
  if (!loaded) {
    return (
      <div>
        {error ? (
          <div>
            <div className="error">{error}</div>
            <button className="btn" onClick={load}>
              Retry
            </button>
          </div>
        ) : (
          <div className="loading">Loading posts…</div>
        )}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="empty">
        No posts yet. Open the Upload page to publish the first one.
      </div>
    );
  }

  return (
    <div>
      {!userId && <Stories />}
      {error && <div className="error">{error}</div>}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onChanged={load} />
      ))}
    </div>
  );
}
