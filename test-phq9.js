/**
 * PHQ-9 Quick Test Script
 * 
 * This script demonstrates how to test the PHQ-9 API endpoints.
 * You can use this with curl, Postman, or any HTTP client.
 */

// Base URL for the API
const BASE_URL = 'http://localhost:5001/api/questionnaire/phq9';

// Sample PHQ-9 test data
const testData = {
  validSubmission: {
    "responses": [
      {"questionIndex": 0, "answer": 2},
      {"questionIndex": 1, "answer": 1},
      {"questionIndex": 2, "answer": 3},
      {"questionIndex": 3, "answer": 2},
      {"questionIndex": 4, "answer": 1},
      {"questionIndex": 5, "answer": 2},
      {"questionIndex": 6, "answer": 0},
      {"questionIndex": 7, "answer": 1},
      {"questionIndex": 8, "answer": 1}
    ],
    "totalScore": 13,
    "severity": "Moderate",
    "impact": "somewhat difficult",
    "hasItem9Positive": true,
    "completedAt": new Date().toISOString()
  },
  
  highRiskSubmission: {
    "responses": [
      {"questionIndex": 0, "answer": 3},
      {"questionIndex": 1, "answer": 3},
      {"questionIndex": 2, "answer": 3},
      {"questionIndex": 3, "answer": 3},
      {"questionIndex": 4, "answer": 2},
      {"questionIndex": 5, "answer": 2},
      {"questionIndex": 6, "answer": 1},
      {"questionIndex": 7, "answer": 1},
      {"questionIndex": 8, "answer": 2}
    ],
    "totalScore": 20,
    "severity": "Severe",
    "impact": "very difficult",
    "hasItem9Positive": true,
    "completedAt": new Date().toISOString()
  }
};

// CURL Commands for Testing

console.log(`
=== PHQ-9 API Testing Commands ===

IMPORTANT: Replace YOUR_JWT_TOKEN with a valid authentication token

1. Submit PHQ-9 Questionnaire (Client):
curl -X POST ${BASE_URL}/submit \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '${JSON.stringify(testData.validSubmission, null, 2)}'

2. Get User History:
curl -X GET "${BASE_URL}/history?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

3. Get Latest Result:
curl -X GET ${BASE_URL}/latest \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

4. Get Specific Result (replace RESULT_UUID):
curl -X GET ${BASE_URL}/result/RESULT_UUID \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

5. Delete Result (replace RESULT_UUID):
curl -X DELETE ${BASE_URL}/result/RESULT_UUID \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

6. Get Analytics (Counselor/Admin/Psychiatrist only):
curl -X GET "${BASE_URL}/analytics?startDate=2025-01-01&endDate=2025-12-31" \\
  -H "Authorization: Bearer PROFESSIONAL_JWT_TOKEN"

7. Get High-Risk Users (Counselor/Admin/Psychiatrist only):
curl -X GET "${BASE_URL}/high-risk?days=30" \\
  -H "Authorization: Bearer PROFESSIONAL_JWT_TOKEN"

8. Get Overview (Counselor/Admin/Psychiatrist only):
curl -X GET ${BASE_URL}/overview \\
  -H "Authorization: Bearer PROFESSIONAL_JWT_TOKEN"

=== Test Server Status ===
Server should be running on: http://localhost:5001

Test the main endpoint:
curl -X GET http://localhost:5001/ \\
  -H "Content-Type: application/json"

=== Database Migration ===
Make sure to run the database migration first:
1. Connect to your PostgreSQL database
2. Run the SQL from: src/config/migrations/create_questionnaire_results_table.js

Or use your preferred migration tool.

=== Authentication ===
To test the endpoints, you'll need:
1. A valid JWT token from the auth system
2. For professional endpoints: token from Counselor/Admin/Psychiatrist user

You can get a token by signing in through:
POST http://localhost:5001/api/auth/signin

=== Validation Tests ===

Test invalid data to verify validation:

Invalid Score:
curl -X POST ${BASE_URL}/submit \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "responses": [{"questionIndex": 0, "answer": 5}],
    "totalScore": 50,
    "severity": "Invalid",
    "hasItem9Positive": false,
    "completedAt": "${new Date().toISOString()}"
  }'

Missing Questions:
curl -X POST ${BASE_URL}/submit \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "responses": [{"questionIndex": 0, "answer": 2}],
    "totalScore": 2,
    "severity": "Minimal or none",
    "hasItem9Positive": false,
    "completedAt": "${new Date().toISOString()}"
  }'
`);

// Test data for different scenarios
const testScenarios = {
  minimal: {
    responses: Array.from({length: 9}, (_, i) => ({questionIndex: i, answer: 0})),
    totalScore: 0,
    severity: "Minimal or none",
    hasItem9Positive: false
  },
  
  mild: {
    responses: [
      {"questionIndex": 0, "answer": 1},
      {"questionIndex": 1, "answer": 1},
      {"questionIndex": 2, "answer": 1},
      {"questionIndex": 3, "answer": 1},
      {"questionIndex": 4, "answer": 1},
      {"questionIndex": 5, "answer": 0},
      {"questionIndex": 6, "answer": 0},
      {"questionIndex": 7, "answer": 0},
      {"questionIndex": 8, "answer": 0}
    ],
    totalScore: 5,
    severity: "Mild",
    hasItem9Positive: false
  },
  
  moderate: testData.validSubmission,
  
  severe: testData.highRiskSubmission
};

console.log('\n=== Test Scenarios ===');
Object.entries(testScenarios).forEach(([level, data]) => {
  console.log(`${level.toUpperCase()}: Score ${data.totalScore}, Item 9: ${data.hasItem9Positive ? 'POSITIVE' : 'Negative'}`);
});

module.exports = {
  BASE_URL,
  testData,
  testScenarios
};
