package com.example.instagram.service;

import com.example.instagram.model.Follow;
import com.example.instagram.model.User;
import com.example.instagram.repository.FollowRepository;
import com.example.instagram.repository.PostRepository;
import com.example.instagram.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final PostRepository postRepository;

    public UserService(UserRepository userRepository,
                       FollowRepository followRepository,
                       PostRepository postRepository) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.postRepository = postRepository;
    }

    /** POST /api/users - creates a user, 400 if the username is taken. */
    public User createUser(String username, String profileImage) {
        if (username == null || username.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username must not be empty");
        }
        String clean = username.trim();
        if (userRepository.existsByUsername(clean)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username already exists");
        }
        User user = new User(clean, profileImage);
        return userRepository.save(user);
    }

    /** GET /api/users */
    public List<User> listUsers() {
        return userRepository.findAll();
    }

    /**
     * GET /api/users/{id} - profile with posts / followers / following counts.
     * When ?followerId= is supplied the response also tells whether that user
     * already follows this profile (used by the Follow/Unfollow button).
     */
    public User getUser(Long id, Long followerId) {
        User user = findUser(id);
        user.setPostsCount((int) postRepository.countByUser_Id(id));
        user.setFollowersCount((int) followRepository.countByFollowingId(id));
        user.setFollowingCount((int) followRepository.countByFollowerId(id));
        if (followerId != null && userRepository.existsById(followerId)) {
            user.setFollowing(followRepository.existsByFollowerIdAndFollowingId(followerId, id));
        }
        return user;
    }

    /** POST /api/users/{id}/follow - the given user follows user {id}. */
    @Transactional
    public void follow(Long followingId, Long followerId) {
        User follower = findUser(followerId);
        User following = findUser(followingId);
        if (follower.getId().equals(following.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "a user cannot follow itself");
        }
        if (followRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "already following this user");
        }
        followRepository.save(new Follow(followerId, followingId));
    }

    /** DELETE /api/users/{id}/follow */
    @Transactional
    public void unfollow(Long followingId, Long followerId) {
        findUser(followerId);
        findUser(followingId);
        long removed = followRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);
        if (removed == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "you are not following this user");
        }
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found: " + id));
    }
}
