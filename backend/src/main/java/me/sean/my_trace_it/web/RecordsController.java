package me.sean.my_trace_it.web;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import me.sean.my_trace_it.common.CurrentUser;
import me.sean.my_trace_it.common.Result;
import me.sean.my_trace_it.domain.Schedule;
import me.sean.my_trace_it.repo.ScheduleRepository;
import me.sean.my_trace_it.service.ScheduleService;
import me.sean.my_trace_it.web.dto.RecordView;
import me.sean.my_trace_it.web.dto.RecordsView;
import me.sean.my_trace_it.web.dto.SaveRequest;
import me.sean.my_trace_it.web.dto.SaveResult;

@RestController
@RequestMapping("/api/records")
public class RecordsController {

    private final ScheduleRepository schedules;
    private final ScheduleService scheduleService;
    private final CurrentUser currentUser;

    public RecordsController(ScheduleRepository schedules,
                             ScheduleService scheduleService,
                             CurrentUser currentUser) {
        this.schedules = schedules;
        this.scheduleService = scheduleService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public RecordsView list(@RequestParam(required = false) String date,
                            @RequestParam(required = false) Boolean includeNextMorning,
                            @RequestParam(required = false, defaultValue = "50") int limit,
                            @RequestParam(required = false, defaultValue = "0") int offset) {
        Long ownerId = currentUser.id();
        if (date != null) {
            List<Schedule> rows = Boolean.TRUE.equals(includeNextMorning)
                ? schedules.findByDateWithNextMorning(ownerId, date, nextDate(date))
                : schedules.findByDate(ownerId, date);
            return new RecordsView(toViews(rows), date);
        }
        List<Schedule> rows = schedules.findPage(ownerId, limit, offset);
        return new RecordsView(toViews(rows), null);
    }

    @GetMapping("/dates")
    public Map<String, List<String>> dates() {
        return Map.of("dates", schedules.findDistinctDates(currentUser.id()));
    }

    @PutMapping("/{uuid}")
    public Result update(@PathVariable String uuid, @RequestBody Map<String, String> body) {
        String content = body.get("content");
        if (content == null) {
            throw new IllegalArgumentException("内容不能为空");
        }
        String trimmed = content.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("内容不能为空");
        }
        Long ownerId = currentUser.id();
        List<Schedule> existing = schedules.findByOwnerIdAndUuid(ownerId, uuid);
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("记录不存在");
        }
        Schedule s = existing.get(0);
        s.setContent(trimmed);
        schedules.save(s);
        return new Result(true, "保存成功");
    }

    @PostMapping("/save")
    public SaveResult save(@RequestBody SaveRequest request) {
        return scheduleService.saveCsv(currentUser.id(), request.csv());
    }

    private static List<RecordView> toViews(List<Schedule> rows) {
        return rows.stream()
            .map(r -> new RecordView(r.getUuid(), r.getCreatedAt(), r.getContent()))
            .collect(Collectors.toList());
    }

    private static String nextDate(String date) {
        return LocalDate.parse(date).plusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
}