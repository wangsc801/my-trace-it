package me.sean.my_trace_it.security;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import me.sean.my_trace_it.domain.User;

/**
 * Role helpers shared by the token filter, the refresh filter and the
 * user-details service. Roles are stored uppercased (e.g. "USER", "ADMIN");
 * Spring Security authorities are "ROLE_" prefixed.
 */
public final class RoleUtil {

    private RoleUtil() {
    }

    public static String authority(String role) {
        if (role == null || role.isEmpty()) {
            return "ROLE_USER";
        }
        String trimmed = role.trim().toUpperCase(Locale.ROOT);
        return trimmed.startsWith("ROLE_") ? trimmed : "ROLE_" + trimmed;
    }

    public static User ensureAdminRole(User user) {
        if (user.getRoles().isEmpty()) {
            user.setRoles(new java.util.ArrayList<>(java.util.List.of("ADMIN")));
        } else if (!user.getRoles().stream().anyMatch(r -> r.equalsIgnoreCase("ADMIN"))) {
            user.getRoles().add("ADMIN");
        }
        return user;
    }

    }