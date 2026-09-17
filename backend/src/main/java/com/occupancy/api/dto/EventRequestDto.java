package com.occupancy.api.dto;

import com.occupancy.domain.EventType;
import com.occupancy.domain.OccupancyEvent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record EventRequestDto(
    @NotBlank(message = "eventId is required")
    String eventId,

    @NotBlank(message = "venueId is required")
    String venueId,

    @NotBlank(message = "deviceId is required")
    String deviceId,

    @NotNull(message = "eventType is required (ENTRY or EXIT)")
    EventType eventType,

    Instant timestamp
) {
    public OccupancyEvent toDomain() {
        return new OccupancyEvent(
            eventId,
            venueId,
            deviceId,
            eventType,
            timestamp != null ? timestamp : Instant.now()
        );
    }
}
