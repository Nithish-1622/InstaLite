"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChatIcon,
  CreateIcon,
  ExploreIcon,
  HomeIcon,
  MenuIcon,
  MoreIcon,
  PersonIcon,
  ReelsIcon,
  SearchIcon,
  SendIcon,
  HeartIcon,
} from "./Icons";
import {
  createUser,
  getUsers,
  mediaUrl,
  storeUser,
  useCurrentUser,
} from "@/lib/api";

/**
 * Instagram's navigation shell:
 *  - fixed left sidebar on desktop (icon-only under 1264px)
 *  - top bar + bottom tab bar on mobile
 *  - a search dialog and a "switch account" dialog (the demo has no login)
 *  - a toast for features that are not part of this learning project
 */
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useCurrentUser();

  const [users, setUsers] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState("");

  async function loadUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
      if (!getStoredUser() && data.length > 0) {
        storeUser(data[0]);
      }
    } catch (err) {
      setMessage(err.message);
    }
  }

  function getStoredUser() {
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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  function comingSoon(name) {
    setToast(`${name} is not part of this demo - try Home, Search, Create or Profile.`);
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
      setSwitchOpen(false);
    } catch (err) {
      setMessage(err.message);
    }
  }

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.username.toLowerCase().includes(q));
  }, [query, users]);

  const isHome = pathname === "/";
  const isProfile = pathname && pathname.startsWith("/profile");
  const isUpload = pathname === "/upload";

  const navItems = [
    { label: "Home", icon: <HomeIcon filled={isHome} />, action: () => router.push("/"), active: isHome },
    { label: "Search", icon: <SearchIcon />, action: () => setSearchOpen(true) },
    { label: "Explore", icon: <ExploreIcon />, action: () => comingSoon("Explore") },
    { label: "Reels", icon: <ReelsIcon />, action: () => comingSoon("Reels") },
    { label: "Messages", icon: <SendIcon />, action: () => comingSoon("Messages") },
    { label: "Notifications", icon: <HeartIcon />, action: () => comingSoon("Notifications") },
    { label: "Create", icon: <CreateIcon filled={isUpload} />, action: () => router.push("/upload"), active: isUpload },
    {
      label: "Profile",
      icon: currentUser ? (
        <span className="avatar nav-avatar">
          {currentUser.profileImage ? (
            <img src={mediaUrl(currentUser.profileImage)} alt="" />
          ) : (
            <PersonIcon size={16} />
          )}
        </span>
      ) : (
        <PersonIcon />
      ),
      action: () =>
        currentUser ? router.push(`/profile/${currentUser.id}`) : comingSoon("Profile"),
      active: isProfile,
    },
  ];

  return (
    <>
      {/* ------------------------------ desktop sidebar ------------------------------ */}
      <aside className="sidebar">
        <Link href="/" className="sidebar-brand">
          InstaLite
        </Link>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${item.active ? "active" : ""}`}
              onClick={item.action}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </button>
          ))}

          <button className="nav-item" onClick={() => setSwitchOpen(true)}>
            <MenuIcon />
            <span className="nav-label">More</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />
      </aside>

      {/* ------------------------------ mobile top bar ------------------------------ */}
      <header className="mobile-topbar">
        <Link href="/" className="mobile-brand">
          InstaLite
        </Link>
        <div className="mobile-topbar-actions">
          <button className="post-actions-like" onClick={() => comingSoon("Notifications")} style={iconButton}>
            <HeartIcon />
          </button>
          <button onClick={() => comingSoon("Messages")} style={iconButton}>
            <ChatIcon />
          </button>
        </div>
      </header>

      {/* ------------------------------ mobile tab bar ------------------------------ */}
      <nav className="mobile-tabbar">
        <button onClick={() => router.push("/")} aria-label="Home">
          <HomeIcon filled={isHome} />
        </button>
        <button onClick={() => setSearchOpen(true)} aria-label="Search">
          <SearchIcon />
        </button>
        <button onClick={() => router.push("/upload")} aria-label="Create">
          <CreateIcon filled={isUpload} />
        </button>
        <button onClick={() => comingSoon("Reels")} aria-label="Reels">
          <ReelsIcon />
        </button>
        <button
          onClick={() =>
            currentUser ? router.push(`/profile/${currentUser.id}`) : comingSoon("Profile")
          }
          aria-label="Profile"
        >
          <span className="avatar nav-avatar">
            {currentUser && currentUser.profileImage ? (
              <img src={mediaUrl(currentUser.profileImage)} alt="" />
            ) : (
              <PersonIcon size={18} />
            )}
          </span>
        </button>
      </nav>

      {/* ------------------------------ search dialog ------------------------------ */}
      {searchOpen && (
        <div className="overlay" onClick={() => setSearchOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              Search
              <button className="btn-link trail" onClick={() => setSearchOpen(false)}>
                Close
              </button>
            </div>
            <div className="dialog-body">
              <input
                type="text"
                autoFocus
                placeholder="Search users"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div style={{ marginTop: 14 }}>
                {results.length === 0 && <div className="empty">No users found.</div>}
                {results.map((u) => (
                  <button
                    key={u.id}
                    className="suggestion-row"
                    style={{ background: "none", border: "none", width: "100%", cursor: "pointer" }}
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery("");
                      router.push(`/profile/${u.id}`);
                    }}
                  >
                    <span className="avatar">
                      {u.profileImage ? <img src={mediaUrl(u.profileImage)} alt="" /> : <PersonIcon size={18} />}
                    </span>
                    <span style={{ textAlign: "left" }}>
                      <span className="name" style={{ display: "block" }}>{u.username}</span>
                      <span className="joined">View profile</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------ switch account dialog ------------------------------ */}
      {switchOpen && (
        <div className="overlay" onClick={() => setSwitchOpen(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              Switch account
              <button className="btn-link trail" onClick={() => setSwitchOpen(false)}>
                Close
              </button>
            </div>
            <div className="dialog-body">
              <div className="meta-caption">
                This demo has no passwords - pick the user you want to act as.
              </div>

              {users.map((u) => (
                <button
                  key={u.id}
                  className="suggestion-row"
                  style={{ background: "none", border: "none", width: "100%", cursor: "pointer" }}
                  onClick={() => {
                    storeUser(u);
                    setSwitchOpen(false);
                  }}
                >
                  <span className="avatar">
                    {u.profileImage ? <img src={mediaUrl(u.profileImage)} alt="" /> : <PersonIcon size={18} />}
                  </span>
                  <span style={{ textAlign: "left" }}>
                    <span className="name" style={{ display: "block" }}>{u.username}</span>
                    <span className="joined">
                      {currentUser && currentUser.id === u.id ? "Current account" : "Switch"}
                    </span>
                  </span>
                </button>
              ))}

              <form onSubmit={handleCreate} style={{ marginTop: 16 }}>
                <div className="meta-caption">Create a new user</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={newUsername}
                    maxLength={50}
                    placeholder="username"
                    onChange={(e) => setNewUsername(e.target.value)}
                  />
                  <button className="btn btn-primary" type="submit">
                    Add
                  </button>
                </div>
              </form>

              {message && <div className="error">{message}</div>}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

const iconButton = {
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: "#262626",
  display: "flex",
};
