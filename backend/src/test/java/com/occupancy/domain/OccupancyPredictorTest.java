package com.occupancy.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OccupancyPredictorTest {

    private OccupancyPredictor predictor;
    private Venue venue;

    @BeforeEach
    void setUp() {
        predictor = new OccupancyPredictor();
        venue = new Venue("mall_01", "Pacific Mall", VenueType.MALL, 1000, 500);
    }

    @Test
    @DisplayName("Zero events in window results in 0 net velocity and identical predicted occupancy")
    void testZeroEventsProducesNeutralPrediction() {
        OccupancyPredictor.PredictionResult result = predictor.predict(venue, List.of(), Duration.ofMinutes(15));

        assertEquals(0.0, result.entryRatePerMinute());
        assertEquals(0.0, result.exitRatePerMinute());
        assertEquals(0.0, result.netVelocityPerMinute());
        assertEquals(500, result.predictedOccupancy30m());
        assertEquals(500, result.predictedOccupancy60m());
        assertEquals(CrowdStatus.MODERATE, result.predictedStatus30m());
        assertEquals(CrowdStatus.MODERATE, result.predictedStatus60m());
        assertEquals(15, result.windowMinutes());
    }

    @Test
    @DisplayName("Net positive velocity correctly projects 30m linear and 60m dampened forecast")
    void testNetPositiveVelocity() {
        List<OccupancyEvent> events = new ArrayList<>();
        Instant now = Instant.now();
        for (int i = 0; i < 60; i++) {
            events.add(new OccupancyEvent("in_" + i, "mall_01", "g1", EventType.ENTRY, now.minusSeconds(i * 10)));
        }
        for (int i = 0; i < 15; i++) {
            events.add(new OccupancyEvent("out_" + i, "mall_01", "g1", EventType.EXIT, now.minusSeconds(i * 10)));
        }

        OccupancyPredictor.PredictionResult result = predictor.predict(venue, events, Duration.ofMinutes(15));

        assertEquals(4.0, result.entryRatePerMinute());
        assertEquals(1.0, result.exitRatePerMinute());
        assertEquals(3.0, result.netVelocityPerMinute());
        assertEquals(590, result.predictedOccupancy30m());
        assertEquals(CrowdStatus.MODERATE, result.predictedStatus30m());
        assertEquals(658, result.predictedOccupancy60m());
        assertEquals(CrowdStatus.BUSY, result.predictedStatus60m());
    }

    @Test
    @DisplayName("Strong outflow clamps to zero-floor and QUIET crowd status")
    void testOutflowClampedToZeroFloor() {
        Venue smallGym = new Venue("gym_01", "Cult Fit", VenueType.GYM, 200, 20);

        List<OccupancyEvent> events = new ArrayList<>();
        Instant now = Instant.now();
        for (int i = 0; i < 10; i++) {
            events.add(new OccupancyEvent("in_" + i, "gym_01", "g1", EventType.ENTRY, now.minusSeconds(i * 10)));
        }
        for (int i = 0; i < 50; i++) {
            events.add(new OccupancyEvent("out_" + i, "gym_01", "g1", EventType.EXIT, now.minusSeconds(i * 10)));
        }

        OccupancyPredictor.PredictionResult result = predictor.predict(smallGym, events, Duration.ofMinutes(10));

        assertEquals(-4.0, result.netVelocityPerMinute());
        assertEquals(0, result.predictedOccupancy30m());
        assertEquals(CrowdStatus.QUIET, result.predictedStatus30m());
        assertEquals(0, result.predictedOccupancy60m());
        assertEquals(CrowdStatus.QUIET, result.predictedStatus60m());
    }

    @Test
    @DisplayName("Extreme inflow clamps to maximum allowed 110% of venue capacity and marks CAPACITY_ANOMALY")
    void testExtremeInflowClampedTo110PercentCapacity() {
        Venue club = new Venue("club_01", "Arena", VenueType.EVENT_VENUE, 500, 400);

        List<OccupancyEvent> events = new ArrayList<>();
        Instant now = Instant.now();
        for (int i = 0; i < 100; i++) {
            events.add(new OccupancyEvent("in_" + i, "club_01", "g1", EventType.ENTRY, now.minusSeconds(i)));
        }

        OccupancyPredictor.PredictionResult result = predictor.predict(club, events, Duration.ofMinutes(5));

        assertEquals(20.0, result.netVelocityPerMinute());
        assertEquals(550, result.predictedOccupancy30m());
        assertEquals(CrowdStatus.CAPACITY_ANOMALY, result.predictedStatus30m());
        assertEquals(550, result.predictedOccupancy60m());
        assertEquals(CrowdStatus.CAPACITY_ANOMALY, result.predictedStatus60m());
    }
}
