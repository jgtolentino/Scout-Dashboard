/**
 * War Room Configuration
 * RED2025 Protocol - Final Countdown
 */

const WAR_ROOM_CONFIG = {
  priorityDisplays: [
    'Cognitive Load Heatmap',
    'Network Apocalypse Simulator',
    'Rage Click Forensics'
  ],
  escalationProtocol: {
    threshold: 2.3, // NASA-TLX target
    action: 'DEPLOY_ATTENTION_HOTFIX_v3'
  },
  refreshRate: 30, // seconds
  alertMode: 'war_room',
  metrics: [
    'cognitive_load',
    '3g_success',
    'silent_failures',
    'wcag_issues'
  ],
  warRoomDisplays: {
    primary: 'victory_tracker',
    secondary: [
      'metrics_history',
      'incident_log',
      'intervention_history'
    ]
  },
  notificationTargets: [
    {
      name: 'Slack',
      channel: '#crisis-war-room',
      events: ['threshold_breach', 'milestone_achieved', 'green_streak_update']
    },
    {
      name: 'Email',
      recipients: ['crisis-team@skr.inc'],
      events: ['major_milestone', 'completion']
    }
  ]
};

module.exports = WAR_ROOM_CONFIG;
