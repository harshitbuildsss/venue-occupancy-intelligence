package com.occupancy.simulator;

import java.util.Objects;

public record GateConfig(
    String gateId,
    String name,
    double trafficWeight
) {
    public GateConfig {
        Objects.requireNonNull(gateId, "gateId must not be null");
        Objects.requireNonNull(name, "name must not be null");
        if (trafficWeight <= 0) {
            throw new IllegalArgumentException("trafficWeight must be positive");
        }
    }
}
