# Production Monitoring Setup Guide

This guide helps you set up free monitoring for KhetConnect with structured JSON logging and error tracking.

## Overview

The system now includes:
- **Structured JSON logging** with request correlation (X-Request-ID) in `logs/app-json.log`
- **Business event logging** in `logs/business-events.log` (JSON format) for audit trail
- **Error tracking** from frontend errors reported to `/api/v1/client-errors`
- **Health endpoint** exposed at `/actuator/health` for uptime monitoring
- **PII masking** in logs to protect sensitive data (phone numbers, emails, GPS coordinates)

## Log Files

Logs are stored in the `./logs/` directory:

- **app-json.log**: Complete application logs in structured JSON format (logstash-compatible)
- **app.log**: Human-readable text logs for development
- **error.log**: Errors only (threshold=ERROR)
- **business-events.log**: Business events (JSON format) - job posts, applications, completions, etc.

All logs are rotated:
- **File size**: 10MB per file
- **Retention**: 30 days
- **Total cap**: 1GB

## Option 1: UptimeRobot (Free - Recommended)

UptimeRobot provides free monitoring with 5-minute interval checks (free tier).

### Setup Steps:

1. **Create free account**: https://uptimerobot.com
2. **Add new monitor**:
   - Type: HTTP(s)
   - Friendly name: "KhetConnect Health"
   - URL: `https://your-railway-url/actuator/health`
   - Monitoring interval: 5 minutes (free tier)
   - Alert contacts: Your email
3. **Test**: Check that `/actuator/health` returns `{"status":"UP",...}`

Expected response:
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "ping": {"status": "UP"}
  }
}
```

**Alerts**: UptimeRobot will email you if health check fails for >1 minute.

---

## Option 2: Cron-based Local Monitoring Script

Run a simple health check script locally every 5 minutes:

```bash
#!/bin/bash
# health-check.sh
HEALTH_URL="https://your-railway-url/actuator/health"
LOG_FILE="/var/log/khetconnect-health.log"

RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$HTTP_CODE" != "200" ]; then
  echo "[$TIMESTAMP] ALERT: Health check failed (HTTP $HTTP_CODE)" >> "$LOG_FILE"
  # Send email, webhook, or Slack notification here
  echo "KhetConnect is DOWN" | mail -s "🚨 KhetConnect DOWN" your-email@example.com
else
  echo "[$TIMESTAMP] OK: Health check passed" >> "$LOG_FILE"
fi
```

Add to crontab:
```bash
crontab -e
# Add line:
*/5 * * * * /path/to/health-check.sh
```

---

## Option 3: Backend Monitoring with Prometheus + Grafana

For production-grade monitoring:

### 1. Enable Prometheus metrics (already configured in application.yml):
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
```

Metrics available at: `https://your-url/actuator/prometheus`

### 2. Install Prometheus locally or in Docker:
```bash
docker run -d \
  -p 9090:9090 \
  -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

### 3. Configure prometheus.yml:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'khetconnect'
    static_configs:
      - targets: ['your-railway-url/actuator/prometheus']
```

### 4. Install Grafana:
```bash
docker run -d \
  -p 3000:3000 \
  grafana/grafana
```

Add Prometheus data source in Grafana and create dashboards for:
- HTTP request rate
- Response times
- Error rates
- JVM memory/GC
- Database connection pool

---

## Log Analysis and Troubleshooting

### View Real-time Logs

```bash
# Text logs
tail -f logs/app.log

# JSON logs (with jq for parsing)
tail -f logs/app-json.log | jq '.'

# Business events
tail -f logs/business-events.log | jq '.'

# Errors only
tail -f logs/error.log
```

### Search Business Events

Find all "JOB_POSTED" events in last 100 lines:
```bash
tail -n 100 logs/business-events.log | grep "JOB_POSTED"
```

Or with jq (for JSON logs):
```bash
tail -n 100 logs/business-events.log | jq 'select(.message == "JOB_POSTED")'
```

### Find Errors by Request ID

Correlate all logs for a request using X-Request-ID (in MDC):
```bash
REQUEST_ID="abc123def456"
grep "$REQUEST_ID" logs/app.log logs/app-json.log logs/error.log
```

### Check Frontend Errors

Errors from the ErrorBoundary are POSTed to `/api/v1/client-errors` and logged server-side.

Search logs:
```bash
grep "CLIENT_ERROR" logs/error.log
grep "Frontend error reported" logs/app.log
```

---

## Log Aggregation (Optional)

For production, send JSON logs to a centralized log aggregation service:

### ELK Stack (Elasticsearch, Logstack, Kibana)
- Import `logs/app-json.log` files to Elasticsearch
- Query and visualize in Kibana

### Datadog / New Relic / Splunk
- Forward JSON logs using a log shipper
- Search and analyze in their UI

Example (using Filebeat to ship to Datadog):
```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - ./logs/app-json.log

output.datadog:
  enabled: true
  api_key: ${DATADOG_API_KEY}
  hostname: khetconnect-prod
```

---

## PII Protection in Logs

All logs are configured to mask sensitive data:

- **Phone numbers**: Masked as `****XXX` (last 3 digits visible)
- **Emails**: Masked as `a***@example.com`
- **GPS coordinates**: Rounded to 2 decimals (~1km precision)

Example logged event:
```json
{
  "event_type": "JOB_POSTED",
  "job_id": 42,
  "farmer_id": "****890",
  "work_type": "Harvesting",
  "location": "Village name",
  "timestamp": "2025-01-15T10:30:45Z"
}
```

---

## Automated Alerts

### Set Up Email Alerts for Errors

Edit `logs/error.log` monitoring:
```bash
#!/bin/bash
# alert-on-errors.sh - run every 5 minutes via cron

ERROR_COUNT=$(wc -l < logs/error.log.$(date +%Y-%m-%d))
THRESHOLD=50

if [ "$ERROR_COUNT" -gt "$THRESHOLD" ]; then
  echo "Alert: $ERROR_COUNT errors logged today" | \
    mail -s "🚨 KhetConnect Errors" your-email@example.com
fi
```

### Monitor FCM Notification Failures

Search for `NOTIFICATION_SEND_FAILED` events:
```bash
grep "NOTIFICATION_SEND_FAILED" logs/business-events.log | wc -l
```

If notification failures spike, check:
1. Firebase Admin SDK configuration
2. FCM token validity
3. Firebase quota limits

---

## Health Endpoint Details

**Endpoint**: `GET /actuator/health`

Response (when healthy):
```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP",
      "details": {
        "database": "PostgreSQL",
        "validationQuery": "..."
      }
    },
    "ping": {
      "status": "UP"
    }
  }
}
```

Response (when degraded):
```json
{
  "status": "DOWN",
  "components": {
    "db": {
      "status": "DOWN",
      "details": {
        "error": "Connection refused"
      }
    }
  }
}
```

---

## Best Practices

1. **Regular log review**: Check `logs/error.log` daily
2. **Monitor notification failures**: Setup alerts on `NOTIFICATION_SEND_FAILED` events
3. **Rotate old logs**: Archive logs older than 30 days
4. **Update PII rules**: If new sensitive fields are added to logs, update `PiiMasker.java`
5. **Test alerts**: Manually trigger an error to verify alert system works
6. **Keep dashboards**: Update monitoring dashboards as features are added

---

## Quick Reference: Configuration

**application.yml**:
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
```

**logback-spring.xml**:
- Console appender (text, development-friendly)
- JSON file appender (machine-readable, logstash-compatible)
- Business events appender (separate JSON log for events)
- Error-only appender (quick error scanning)

**PiiMasker.java**:
- Masks phone numbers
- Masks emails
- Masks/truncates GPS coordinates
- Can be extended for other sensitive fields

---

## Troubleshooting

**Health check returns 503 (DOWN)**
- Database connection lost → Check PostgreSQL/Neon
- Memory issues → Check JVM heap size

**No logs appearing**
- Check `./logs/` directory exists
- Verify `logback-spring.xml` is in classpath
- Check file permissions

**JSON logs not valid**
- Ensure logstash-logback-encoder is in pom.xml
- Validate JSON: `cat logs/app-json.log | jq '.' | head`

**Missing business events**
- Verify `BusinessEventLogger` is called in service methods
- Check log level is INFO or lower
- Events only logged for specific actions (job post, application, etc.)

