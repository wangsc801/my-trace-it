package me.sean.my_trace_it.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.sean.my_trace_it.common.CurrentUser;
import me.sean.my_trace_it.service.ScheduleService;
import me.sean.my_trace_it.web.dto.DayScheduleView;

@RestController
@RequestMapping("/api/schedules")
public class SchedulesController {

    private final ScheduleService scheduleService;
    private final CurrentUser currentUser;

    public SchedulesController(ScheduleService scheduleService, CurrentUser currentUser) {
        this.scheduleService = scheduleService;
        this.currentUser = currentUser;
    }

    @GetMapping("/{date}")
    public DayScheduleView get(@PathVariable String date) {
        return scheduleService.buildDaySchedule(currentUser.id(), date);
    }
}