package me.sean.my_trace_it.security;

import java.util.List;

/**
 * Principal placed in the SecurityContext by {@link JwtAuthFilter}.
 */
public record AuthUser(Long id, String username, List<String> roles) {
}