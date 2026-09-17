package com.occupancy.domain;

import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Core Occupancy Engine.
 * Responsible for applying entry/exit events to a venue while enforcing:
 * 1. Idempotency (duplicate events are ignored and do not alter state)
 * 2. Non-negative occupancy floor (EXIT on 0 is rejected)
 * 3. Centralized CrowdStatus recalculation (including CAPACITY_ANOMALY when > capacity)
 *
 * Designed to be portable to AWS Lambda / DynamoDB conditional writes later.
 */
public class OccupancyEngine {

    // Processed event ID registry for idempotency
    private final Set<String> processedEventIds = ConcurrentHashMap.newKeySet();

    public synchronized EventProcessingResult processEvent(Venue venue, OccupancyEvent event) {
        if (!venue.getVenueId().equals(event.getVenueId())) {
            return EventProcessingResult.rejected(
                EventProcessingStatus.INVALID_VENUE_MISMATCH,
                "Event venueId does not match venue",
                venue.getCurrentOccupancy(),
                venue.getStatus()
            );
        }

        // Rule C: Idempotency Check
        if (processedEventIds.contains(event.getEventId())) {
            return EventProcessingResult.duplicate(venue.getCurrentOccupancy(), venue.getStatus());
        }

        // Rule A & Standard rules: ENTRY (+1), EXIT (-1)
        int current = venue.getCurrentOccupancy();

        if (event.getEventType() == EventType.EXIT) {
            if (current <= 0) {
                // Reject invalid exit event
                return EventProcessingResult.rejected(
                    EventProcessingStatus.REJECTED_NEGATIVE_OCCUPANCY,
                    "Occupancy cannot be negative. Exit event rejected.",
                    current,
                    venue.getStatus()
                );
            }
            venue.updateOccupancy(current - 1);
        } else if (event.getEventType() == EventType.ENTRY) {
            venue.updateOccupancy(current + 1);
        }

        // Mark event as processed
        processedEventIds.add(event.getEventId());

        return EventProcessingResult.processed(venue.getCurrentOccupancy(), venue.getStatus());
    }

    public boolean isEventProcessed(String eventId) {
        return processedEventIds.contains(eventId);
    }

    public Set<String> getProcessedEventIds() {
        return Collections.unmodifiableSet(processedEventIds);
    }
}
