package com.occupancy.api.controller;

import com.occupancy.api.dto.CreateVenueRequestDto;
import com.occupancy.api.dto.VenueResponseDto;
import com.occupancy.domain.Venue;
import com.occupancy.repository.VenueRepository;
import com.occupancy.service.OccupancyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/venues")
@CrossOrigin(origins = "*")
public class VenueController {

    private final OccupancyService occupancyService;
    private final VenueRepository venueRepository;

    public VenueController(OccupancyService occupancyService, VenueRepository venueRepository) {
        this.occupancyService = Objects.requireNonNull(occupancyService, "occupancyService must not be null");
        this.venueRepository = Objects.requireNonNull(venueRepository, "venueRepository must not be null");
    }

    @GetMapping
    public ResponseEntity<List<VenueResponseDto>> getAllVenues() {
        List<VenueResponseDto> venues = venueRepository.findAll().stream()
                .map(VenueResponseDto::fromDomain)
                .collect(Collectors.toList());
        return ResponseEntity.ok(venues);
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
}
