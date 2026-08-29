package me.sean.my_trace_it.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import me.sean.my_trace_it.domain.Color;

public interface ColorRepository extends JpaRepository<Color, Long> {

    List<Color> findByOwnerIdAndDeletedAtIsNullOrderBySeqAsc(Long ownerId);

    Optional<Color> findByOwnerIdAndName(Long ownerId, String name);

    boolean existsByOwnerIdAndId(Long ownerId, Long id);
}