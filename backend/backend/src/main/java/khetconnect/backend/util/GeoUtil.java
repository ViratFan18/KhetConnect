package khetconnect.backend.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class GeoUtil {

    private static final double EARTH_RADIUS_KM = 6371.0;
    private static final double LOCATION_BUCKET_DEGREES = 0.01; // ~1.1km at the equator

    private GeoUtil() {}

    public static double distanceKm(BigDecimal lat1, BigDecimal lng1, BigDecimal lat2, BigDecimal lng2) {
        if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
            return Double.MAX_VALUE;
        }
        double dLat = Math.toRadians(lat2.doubleValue() - lat1.doubleValue());
        double dLng = Math.toRadians(lng2.doubleValue() - lng1.doubleValue());
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1.doubleValue())) * Math.cos(Math.toRadians(lat2.doubleValue()))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(EARTH_RADIUS_KM * c * 100.0) / 100.0;
    }

    public static boolean withinKm(BigDecimal lat1, BigDecimal lng1, BigDecimal lat2, BigDecimal lng2, double km) {
        return distanceKm(lat1, lng1, lat2, lng2) <= km;
    }

    public static String locationBucket(BigDecimal lat, BigDecimal lng) {
        if (lat == null || lng == null) {
            return "unknown";
        }

        BigDecimal bucketLat = BigDecimal.valueOf(Math.round(lat.doubleValue() / LOCATION_BUCKET_DEGREES) * LOCATION_BUCKET_DEGREES)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal bucketLng = BigDecimal.valueOf(Math.round(lng.doubleValue() / LOCATION_BUCKET_DEGREES) * LOCATION_BUCKET_DEGREES)
                .setScale(2, RoundingMode.HALF_UP);

        return bucketLat + ":" + bucketLng;
    }
}
