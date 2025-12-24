export type Question = {
  id: string;
  text: string;
  options: Array<{ value: string; label: string }>;
};

export const questionsData: Question[] = [
    {
      id: "q1",
    text: "Does your organization maintain API inventory?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q2",
    text: "Does your organization conduct API security assessment (e.g., functional testing, penetration testing, fuzzing, application security testing (DAST/SAST) on periodic basis?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q3",
    text: "Is your organization ISO 22301 certified?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q4",
    text: "Does your organization maintain a PII data inventory?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q5",
    text: "Does your organization conduct PIA?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q6",
    text: "Does your organization conduct red teaming exercises?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q7",
    text: "Is there a GRC / IRM platform implemented having policy, risk, compliance, BCM and TPRM functionality enabled?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q8",
    text: "Is there a centralized Mobile Device Management (MDM) platform deployed and operational?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q9",
    text: "Is there a Privileged Access Management (PAM) solution implemented?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q10",
    text: "Has your organization deployed any Behavioral analytics tools (e.g., User and Entities Behavior Analytics) and linked with SIEM?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q11",
    text: "Is there an external attack surface management (EASM) solution deployed and operational?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q12",
    text: "Is there a brand protection solution implemented to monitor, detect, and remove online threats like counterfeits, fake social media accounts, phishing sites, and trademark abuse?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q13",
    text: "Does your organization conduct third-party risk assessments, including due diligence outcomes, control effectiveness, and residual risk ratings on a periodic basis?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q14",
    text: "Is there any contract lifecycle management (CLM) tool deployed to automate and streamline contract management?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
    },
    {
      id: "q15",
    text: "Are relevant third parties involved in your organization BCP Tabletop exercise / DR drills?",
      options: [
      { value: "1", label: "Yes" },
      { value: "0", label: "No" },
      ],
        },
];
