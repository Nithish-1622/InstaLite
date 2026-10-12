package com.example.instagram.repository;

import com.example.instagram.model.Follow;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    long countByFollowerId(Long followerId);

    long countByFollowingId(Long followingId);

    long deleteByFollowerIdAndFollowingId(Long followerId, Long followingId);
}
