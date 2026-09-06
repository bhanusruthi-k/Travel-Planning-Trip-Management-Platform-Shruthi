package com.tripnest.tripnest_backend.dto.destination;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherResponseDTO {
    private String destinationName;
    private Double temperature;
    private String condition;
    private Integer humidity;
    private Double windSpeed;
    private String icon;
    private List<ForecastDayDTO> forecast;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForecastDayDTO {
        private String day;
        private Double temp;
        private String condition;
    }
}
