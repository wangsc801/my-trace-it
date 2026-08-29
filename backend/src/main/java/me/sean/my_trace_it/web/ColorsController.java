package me.sean.my_trace_it.web;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import me.sean.my_trace_it.common.CurrentUser;
import me.sean.my_trace_it.common.Result;
import me.sean.my_trace_it.domain.Color;
import me.sean.my_trace_it.repo.ColorRepository;
import me.sean.my_trace_it.web.dto.ColorUpsert;
import me.sean.my_trace_it.web.dto.ColorView;
import me.sean.my_trace_it.web.dto.ColorsView;
import me.sean.my_trace_it.web.dto.SaveColorsRequest;

@RestController
@RequestMapping("/api/colors")
public class ColorsController {

    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ColorRepository colors;
    private final CurrentUser currentUser;

    public ColorsController(ColorRepository colors, CurrentUser currentUser) {
        this.colors = colors;
        this.currentUser = currentUser;
    }

    @GetMapping
    public ColorsView list() {
        List<ColorView> views = colors.findByOwnerIdAndDeletedAtIsNullOrderBySeqAsc(currentUser.id())
            .stream()
            .map(c -> new ColorView(c.getId(), c.getName(), c.getColor(), c.getSeq()))
            .collect(Collectors.toList());
        return new ColorsView(views);
    }

    @PostMapping
    public Result create(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String color = body.get("color");
        if (name == null || name.trim().isEmpty() || color == null || color.trim().isEmpty()) {
            throw new IllegalArgumentException("名称和颜色不能为空");
        }
        Long ownerId = currentUser.id();
        if (colors.findByOwnerIdAndName(ownerId, name.trim()).isPresent()) {
            throw new IllegalArgumentException("颜色名称已存在");
        }
        int maxSeq = colors.findByOwnerIdAndDeletedAtIsNullOrderBySeqAsc(ownerId).stream()
            .map(Color::getSeq)
            .reduce(0, Math::max);
        String now = TS.format(LocalDateTime.now());
        colors.save(new Color(ownerId, name.trim(), color.trim(), maxSeq + 1, now, now));
        return new Result(true, "创建成功");
    }

    @PutMapping
    public Result saveAll(@RequestBody SaveColorsRequest body) {
        String now = TS.format(LocalDateTime.now());
        Long ownerId = currentUser.id();
        for (String uuid : body.deletes()) {
            colors.findById(Long.valueOf(uuid))
                .filter(c -> c.getOwnerId().equals(ownerId))
                .ifPresent(c -> {
                    c.setDeletedAt(now);
                    c.setUpdatedAt(now);
                    colors.save(c);
                });
        }
        for (ColorUpsert u : body.upserts()) {
            Optional<Color> existing = colors.findByOwnerIdAndName(ownerId, u.name());
            if (existing.isPresent()) {
                Color c = existing.get();
                c.setColor(u.color());
                c.setSeq(u.seq());
                c.setUpdatedAt(now);
                colors.save(c);
            } else {
                colors.save(new Color(ownerId, u.name(), u.color(), u.seq(), now, now));
            }
        }
        return new Result(true, "保存成功");
    }

    @PutMapping("/{id}")
    public Result update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String color = body.get("color");
        if (color == null || color.trim().isEmpty()) {
            throw new IllegalArgumentException("颜色不能为空");
        }
        Color c = colors.findById(id)
            .filter(x -> x.getOwnerId().equals(currentUser.id()))
            .orElseThrow(() -> new IllegalArgumentException("颜色不存在"));
        c.setColor(color.trim());
        c.setUpdatedAt(TS.format(LocalDateTime.now()));
        colors.save(c);
        return new Result(true, "保存成功");
    }
}