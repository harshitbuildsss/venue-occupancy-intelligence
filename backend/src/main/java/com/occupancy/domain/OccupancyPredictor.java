package com.occupancy.domain;

import java.time.Duration;
import java.util.List;
import java.util.Objects;

/**
 * Pure domain service for statistical occupancy trend velocity and short-term forecasting.
 * Strictly mathematical, deterministic, and ML-free.
 */
public class OccupancyPredictor {

    public static final double DAMPENING_FACTOR_ALPHA = 0.75;
    public static final double MAX_CAPACITY_FACTOR = 1.10;

    public record PredictionResult(
        double entryRatePerMinute,
        double exitRatePerMinute,
        double netVelocityPerMinute,
        int predictedOccupancy30m,
        CrowdStatus predictedStatus30m,
        int predictedOccupancy60m,
        CrowdStatus predictedStatus60m,
        int windowMinutes
    ) {}

    public PredictionResult predict(Venue venue, List<OccupancyEvent> recentEvents, Duration windowDuration) {
        Objects.requireNonNull(venue, "venue must not be null");
        Objects.requireNonNull(recentEvents, "recentEvents must not be null");
        Objects.requireNonNull(windowDuration, "windowDuration must not be null");

        double windowMinutes = Math.max(1.0, windowDuration.toSeconds() / 60.0);

        long entryCount = recentEvents.stream()
                .filter(e -> e.getEventType() == EventType.ENTRY)
                .count();

        long exitCount = recentEvents.stream()
                .filter(e -> e.getEventType() == EventType.EXIT)
                .count();

        double entryRate = roundToTwoDecimals(entryCount / windowMinutes);
        double exitRate = roundToTwoDecimals(exitCount / windowMinutes);
        double netVelocity = roundToTwoDecimals(entryRate - exitRate);

        int current = venue.getCurrentOccupancy();
        int capacity = venue.getCapacity();
        int maxAllowed = (int) Math.floor(capacity * MAX_CAPACITY_FACTOR);

        // 30-minute linear projection
        double raw30 = current + (netVelocity * 30.0);
        int pred30 = clamp((int) Math.round(raw30), 0, maxAllowed);
        CrowdStatus status30 = CrowdStatus.calculate(pred30, capacity);

        // 60-minute dampened projection with alpha = 0.75
        double raw60 = current + (netVelocity * 30.0) + (netVelocity * 30.0 * DAMPENING_FACTOR_ALPHA);
        int pred60 = clamp((int) Math.round(raw60), 0, maxAllowed);
        CrowdStatus status60 = CrowdStatus.calculate(pred60, capacity);

        return new PredictionResult(
            entryRate,
            exitRate,
            netVelocity,
            pred30,
            status30,
            pred60,
            status60,
            (int) Math.round(windowMinutes)
        );
    }

    private int clamp(int value, int min, int max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    private double roundToTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
