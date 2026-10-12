"use client";

import { useEffect, useState } from "react";

// ------------------------------------------------------------------
// One place that knows where the backend lives.
// Change this (or set NEXT_PUBLIC_API_URL) if Spring Boot runs elsewhere.
// ------------------------------------------------------------------
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ------------------------------------------------------------------
// Low level fetch helper: every call returns parsed JSON,
// or throws an Error carrying the message sent by Spring Boot.
// ------------------------------------------------------------------
async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch (err) {
    throw new Error("Cannot reach the backend. Is Spring Boot running on " + API_BASE_URL + "?");
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(
      (data && data.message) || `Request failed with status ${response.status}`
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

// ------------------------------------------------------------------
// Users
// ------------------------------------------------------------------
export function getUsers() {
  return request("/api/users");
}

export function createUser(username, profileImage) {
  return request("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, profileImage }),
  });
}

export function getUser(id, followerId) {
  const suffix = followerId ? `?followerId=${followerId}` : "";
  return request(`/api/users/${id}${suffix}`);
}

export function followUser(id, followerId) {
  return request(`/api/users/${id}/follow?followerId=${followerId}`, {
    method: "POST",
  });
}

export function unfollowUser(id, followerId) {
  return request(`/api/users/${id}/follow?followerId=${followerId}`, {
    method: "DELETE",
  });
}

// ------------------------------------------------------------------
// Posts
// ------------------------------------------------------------------
export function getPosts(userId, currentUserId) {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId); // profile filter
  if (currentUserId) params.set("currentUserId", currentUserId); // who is asking
  const query = params.toString();
  return request(`/api/posts${query ? `?${query}` : ""}`);
}

export function getPost(id, currentUserId) {
  const suffix = currentUserId ? `?currentUserId=${currentUserId}` : "";
  return request(`/api/posts/${id}${suffix}`);
}

export function uploadPost({ file, caption, userId }) {
  const form = new FormData();
  form.append("file", file);
  form.append("caption", caption || "");
  form.append("userId", userId);
  return request("/api/posts", { method: "POST", body: form });
}

export function likePost(postId, userId) {
  return request(`/api/posts/${postId}/likes?userId=${userId}`, {
    method: "POST",
  });
}

export function unlikePost(postId, userId) {
  return request(`/api/posts/${postId}/likes?userId=${userId}`, {
    method: "DELETE",
  });
}

// ------------------------------------------------------------------
// Comments
// ------------------------------------------------------------------
export function getComments(postId) {
  return request(`/api/posts/${postId}/comments`);
}

export function addComment(postId, userId, text) {
  return request(`/api/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, text }),
  });
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/** Turns the stored media path ("/uploads/abc.jpg") into a full URL. */
export function mediaUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

/** "2026-10-12T10:15:00" -> "12 Oct 2026" */
export function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ------------------------------------------------------------------
// Demo user selection (no login in this learning project).
// The chosen user is kept in localStorage and every page reads it
// through the useCurrentUser hook below.
// ------------------------------------------------------------------
const CURRENT_USER_KEY = "instagram_current_user";

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
  window.dispatchEvent(new Event("current-user-changed"));
}

/** React hook: the currently selected demo user (or null). */
export function useCurrentUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getStoredUser());
    const onChange = () => setUser(getStoredUser());
    window.addEventListener("current-user-changed", onChange);
    return () => window.removeEventListener("current-user-changed", onChange);
  }, []);

  return user;
}
