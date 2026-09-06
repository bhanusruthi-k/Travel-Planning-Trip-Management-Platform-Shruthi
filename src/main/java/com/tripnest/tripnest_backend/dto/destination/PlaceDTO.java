package com.tripnest.tripnest_backend.dto.destination;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceDTO {
    private String id;
    private String name;
    private String category;
    private Double rating;
    private Integer reviewCount;
    private String address;
    private String imageUrl;
    private String description;
}
