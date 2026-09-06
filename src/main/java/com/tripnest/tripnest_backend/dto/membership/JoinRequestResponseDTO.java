package com.tripnest.tripnest_backend.dto.membership;

import com.tripnest.tripnest_backend.model.JoinRequestStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JoinRequestResponseDTO {

    private Long id;
    private Long tripId;
    private String tripTitle;
    private Long userId;
    private String userName;
    private String userEmail;
    private JoinRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
