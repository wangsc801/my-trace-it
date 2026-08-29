package me.sean.my_trace_it.web;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.sean.my_trace_it.common.CurrentUser;
import me.sean.my_trace_it.common.Result;
import me.sean.my_trace_it.domain.Diary;
import me.sean.my_trace_it.repo.DiaryRepository;
import me.sean.my_trace_it.web.dto.DiaryView;

@RestController
@RequestMapping("/api/diary/{date}")
public class DiaryController {

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final DiaryRepository diaries;
    private final CurrentUser currentUser;

    public DiaryController(DiaryRepository diaries, CurrentUser currentUser) {
        this.diaries = diaries;
        this.currentUser = currentUser;
    }

    @GetMapping
    public DiaryView get(@PathVariable String date) {
        return new DiaryView(diaries.findByOwnerIdAndDate(currentUser.id(), date)
            .filter(d -> d.getDeletedAt() == null)
            .map(Diary::getContent)
            .orElse(""));
    }

    @PutMapping
    public Result save(@PathVariable String date, @RequestBody DiaryView body) {
        String now = TS.format(LocalDateTime.now());
        Long ownerId = currentUser.id();
        Diary diary = diaries.findByOwnerIdAndDate(ownerId, date)
            .filter(d -> d.getDeletedAt() == null)
            .orElse(null);
        if (diary == null) {
            diaries.save(new Diary(ownerId, date, body.content(), now, now, null));
        } else {
            diary.setContent(body.content());
            diary.setUpdatedAt(now);
            diaries.save(diary);
        }
        return new Result(true, "保存成功");
    }

    @DeleteMapping
    public Result delete(@PathVariable String date) {
        String now = TS.format(LocalDateTime.now());
        diaries.findByOwnerIdAndDate(currentUser.id(), date).ifPresent(d -> {
            d.setDeletedAt(now);
            d.setUpdatedAt(now);
            diaries.save(d);
        });
        return new Result(true, "删除成功");
    }
}