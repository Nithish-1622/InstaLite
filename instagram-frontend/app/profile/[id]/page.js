"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Feed from "../../components/Feed";
import {
  followUser,
  getUser,
  mediaUrl,
  unfollowUser,
  useCurrentUser,
} from "@/lib/api";

/**
 * User profile: avatar, counts, follow / unfollow button and the
 * posts published by this user.
 */
export default function ProfilePage() {
  const params = useParams();
  const id = params.id;
  const currentUser = useCurrentUser();

  const [profile, setProfile] = useState(null);
  const [postsVersion, setPostsVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProfile(await getUser(id, currentUser ? currentUser.id : null));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser ? currentUser.id : null]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFollow() {
    if (!currentUser) {
      setError("Select a user in the top bar first.");
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
      setPostsVersion((v) => v + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="loading">Loading profile…</div>;

  if (error && !profile) {
    return (
      <div>
        <div className="error">{error}</div>
        <button className="btn" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const isSelf = currentUser && profile && currentUser.id === profile.id;

  return (
    <>
      <div className="profile-head">
        <div className="avatar">
          {profile.profileImage ? (
            <img src={mediaUrl(profile.profileImage)} alt={profile.username} />
          ) : (
            profile.username.charAt(0).toUpperCase()
          )}
        </div>

        <div>
          <h1 className="profile-name">{profile.username}</h1>

          <div className="profile-stats">
            <span>
              <strong>{profile.postsCount}</strong> posts
            </span>
            <span>
              <strong>{profile.followersCount}</strong> followers
            </span>
            <span>
              <strong>{profile.followingCount}</strong> following
            </span>
          </div>

          <div className="profile-actions">
            {!isSelf && (
              <button
                className="btn btn-primary btn-small"
                onClick={toggleFollow}
                disabled={busy}
              >
                {busy ? "…" : profile.following ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <h2 className="page-title">Posts</h2>
      <Feed key={postsVersion} userId={profile.id} />
    </>
  );
}
