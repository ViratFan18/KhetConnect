# Multi-stage Dockerfile for Spring Boot backend
# Stage 1: Build with Maven
FROM maven:3.9.6-eclipse-temurin-17-jammy as builder

WORKDIR /build

# Copy pom.xml and download dependencies (cacheable layer)
COPY pom.xml .
RUN mvn dependency:resolve

# Copy source code
COPY src ./src

# Build application
RUN mvn clean package -DskipTests -q

# Stage 2: Runtime with slim JRE
FROM eclipse-temurin:17-jre-jammy

# Create non-root user for security
RUN useradd -m -u 1001 khetconnect
WORKDIR /app

# Copy built JAR from builder stage
COPY --from=builder --chown=khetconnect:khetconnect /build/target/backend-*.jar app.jar

# Switch to non-root user
USER khetconnect

# Expose port (default Spring Boot port)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/actuator/health || exit 1

# Run application with optimized JVM settings
ENTRYPOINT ["java", \
    "-Xms256m", \
    "-Xmx512m", \
    "-XX:+UseG1GC", \
    "-XX:MaxGCPauseMillis=200", \
    "-Dfile.encoding=UTF-8", \
    "-Dspring.profiles.active=production", \
    "-jar", \
    "app.jar"]
