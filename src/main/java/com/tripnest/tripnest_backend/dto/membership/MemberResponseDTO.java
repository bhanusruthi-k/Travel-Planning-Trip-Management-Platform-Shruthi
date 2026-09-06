package com.tripnest.tripnest_backend.dto.membership;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberResponseDTO {

    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String role; // OWNER, GROUP_ADMIN, MEMBER
    private LocalDateTime joinedAt;
}
