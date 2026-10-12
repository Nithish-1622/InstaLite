"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PostCard from "../../components/PostCard";
import {
  CommentIcon,
  GridIcon,
  HeartIcon,
  PersonIcon,
  ReelsTabIcon,
  SettingsIcon,
  TaggedIcon,
} from "../../components/Icons";
import {
  followUser,
  getPosts,
  getUser,
  mediaUrl,
  unfollowUser,
  useCurrentUser,
} from "@/lib/api";

/**
 * Instagram profile page: header (avatar, stats, bio), tabs and a
 * three-column grid; clicking a thumbnail opens the post in a dialog.
 */
export default function ProfilePage() {
  const params = useParams();
  const id = params.id;
  const currentUser = useCurrentUser();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const viewerId = currentUser ? currentUser.id : null;
      const [user, postData] = await Promise.all([
        getUser(id, viewerId),
        getPosts(id, viewerId),
      ]);
      setProfile(user);
      setPosts(postData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, currentUser ? currentUser.id : null]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 2400);
    return () => clearTimeout(timer);
  }, [notice]);

  async function toggleFollow() {
    if (!currentUser) {
      setError("Pick an account in the More menu first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (profile.following) {
        await unfollowUser(profile.id, currentUser.id);
      } else {
        await followUser(profile.id, currentUser.id);
      }
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="loading">Loading…</div>;

  if (error && !profile) {
    return (
      <div className="narrow-page">
        <div className="error">{error}</div>
        <button className="btn" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const isSelf = currentUser && profile && currentUser.id === profile.id;

  return (
    <div className="narrow-page">
      <header className="profile-header">
        <div className="profile-avatar">
          {profile.profileImage ? (
            <img src={mediaUrl(profile.profileImage)} alt={profile.username} />
          ) : (
            <PersonIcon size={72} />
          )}
        </div>

        <div className="profile-info">
          <div className="profile-topline">
            <h1>{profile.username}</h1>

            {!isSelf && (
              <>
                <button
                  className={`btn ${profile.following ? "btn-secondary" : "btn-primary"}`}
                  onClick={toggleFollow}
                  disabled={busy}
                >
                  {busy ? "…" : profile.following ? "Following" : "Follow"}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setNotice("Direct messages are not part of this demo.")}
                >
                  Message
                </button>
              </>
            )}

            {isSelf && (
              <button
                className="btn btn-secondary"
                onClick={() => setNotice("Profile editing is not part of this demo.")}
              >
                Edit profile
              </button>
            )}

            <button
              className="post-more"
              onClick={() => setNotice("Settings are not part of this demo.")}
              aria-label="Settings"
            >
              <SettingsIcon />
            </button>
          </div>

          <ul className="profile-stats">
            <li>
              <strong>{profile.postsCount}</strong> posts
            </li>
            <li>
              <strong>{profile.followersCount}</strong> followers
            </li>
            <li>
              <strong>{profile.followingCount}</strong> following
            </li>
          </ul>

          <p className="profile-name">{profile.username}</p>
          <p className="profile-bio">
            InstaLite demo account
            <br />
            Photos &amp; short videos · built with Spring Boot + Next.js
          </p>
        </div>
      </header>

      <div className="profile-stats-mobile">
        <ul>
          <li>
            <strong>{profile.postsCount}</strong>
            <span>posts</span>
          </li>
          <li>
            <strong>{profile.followersCount}</strong>
            <span>followers</span>
          </li>
          <li>
            <strong>{profile.followingCount}</strong>
            <span>following</span>
          </li>
        </ul>
      </div>

      <div className="profile-tabs">
        <button className="profile-tab active">
          <GridIcon /> Posts
        </button>
        <button
          className="profile-tab"
          onClick={() => setNotice("Reels are not part of this demo.")}
        >
          <ReelsTabIcon /> Reels
        </button>
        <button
          className="profile-tab"
          onClick={() => setNotice("Tagged posts are not part of this demo.")}
        >
          <TaggedIcon /> Tagged
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 44, color: "#dbdbdb" }}>◎</div>
          <strong style={{ color: "#262626", fontSize: 28, display: "block" }}>
            Share Photos
          </strong>
          When {isSelf ? "you share" : `${profile.username} shares`} photos, they will
          appear on the profile.
        </div>
      ) : (
        <div className="profile-grid">
          {posts.map((post) => (
            <button
              key={post.id}
              className="grid-item"
              onClick={() => setSelected(post)}
              aria-label={`Open post ${post.id}`}
            >
              {post.mediaType === "VIDEO" ? (
                <video src={mediaUrl(post.mediaUrl)} muted playsInline preload="metadata" />
              ) : (
                <img src={mediaUrl(post.mediaUrl)} alt={post.caption || ""} />
              )}
              {post.mediaType === "VIDEO" && (
                <span className="grid-badge">
                  <ReelsTabIcon />
                </span>
              )}
              <span className="grid-overlay">
                <span>
                  <HeartIcon size={18} filled /> {post.likeCount}
                </span>
                <span>
                  <CommentIcon /> {post.commentCount}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="dialog dialog-wide" onClick={(e) => e.stopPropagation()}>
            <PostCard post={selected} onChanged={load} />
          </div>
        </div>
      )}

      {notice && <div className="toast">{notice}</div>}
    </div>
  );
}
