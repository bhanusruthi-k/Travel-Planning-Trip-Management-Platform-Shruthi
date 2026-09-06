package com.tripnest.tripnest_backend.dto.membership;

import com.tripnest.tripnest_backend.model.MemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateMemberRoleRequestDTO {

    @NotNull(message = "Role is required")
    private MemberRole role;
}
