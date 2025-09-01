# PHQ-9 Questionnaire Implementation

This document outlines the PHQ-9 (Patient Health Questionnaire-9) implementation in the Sona backend system. The PHQ-9 is a validated screening tool for depression assessment.

## 📋 Overview

The PHQ-9 implementation provides:

- Secure questionnaire submission and storage
- User history tracking and analytics
- Risk assessment and monitoring (particularly for suicidal ideation)
- Role-based access control for healthcare professionals
- HIPAA-compliant data handling

## 🏗️ Database Schema

### Table: `questionnaire_results`

```sql
CREATE TABLE questionnaire_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id),
    questionnaire_type ENUM('PHQ9') NOT NULL DEFAULT 'PHQ9',
    responses JSONB NOT NULL,
    total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 27),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('Minimal or none', 'Mild', 'Moderate', 'Moderately severe', 'Severe')),
    impact VARCHAR(100),
    has_item9_positive BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX idx_questionnaire_results_user_id ON questionnaire_results(user_id);
CREATE INDEX idx_questionnaire_results_type ON questionnaire_results(questionnaire_type);
CREATE INDEX idx_questionnaire_results_completed_at ON questionnaire_results(completed_at);
CREATE INDEX idx_questionnaire_results_item9 ON questionnaire_results(has_item9_positive);
CREATE INDEX idx_questionnaire_results_composite ON questionnaire_results(user_id, questionnaire_type, completed_at);
```

## 🔗 API Endpoints

### Client Endpoints (Authenticated Users)

#### 1. Submit PHQ-9 Questionnaire

```http
POST /api/questionnaire/phq9/submit
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "responses": [
    {"questionIndex": 0, "answer": 2},
    {"questionIndex": 1, "answer": 1},
    // ... 9 total responses
  ],
  "totalScore": 15,
  "severity": "Moderate",
  "impact": "somewhat difficult",
  "hasItem9Positive": false,
  "completedAt": "2025-08-31T10:30:00Z"
}
```

#### 2. Get User's History

```http
GET /api/questionnaire/phq9/history?page=1&limit=10
Authorization: Bearer {jwt_token}
```

#### 3. Get Latest Result

```http
GET /api/questionnaire/phq9/latest
Authorization: Bearer {jwt_token}
```

#### 4. Get Specific Result

```http
GET /api/questionnaire/phq9/result/{resultId}
Authorization: Bearer {jwt_token}
```

#### 5. Delete Result

```http
DELETE /api/questionnaire/phq9/result/{resultId}
Authorization: Bearer {jwt_token}
```

### Professional Endpoints (Counselor/Psychiatrist/Admin Only)

#### 6. Get Analytics

```http
GET /api/questionnaire/phq9/analytics?startDate=2025-01-01&endDate=2025-08-31
Authorization: Bearer {professional_token}
```

#### 7. Get High-Risk Users

```http
GET /api/questionnaire/phq9/high-risk?days=30
Authorization: Bearer {professional_token}
```

#### 8. Get Overview Dashboard

```http
GET /api/questionnaire/phq9/overview
Authorization: Bearer {professional_token}
```

## 📊 PHQ-9 Scoring System

### Questions (0-3 scale each)

0. Little interest or pleasure in doing things
1. Feeling down, depressed, or hopeless
2. Trouble falling/staying asleep, or sleeping too much
3. Feeling tired or having little energy
4. Poor appetite or overeating
5. Feeling bad about yourself or that you are a failure
6. Trouble concentrating on things
7. Moving or speaking slowly, or being fidgety/restless
8. **Thoughts of being better off dead or hurting yourself** ⚠️

### Scoring Scale

- **0** = Not at all
- **1** = Several days
- **2** = More than half the days
- **3** = Nearly every day

### Severity Levels

- **0-4**: Minimal or none
- **5-9**: Mild
- **10-14**: Moderate
- **15-19**: Moderately severe
- **20-27**: Severe

### 🚨 Risk Assessment

- **Item 9 Positive**: Any answer > 0 on question 8 (suicidal ideation)
- **High Risk**: Total score ≥ 15 or Item 9 positive
- **Critical Risk**: Item 9 positive (requires immediate attention)

## 🔒 Security Features

### Authentication & Authorization

- JWT token required for all endpoints
- Users can only access their own questionnaire results
- Role-based access control:
  - **Clients**: Submit and view own results
  - **Counselors/Psychiatrists**: Access analytics and high-risk monitoring
  - **Admins**: Full system access

### Data Protection

- Input validation and sanitization
- Soft deletion for data retention
- Audit trail with timestamps
- HIPAA compliance considerations
- High-risk case logging for monitoring

### Privacy Controls

- User data anonymization in analytics
- Configurable data retention policies
- Secure data transmission (HTTPS required)

## 📈 Analytics Features

### For Healthcare Professionals

- **Severity Breakdown**: Distribution of depression levels
- **Weekly/Monthly Trends**: Assessment frequency and average scores
- **Risk Monitoring**: Track high-risk users requiring intervention
- **Population Health**: Aggregate statistics for program evaluation

### Sample Analytics Response

```json
{
  "totalAssessments": 150,
  "severityBreakdown": {
    "Minimal or none": 45,
    "Mild": 38,
    "Moderate": 35,
    "Moderately severe": 22,
    "Severe": 10
  },
  "averageScore": 8.6,
  "riskAssessments": 25,
  "weeklyTrends": [...],
  "monthlyTrends": [...]
}
```

## 🧪 Testing

### Run Database Migration

```bash
# Create the questionnaire_results table
npm run migrate
```

### Test API Endpoints

```bash
# Start the server
npm run dev

# Test with curl or Postman using the examples in:
# src/docs/PHQ9-API-Documentation.js
```

### Validation Testing

- Test score calculations (0-27 range)
- Test severity classification
- Test item 9 suicide risk detection
- Test role-based access control
- Test pagination and filtering

## 🚀 Deployment Checklist

### Database Setup

- [ ] Run migration to create `questionnaire_results` table
- [ ] Verify indexes are created for performance
- [ ] Set up database backup strategy

### Security Configuration

- [ ] Ensure HTTPS is enabled in production
- [ ] Configure JWT secret securely
- [ ] Set up proper CORS policies
- [ ] Enable request rate limiting

### Monitoring Setup

- [ ] Configure logging for high-risk assessments
- [ ] Set up alerts for critical risk cases
- [ ] Monitor API performance and usage
- [ ] Implement data retention policies

### Compliance

- [ ] Review HIPAA compliance requirements
- [ ] Implement data anonymization for analytics
- [ ] Set up audit logging
- [ ] Configure secure data transmission

## 📞 Support & Monitoring

### High-Risk Case Management

The system automatically logs cases where:

- Total PHQ-9 score ≥ 15 (Moderately severe or Severe)
- Item 9 (suicidal ideation) is answered positively

Healthcare professionals can monitor these cases via:

- `/api/questionnaire/phq9/high-risk` endpoint
- Real-time dashboard at `/api/questionnaire/phq9/overview`

### Error Handling

- Comprehensive input validation
- Descriptive error messages
- Proper HTTP status codes
- Graceful degradation for system failures

## 📝 Notes for Developers

### Code Structure

- **Model**: `src/models/QuestionnaireResult.ts`
- **Service**: `src/services/PHQ9Service.ts`
- **Controller**: `src/controllers/PHQ9Controller.ts`
- **Routes**: `src/routes/PHQ9Routes.ts`
- **Validation**: `src/schema/ValidationSchema.ts`
- **Migration**: `src/config/migrations/create_questionnaire_results_table.js`

### Key Features Implemented

- ✅ Comprehensive input validation
- ✅ Automatic score calculation and verification
- ✅ Suicide risk detection (Item 9 monitoring)
- ✅ Role-based access control
- ✅ Soft deletion support
- ✅ Analytics and reporting
- ✅ Performance optimized with indexes
- ✅ HIPAA compliance considerations

This implementation provides a robust, secure, and scalable foundation for PHQ-9 questionnaire management in the Sona mental health platform.
