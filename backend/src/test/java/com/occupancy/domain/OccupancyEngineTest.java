package com.occupancy.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class OccupancyEngineTest {

    private OccupancyEngine engine;
    private Venue venue;

    @BeforeEach
    void setUp() {
        engine = new OccupancyEngine();
        // Capacity = 100, initial occupancy = 0
        venue = new Venue("mall_001", "Pacific Mall", VenueType.MALL, 100, 0);
    }

    @Test
    @DisplayName("ENTRY event increments occupancy by 1")
    void testEntryIncrementsOccupancy() {
        OccupancyEvent entry = new OccupancyEvent("evt_1", "mall_001", "gate_a", EventType.ENTRY, Instant.now());
        EventProcessingResult result = engine.processEvent(venue, entry);

        assertEquals(EventProcessingStatus.PROCESSED, result.status());
        assertEquals(1, venue.getCurrentOccupancy());
        assertEquals(1, result.resultingOccupancy());
        assertEquals(CrowdStatus.QUIET, result.resultingStatus());
        assertTrue(engine.isEventProcessed("evt_1"));
    }

    @Test
    @DisplayName("EXIT event decrements occupancy by 1 when occupancy > 0")
    void testExitDecrementsOccupancy() {
        // Setup initial occupancy = 5
        Venue v = new Venue("mall_001", "Pacific Mall", VenueType.MALL, 100, 5);

        OccupancyEvent exit = new OccupancyEvent("evt_exit_1", "mall_001", "gate_b", EventType.EXIT, Instant.now());
        EventProcessingResult result = engine.processEvent(v, exit);

        assertEquals(EventProcessingStatus.PROCESSED, result.status());
        assertEquals(4, v.getCurrentOccupancy());
        assertEquals(4, result.resultingOccupancy());
    }

    @Test
    @DisplayName("Edge Case A: EXIT when occupancy is 0 must NOT become -1 and must be rejected")
    void testExitAtZeroOccupancyRejected() {
        assertEquals(0, venue.getCurrentOccupancy());

        OccupancyEvent exit = new OccupancyEvent("evt_bad_exit", "mall_001", "gate_a", EventType.EXIT, Instant.now());
        EventProcessingResult result = engine.processEvent(venue, exit);

        assertEquals(EventProcessingStatus.REJECTED_NEGATIVE_OCCUPANCY, result.status());
        assertEquals(0, venue.getCurrentOccupancy());
        assertFalse(engine.isEventProcessed("evt_bad_exit"), "Rejected event should not be marked as processed");
    }

    @Test
    @DisplayName("Edge Case B: Occupancy exceeding capacity flags CAPACITY_ANOMALY")
    void testCapacityAnomalyWhenExceedingCapacity() {
        Venue smallVenue = new Venue("gym_001", "Gold's Gym", VenueType.GYM, 2, 2);
        assertEquals(CrowdStatus.NEAR_CAPACITY, smallVenue.getStatus());

        OccupancyEvent overflowEntry = new OccupancyEvent("evt_over", "gym_001", "gate_1", EventType.ENTRY, Instant.now());
        EventProcessingResult result = engine.processEvent(smallVenue, overflowEntry);

        assertEquals(EventProcessingStatus.PROCESSED, result.status());
        assertEquals(3, smallVenue.getCurrentOccupancy());
        assertEquals(CrowdStatus.CAPACITY_ANOMALY, result.resultingStatus());
        assertEquals(CrowdStatus.CAPACITY_ANOMALY, smallVenue.getStatus());
    }

    @Test
    @DisplayName("Edge Case C: Duplicate eventId is ignored and does not double-count (Idempotency)")
    void testIdempotencyDuplicateEventIgnored() {
        OccupancyEvent entry = new OccupancyEvent("evt_dup_1", "mall_001", "gate_a", EventType.ENTRY, Instant.now());

        // First attempt: processed
        EventProcessingResult firstResult = engine.processEvent(venue, entry);
        assertEquals(EventProcessingStatus.PROCESSED, firstResult.status());
        assertEquals(1, venue.getCurrentOccupancy());

        // Second attempt with exact same eventId: duplicate ignored
        EventProcessingResult secondResult = engine.processEvent(venue, entry);
        assertEquals(EventProcessingStatus.DUPLICATE_IGNORED, secondResult.status());
        assertEquals(1, venue.getCurrentOccupancy(), "Occupancy must NOT increment again on duplicate event");
    }

    @Test
    @DisplayName("Event venueId mismatch is rejected without modifying state")
    void testVenueMismatchRejected() {
        OccupancyEvent mismatch = new OccupancyEvent("evt_mis", "diff_mall", "gate_a", EventType.ENTRY, Instant.now());
        EventProcessingResult result = engine.processEvent(venue, mismatch);

        assertEquals(EventProcessingStatus.INVALID_VENUE_MISMATCH, result.status());
        assertEquals(0, venue.getCurrentOccupancy());
        assertFalse(engine.isEventProcessed("evt_mis"));
    }

    @ParameterizedTest
    @CsvSource({
        "0, 100, QUIET",
        "29, 100, QUIET",
        "30, 100, MODERATE",
        "59, 100, MODERATE",
        "60, 100, BUSY",
        "79, 100, BUSY",
        "80, 100, VERY_BUSY",
        "94, 100, VERY_BUSY",
        "95, 100, NEAR_CAPACITY",
        "100, 100, NEAR_CAPACITY",
        "101, 100, CAPACITY_ANOMALY"
    })
    @DisplayName("Crowd status percentage thresholds evaluate accurately")
    void testCrowdStatusThresholds(int occupancy, int capacity, CrowdStatus expectedStatus) {
        assertEquals(expectedStatus, CrowdStatus.calculate(occupancy, capacity));
    }
}
