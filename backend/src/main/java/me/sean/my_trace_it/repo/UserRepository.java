package me.sean.my_trace_it.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import me.sean.my_trace_it.domain.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);
}