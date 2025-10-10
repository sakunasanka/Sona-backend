/**
 * PHQ-9 Implementation Test & Documentation
 * 
 * This file contains example API calls and test data for the PHQ-9 questionnaire system.
 * Use this as a reference for testing the implementation.
 */

// Example PHQ-9 Response Data
const samplePHQ9Responses = [
  {
    "questionIndex": 0,
    "answer": 2
  },
  {
    "questionIndex": 1,
    "answer": 1
  },
  {
    "questionIndex": 2,
    "answer": 3
  },
  {
    "questionIndex": 3,
    "answer": 2
  },
  {
    "questionIndex": 4,
    "answer": 1
  },
  {
    "questionIndex": 5,
    "answer": 2
  },
  {
    "questionIndex": 6,
    "answer": 0
  },
  {
    "questionIndex": 7,
    "answer": 1
  },
  {
    "questionIndex": 8,
    "answer": 1
  }
];

// Calculate total score (should be 13)
const totalScore = samplePHQ9Responses.reduce((sum, response) => sum + response.answer, 0);

// Example submission payload
const phq9SubmissionPayload = {
  "responses": samplePHQ9Responses,
  "totalScore": totalScore, // 13
  "severity": "Moderate", // 10-14 range
  "impact": "somewhat difficult",
  "hasItem9Positive": true, // Item 8 (index 8) has answer > 0
  "completedAt": new Date().toISOString()
};

/**
 * API Endpoints Documentation
 * 
 * BASE_URL: http://localhost:5001/api/questionnaire/phq9
 * 
 * All endpoints require authentication via Bearer token in Authorization header
 */

const apiExamples = {
  
  // 1. Submit PHQ-9 Questionnaire
  submitPHQ9: {
    method: 'POST',
    url: '/api/questionnaire/phq9/submit',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    },
    body: phq9SubmissionPayload
  },

  // 2. Get User's PHQ-9 History
  getUserHistory: {
    method: 'GET',
    url: '/api/questionnaire/phq9/history?page=1&limit=10',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  },

  // 3. Get User's Latest Result
  getUserLatest: {
    method: 'GET',
    url: '/api/questionnaire/phq9/latest',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  },

  // 4. Get Specific Result by ID
  getResultById: {
    method: 'GET',
    url: '/api/questionnaire/phq9/result/RESULT_UUID_HERE',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  },

  // 5. Delete Result (Soft Delete)
  deleteResult: {
    method: 'DELETE',
    url: '/api/questionnaire/phq9/result/RESULT_UUID_HERE',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  },

  // 6. Get Analytics (Counselor/Admin/Psychiatrist only)
  getAnalytics: {
    method: 'GET',
    url: '/api/questionnaire/phq9/analytics?startDate=2025-01-01&endDate=2025-08-31&severity=Moderate',
    headers: {
      'Authorization': 'Bearer COUNSELOR_OR_ADMIN_JWT_TOKEN'
    }
  },

  // 7. Get High-Risk Users (Counselor/Admin/Psychiatrist only)
  getHighRiskUsers: {
    method: 'GET',
    url: '/api/questionnaire/phq9/high-risk?days=30',
    headers: {
      'Authorization': 'Bearer COUNSELOR_OR_ADMIN_JWT_TOKEN'
    }
  },

  // 8. Get Overview Dashboard (Counselor/Admin/Psychiatrist only)
  getOverview: {
    method: 'GET',
    url: '/api/questionnaire/phq9/overview',
    headers: {
      'Authorization': 'Bearer COUNSELOR_OR_ADMIN_JWT_TOKEN'
    }
  }
};

/**
 * Sample Response Formats
 */

const sampleResponses = {
  
  // Submit PHQ-9 Response
  submitSuccess: {
    "success": true,
    "message": "PHQ-9 questionnaire submitted successfully",
    "data": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "userId": 123,
      "questionnaireType": "PHQ9",
      "responses": samplePHQ9Responses,
      "totalScore": 13,
      "severity": "Moderate",
      "impact": "somewhat difficult",
      "hasItem9Positive": true,
      "completedAt": "2025-08-31T10:30:00.000Z",
      "createdAt": "2025-08-31T10:30:05.000Z"
    }
  },

  // Get History Response
  historyResponse: {
    "success": true,
    "message": "PHQ-9 history retrieved successfully",
    "data": {
      "results": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "questionnaireType": "PHQ9",
          "responses": samplePHQ9Responses,
          "totalScore": 13,
          "severity": "Moderate",
          "impact": "somewhat difficult",
          "hasItem9Positive": true,
          "completedAt": "2025-08-31T10:30:00.000Z",
          "createdAt": "2025-08-31T10:30:05.000Z"
        }
      ],
      "pagination": {
        "total": 5,
        "page": 1,
        "limit": 10,
        "totalPages": 1,
        "hasNext": false,
        "hasPrev": false
      }
    }
  },

  // Analytics Response
  analyticsResponse: {
    "success": true,
    "message": "PHQ-9 analytics retrieved successfully",
    "data": {
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
      "weeklyTrends": [
        {
          "week": "2025-W34",
          "count": 12,
          "averageScore": 9.2
        }
      ],
      "monthlyTrends": [
        {
          "month": "2025-08",
          "count": 45,
          "averageScore": 8.8
        }
      ]
    }
  },

  // High-Risk Users Response
  highRiskResponse: {
    "success": true,
    "message": "High-risk users retrieved successfully",
    "data": {
      "users": [
        {
          "userId": 123,
          "userName": "John Doe",
          "userEmail": "john@example.com",
          "latestScore": 18,
          "latestSeverity": "Moderately severe",
          "hasItem9Positive": true,
          "completedAt": "2025-08-30T14:20:00.000Z",
          "riskLevel": "CRITICAL"
        }
      ],
      "filters": {
        "days": 30
      },
      "summary": {
        "totalHighRisk": 8,
        "criticalRisk": 3,
        "highRisk": 5
      }
    }
  }
};

/**
 * PHQ-9 Question Reference
 * 
 * The PHQ-9 consists of 9 questions, each scored 0-3:
 * 0 = Not at all
 * 1 = Several days
 * 2 = More than half the days
 * 3 = Nearly every day
 */

const phq9Questions = [
  "Little interest or pleasure in doing things", // Index 0
  "Feeling down, depressed, or hopeless", // Index 1
  "Trouble falling or staying asleep, or sleeping too much", // Index 2
  "Feeling tired or having little energy", // Index 3
  "Poor appetite or overeating", // Index 4
  "Feeling bad about yourself or that you are a failure or have let yourself or your family down", // Index 5
  "Trouble concentrating on things, such as reading the newspaper or watching television", // Index 6
  "Moving or speaking so slowly that other people could have noticed. Or the opposite being so fidgety or restless that you have been moving around a lot more than usual", // Index 7
  "Thoughts that you would be better off dead, or of hurting yourself" // Index 8 - SUICIDE RISK INDICATOR
];

/**
 * Severity Scoring Guide
 */

const severityGuide = {
  "Minimal or none": "0-4 points",
  "Mild": "5-9 points",
  "Moderate": "10-14 points",
  "Moderately severe": "15-19 points",
  "Severe": "20-27 points"
};

/**
 * Database Schema Reference
 */

const databaseSchema = {
  tableName: "questionnaire_results",
  columns: {
    id: "UUID (Primary Key)",
    user_id: "INTEGER (Foreign Key to users table)",
    questionnaire_type: "ENUM('PHQ9')",
    responses: "JSONB (Array of question responses)",
    total_score: "INTEGER (0-27)",
    severity: "VARCHAR (Calculated from score)",
    impact: "VARCHAR (Optional impact description)",
    has_item9_positive: "BOOLEAN (Suicide risk flag)",
    completed_at: "DATETIME",
    created_at: "DATETIME",
    updated_at: "DATETIME",
    deleted_at: "DATETIME (For soft deletion)"
  },
  indexes: [
    "user_id",
    "questionnaire_type", 
    "completed_at",
    "has_item9_positive",
    "user_id, questionnaire_type, completed_at (composite)"
  ]
};

/**
 * Security & Privacy Features
 */

const securityFeatures = [
  "JWT authentication required for all endpoints",
  "Users can only access their own questionnaire results",
  "Role-based access control for analytics (Counselor/Admin/Psychiatrist only)",
  "Soft deletion support for data retention policies",
  "Input validation and sanitization",
  "Audit trail via created_at/updated_at timestamps",
  "High-risk case logging for monitoring",
  "HIPAA compliance considerations built-in"
];

/**
 * Testing Checklist
 */

const testingChecklist = [
  "✓ Create questionnaire_results table via migration",
  "✓ Test PHQ-9 submission with valid data",
  "✓ Test validation for invalid responses (out of range, missing questions)",
  "✓ Test score calculation accuracy",
  "✓ Test severity classification",
  "✓ Test item 9 suicide risk detection",
  "✓ Test user history retrieval with pagination",
  "✓ Test latest result retrieval", 
  "✓ Test result retrieval by ID with access control",
  "✓ Test soft deletion functionality",
  "✓ Test analytics endpoint for professionals only",
  "✓ Test high-risk user identification",
  "✓ Test role-based access control",
  "✓ Test error handling and validation",
  "✓ Test database indexes and performance"
];

module.exports = {
  samplePHQ9Responses,
  phq9SubmissionPayload,
  apiExamples,
  sampleResponses,
  phq9Questions,
  severityGuide,
  databaseSchema,
  securityFeatures,
  testingChecklist
};
