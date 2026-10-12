"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PersonIcon } from "./Icons";
import {
  followUser,
  getUsers,
  mediaUrl,
  unfollowUser,
  useCurrentUser,
} from "@/lib/api";

/**
 * Right column of the home page: the signed-in demo user plus
 * "Suggested for you" with working Follow / Following buttons.
 */
export default function Suggestions() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  const others = users.filter((u) => !currentUser || u.id !== currentUser.id);

  async function toggleFollow(user) {
    if (!currentUser) return;
    const isFollowing = !!following[user.id];
    try {
      if (isFollowing) {
        await unfollowUser(user.id, currentUser.id);
        setFollowing((f) => ({ ...f, [user.id]: false }));
      } else {
        await followUser(user.id, currentUser.id);
        setFollowing((f) => ({ ...f, [user.id]: true }));
      }
    } catch (err) {
      if (err.status === 400) {
        // Already following / not following - treat as success and flip state.
        setFollowing((f) => ({ ...f, [user.id]: !isFollowing }));
      }
    }
  }

  return (
    <aside className="suggestions">
      {currentUser && (
        <div className="suggestions-me">
          <span className="avatar" onClick={() => router.push(`/profile/${currentUser.id}`)} style={{ cursor: "pointer" }}>
            {currentUser.profileImage ? (
              <img src={mediaUrl(currentUser.profileImage)} alt="" />
            ) : (
              <PersonIcon size={22} />
            )}
          </span>
          <span>
            <span className="name" style={{ display: "block" }}>{currentUser.username}</span>
            <span className="sub">InstaLite demo account</span>
          </span>
        </div>
      )}

      <div className="suggestions-header">
        <span>Suggested for you</span>
      </div>

      {others.length === 0 && <div className="meta-caption">No other users yet.</div>}

      {others.map((u) => (
        <div className="suggestion-row" key={u.id}>
          <span className="avatar" style={{ cursor: "pointer" }} onClick={() => router.push(`/profile/${u.id}`)}>
            {u.profileImage ? <img src={mediaUrl(u.profileImage)} alt="" /> : <PersonIcon size={18} />}
          </span>
          <span style={{ cursor: "pointer" }} onClick={() => router.push(`/profile/${u.id}`)}>
            <span className="name" style={{ display: "block" }}>{u.username}</span>
            <span className="joined">Suggested for you</span>
          </span>
          <button className="btn-link" onClick={() => toggleFollow(u)}>
            {following[u.id] ? "Following" : "Follow"}
          </button>
        </div>
      ))}

      <div className="suggestions-footer">
        <a href="#">About</a> · <a href="#">Help</a> · <a href="#">Press</a> ·{" "}
        <a href="#">API</a> · <a href="#">Jobs</a> · <a href="#">Privacy</a> ·{" "}
        <a href="#">Terms</a> · <a href="#">Locations</a> · <a href="#">Language</a> ·{" "}
        <a href="#">Meta Verified</a>
        <div className="copy">© 2026 InstaLite from Meta</div>
      </div>
    </aside>
  );
}
