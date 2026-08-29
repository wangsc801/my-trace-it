package me.sean.my_trace_it.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import me.sean.my_trace_it.domain.User;

@Component
public class JwtService {

    private final SecretKey key;
    private final long expirySeconds;

    public JwtService(JwtProps props) {
        String secret = props.getSecret();
        byte[] bytes = secret == null ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException(
                "JWT secret (app.jwt.secret / JWT_SECRET) must be set and at least 32 bytes long for HS256");
        }
        this.key = Keys.hmacShaKeyFor(bytes);
        this.expirySeconds = props.getExpirySeconds();
    }

    public String issue(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(user.getUsername())
            .claim("uid", user.getId())
            .claim("roles", user.getRoles())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(expirySeconds)))
            .signWith(key)
            .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}