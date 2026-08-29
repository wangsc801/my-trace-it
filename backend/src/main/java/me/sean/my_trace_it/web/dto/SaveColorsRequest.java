package me.sean.my_trace_it.web.dto;

import java.util.List;

public record SaveColorsRequest(List<ColorUpsert> upserts, List<String> deletes) {
}