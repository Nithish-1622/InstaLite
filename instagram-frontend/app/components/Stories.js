"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PersonIcon, PlusIcon } from "./Icons";
import { getUsers, mediaUrl, useCurrentUser } from "@/lib/api";

/**
 * The horizontal stories strip above the feed.
 * There are no real stories in this project: "Your story" shows the current
 * demo user and every other user becomes a tappable story that opens their
 * profile.
 */
export default function Stories() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  if (users.length === 0) return null;

  const others = users.filter((u) => !currentUser || u.id !== currentUser.id);

  return (
    <div className="stories hide-scrollbar">
      {currentUser && (
        <button className="story" onClick={() => router.push(`/profile/${currentUser.id}`)}>
          <span className="story-ring seen">
            <span className="story-inner">
              {currentUser.profileImage ? (
                <img src={mediaUrl(currentUser.profileImage)} alt="" />
              ) : (
                <PersonIcon size={30} />
              )}
            </span>
            <span className="story-add">
              <PlusIcon size={12} />
            </span>
          </span>
          <span className="story-label">Your story</span>
        </button>
      )}

      {others.map((u) => (
        <button
          key={u.id}
          className="story"
          onClick={() => router.push(`/profile/${u.id}`)}
        >
          <span className="story-ring">
            <span className="story-inner">
              {u.profileImage ? <img src={mediaUrl(u.profileImage)} alt="" /> : <PersonIcon size={30} />}
            </span>
          </span>
          <span className="story-label">{u.username}</span>
        </button>
      ))}
    </div>
  );
}
