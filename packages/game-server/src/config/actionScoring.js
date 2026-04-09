export const ACTION_SCORES = {
  // Scenario 1 - Phishing Email Detection (Bedroom Map)
  'inspect_email': 5,
  'found_phishing': 10,
  'reported_phishing': 15,        // Good ending: Report email (+15 poin +15 exp)
  'deleted_phishing': 15,         // Good ending: Delete email (+15 poin +15 exp)
  'teacher_phishing_confirmed': 25, // Good ending: Confirm with teacher in classroom (+25 poin +25 exp)
  'clicked_malicious_link': -25,  // Bad ending: Submitted phishing form (negative score)
  
  // Scenario 2 - WiFi Security (Cafe Map)
  'check_owner': 5,
  'check_security': 5,
  'bonus': 20,                    // Good ending: Connected to correct WiFi (+20 poin +20 exp)
  'penalty': -20,                 // Bad ending: Connected to evil twin WiFi (-20 poin -20 exp)
  
  // Scenario 2 - Browser/Attack visualization
  'attack_visualization_complete': 25, // Good ending after browser loads successfully
}

