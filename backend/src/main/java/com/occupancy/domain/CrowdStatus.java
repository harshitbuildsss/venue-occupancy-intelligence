package com.occupancy.domain;

public enum CrowdStatus {
    QUIET,
    MODERATE,
    BUSY,
    VERY_BUSY,
    NEAR_CAPACITY,
    CAPACITY_ANOMALY;

    public static CrowdStatus calculate(int occupancy, int capacity) {
        if (capacity <= 0) {
            return CAPACITY_ANOMALY;
        }
        if (occupancy > capacity) {
            return CAPACITY_ANOMALY;
        }
        double percentage = ((double) occupancy / capacity) * 100.0;
        if (percentage < 30.0) {
            return QUIET;
        } else if (percentage < 60.0) {
            return MODERATE;
        } else if (percentage < 80.0) {
            return BUSY;
        } else if (percentage < 95.0) {
            return VERY_BUSY;
        } else {
            return NEAR_CAPACITY;
        }
    }
}
