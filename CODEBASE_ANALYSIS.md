# KhetConnect Codebase Analysis Report

## Executive Summary

The KhetConnect notification system has **three critical issues** causing the reported problems:
1. **Rejection notifications never sent** - Missing notification in `rejectLabourer()`
2. **Duplicate/repeated notifications** - Multiple event listeners and API calls
3. **Quick apply errors** - Race condition in state management

---

## 🔴 ISSUE 1: Rejection Notifications Not Reaching Labour

### Problem
When a farmer rejects a labour's job application, **no notification is sent to the labour user**.

### Root Cause
**File**: [backend/src/main/java/khetconnect/backend/service/JobService.java](backend/backend/src/main/java/khetconnect/backend/service/JobService.java)  
**Lines**: ~158-165

The `rejectLabourer()` method updates the application status but **does not call `notificationService.notifyUser()`**

```java
@Transactional
@CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
public JobResponse rejectLabourer(Long jobId, Long labourerId, Long farmerId) {
    validateFarmerJob(jobId, farmerId);
    JobApplication app = applicationRepository.findByJobIdAndLabourerId(jobId, labourerId)
            .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    app.setStatus(ApplicationStatus.REJECTED);
    applicationRepository.save(app);
    Job job = jobRepository.findById(jobId).orElseThrow();
    return toJobResponse(job, null, farmerId);
    // ❌ NO NOTIFICATION SENT HERE
}
```

### Comparison with Working Methods
- **acceptLabourer()** (lines 143-155) ✅ sends notification
- **applyToJob()** (lines 111-130) ✅ sends notification
- **completeJob()** (lines 167-195) ✅ sends notifications
- **rejectLabourer()** ❌ MISSING notification

### Expected Behavior
```java
notificationService.notifyUser(app.getLabourer(),
    "Application Rejected",
    "Your application for " + job.getTitle() + " was rejected",
    "APPLICATION_REJECTED");
```

### Current Flow of Notification Types
| Event | Notification Type | Sender | Method |
|-------|------------------|--------|--------|
| Job Posted | `JOB_POSTED` | System | `notifyNearbyLabourers()` |
| Labour Applied | `APPLICATION` | System | `applyToJob()` |
| Labour Accepted | `APPLICATION_ACCEPTED` | System | `acceptLabourer()` ✅ |
| Labour Rejected | `APPLICATION_REJECTED` | ❌ MISSING | `rejectLabourer()` |
| Job Completed | `JOB_COMPLETED` | System | `completeJob()` ✅ |

---

## 🟠 ISSUE 2: Duplicate/Repeated Notifications and Ratings

### Problem A: Rating Asked Repeatedly

#### Root Cause
**Frontend**: Multiple triggering points can show the rating modal for the same job

**Files Affected**:
- [frontend/src/pages/JobDetail.jsx](frontend/src/pages/JobDetail.jsx) - Lines 71-82
- [frontend/src/pages/MyJobs.jsx](frontend/src/pages/MyJobs.jsx) - Lines 59-74

Both files have separate `completeJob()` implementations that show the rating modal.

**Current Implementation**:
```javascript
// MyJobs.jsx - completeJob()
const completeJob = async (jobId) => {
    if (!window.confirm(t('confirmComplete'))) return
    await api.put(`/jobs/${jobId}/complete`)
    loadJobs()
    const job = jobs.find((j) => j.id === jobId)
    const apps = applicants[jobId] || []
    const accepted = apps.find((a) => a.status === 'ACCEPTED')
    if (accepted) {
        setRateModal({
            job,
            rateeId: accepted.labourerId,
            rateeName: accepted.name,
            onSubmit: async ({ rating, comment }) => {
                // 📍 Rating submission happens here
                await api.post('/ratings', { ... })
            },
        })
    }
}
```

**What Happens**:
1. User clicks "Mark Complete" → Notification "JOB_COMPLETED" sent to labour
2. Rating modal opens in MyJobs/JobDetail
3. User fills rating and submits
4. If user navigates away and comes back, might see the modal again
5. Or if they refresh, the job is still COMPLETED, so they could be prompted again

**Evidence of Multiple Calls**:
- Backend `NotificationEventListener` is `@Async` (line 20) - runs in thread pool
- Multiple notifications can be published in rapid succession
- No deduplication or throttling on frontend

#### Root Cause
**Frontend**: Event listeners not cleaned up properly

**File**: [frontend/src/components/NotificationBell.jsx](frontend/src/components/NotificationBell.jsx) - Lines 14-48

**Issue**: Multiple event listeners can be registered:
```javascript
useEffect(() => {
    // ... fetchCount setup

    // listen for incoming foreground FCM messages
    const onFcm = (e) => {
        setCount((c) => c + 1)  // Increments on each FCM message
    }
    window.addEventListener('fcm:message', onFcm)

    return () => {
        window.removeEventListener('focus', onFocus)
        window.removeEventListener('fcm:message', onFcm)  // ✅ Does cleanup
    }
}, [token])
```

While cleanup exists, if the component remounts (unlikely in this app), or if multiple instances mount, duplicates could accumulate.

**Also**: [main.jsx](frontend/src/main.jsx) - Lines 18-28
```javascript
if (isFcmEnabled()) {
  listenForegroundMessages((payload) => {
    toast(`${title}...`)
    window.dispatchEvent(new CustomEvent('fcm:message', { detail: payload }))
    // This dispatch triggers NotificationBell's onFcm listener
  })
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
  }
}
```

**Potential Issue**: If `listenForegroundMessages()` is called multiple times (though unlikely), it creates duplicate message handlers.

### Problem B: Notifications Sent Multiple Times Per Click

#### Root Cause
**Backend**: Async event processing + no idempotency

**File**: [backend/src/main/java/khetconnect/backend/listener/NotificationEventListener.java](backend/backend/src/main/java/khetconnect/backend/listener/NotificationEventListener.java)

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Async  // 🔴 Runs in thread pool - no guaranteed order or deduplication
    @EventListener
    public void handleNotification(NotificationEvent event) {
        User user = event.getUser();
        Notification notification = Notification.builder()...
        notificationRepository.save(notification);  // Save to DB
        log.info("Saved notification...");
        notificationService.sendPushNotification(...);  // Send FCM
    }
}
```

**What Happens if farmer clicks "Accept" twice fast**:
1. First click: `acceptLabourer()` publishes event
2. Event listener saves to DB + sends FCM (in thread)
3. Second click: Another event published
4. Second listener processes (possibly out of order)
5. User receives 2+ notifications

**Evidence**: 
- No duplicate key constraints on Notification entity
- No request-level deduplication
- No idempotency tokens

### Problem C: Multiple Rating Modal Instances

When job is completed, rating modal appears. User can:
1. Submit rating → Success toast → Modal closes
2. Click "Back" → Modal closes but job stays COMPLETED
3. Refresh page → Job detail reloads
4. Complete job again (if somehow in IN_PROGRESS) → Another modal

**Risk**: Rating can be submitted twice if user:
1. Submits rating in modal
2. Page errors/timeout before modal closes
3. User resubmits

But `RatingService.submitRating()` has protection:
```java
if (ratingRepository.existsByRaterIdAndJobId(raterId, request.getJobId())) {
    throw new BadRequestException("You have already rated this job");
}
```

So duplicate submissions are blocked at DB level ✅

---

## 🟡 ISSUE 3: Quick Apply Shows Error on First Click but Works After

### Problem
When labour taps "Quick Apply" on JobCard, sometimes:
- First click: Error toast shown
- Second click: Works successfully
- Or: First click shows "Already applied" even though it didn't work

### Root Cause
**Frontend**: Race condition + state synchronization issue

**File**: [frontend/src/components/JobCard.jsx](frontend/src/components/JobCard.jsx) - Lines 35-53

```javascript
const handleQuickApply = async (event) => {
    event.stopPropagation()
    if (applied || applying || !job?.id || user?.role !== 'LABOURER') return

    setApplying(true)  // 📍 Set loading state
    try {
        const res = await api.post(`/jobs/${job.id}/apply`, null, { suppressErrorToast: true })
        const updated = unwrap(res) || res
        setApplied(true)  // 📍 Update local state
        onApplySuccess?.(updated)  // 📍 Refresh parent
        toast.success(t('applied'))
    } catch (err) {
        toast.error(getApiErrorMessage(err, t('error')))
        // 🔴 ISSUE: setApplying(false) happens in finally, 
        // but setApplied(true) was NOT set if error occurred
        // So state: applying=false, applied=false
        // User can click again immediately before parent refreshes
    } finally {
        setApplying(false)  // ✅ This runs always
    }
}
```

### Why It Fails on First Click

**Scenario**:
1. User taps "Quick Apply"
2. Network request sent (applying = true)
3. Server processes: saves application
4. Toast notification sent by server (via FCM)
5. Frontend receives 200 response ✅
6. BUT: Parent component hasn't refreshed yet
7. User tries again while parent is still loading
8. Backend returns "Already applied" error
9. User sees error toast

**OR** (timing issue):
1. Network latency causes 500ms delay
2. UI button is disabled for 500ms
3. Then it re-enables
4. But job.myApplicationStatus hasn't updated yet
5. User can click again

### Evidence
**File**: [frontend/src/pages/NearbyJobs.jsx](frontend/src/pages/NearbyJobs.jsx) - Lines 47-49

```javascript
{filtered.map((job) => (
    <JobCard key={job.id} job={job} onApplySuccess={() => loadJobs()} />
))}
```

When `onApplySuccess` is called, it refreshes the ENTIRE job list. This can take 1-2 seconds.

**During that 1-2 second window**:
- Button shows "Applied" locally (via setApplied)
- But parent's job objects haven't updated
- If parent re-renders with old job data
- Button can re-enable

### Issue Flow
```
User taps "Quick Apply"
    ↓
API POST /jobs/{id}/apply
    ↓
setApplying(true) - Button disabled ✅
    ↓
Server returns 200 OK
    ↓
setApplied(true) - Button now shows "Applied" ✅
onApplySuccess() called - Refreshes job list ⏳ (1-2 seconds)
    ↓ (DURING REFRESH PERIOD - 1-2s)
Parent JobCard re-renders with OLD job data where myApplicationStatus is still null
    ↓ (RARE) If re-render is slow
Button re-enables because new props show applied=false
    ↓
User can click again → "Already applied" error ❌
```

---

## 📊 System Architecture

### Backend Notification Flow

```
User Action (e.g., Accept, Reject, Complete)
    ↓
JobController.accept/reject/complete()
    ↓
JobService.acceptLabourer/rejectLabourer/completeJob()
    ↓
notificationService.notifyUser(User, title, body, type)
    ↓
ApplicationEventPublisher.publishEvent(NotificationEvent)
    ↓ (ASYNC - Thread Pool)
NotificationEventListener.handleNotification()
    ↓
- Save to DB: notificationRepository.save(notification)
- Send FCM: sendPushNotification(...)
    ↓
Firebase Cloud Messaging
    ↓
User's Device (foreground/background)
```

### Frontend Notification Flow

```
Backend sends FCM message
    ↓
Service Worker receives (background message)
    ├─ foreground (app open): listenForegroundMessages callback
    │  ├─ Show toast
    │  └─ Dispatch window event: fcm:message
    │
    └─ background (app closed): firebase-messaging-sw.js
       └─ Show notification in taskbar

App Foreground Messages
    ↓
main.jsx listenForegroundMessages()
    ├─ toast.info(title: body)
    └─ window.dispatchEvent(new CustomEvent('fcm:message'))
           ↓
           NotificationBell.useEffect()
           └─ Increment unread count
```

### Rating Modal Trigger Flow

```
Farmer clicks "Mark Complete" on Job
    ↓
JobDetail.completeJob() / MyJobs.completeJob()
    ↓
PUT /jobs/{id}/complete
    ↓
Backend:
  - Set job.status = COMPLETED
  - For each ACCEPTED labourer:
    - Send "JOB_COMPLETED" notification
    - Update labourerProfile.totalJobsDone++
    ↓
Frontend receives 200 OK
    ↓
setJob(updated)
    ↓
Check if job has ACCEPTED applicants
    ↓
Show RateJobModal with first ACCEPTED labourer
    ↓
User fills rating + comment
    ↓
Click "Submit Rating"
    ↓
POST /ratings { jobId, rateeId, stars, comment }
    ↓
Backend:
  - Validate job is COMPLETED
  - Validate rater & ratee participated
  - Check no duplicate rating exists ✅
  - Save rating
  - Recalculate ratee's average rating
    ↓
Frontend: Close modal + show success toast
```

---

## 📋 Current Notification Types & Implementation

### Implemented Notifications

| Type | Triggered | Sent By | Recipient | Implementation |
|------|-----------|---------|-----------|-----------------|
| `JOB_POSTED` | Job created | System | Nearby labourers | `JobService.notifyNearbyLabourers()` ✅ |
| `APPLICATION` | Labour applies | System | Farmer | `JobService.applyToJob()` ✅ |
| `APPLICATION_ACCEPTED` | Farmer accepts | System | Labour | `JobService.acceptLabourer()` ✅ |
| `APPLICATION_REJECTED` | Farmer rejects | System | Labour | `JobService.rejectLabourer()` ❌ **MISSING** |
| `JOB_COMPLETED` | Farmer marks done | System | All accepted labourers | `JobService.completeJob()` ✅ |
| `BOOKING_REQUEST` | Farmer requests booking | System | Labourer | `AvailabilityService.createBooking()` ✅ |
| `BOOKING_COMPLETED` | Booking finished | System | Farmer | `AvailabilityService.completeBooking()` ✅ |
| `BOOKING_CANCELLED` | Booking cancelled | System | Both parties | `AvailabilityService.cancelBooking()` ✅ |

---

## 🏗️ File Dependency Map

### Backend Notification Components

```
BackendApplication.java (@EnableAsync)
    ↓
JobController.java → JobService.java
    ├─ POST /jobs → createJob()
    ├─ POST /jobs/{id}/apply → applyToJob() 
    ├─ PUT /jobs/{id}/accept → acceptLabourer()
    ├─ PUT /jobs/{id}/reject → rejectLabourer()
    └─ PUT /jobs/{id}/complete → completeJob()
         ↓ (all call)
         NotificationService.java
            ├─ notifyUser() [publishes event]
            └─ sendPushNotification() [FCM]
                 ↓
         NotificationEvent.java [Event object]
              ↓
         NotificationEventListener.java [@Async, @EventListener]
              ├─ notificationRepository.save()
              └─ notificationService.sendPushNotification()

NotificationController.java
    ├─ GET /notifications → get list
    └─ PUT /notifications/read → mark all read

RatingController.java
    └─ POST /ratings → submitRating()
         ↓
         RatingService.java
```

### Frontend Notification Components

```
main.jsx
    ├─ initFirebase()
    ├─ requestAndRegisterFcm() [on login]
    └─ listenForegroundMessages()
         └─ window.dispatchEvent('fcm:message')
                ↓
App.jsx (Router)
    ├─ JobDetail.jsx
    ├─ MyJobs.jsx
    └─ NearbyJobs.jsx
         ├─ JobCard.jsx [Quick Apply button]
         │  ├─ handleQuickApply()
         │  └─ onApplySuccess()
         │
         └─ notificationBell in Navbar.jsx
              └─ NotificationBell.jsx
                   ├─ fetchCount() [periodic]
                   └─ onFcm listener [event-based]
                       └─ setCount()

NotificationsPage.jsx
    ├─ api.get('/notifications')
    ├─ api.put('/notifications/read')
    └─ Display list

RateJobModal.jsx
    └─ submit() [POST /ratings]
```

---

## 🔧 Recommendations & Fixes

### Fix 1: Add Rejection Notification (CRITICAL)

**File**: [backend/src/main/java/khetconnect/backend/service/JobService.java](backend/backend/src/main/java/khetconnect/backend/service/JobService.java)

**Lines to modify**: ~158-165 in `rejectLabourer()`

```java
@Transactional
@CacheEvict(value = {"nearbyJobs", "myJobs"}, allEntries = true)
public JobResponse rejectLabourer(Long jobId, Long labourerId, Long farmerId) {
    validateFarmerJob(jobId, farmerId);
    JobApplication app = applicationRepository.findByJobIdAndLabourerId(jobId, labourerId)
            .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    app.setStatus(ApplicationStatus.REJECTED);
    applicationRepository.save(app);
    Job job = jobRepository.findById(jobId).orElseThrow();
    
    // ADD THIS BLOCK:
    notificationService.notifyUser(app.getLabourer(),
            "Application Rejected",
            "Your application for " + job.getTitle() + " was rejected",
            "APPLICATION_REJECTED");
    
    return toJobResponse(job, null, farmerId);
}
```

### Fix 2: Add Idempotency to Quick Apply (HIGH)

**File**: [frontend/src/components/JobCard.jsx](frontend/src/components/JobCard.jsx)

```javascript
const handleQuickApply = async (event) => {
    event.stopPropagation()
    // Already prevent re-click
    if (applied || applying || !job?.id || user?.role !== 'LABOURER') return

    setApplying(true)
    try {
        const res = await api.post(`/jobs/${job.id}/apply`, null, { suppressErrorToast: true })
        const updated = unwrap(res) || res
        setApplied(true)  // Optimistic update
        
        // Wait a moment before calling refresh to ensure state is synchronized
        setTimeout(() => {
            onApplySuccess?.(updated)
        }, 100)  // Small delay to ensure local state updates first
        
        toast.success(t('applied'))
    } catch (err) {
        // On error, check if it's "already applied"
        const errorMsg = getApiErrorMessage(err, t('error'))
        if (errorMsg.includes('Already applied')) {
            setApplied(true)  // Still mark as applied even on error
        } else {
            toast.error(errorMsg)
            setApplied(false)  // Only reset if it's not "already applied"
        }
    } finally {
        setApplying(false)
    }
}
```

### Fix 3: Prevent Duplicate Rating Modals (MEDIUM)

**File**: [frontend/src/pages/JobDetail.jsx](frontend/src/pages/JobDetail.jsx) and [frontend/src/pages/MyJobs.jsx](frontend/src/pages/MyJobs.jsx)

Add a flag to prevent showing modal twice:

```javascript
const [ratingModalShown, setRatingModalShown] = useState(false)

const completeJob = async () => {
    if (!window.confirm(t('confirmComplete'))) return
    try {
        const res = await api.put(`/jobs/${id}/complete`, null, { suppressErrorToast: true })
        const updatedJob = unwrap(res)
        setJob(updatedJob)
        toast.success(t('completed'))
        
        const accepted = updatedJob.applicants?.find((a) => a.status === 'ACCEPTED')
        // Only show modal once per completion
        if (accepted && !ratingModalShown) {
            setRatingModalShown(true)  // Prevent showing again
            setRateModal({
                job: updatedJob,
                rateeId: accepted.labourerId,
                rateeName: accepted.name,
                onSubmit: async ({ rating, comment }) => {
                    await api.post('/ratings', { 
                        jobId: updatedJob.id, 
                        rateeId: accepted.labourerId, 
                        stars: rating, 
                        comment 
                    }, { suppressErrorToast: true })
                },
            })
        }
    } catch (err) {
        toast.error(getApiErrorMessage(err, t('error')))
    }
}
```

### Fix 4: Add Request Deduplication (OPTIONAL - for advanced cases)

**Concept**: Use a request ID header to prevent duplicate processing

**File**: [backend/src/main/java/khetconnect/backend/service/JobService.java](backend/backend/src/main/java/khetconnect/backend/service/JobService.java)

For future: Add `@Idempotent` annotation or request ID tracking to prevent double notifications on double-clicks.

---

## 📝 Notification Database Schema

### Current Notification Entity

```java
@Entity
@Table(name = "notifications")
public class Notification {
    @Id @GeneratedValue
    private Long id;                    // Primary key
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;                  // Recipient
    
    private String title;               // Notification title
    private String body;                // Notification body
    private String type;                // Type: JOB_POSTED, APPLICATION, etc.
    private Boolean read;               // Read status
    private LocalDateTime createdAt;    // Creation timestamp
}
```

### Missing Fields (Consider for Enhancement)

- `jobId` - Link to job for context
- `applicationId` - Link to application
- `actionUrl` - Deep link to open in app
- `relatedUserId` - Who triggered the notification

---

## 🧪 Testing Recommendations

### Test 1: Rejection Notification
1. Farmer posts job
2. Labour applies
3. Farmer rejects application
4. ✅ Labour receives "APPLICATION_REJECTED" notification
5. Labour can see it in NotificationsPage

### Test 2: Quick Apply Race Condition
1. Labour taps "Quick Apply" on NearbyJobs
2. Do NOT wait for response
3. Immediately tap same button again
4. ✅ Second click is prevented (button disabled)
5. ❌ If button re-enables before first request completes, user can apply twice

### Test 3: Rating Modal Idempotency
1. Farmer completes job
2. Rating modal appears
3. Farmer submits rating
4. Close modal
5. Navigate away and back to job
6. ✅ Rating modal should NOT appear again
7. ✅ Rating should be submitted exactly once

---

## 📚 Code Search References

All notification-related code calls:
```
NotificationService.notifyUser() called at:
  - JobService.java:75   (notifyNearbyLabourers)
  - JobService.java:129  (applyToJob)
  - JobService.java:153  (acceptLabourer)
  - JobService.java:194  (completeJob)
  - AvailabilityService.java:68, 88, 104, 105

NotificationService.sendPushNotification() called at:
  - NotificationEventListener.java:34
```

---

## 🎯 Summary Table

| Issue | Severity | Root Cause | Location | Impact |
|-------|----------|-----------|----------|--------|
| No rejection notification | 🔴 CRITICAL | Missing notifyUser() call | JobService.rejectLabourer() | Labour never knows they were rejected |
| Repeated ratings | 🟠 HIGH | Multiple modal instances | JobDetail + MyJobs | User frustrated, duplicate rating attempts |
| Quick apply error | 🟠 HIGH | Race condition + state sync | JobCard.jsx | User confused, thinks app is broken |
| Multiple FCM listeners | 🟡 MEDIUM | No duplicate prevention | main.jsx, NotificationBell.jsx | Rare but possible duplication |
| Async event ordering | 🟡 MEDIUM | No ordering guarantees | NotificationEventListener | Multiple notifications in unpredictable order |

