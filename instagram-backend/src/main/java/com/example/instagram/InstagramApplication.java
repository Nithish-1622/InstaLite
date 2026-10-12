package com.example.instagram;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

/**
 * Entry point of the Instagram-style backend.
 *
 * A single Spring Boot application holds every layer:
 *   controller  -> handles HTTP requests (REST API)
 *   service     -> business rules (upload, likes, follows, comments)
 *   repository  -> database access (Spring Data JPA)
 *   model       -> JPA entities that become MySQL tables
 */
@SpringBootApplication
public class InstagramApplication {

    public static void main(String[] args) {
        SpringApplication.run(InstagramApplication.class, args);
    }

    /**
     * First start only: create two demo users so the Like / Comment /
     * Follow flow can be tried immediately (one user acting on another).
     * Remove this bean if you do not want any seed data.
     */
    @Bean
    CommandLineRunner seedDemoUsers(com.example.instagram.repository.UserRepository userRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                userRepository.save(new com.example.instagram.model.User("alice", null));
                userRepository.save(new com.example.instagram.model.User("bob", null));
                System.out.println("Seeded demo users: alice, bob");
            }
        };
    }
}
