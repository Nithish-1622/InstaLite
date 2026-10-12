"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createUser,
  getUsers,
  storeUser,
  useCurrentUser,
} from "@/lib/api";

/**
 * Top navigation: Home / Upload / Profile links plus the demo user selector.
 * There is no login in this project - the selected user is stored in
 * localStorage and sent with every like / follow / comment request.
 */
export default function Navbar() {
  const currentUser = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [message, setMessage] = useState("");

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
      // Auto-select the first user so the app works on first visit.
      if (!getStoredUserSafe() && data.length > 0) {
        storeUser(data[0]);
      }
    } catch (err) {
      setMessage(err.message);
    }
  }

  function getStoredUserSafe() {
    try {
      return JSON.parse(window.localStorage.getItem("instagram_current_user"));
    } catch {
      return null;
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(event) {
    const id = Number(event.target.value);
    const user = users.find((u) => u.id === id);
    storeUser(user || null);
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (!newUsername.trim()) return;
    setMessage("");
    try {
      const user = await createUser(newUsername.trim());
      setNewUsername("");
      await loadUsers();
      storeUser(user);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          InstaLite
        </Link>

        <nav className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/upload">Upload</Link>
          <Link href={currentUser ? `/profile/${currentUser.id}` : "/"}>
            Profile
          </Link>
        </nav>

        <div className="nav-user">
          {users.length > 0 && (
            <select value={currentUser ? currentUser.id : ""} onChange={handleSelect}>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          )}
          <form onSubmit={handleCreate} style={{ display: "flex", gap: 6 }}>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="new user"
              style={{ width: 110 }}
            />
            <button className="btn btn-small" type="submit">
              Add
            </button>
          </form>
        </div>
      </div>

      {message && (
        <div style={{ padding: "6px 16px" }}>
          <div className="error">{message}</div>
        </div>
      )}
    </header>
  );
}
