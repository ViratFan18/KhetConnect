package khetconnect.backend.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Locale;

public enum WorkType {
    GENERAL, HARVESTING, PLANTING, IRRIGATION, SPRAYING, WEEDING, OTHER;

    @JsonCreator
    public static WorkType fromValue(String value) {
        if (value == null || value.isBlank()) {
            return OTHER;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "GENERAL", "GEN", "DEFAULT" -> GENERAL;
            case "HARVESTING" -> HARVESTING;
            case "PLANTING" -> PLANTING;
            case "IRRIGATION" -> IRRIGATION;
            case "SPRAYING" -> SPRAYING;
            case "WEEDING" -> WEEDING;
            case "OTHER" -> OTHER;
            default -> OTHER;
        };
    }
}
