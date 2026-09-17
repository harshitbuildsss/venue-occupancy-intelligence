package com.occupancy.api.dto;

import com.occupancy.domain.CrowdStatus;
import com.occupancy.domain.EventProcessingResult;
import com.occupancy.domain.EventProcessingStatus;

public record EventResponseDto(
    EventProcessingStatus status,
    String message,
    int currentOccupancy,
    CrowdStatus crowdStatus
) {
    public static EventResponseDto fromDomainResult(EventProcessingResult result) {
        return new EventResponseDto(
            result.status(),
            result.message(),
            result.resultingOccupancy(),
            result.resultingStatus()
        );
    }
}
