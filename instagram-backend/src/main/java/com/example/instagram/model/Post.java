package com.example.instagram.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.LocalDateTime;

/**
 * Table: posts (id, userId, caption, mediaUrl, mediaType, createdAt)
 *
 * The ManyToOne user association is stored in the column `userId`,
 * so the feed response automatically contains the username of the author.
 * Only the media file path is stored here - never the file bytes.
 */
@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "userId", nullable = false)
    private User user;

    @Column(length = 500)
    private String caption;

    @Column(nullable = false)
    private String mediaUrl;

    /** IMAGE or VIDEO */
    @Column(name = "mediaType", nullable = false)
    private String mediaType;

    @Column(name = "createdAt")
    private LocalDateTime createdAt = LocalDateTime.now();

    /** Not a database column - filled by the service for the feed. */
    @Transient
    private int likeCount;

    @Transient
    private int commentCount;

    /** True when the given (demo) user already liked this post. */
    @Transient
    private boolean likedByCurrentUser;

    public Post() {
    }

    public Post(User user, String caption, String mediaUrl, String mediaType) {
        this.user = user;
        this.caption = caption;
        this.mediaUrl = mediaUrl;
        this.mediaType = mediaType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getCaption() {
        return caption;
    }

    public void setCaption(String caption) {
        this.caption = caption;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public int getLikeCount() {
        return likeCount;
    }

    public void setLikeCount(int likeCount) {
        this.likeCount = likeCount;
    }

    public int getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(int commentCount) {
        this.commentCount = commentCount;
    }

    public boolean isLikedByCurrentUser() {
        return likedByCurrentUser;
    }

    public void setLikedByCurrentUser(boolean likedByCurrentUser) {
        this.likedByCurrentUser = likedByCurrentUser;
    }
}
