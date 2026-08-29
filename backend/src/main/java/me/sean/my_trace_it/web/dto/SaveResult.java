package me.sean.my_trace_it.web.dto;

public record SaveResult(boolean ok, int parsed, int compared, int modified, int inserted, String message) {
}