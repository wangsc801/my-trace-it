package me.sean.my_trace_it.web.dto;

import java.util.List;

public record DayScheduleView(String date, String wakeup_at, List<DayEventView> events) {
}