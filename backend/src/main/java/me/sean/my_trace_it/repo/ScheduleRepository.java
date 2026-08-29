package me.sean.my_trace_it.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaRepository;

import me.sean.my_trace_it.domain.Schedule;
import me.sean.my_trace_it.domain.Schedule.ScheduleId;

public interface ScheduleRepository extends JpaRepository<Schedule, ScheduleId> {

    @Query(value = "SELECT * FROM schedule WHERE owner_id = :ownerId "
            + "ORDER BY created_at DESC LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<Schedule> findPage(@Param("ownerId") Long ownerId,
                            @Param("limit") int limit,
                            @Param("offset") int offset);

    @Query(value = "SELECT * FROM schedule WHERE owner_id = :ownerId "
            + "AND substr(created_at, 1, 10) = :date ORDER BY created_at", nativeQuery = true)
    List<Schedule> findByDate(@Param("ownerId") Long ownerId, @Param("date") String date);

    @Query(value = "SELECT * FROM schedule WHERE owner_id = :ownerId AND ("
            + "substr(created_at, 1, 10) = :date OR "
            + "(substr(created_at, 1, 10) = :nextDate AND CAST(substr(created_at, 12, 2) AS INTEGER) < 4)) "
            + "ORDER BY created_at", nativeQuery = true)
    List<Schedule> findByDateWithNextMorning(@Param("ownerId") Long ownerId,
                                             @Param("date") String date,
                                             @Param("nextDate") String nextDate);

    @Query(value = "SELECT DISTINCT substr(created_at, 1, 10) AS d FROM schedule "
            + "WHERE owner_id = :ownerId ORDER BY d", nativeQuery = true)
    List<String> findDistinctDates(@Param("ownerId") Long ownerId);

    List<Schedule> findByOwnerIdAndUuid(Long ownerId, String uuid);
}