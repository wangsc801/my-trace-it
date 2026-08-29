package me.sean.my_trace_it.admin.dto;

import java.util.List;

public record UpdateUserRequest(String password, Boolean enabled, List<String> roles) {
}