# Multi-stage Dockerfile for Spring Boot backend - OPTIMIZED FOR RENDER
# Stage 1: Build with Maven
FROM maven:3.9.9-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy pom.xml and download dependencies (cacheable layer)
COPY pom.xml .
RUN mvn dependency:resolve -q

# Copy source code
COPY src ./src

# Build application
RUN mvn clean package -DskipTests -q

# Stage 2: Runtime with slim JRE
FROM eclipse-temurin:17-jre-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN adduser -D -u 1001 khetconnect
WORKDIR /app

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R khetconnect:khetconnect /app

# Copy built JAR
COPY --from=builder --chown=khetconnect:khetconnect /build/target/backend-*.jar app.jar

# PostgreSQL Configuration (Neon Cloud DB)
ENV SPRING_PROFILES_ACTIVE=production \
    SERVER_PORT=8080 \
    SERVER_ADDRESS=0.0.0.0 \
    SPRING_DATASOURCE_URL=jdbc:postgresql://ep-plain-sound-axn7eq8a-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require \
    SPRING_DATASOURCE_USERNAME=neondb_owner \
    SPRING_DATASOURCE_PASSWORD=npg_zsV5lG7iCIeE \
    SPRING_DATASOURCE_DRIVERCLASSNAME=org.postgresql.Driver \
    SPRING_JPA_HIBERNATE_DDL_AUTO=validate \
    SPRING_FLYWAY_ENABLED=false \
    JWT_SECRET_KEY=ThisIsA32CharSecretForKhetConnect123 \
    CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://*.vercel.app \
    KHETCONNECT_FCM_ENABLED=false \
    SPRING_DEVTOOLS_RESTART_ENABLED=false \
    LOGGING_LEVEL_ROOT=WARN \
    LOGGING_LEVEL_KHETCONNECT=INFO \
    SPRING_JPA_SHOW_SQL=false \
    SPRING_JPA_PROPERTIES_HIBERNATE_FORMAT_SQL=false

USER khetconnect

EXPOSE 8080

HEALTHCHECK --interval=20s --timeout=2s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Optimized JVM startup flags for fast boot on Render
ENTRYPOINT ["java", \
    "-Xms128m", \
    "-Xmx256m", \
    "-XX:+UseG1GC", \
    "-XX:MaxGCPauseMillis=200", \
    "-XX:InitiatingHeapOccupancyPercent=35", \
    "-XX:+ParallelRefProcEnabled", \
    "-XX:+TieredCompilation", \
    "-XX:TieredStopAtLevel=1", \
    "-Dfile.encoding=UTF-8", \
    "-Dspring.xml.ignore=true", \
    "-Dspring.groovy.template.check-template-location=false", \
    "-Dspring.jmx.enabled=false", \
    "-jar", \
    "app.jar"]
