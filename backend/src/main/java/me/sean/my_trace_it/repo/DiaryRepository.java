package me.sean.my_trace_it.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import me.sean.my_trace_it.domain.Diary;
import me.sean.my_trace_it.domain.Diary.DiaryId;

public interface DiaryRepository extends JpaRepository<Diary, DiaryId> {

    Optional<Diary> findByOwnerIdAndDate(Long ownerId, String date);
}