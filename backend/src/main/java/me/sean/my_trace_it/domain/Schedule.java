package me.sean.my_trace_it.domain;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

/**
 * A scheduling record row. Owned by a user; (ownerId, uuid) is the composite key.
 */
@Entity
@Table(name = "schedule")
@IdClass(Schedule.ScheduleId.class)
public class Schedule {

    @Id
    private Long ownerId;

    @Id
    private String uuid;

    private String createdAt;
    private String content;
    private String amountFormatted;
    private Double amount;
    private String amountUnit;

    public Schedule() {
    }

    public Schedule(Long ownerId, String uuid, String createdAt, String content,
                    String amountFormatted, Double amount, String amountUnit) {
        this.ownerId = ownerId;
        this.uuid = uuid;
        this.createdAt = createdAt;
        this.content = content;
        this.amountFormatted = amountFormatted;
        this.amount = amount;
        this.amountUnit = amountUnit;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public String getUuid() {
        return uuid;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getAmountFormatted() {
        return amountFormatted;
    }

    public Double getAmount() {
        return amount;
    }

    public String getAmountUnit() {
        return amountUnit;
    }

    public static class ScheduleId implements Serializable {
        private Long ownerId;
        private String uuid;

        public ScheduleId() {
        }

        public ScheduleId(Long ownerId, String uuid) {
            this.ownerId = ownerId;
            this.uuid = uuid;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) {
                return true;
            }
            if (!(o instanceof ScheduleId that)) {
                return false;
            }
            return Objects.equals(ownerId, that.ownerId) && Objects.equals(uuid, that.uuid);
        }

        @Override
        public int hashCode() {
            return Objects.hash(ownerId, uuid);
        }
    }
}