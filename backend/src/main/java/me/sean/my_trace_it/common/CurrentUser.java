package me.sean.my_trace_it.common;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import me.sean.my_trace_it.security.AuthUser;

/**
 * Read the currently authenticated user (from the JWT principal) to scope
 * data access by ownership.
 */
@Component
public class CurrentUser {

    public Long id() {
        return authUser().id();
    }

    public String username() {
        return authUser().username();
    }

    public List<String> roles() {
        return authUser().roles();
    }

    public boolean isAdmin() {
        return roles().stream().anyMatch(r -> r.equalsIgnoreCase("ADMIN"));
    }

    private AuthUser authUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthUser principal) {
            return principal;
        }
        throw new IllegalStateException("当前请求未认证");
    }
}