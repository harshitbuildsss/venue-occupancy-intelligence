package com.occupancy.domain;

public enum EventProcessingStatus {
    PROCESSED,
    DUPLICATE_IGNORED,
    REJECTED_NEGATIVE_OCCUPANCY,
    INVALID_VENUE_MISMATCH
}
