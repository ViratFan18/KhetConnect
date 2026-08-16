package khetconnect.backend.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.annotation.PostConstruct;
import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Configuration
@Slf4j
public class FirebaseConfig {

    @Value("${FIREBASE_SERVICE_ACCOUNT_PATH:}")
    private String serviceAccountPath;

    @Value("${khetconnect.fcm.enabled:false}")
    private boolean fcmEnabled;

    @PostConstruct
    public void init() {
        if (!fcmEnabled) {
            log.info("FCM disabled via configuration; skipping Firebase initialization");
            return;
        }

        if (serviceAccountPath == null || serviceAccountPath.isBlank()) {
            log.warn("FIREBASE_SERVICE_ACCOUNT_PATH not set; skipping Firebase initialization");
            return;
        }

        try {
            Path p = Path.of(serviceAccountPath);
            if (!Files.exists(p)) {
                log.warn("Firebase service account file does not exist at {} ; skipping initialization", serviceAccountPath);
                return;
            }
            try (FileInputStream serviceAccount = new FileInputStream(p.toFile())) {
                GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("Initialized FirebaseApp from service account");
            }
        } catch (Exception e) {
            log.warn("Failed to initialize FirebaseApp: {}", e.getMessage());
        }
    }
}
