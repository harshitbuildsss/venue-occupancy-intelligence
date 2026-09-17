package com.occupancy.api.controller;

import com.occupancy.api.dto.CreateVenueRequestDto;
import com.occupancy.api.dto.VenueAnalyticsDto;
import com.occupancy.api.dto.VenueResponseDto;
import com.occupancy.domain.Venue;
import com.occupancy.service.OccupancyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping("/api/v1/venues")
public class VenueController {

    private final OccupancyService occupancyService;

    public VenueController(OccupancyService occupancyService) {
        this.occupancyService = Objects.requireNonNull(occupancyService, "occupancyService must not be null");
    }

    @PostMapping
    public ResponseEntity<?> createVenue(@Valid @RequestBody CreateVenueRequestDto request) {
        if (occupancyService.getVenue(request.venueId()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Venue with id '" + request.venueId() + "' already exists");
        }
        Venue venue = occupancyService.registerVenue(request.toDomain());
        return ResponseEntity.status(HttpStatus.CREATED).body(VenueResponseDto.fromDomain(venue));
    }

    @GetMapping("/{venueId}")
    public ResponseEntity<VenueResponseDto> getVenue(@PathVariable("venueId") String venueId) {
        return occupancyService.getVenue(venueId)
                .map(venue -> ResponseEntity.ok(VenueResponseDto.fromDomain(venue)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/{venueId}/analytics")
    public ResponseEntity<VenueAnalyticsDto> getVenueAnalytics(
            @PathVariable("venueId") String venueId,
            @RequestParam(name = "windowMinutes", defaultValue = "15") int windowMinutes) {
        return occupancyService.getVenueAnalytics(venueId, windowMinutes)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }
}
