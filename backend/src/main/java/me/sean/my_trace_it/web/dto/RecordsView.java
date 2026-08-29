package me.sean.my_trace_it.web.dto;

import java.util.List;

public record RecordsView(List<RecordView> rows, String date) {
}