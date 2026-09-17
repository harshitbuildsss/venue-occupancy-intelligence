package com.occupancy.simulator;

import com.occupancy.domain.OccupancyEvent;

@FunctionalInterface
public interface EventSink {
    void emit(OccupancyEvent event);
}
