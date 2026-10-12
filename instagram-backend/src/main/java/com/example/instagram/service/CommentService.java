package com.example.instagram.service;

import com.example.instagram.model.Comment;
import com.example.instagram.model.User;
import com.example.instagram.repository.CommentRepository;
import com.example.instagram.repository.PostRepository;
import com.example.instagram.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository,
                          PostRepository postRepository,
                          UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    /** POST /api/posts/{id}/comments - JSON body { userId, text }. */
    @Transactional
    public Comment addComment(Long postId, Long userId, String text) {
        if (!postRepository.existsById(postId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "post not found: " + postId);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found: " + userId));
        if (text == null || text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "comment text must not be empty");
        }
        if (text.length() > 500) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "comment is longer than 500 characters");
        }
        return commentRepository.save(new Comment(user, postId, text.trim()));
    }

    /** GET /api/posts/{id}/comments */
    public List<Comment> getComments(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "post not found: " + postId);
        }
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
    }
}
