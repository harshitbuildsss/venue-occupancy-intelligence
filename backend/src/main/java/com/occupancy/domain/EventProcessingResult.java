package com.occupancy.domain;

public record EventProcessingResult(
    EventProcessingStatus status,
    String message,
    int resultingOccupancy,
    CrowdStatus resultingStatus
) {
    public static EventProcessingResult processed(int occupancy, CrowdStatus status) {
        return new EventProcessingResult(EventProcessingStatus.PROCESSED, "Event processed successfully", occupancy, status);
    }

    public static EventProcessingResult duplicate(int occupancy, CrowdStatus status) {
        return new EventProcessingResult(EventProcessingStatus.DUPLICATE_IGNORED, "Duplicate event ignored", occupancy, status);
    }

    public static EventProcessingResult rejected(EventProcessingStatus status, String message, int occupancy, CrowdStatus crowdStatus) {
        return new EventProcessingResult(status, message, occupancy, crowdStatus);
    }
}
