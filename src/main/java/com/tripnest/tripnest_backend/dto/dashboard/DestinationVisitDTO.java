package com.tripnest.tripnest_backend.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationVisitDTO {
    private Long destinationId;
    private String destinationName;
    private String country;
    private String imageUrl;
    private long visitCount;

    public DestinationVisitDTO(Long destinationId, String destinationName, String country, long visitCount) {
        this.destinationId = destinationId;
        this.destinationName = destinationName;
        this.country = country;
        this.visitCount = visitCount;
    }
}
