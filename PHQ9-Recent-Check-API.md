# PHQ-9 Recent Assessment Check Endpoint

## 📋 Overview

New endpoint to check if a user has completed a PHQ-9 assessment within a specified number of days.

## 🔗 API Endpoint Details

### **Check Recent Assessment**

**Method:** `GET`  
**URL:** `http://localhost:5001/api/questionnaire/phq9/recent-check`

**Headers:**

```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Query Parameters:**

- `days` (optional): Number of days to look back (1-365, default: 7)

## 📝 **API Examples**

### 1. Check last 7 days (default)

```
GET http://localhost:5001/api/questionnaire/phq9/recent-check
Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. Check last 30 days

```
GET http://localhost:5001/api/questionnaire/phq9/recent-check?days=30
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. Check last 3 days

```
GET http://localhost:5001/api/questionnaire/phq9/recent-check?days=3
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📊 **Response Formats**

### **User HAS recent assessment:**

```json
{
  "success": true,
  "message": "User has completed PHQ-9 within the last 7 days",
  "data": {
    "hasRecent": true,
    "lastAssessmentDate": "2025-09-01T04:24:55.740Z",
    "daysChecked": 7,
    "cutoffDate": "2025-08-25T04:24:55.740Z"
  }
}
```

### **User has NO recent assessment:**

```json
{
  "success": true,
  "message": "No PHQ-9 assessments found within the last 7 days",
  "data": {
    "hasRecent": false,
    "lastAssessmentDate": null,
    "daysChecked": 7,
    "cutoffDate": "2025-08-25T04:24:55.740Z"
  }
}
```

## ⚠️ **Error Responses**

### **Invalid days parameter:**

```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Days parameter must be a number between 1 and 365",
  "statusCode": 400
}
```

### **Authentication required:**

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication token is required",
  "statusCode": 401
}
```

## 🧪 **Testing Examples**

### **Postman Collection**

#### Test Case 1: Default 7-day check

```
GET {{baseUrl}}/api/questionnaire/phq9/recent-check
Authorization: Bearer {{authToken}}
```

#### Test Case 2: Custom timeframe (30 days)

```
GET {{baseUrl}}/api/questionnaire/phq9/recent-check?days=30
Authorization: Bearer {{authToken}}
```

#### Test Case 3: Invalid parameter (should fail)

```
GET {{baseUrl}}/api/questionnaire/phq9/recent-check?days=400
Authorization: Bearer {{authToken}}
```

### **cURL Examples**

#### Check last 7 days:

```bash
curl -X GET "http://localhost:5001/api/questionnaire/phq9/recent-check" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Check last 14 days:

```bash
curl -X GET "http://localhost:5001/api/questionnaire/phq9/recent-check?days=14" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## 🔍 **Implementation Details**

### **Database Query Logic:**

- Queries `questionnaire_results` table
- Filters by current user ID
- Checks `completedAt` date within specified timeframe
- Excludes soft-deleted records (`deleted_at IS NULL`)
- Orders by `completedAt DESC` to get most recent

### **Validation:**

- ✅ Requires valid JWT authentication
- ✅ Days parameter: 1-365 range validation
- ✅ Defaults to 7 days if not specified
- ✅ Proper error handling for edge cases

### **Security:**

- ✅ Users can only check their own assessments
- ✅ No sensitive data exposed in response
- ✅ Follows existing authentication patterns

## 🎯 **Use Cases**

1. **Preventing Duplicate Assessments**: Check if user completed PHQ-9 recently before showing assessment form
2. **Compliance Tracking**: Ensure users complete regular assessments (e.g., weekly check-ins)
3. **Dashboard Logic**: Display different UI based on recent assessment status
4. **Reminder Systems**: Trigger notifications if no recent assessments
5. **Progress Monitoring**: Track assessment frequency for treatment plans

## 📋 **Frontend Integration Example**

```javascript
// Check if user needs to complete PHQ-9
async function checkRecentAssessment(days = 7) {
  try {
    const response = await fetch(
      `/api/questionnaire/phq9/recent-check?days=${days}`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      return {
        hasRecent: data.data.hasRecent,
        lastDate: data.data.lastAssessmentDate,
        needsAssessment: !data.data.hasRecent,
      };
    }
  } catch (error) {
    console.error("Error checking recent assessment:", error);
    return { hasRecent: false, needsAssessment: true };
  }
}

// Usage
const assessmentStatus = await checkRecentAssessment(7);
if (assessmentStatus.needsAssessment) {
  // Show PHQ-9 form
  showAssessmentPrompt();
} else {
  // Show dashboard or skip assessment
  showDashboard();
}
```

This endpoint provides a simple, efficient way to check user assessment status for various application flows! 🚀
