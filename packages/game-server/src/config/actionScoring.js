export const ACTION_SCORES = {
  // Scenario 1 - Phishing Email Detection (Bedroom Map)
  'inspect_email': 5,
  'found_phishing': 10,

  // Endings (Mission 1)
  'reported_phishing': 15,            // Report email (+15)
  'deleted_phishing': 15,             // Delete email (+15)
  'teacher_phishing_confirmed': 20,   // Classroom teacher (+20)
  'clicked_malicious_link': -20,      // Phishing form (-20)

  // Scenario 2 - WiFi Security (Cafe Map)
  'check_owner': 5,
  'check_security': 5,

  // Endings (Mission 2)
  'bonus': 20,                        // Connect true cafe wifi (+20)
  'penalty': -20,                     // Connect evil twin (-20)

  // Scenario 2 - Browser/Attack visualization
  'attack_visualization_complete': 25, // Good ending after browser loads successfully
}

