package me.sean.my_trace_it.web.dto;

import java.util.List;

public record LoginResponse(String token, String username, List<String> roles) {
}