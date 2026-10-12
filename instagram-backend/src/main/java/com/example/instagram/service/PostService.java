package com.example.instagram.service;

import com.example.instagram.model.Post;
import com.example.instagram.model.User;
import com.example.instagram.repository.CommentRepository;
import com.example.instagram.repository.LikeRepository;
import com.example.instagram.repository.PostRepository;
import com.example.instagram.repository.UserRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PostService {

    /** Content types that are allowed for upload. */
    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "video/mp4", "video/webm", "video/quicktime");

    /** Maximum upload size (bytes) - also configured in application.properties. */
    private static final long MAX_FILE_SIZE = 50L * 1024 * 1024;

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public PostService(PostRepository postRepository,
                       UserRepository userRepository,
                       LikeRepository likeRepository,
                       CommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
    }

    /**
     * POST /api/posts - multipart upload.
     *
     * Flow: validate -> save file to uploads/ -> simulated media processing ->
     * save metadata row in MySQL -> return the post (201).
     */
    @Transactional
    public Post createPost(MultipartFile file, String caption, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found: " + userId));

        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "media file is required");
        }
        String declaredType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        // Some HTTP clients (curl on Windows, Postman) do not know the media
        // type of an .mp4/.mov file and send "application/octet-stream".
        // Fall back to the file extension, then apply the allow-list.
        String contentType = declaredType;
        if (contentType.isEmpty() || "application/octet-stream".equals(contentType)) {
            contentType = typeFromFilename(file.getOriginalFilename());
        }
        if (!ALLOWED_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "unsupported file type: " + (declaredType.isEmpty() ? "unknown" : declaredType)
                            + " (allowed: jpg, png, gif, webp, mp4, webm, mov)");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "file is larger than 50 MB");
        }

        String mediaType = contentType.startsWith("video/") ? "VIDEO" : "IMAGE";
        String mediaUrl = saveFile(file, contentType);

        // --- Simulated media processing ---------------------------------
        // In a production system this request would only push a message onto
        // Kafka/RabbitMQ ("media.uploaded") and return immediately; a media
        // processing worker would then transcode videos, generate thumbnails
        // and update the post. For this beginner project we run the same step
        // synchronously inside this method.
        processMedia(mediaUrl, mediaType);
        // ---------------------------------------------------------------

        Post post = new Post(user, caption == null ? "" : caption.trim(), mediaUrl, mediaType);
        Post saved = postRepository.save(post);
        fillCounts(saved, userId);
        return saved;
    }

    /** GET /api/posts - newest first; optionally filtered by profile and
     *  annotated with the likes of the current user. */
    public List<Post> getFeed(Long userId, Long currentUserId) {
        List<Post> posts = userId == null
                ? postRepository.findAllByOrderByCreatedAtDesc()
                : postRepository.findByUser_IdOrderByCreatedAtDesc(userId);
        posts.forEach(p -> fillCounts(p, currentUserId));
        return posts;
    }

    /** GET /api/posts/{id} - single post details. */
    public Post getPost(Long id, Long currentUserId) {
        Post post = findPost(id);
        fillCounts(post, currentUserId);
        return post;
    }

    /** POST /api/posts/{id}/likes */
    @Transactional
    public void like(Long postId, Long userId) {
        findPost(postId);
        findUser(userId);
        if (likeRepository.existsByUserIdAndPostId(userId, postId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "post already liked by this user");
        }
        likeRepository.save(new com.example.instagram.model.Like(userId, postId));
    }

    /** DELETE /api/posts/{id}/likes */
    @Transactional
    public void unlike(Long postId, Long userId) {
        findPost(postId);
        findUser(userId);
        long removed = likeRepository.deleteByUserIdAndPostId(userId, postId);
        if (removed == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "post is not liked by this user");
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private String saveFile(MultipartFile file, String contentType) {
        String extension = extensionFor(contentType, file.getOriginalFilename());
        String filename = UUID.randomUUID() + extension;
        Path directory = Paths.get(uploadDir).toAbsolutePath();
        try {
            Files.createDirectories(directory);
            Path target = directory.resolve(filename);
            Files.copy(file.getInputStream(), target);
            // mediaUrl is stored in MySQL - the bytes live on disk only.
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "could not save the uploaded file: " + e.getMessage());
        }
    }

    /** Placeholder for the real media processing pipeline. */
    private void processMedia(String mediaUrl, String mediaType) {
        // Basic validation already happened above. A production implementation
        // would start background jobs here (resize image / transcode video).
        if (mediaUrl == null || mediaUrl.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "media processing failed");
        }
        if ("VIDEO".equals(mediaType)) {
            // Short videos only - keeps the demo lightweight.
            // Transcoding (mp4 -> HLS) would be queued in Kafka here.
        }
    }

    private String extensionFor(String contentType, String originalName) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            case "video/mp4" -> ".mp4";
            case "video/webm" -> ".webm";
            case "video/quicktime" -> ".mov";
            default -> {
                if (originalName != null && originalName.toLowerCase(Locale.ROOT).endsWith(".png")) {
                    yield ".png";
                }
                yield ".jpg";
            }
        };
    }

    /** Maps a file name to its media type (fallback when the client sends no type). */
    private String typeFromFilename(String name) {
        if (name == null) {
            return "";
        }
        String lower = name.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".mp4")) return "video/mp4";
        if (lower.endsWith(".webm")) return "video/webm";
        if (lower.endsWith(".mov")) return "video/quicktime";
        return "";
    }

    private void fillCounts(Post post, Long currentUserId) {
        post.setLikeCount((int) likeRepository.countByPostId(post.getId()));
        post.setCommentCount((int) commentRepository.countByPostId(post.getId()));
        post.setLikedByCurrentUser(currentUserId != null
                && likeRepository.existsByUserIdAndPostId(currentUserId, post.getId()));
    }

    private Post findPost(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "post not found: " + id));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found: " + id));
    }
}
