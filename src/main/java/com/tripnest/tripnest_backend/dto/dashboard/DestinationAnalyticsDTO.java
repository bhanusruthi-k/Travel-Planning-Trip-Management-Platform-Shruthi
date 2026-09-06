package com.tripnest.tripnest_backend.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationAnalyticsDTO {
    private Long destinationId;
    private String destinationName;
    private String country;
    private String imageUrl;
    private long tripCount;

    public DestinationAnalyticsDTO(Long destinationId, String destinationName, String country, long tripCount) {
        this.destinationId = destinationId;
        this.destinationName = destinationName;
        this.country = country;
        this.tripCount = tripCount;
    }
}
