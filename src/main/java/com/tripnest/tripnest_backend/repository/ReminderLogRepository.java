package com.tripnest.tripnest_backend.repository;

import com.tripnest.tripnest_backend.model.ReminderLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReminderLogRepository extends JpaRepository<ReminderLog, Long> {

    boolean existsByReminderTypeAndEntityIdAndUserIdAndReminderKey(
            String reminderType, Long entityId, Long userId, String reminderKey);

    boolean existsByReminderTypeAndEntityIdAndUserId(
            String reminderType, Long entityId, Long userId);

    boolean existsByReminderTypeAndEntityId(
            String reminderType, Long entityId);

    Optional<ReminderLog> findByReminderTypeAndEntityIdAndUserIdAndReminderKey(
            String reminderType, Long entityId, Long userId, String reminderKey);

    @Modifying
    @Query("DELETE FROM ReminderLog r WHERE r.reminderType = :reminderType AND r.entityId = :entityId")
    void deleteByReminderTypeAndEntityId(@Param("reminderType") String reminderType, @Param("entityId") Long entityId);

    @Modifying
    @Query("DELETE FROM ReminderLog r WHERE r.userId = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}

