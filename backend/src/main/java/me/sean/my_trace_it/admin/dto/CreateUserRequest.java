package me.sean.my_trace_it.admin.dto;

import java.util.List;

public record CreateUserRequest(String username, String password, List<String> roles) {
}