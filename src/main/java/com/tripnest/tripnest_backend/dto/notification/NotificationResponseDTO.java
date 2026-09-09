package com.tripnest.tripnest_backend.dto.notification;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.tripnest.tripnest_backend.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDTO {
    private Long id;
    private NotificationType type;
    private String message;
    private Long tripId;
    private String tripTitle;

    @JsonProperty("isRead")
    private boolean isRead;

    @JsonProperty("read")
    public boolean isReadProperty() {
        return isRead;
    }

    private LocalDateTime createdAt;
}
