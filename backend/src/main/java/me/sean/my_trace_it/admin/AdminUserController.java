package me.sean.my_trace_it.admin;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import me.sean.my_trace_it.admin.dto.CreateUserRequest;
import me.sean.my_trace_it.admin.dto.UpdateUserRequest;
import me.sean.my_trace_it.admin.dto.UserView;
import me.sean.my_trace_it.common.Result;
import me.sean.my_trace_it.domain.User;
import me.sean.my_trace_it.repo.UserRepository;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private static final int USERNAME_MAX = 64;

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AdminUserController(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<UserView> list() {
        return users.findAll().stream().map(UserView::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserView create(@RequestBody CreateUserRequest request) {
        String username = request.username() == null ? "" : request.username().trim();
        if (username.isEmpty() || username.length() > USERNAME_MAX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户名需为 1-64 个字符");
        }
        String password = request.password();
        if (password == null || password.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "请提供初始密码");
        }
        if (users.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "用户名已存在");
        }
        List<String> roles = normalizeRoles(request.roles());
        User user = new User(username, passwordEncoder.encode(password), new ArrayList<>(roles));
        return UserView.from(users.save(user));
    }

    @PatchMapping("/{id}")
    public UserView update(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        User user = users.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));
        if (request.password() != null && !request.password().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.password()));
        }
        if (request.roles() != null) {
            user.setRoles(normalizeRoles(request.roles()));
        }
        if (request.enabled() != null) {
            user.setEnabled(request.enabled());
        }
        return UserView.from(users.save(user));
    }

    private static List<String> normalizeRoles(List<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return List.of("USER");
        }
        return roles.stream()
            .map(r -> r.trim().toUpperCase(Locale.ROOT))
            .filter(r -> !r.isEmpty())
            .distinct()
            .toList();
    }
}