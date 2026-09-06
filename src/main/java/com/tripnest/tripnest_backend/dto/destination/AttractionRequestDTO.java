package com.tripnest.tripnest_backend.dto.destination;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttractionRequestDTO {

    @NotBlank(message = "Attraction name is required")
    @Size(max = 150, message = "Attraction name cannot exceed 150 characters")
    private String name;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;
}
