package me.sean.my_trace_it.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import me.sean.my_trace_it.domain.Schedule;
import me.sean.my_trace_it.repo.ScheduleRepository;
import me.sean.my_trace_it.web.dto.ActivityView;
import me.sean.my_trace_it.web.dto.DayEventView;
import me.sean.my_trace_it.web.dto.DayScheduleView;
import me.sean.my_trace_it.web.dto.SaveResult;

/**
 * CSV parsing and day-schedule building, mirroring the frontend lib/schedule.ts.
 */
@Service
public class ScheduleService {

    private static final Set<String> END_MARKERS = Set.of("完毕", "结束");
    private static final String WAKEUP_CONTENT = "起床";

    private final ScheduleRepository schedules;

    public ScheduleService(ScheduleRepository schedules) {
        this.schedules = schedules;
    }

    /** One parsed CSV data row (mirrors frontend CsvRow). */
    public record CsvRow(String createdAt, String content, String amountFormatted,
                         String amount, String amountUnit, String uuid) {
    }

    /* ---------- CSV parsing ---------- */

    public List<CsvRow> parseCsv(String csv) {
        String[] lines = csv.split("\\r?\\n");
        List<CsvRow> rows = new ArrayList<>();
        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isEmpty()) {
                continue;
            }
            // Skip header row
            if (line.startsWith("createdAt,content")) {
                continue;
            }
            String[] f = parseLine(line);
            String createdAt = f.length > 0 ? f[0].trim() : "";
            String content = f.length > 1 ? f[1].trim() : "";
            String amountFormatted = f.length > 2 ? f[2].trim() : "";
            String amount = f.length > 3 ? f[3].trim() : "";
            String amountUnit = f.length > 4 ? f[4].trim() : "";
            String uuid = f.length > 5 ? f[5].trim() : "";
            if (createdAt.isEmpty() || content.isEmpty() || uuid.isEmpty()) {
                continue;
            }
            rows.add(new CsvRow(createdAt, content, amountFormatted, amount,
                normalizeAmountUnit(amountUnit), uuid));
        }
        return rows;
    }

    /** Split one CSV line into fields, handling quotes and escaped quotes. */
    private static String[] parseLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch == ',' && !inQuotes) {
                fields.add(current.toString());
                current.setLength(0);
            } else {
                current.append(ch);
            }
        }
        fields.add(current.toString());
        return fields.toArray(new String[0]);
    }

    /* ---------- Save (upsert by uuid) ---------- */

    @Transactional
    public SaveResult saveCsv(Long ownerId, String csv) {
        List<CsvRow> rows = parseCsv(csv);
        int compared = 0;
        int modified = 0;
        int inserted = 0;
        for (CsvRow row : rows) {
            compared++;
            List<Schedule> existing = schedules.findByOwnerIdAndUuid(ownerId, row.uuid());
            if (existing.isEmpty()) {
                schedules.save(new Schedule(ownerId, row.uuid(), row.createdAt(), row.content(),
                    row.amountFormatted(), toDouble(row.amount()), row.amountUnit()));
                inserted++;
            } else {
                Schedule s = existing.get(0);
                if (!row.content().equals(s.getContent())) {
                    s.setContent(row.content());
                    s.setCreatedAt(row.createdAt());
                    schedules.save(s);
                    modified++;
                }
            }
        }
        return new SaveResult(true, rows.size(), compared, modified, inserted, "保存成功");
    }

    /** Normalize amountUnit: blank or "NONE" → real null, otherwise the value. */
    private static String normalizeAmountUnit(String s) {
        if (s == null || s.isBlank() || "NONE".equalsIgnoreCase(s.trim())) {
            return null;
        }
        return s;
    }

    private static Double toDouble(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return Double.valueOf(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /* ---------- Single-day schedule payload ---------- */

    public DayScheduleView buildDaySchedule(Long ownerId, String date) {
        List<Schedule> found = schedules.findByDate(ownerId, date);
        found.sort((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()));

        String wakeupAt = null;
        List<DayEventView> events = new ArrayList<>();
        for (int i = 0; i < found.size(); i++) {
            Schedule row = found.get(i);
            String content = row.getContent();
            if (WAKEUP_CONTENT.equals(content)) {
                if (wakeupAt == null) {
                    wakeupAt = formatHm(row.getCreatedAt());
                }
                continue;
            }
            if (isEndMarker(content)) {
                continue;
            }
            Schedule next = (i + 1 < found.size()) ? found.get(i + 1) : null;
            String[] nameDetail = splitNameDetail(content);
            events.add(new DayEventView(formatHm(row.getCreatedAt()),
                next != null ? formatHm(next.getCreatedAt()) : null,
                new ActivityView(nameDetail[0], nameDetail[1])));
        }
        return new DayScheduleView(date, wakeupAt, events);
    }

    private static boolean isEndMarker(String content) {
        return END_MARKERS.contains(content.trim());
    }

    /** HH:mm from the createdAt ISO string, keeping the data's own timezone. */
    private static String formatHm(String iso) {
        return iso.length() >= 16 ? iso.substring(11, 16) : iso;
    }

    /** Split content on the first space into name/detail (detail may be null). */
    private static String[] splitNameDetail(String content) {
        int idx = content.indexOf(' ');
        if (idx == -1) {
            return new String[] { content, null };
        }
        String detail = content.substring(idx + 1).trim();
        return new String[] { content.substring(0, idx), detail.isEmpty() ? null : detail };
    }
}