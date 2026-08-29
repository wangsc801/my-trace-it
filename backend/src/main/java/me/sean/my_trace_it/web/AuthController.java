package me.sean.my_trace_it.web;

import java.util.List;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.sean.my_trace_it.domain.User;
import me.sean.my_trace_it.repo.UserRepository;
import me.sean.my_trace_it.security.JwtService;
import me.sean.my_trace_it.web.dto.LoginRequest;
import me.sean.my_trace_it.web.dto.LoginResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository users;
    private final JwtService jwt;

    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository users,
                          JwtService jwt) {
        this.authenticationManager = authenticationManager;
        this.users = users;
        this.jwt = jwt;
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) throws AuthenticationException {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        User user = users.findByUsername(request.username())
            .orElseThrow(() -> new UsernameNotFoundException("用户不存在：" + request.username()));
        return new LoginResponse(jwt.issue(user), user.getUsername(), List.copyOf(user.getRoles()));
    }
}