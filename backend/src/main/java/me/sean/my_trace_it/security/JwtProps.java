package me.sean.my_trace_it.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public class JwtProps {

    private String secret;
    private long expirySeconds = 86400;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpirySeconds() {
        return expirySeconds;
    }

    public void setExpirySeconds(long expirySeconds) {
        this.expirySeconds = expirySeconds;
    }
}