package me.sean.my_trace_it.domain;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/**
 * Per-date diary entry, owned by a user. (ownerId, date) is the composite key.
 */
@Entity
@Table(name = "diary")
@IdClass(Diary.DiaryId.class)
public class Diary {

    @Id
    private Long ownerId;

    @Id
    private String date;

    @Column(nullable = false)
    private String content = "";

    private String createdAt;
    private String updatedAt;
    private String deletedAt;

    public Diary() {
    }

    public Diary(Long ownerId, String date, String content, String createdAt, String updatedAt, String deletedAt) {
        this.ownerId = ownerId;
        this.date = date;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.deletedAt = deletedAt;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(String deletedAt) {
        this.deletedAt = deletedAt;
    }

    public static class DiaryId implements Serializable {
        private Long ownerId;
        private String date;

        public DiaryId() {
        }

        public DiaryId(Long ownerId, String date) {
            this.ownerId = ownerId;
            this.date = date;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof DiaryId that)) {
                return false;
            }
            return Objects.equals(ownerId, that.ownerId) && Objects.equals(date, that.date);
        }

        @Override
        public int hashCode() {
            return Objects.hash(ownerId, date);
        }
    }
}