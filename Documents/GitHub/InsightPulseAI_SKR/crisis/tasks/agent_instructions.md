# Agent Instructions: RED2025 Final Countdown

## Claudia – System Coordination

**Task:** Sync Final Countdown Monitor to frontend and dashboard
**Assignee:** Claudia
**Tags:** crisis, UIUX, status
**Note:** Ensure `status.json` reflects latest uptime streak, ETA, and metrics for RED2025. Push to /public/status.json every 30s during active monitoring.

### Implementation Details:
1. Connect the monitoring service to the frontend using the FinalCountdownMonitor component
2. Ensure all metrics are correctly formatted and updated in the status.json file
3. Implement the 30-second refresh cycle for live updates
4. Verify that component renders correctly in all UI locations (hero, sidebar, shell)
5. Test fallback behavior when network connectivity is limited

## Maya – Documentation + SOP

**Task:** Document RED2025 Countdown UI logic
**Assignee:** Maya
**Tags:** documentation, UX
**Note:** Outline polling behavior, JSON schema, and transition logic for FinalCountdownMonitor.tsx. Confirm fallback for offline mode.

### Implementation Details:
1. Create comprehensive documentation for the FinalCountdownMonitor component
2. Specify the JSON schema for the status.json file
3. Document the transition logic for phase changes
4. Detail the offline fallback behavior and caching strategy
5. Create diagrams showing data flow and component relationship

## Echo – Logging & Telemetry

**Task:** Attach telemetry summaries to `status.json` endpoint
**Assignee:** Echo
**Tags:** logs, UXmetrics
**Note:** Every 30s snapshot from RED2025 monitor must include NASA TLX score, 3G test results, and task escape rate. Embed into API responses for UI sync.

### Implementation Details:
1. Implement telemetry collection for all required metrics
2. Configure 30-second snapshot intervals
3. Include all required metrics in the telemetry section of status.json
4. Set up appropriate error handling and timeout behaviors
5. Verify metrics are correctly displayed in the UI components

## Kalaw – Knowledge Indexing

**Task:** Index all RED2025 Phase 2 metrics in SKR
**Assignee:** Kalaw
**Tags:** SKR, metrics
**Note:** Log success thresholds and snapshot messages to SKR under `/emergency_protocols/red2025/phase2/monitoring_log.md`.

### Implementation Details:
1. Create the monitoring_log.md file in the specified location
2. Format all metrics in a consistent, readable format
3. Include success thresholds, current values, and status for each metric
4. Document the green streak monitoring data
5. Create a timeline of critical path milestones and their status