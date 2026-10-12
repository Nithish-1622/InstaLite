package com.example.instagram.controller;

import com.example.instagram.model.Post;
import com.example.instagram.service.PostService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Posts and likes.
 *
 * POST   /api/posts               upload media + create post (multipart) -> 201
 * GET    /api/posts               feed (?userId= profile filter,
 *                                                 ?currentUserId= viewer)  -> 200
 * GET    /api/posts/{id}          post details (?currentUserId=)          -> 200
 * POST   /api/posts/{id}/likes    like a post (?userId=)                 -> 201
 * DELETE /api/posts/{id}/likes    unlike a post (?userId=)               -> 200
 */
@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public ResponseEntity<Post> uploadPost(@RequestParam("file") MultipartFile file,
                                           @RequestParam(value = "caption", required = false) String caption,
                                           @RequestParam("userId") Long userId) {
        Post post = postService.createPost(file, caption, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    @GetMapping
    public List<Post> getFeed(@RequestParam(value = "userId", required = false) Long userId,
                              @RequestParam(value = "currentUserId", required = false) Long currentUserId) {
        // userId        -> optional filter (posts of one profile)
        // currentUserId -> who is asking, so the response can say whether
        //                  that user already liked each post
        return postService.getFeed(userId, currentUserId);
    }

    @GetMapping("/{id}")
    public Post getPost(@PathVariable Long id,
                        @RequestParam(value = "currentUserId", required = false) Long currentUserId) {
        return postService.getPost(id, currentUserId);
    }

    @PostMapping("/{id}/likes")
    public ResponseEntity<Map<String, String>> like(@PathVariable Long id,
                                                    @RequestParam Long userId) {
        postService.like(id, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "post liked"));
    }

    @DeleteMapping("/{id}/likes")
    public ResponseEntity<Map<String, String>> unlike(@PathVariable Long id,
                                                      @RequestParam Long userId) {
        postService.unlike(id, userId);
        return ResponseEntity.ok(Map.of("message", "post unliked"));
    }
}
