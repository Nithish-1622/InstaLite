package com.example.instagram.repository;

import com.example.instagram.model.Like;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LikeRepository extends JpaRepository<Like, Long> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    long countByPostId(Long postId);

    long deleteByUserIdAndPostId(Long userId, Long postId);
}
