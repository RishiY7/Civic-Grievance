# Civic Grievance Triage System - Testing Guide

This document outlines the testing scenarios and test cases for all major aspects of the Civic Grievance Triage System website. Use this as a checklist to verify that all features are functioning correctly.

## 1. Authentication & Roles
- **[ ] Department Login:** Verify that a department user can log in with valid credentials.
- **[ ] Invalid Credentials:** Verify that an error message is displayed when incorrect login details are entered.
- **[ ] Access Control:** Ensure citizens (unauthenticated users) cannot access the department dashboard directly via URL.
- **[ ] Role-based Routing:** Ensure that once a department user logs in, they only see the grievances assigned to their specific department (e.g., Roads, Water, Sanitation, Electricity).

## 2. Citizen Grievance Reporting
- **[ ] Image Upload:** Verify that clicking the upload area allows the user to select an image, and the UI updates to show the selected file name and a checkmark.
- **[ ] Location Capture:** 
  - Click "Get My Location" and accept browser permissions. Verify latitude and longitude are captured successfully.
  - Verify map interaction works (if a map is displayed to drop a pin).
- **[ ] Text Description:** Enter a text description and verify it gets submitted correctly.
- **[ ] Audio Recording:** 
  - Click "Record Audio", speak, and click "Stop".
  - Verify that the audio can be previewed/played back before submission.
- **[ ] Required Fields:** Try submitting without an image or location. Verify the form prevents submission and prompts the user.
- **[ ] Successful Submission:** 
  - Submit a complete form.
  - Verify the submission overlay/modal appears containing the AI Analysis results (Severity, Department, Visual Issue, Translations).

## 3. AI & Processing Backend
- **[ ] YOLO Visual Detection:** Upload an image containing a recognizable civic issue (e.g., a pothole or garbage). Verify the AI correctly flags the visual issue.
- **[ ] Sarvam AI Translation:** Enter a grievance description in a regional language (e.g., Hindi or Kannada). Verify the AI analysis modal returns an accurate English translation.
- **[ ] Audio Transcription/Translation:** Submit an audio recording in a regional language. Verify the Gemini AI correctly interprets the audio and assigns the right severity and department.
- **[ ] Department Routing:** Verify the AI correctly maps the issue to the appropriate department (e.g., Pothole -> Roads, Streetlight -> Electricity).

## 4. Duplicate Detection
- **[ ] Identical Location Flagging:** 
  - Submit an issue at a specific location.
  - Submit a second issue of the same category within 50 meters of the first location.
  - Verify the second issue is flagged as a duplicate and links to the parent ticket.
- **[ ] Distinct Location Bypass:** Submit a similar issue >50 meters away and verify it is treated as a new, distinct ticket.

## 5. Department Dashboard
- **[ ] Grievance List:** Verify the dashboard displays all active grievances assigned to the logged-in department.
- **[ ] Issue Details:** Click on a grievance to open its details view. Verify all information (Original text, AI Tag, Severity, Location) matches the citizen's submission.
- **[ ] Status Update (In-Progress):** Click "Start Work" and verify the issue status changes to "In-Progress".
- **[ ] Proof of Work Upload:** 
  - Attempt to mark the issue as "Resolved" without uploading a proof photo. Verify an error alert is shown.
  - Upload a valid proof photo, mark as resolved, and verify the status successfully updates to "Resolved".
- **[ ] Resolved State:** View a resolved issue. Verify it displays a success message indicating the citizen has been notified.

## 6. Multi-lingual UI Support
- **[ ] Language Toggle:** Change the website language (English, Kannada, Hindi) if a language selector is present.
- **[ ] Bilingual Text Display:** Verify that UI elements (labels, buttons, hints) accurately display the chosen language or bilingual strings as configured in the `locales.ts` file.

## 7. Responsive Design & UI
- **[ ] Mobile View:** Access the citizen reporting form on a mobile device (or via browser dev tools). Verify the layout stacks cleanly and buttons are tappable.
- **[ ] Loading States:** Verify that loading spinners appear during location fetching, audio recording initialization, and form submission.
- **[ ] Error Handling:** Verify that network errors or failed AI processing show a user-friendly error message on the screen rather than crashing the page.
