export const scenario1ScoringRules = {
  // ======================
  // NETRAL
  // ======================
  OPEN_EMAIL: 0,
  CLICK_LINK: 0,

  // ======================
  // AMAN / EDUKATIF
  // ======================
  IGNORE_EMAIL: 10,        // Risiko rendah
  CLOSE_PAGE: 10,         // Risiko rendah

  CHECK_SENDER: 15,       // Sangat rendah
  REPORT_EMAIL: 15,       // Sangat rendah
  DELETE_EMAIL: 10,       // Risiko rendah

  // ======================
  // BERBAHAYA
  // ======================
  SUBMIT_FORM: -15,       // Sangat tinggi

  // ======================
  // CLASSROOM SCENE - TEACHER CONFIRMATION
  // ======================
  teacher_phishing_confirmed: 20,  // Successfully confirmed phishing with teacher (good ending)
};