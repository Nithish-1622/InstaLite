package com.example.instagram.repository;

import com.example.instagram.model.Post;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    /** Newest first - used by the home feed. */
    List<Post> findAllByOrderByCreatedAtDesc();

    /** Newest first - used by a user profile page. */
    List<Post> findByUser_IdOrderByCreatedAtDesc(Long userId);

    long countByUser_Id(Long userId);
}
