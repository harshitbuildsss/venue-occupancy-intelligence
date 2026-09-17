package com.occupancy.api.controller;

import com.occupancy.api.dto.EventRequestDto;
import com.occupancy.api.dto.EventResponseDto;
import com.occupancy.domain.EventProcessingResult;
import com.occupancy.domain.EventProcessingStatus;
import com.occupancy.service.OccupancyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping("/api/v1/events")
@CrossOrigin(origins = "*")
public class EventController {

    private final OccupancyService occupancyService;

    public EventController(OccupancyService occupancyService) {
        this.occupancyService = Objects.requireNonNull(occupancyService, "occupancyService must not be null");
    }

    @PostMapping
    public ResponseEntity<EventResponseDto> ingestEvent(@Valid @RequestBody EventRequestDto request) {
        EventProcessingResult result = occupancyService.processEvent(request.toDomain());
        EventResponseDto response = EventResponseDto.fromDomainResult(result);

        if (result.status() == EventProcessingStatus.INVALID_VENUE_MISMATCH) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } else if (result.status() == EventProcessingStatus.REJECTED_NEGATIVE_OCCUPANCY) {
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
        } else if (result.status() == EventProcessingStatus.DUPLICATE_IGNORED) {
            return ResponseEntity.status(HttpStatus.OK).body(response);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
