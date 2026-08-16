package khetconnect.backend.util;

import java.util.regex.Pattern;

/**
 * Utility to mask PII (Personally Identifiable Information) before logging.
 * Masks phone numbers, partial GPS coordinates, and email addresses.
 */
public class PiiMasker {
    
    private static final Pattern PHONE_PATTERN = Pattern.compile("\\d{10}");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
    
    /**
     * Mask a phone number (10 digits) to the format: ******* + last 3 digits
     */
    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return phone;
        }
        return "****" + phone.substring(Math.max(0, phone.length() - 4));
    }
    
    /**
     * Mask GPS coordinates to 2 decimal places (roughly 1km precision)
     */
    public static String maskGps(Double latitude, Double longitude) {
        if (latitude == null || longitude == null) {
            return "null";
        }
        return String.format("%.2f,%.2f", latitude, longitude);
    }
    
    /**
     * Mask email address to the format: first_char**@domain
     */
    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        int atIndex = email.indexOf("@");
        if (atIndex <= 1) {
            return email;
        }
        return email.charAt(0) + "***" + email.substring(atIndex);
    }
    
    /**
     * Remove all phone numbers from a string
     */
    public static String removePhones(String text) {
        if (text == null) {
            return null;
        }
        return PHONE_PATTERN.matcher(text).replaceAll("****");
    }
    
    /**
     * Remove all email addresses from a string
     */
    public static String removeEmails(String text) {
        if (text == null) {
            return null;
        }
        return EMAIL_PATTERN.matcher(text).replaceAll("[REDACTED]");
    }
}
