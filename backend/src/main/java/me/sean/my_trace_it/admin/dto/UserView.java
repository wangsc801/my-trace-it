package me.sean.my_trace_it.admin.dto;

import java.time.Instant;
import java.util.List;

import me.sean.my_trace_it.domain.User;

public record UserView(Long id, String username, List<String> roles, boolean enabled, Instant createdAt) {

    public static UserView from(User user) {
        return new UserView(user.getId(), user.getUsername(),
            List.copyOf(user.getRoles()), user.isEnabled(), user.getCreatedAt());
    }
}