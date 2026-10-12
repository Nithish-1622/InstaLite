package com.example.instagram.controller;

import com.example.instagram.model.User;
import com.example.instagram.service.UserService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Users, profiles and the follow relationship.
 *
 * POST   /api/users               create a user                -> 201
 * GET    /api/users               list users                   -> 200
 * GET    /api/users/{id}          profile with counts          -> 200
 * POST   /api/users/{id}/follow   follow user {id}             -> 201
 * DELETE /api/users/{id}/follow   unfollow user {id}           -> 200
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody Map<String, String> body) {
        User user = userService.createUser(body.get("username"), body.get("profileImage"));
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @GetMapping
    public List<User> listUsers() {
        return userService.listUsers();
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id,
                        @RequestParam(value = "followerId", required = false) Long followerId) {
        return userService.getUser(id, followerId);
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<Map<String, String>> follow(@PathVariable Long id,
                                                      @RequestParam Long followerId) {
        userService.follow(id, followerId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "now following user " + id));
    }

    @DeleteMapping("/{id}/follow")
    public ResponseEntity<Map<String, String>> unfollow(@PathVariable Long id,
                                                        @RequestParam Long followerId) {
        userService.unfollow(id, followerId);
        return ResponseEntity.ok(Map.of("message", "unfollowed user " + id));
    }
}
