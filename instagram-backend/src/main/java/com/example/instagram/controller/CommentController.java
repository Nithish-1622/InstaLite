package com.example.instagram.controller;

import com.example.instagram.model.Comment;
import com.example.instagram.service.CommentService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Comments on a post.
 *
 * POST /api/posts/{id}/comments   add a comment  -> 201
 * GET  /api/posts/{id}/comments   list comments  -> 200
 */
@RestController
@RequestMapping("/api/posts/{id}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    public ResponseEntity<Comment> addComment(@PathVariable Long id,
                                              @RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(String.valueOf(body.get("userId")));
        String text = body.get("text") == null ? null : String.valueOf(body.get("text"));
        Comment comment = commentService.addComment(id, userId, text);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping
    public List<Comment> getComments(@PathVariable Long id) {
        return commentService.getComments(id);
    }
}
