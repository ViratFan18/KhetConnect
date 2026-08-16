package khetconnect.backend.config;

import khetconnect.backend.util.GeoUtil;

import java.math.BigDecimal;

public final class CacheKeys {
    private CacheKeys() {}

    public static String nearbyJobsKey(BigDecimal lat, BigDecimal lng) {
        return "nearbyJobs:" + GeoUtil.locationBucket(lat, lng);
    }
}
