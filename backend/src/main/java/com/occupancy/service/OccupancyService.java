package com.occupancy.service;

import com.occupancy.api.dto.VenueAnalyticsDto;
import com.occupancy.domain.*;
import com.occupancy.repository.OccupancyEventRepository;
import com.occupancy.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class OccupancyService {

    private final VenueRepository venueRepository;
    private final OccupancyEventRepository eventRepository;
    private final OccupancyEngine occupancyEngine;
    private final OccupancyPredictor occupancyPredictor;

    @Autowired
    public OccupancyService(VenueRepository venueRepository,
                            OccupancyEventRepository eventRepository) {
        this.venueRepository = Objects.requireNonNull(venueRepository, "venueRepository must not be null");
        this.eventRepository = Objects.requireNonNull(eventRepository, "eventRepository must not be null");
        this.occupancyEngine = new OccupancyEngine();
        this.occupancyPredictor = new OccupancyPredictor();
    }

    public OccupancyService(VenueRepository venueRepository,
                            OccupancyEventRepository eventRepository,
                            OccupancyEngine occupancyEngine,
                            OccupancyPredictor occupancyPredictor) {
        this.venueRepository = Objects.requireNonNull(venueRepository, "venueRepository must not be null");
        this.eventRepository = Objects.requireNonNull(eventRepository, "eventRepository must not be null");
        this.occupancyEngine = Objects.requireNonNull(occupancyEngine, "occupancyEngine must not be null");
        this.occupancyPredictor = Objects.requireNonNull(occupancyPredictor, "occupancyPredictor must not be null");
    }

    @Transactional
    public EventProcessingResult processEvent(OccupancyEvent event) {
        Objects.requireNonNull(event, "event must not be null");

        Optional<Venue> venueOpt = venueRepository.findById(event.getVenueId());
        if (venueOpt.isEmpty()) {
            return EventProcessingResult.rejected(
                EventProcessingStatus.INVALID_VENUE_MISMATCH,
                "Venue not found: " + event.getVenueId(),
                0,
                CrowdStatus.QUIET
            );
        }

        Venue venue = venueOpt.get();

        if (eventRepository.existsByEventId(event.getEventId())) {
            return EventProcessingResult.duplicate(venue.getCurrentOccupancy(), venue.getStatus());
        }

        EventProcessingResult result = occupancyEngine.processEvent(venue, event);

        if (result.status() == EventProcessingStatus.PROCESSED) {
            try {
                venueRepository.save(venue);
                eventRepository.save(event);
            } catch (DataIntegrityViolationException ex) {
                return EventProcessingResult.duplicate(venue.getCurrentOccupancy(), venue.getStatus());
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Optional<Venue> getVenue(String venueId) {
        return venueRepository.findById(venueId);
    }

    @Transactional
    public Venue registerVenue(Venue venue) {
        return venueRepository.save(venue);
    }

    @Transactional(readOnly = true)
    public Optional<VenueAnalyticsDto> getVenueAnalytics(String venueId, int windowMinutes) {
        Optional<Venue> venueOpt = venueRepository.findById(venueId);
        if (venueOpt.isEmpty()) {
            return Optional.empty();
        }

        Venue venue = venueOpt.get();
        Duration window = Duration.ofMinutes(Math.max(1, windowMinutes));
        Instant cutoff = Instant.now().minus(window);

        List<OccupancyEvent> allRecentEvents = eventRepository.findByVenueIdOrderByTimestampDesc(venueId);
        List<OccupancyEvent> windowEvents = allRecentEvents.stream()
                .filter(e -> e.getTimestamp() != null && !e.getTimestamp().isBefore(cutoff))
                .toList();

        OccupancyPredictor.PredictionResult prediction = occupancyPredictor.predict(venue, windowEvents, window);

        return Optional.of(new VenueAnalyticsDto(
            venue.getVenueId(),
            venue.getCurrentOccupancy(),
            venue.getCapacity(),
            prediction.entryRatePerMinute(),
            prediction.exitRatePerMinute(),
            prediction.netVelocityPerMinute(),
            prediction.predictedOccupancy30m(),
            prediction.predictedStatus30m(),
            prediction.predictedOccupancy60m(),
            prediction.predictedStatus60m(),
            prediction.windowMinutes()
        ));
    }
}
