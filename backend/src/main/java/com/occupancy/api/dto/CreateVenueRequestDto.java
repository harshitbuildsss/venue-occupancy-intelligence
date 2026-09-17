package com.occupancy.api.dto;

import com.occupancy.domain.Venue;
import com.occupancy.domain.VenueType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateVenueRequestDto(
    @NotBlank(message = "venueId is required")
    String venueId,

    @NotBlank(message = "name is required")
    String name,

    @NotNull(message = "type is required")
    VenueType type,

    @Min(value = 1, message = "capacity must be at least 1")
    int capacity,

    @Min(value = 0, message = "initialOccupancy cannot be negative")
    int initialOccupancy
) {
    public Venue toDomain() {
        return new Venue(venueId, name, type, capacity, initialOccupancy);
    }
}
