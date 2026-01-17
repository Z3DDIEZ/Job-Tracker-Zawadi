/**
 * Firebase Cloud Functions for Job Application Tracker
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
import { autoTagApplication } from './automatedTagging';

// Export functions
export { autoTagApplication };

// Example function for testing
export const helloWorld = functions.https.onRequest((request: functions.https.Request, response: functions.Response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});