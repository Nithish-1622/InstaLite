"use client";

import { useCallback, useEffect, useState } from "react";
import PostCard from "./PostCard";
import { getPosts } from "@/lib/api";

/**
 * The home feed (or a single user's posts when `userId` is given).
 * Loads data from GET /api/posts with fetch() and shows
 * loading / error / empty states.
 */
export default function Feed({ userId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPosts(userId);
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="loading">Loading posts…</div>;
  }

  if (error) {
    return (
      <div>
        <div className="error">{error}</div>
        <button className="btn" onClick={load}>
          Retry
        </button>
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
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onChanged={load} />
      ))}
    </div>
  );
}
