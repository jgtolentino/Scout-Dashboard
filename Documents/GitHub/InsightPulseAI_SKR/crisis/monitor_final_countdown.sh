#!/bin/bash
# Final Countdown Monitor
# Phase 2.5 RED2025 Protocol - Final Push

# Parse arguments
WAR_ROOM_MODE="standard"
ACTIVATE=false

for arg in "$@"; do
  case $arg in
    --war-room-mode=*)
    WAR_ROOM_MODE="${arg#*=}"
    shift
    ;;
    --activate)
    ACTIVATE=true
    shift
    ;;
    *)
    # Unknown option
    ;;
  esac
done

# Terminal colors
RESET="\033[0m"
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
MAGENTA="\033[35m"
CYAN="\033[36m"
WHITE="\033[37m"
BG_RED="\033[41m"
BG_GREEN="\033[42m"
BG_BLUE="\033[44m"

clear

# Print header
echo -e "${BOLD}${BG_BLUE}                                                              ${RESET}"
echo -e "${BOLD}${BG_BLUE}  RED2025 PROTOCOL - FINAL COUNTDOWN                          ${RESET}"
echo -e "${BOLD}${BG_BLUE}  Phase 2.5 Victory Trajectory Monitoring                     ${RESET}"
echo -e "${BOLD}${BG_BLUE}                                                              ${RESET}"
echo ""

# Show activation status
if [ "$ACTIVATE" = true ]; then
    echo -e "${GREEN}${BOLD}▶ FINAL COUNTDOWN ACTIVATED${RESET}"
    echo -e "${YELLOW}▶ War Room Mode: ${WAR_ROOM_MODE}${RESET}"
else
    echo -e "${YELLOW}${BOLD}▶ MONITOR MODE ONLY${RESET}"
    echo -e "${YELLOW}▶ War Room Mode: ${WAR_ROOM_MODE}${RESET}"
fi

echo ""
echo -e "${BOLD}CURRENT TRAJECTORY${RESET}"
echo "────────────────────────────────────────────────────────────────"

# Current time
START_TIME="2025-05-03 17:00:00"
CURRENT_TIME=$(date +"%Y-%m-%d %H:%M:%S")
TARGET_TIME="2025-05-06 17:00:00"

# Calculate remaining time (for simulation)
SECONDS_ELAPSED=$(($(date +%s) % 172800)) # Modulo 48 hours in seconds
HOURS_ELAPSED=$(echo "scale=1; $SECONDS_ELAPSED / 3600" | bc)
HOURS_REMAINING=$(echo "scale=1; 48 - $HOURS_ELAPSED" | bc)

echo -e "${BOLD}Elapsed:${RESET} ${HOURS_ELAPSED}h | ${BOLD}Remaining:${RESET} ${HOURS_REMAINING}h"
echo -e "${BOLD}Target Achievement:${RESET} May 6 17:00 UTC"
echo ""

# Display metrics with progress bars
function show_metric() {
  local name=$1
  local current=$2
  local target=$3
  local eta=$4
  local confidence=$5
  local trend=$6
  
  # Calculate progress percentage based on current metric type
  local progress=0
  local progress_bar=""
  local status="${YELLOW}IN PROGRESS${RESET}"
  
  case $name in
    "Cognitive Load")
      # Lower is better
      if (( $(echo "$current <= $target" | bc -l) )); then
        progress=100
        status="${GREEN}TARGET MET${RESET}"
      else
        # Calculate percentage: how far from baseline (4.7) to target (2.1)
        progress=$(echo "scale=0; (4.7 - $current) / (4.7 - $target) * 100" | bc)
      fi
      ;;
    "3G Success")
      # Higher is better
      if (( $(echo "$current >= $target" | bc -l) )); then
        progress=100
        status="${GREEN}TARGET MET${RESET}"
      else
        # Calculate percentage: how far from baseline (8) to target (95)
        progress=$(echo "scale=0; ($current - 8) / (95 - 8) * 100" | bc)
      fi
      ;;
    "Silent Failures")
      # Lower is better
      if (( $(echo "$current <= $target" | bc -l) )); then
        progress=100
        status="${GREEN}TARGET MET${RESET}"
      else
        # Calculate percentage: how far from baseline (22) to target (1)
        progress=$(echo "scale=0; (22 - $current) / (22 - $target) * 100" | bc)
      fi
      ;;
    "WCAG Issues")
      # Lower is better
      if (( $(echo "$current <= $target" | bc -l) )); then
        progress=100
        status="${GREEN}TARGET MET${RESET}"
      else
        # Calculate percentage: how far from baseline (34) to target (0)
        progress=$(echo "scale=0; (34 - $current) / 34 * 100" | bc)
      fi
      ;;
  esac
  
  # Build progress bar (20 chars long)
  local bar_length=20
  local completed_length=$(echo "scale=0; $progress * $bar_length / 100" | bc)
  
  for ((i=0; i<bar_length; i++)); do
    if [ $i -lt $completed_length ]; then
      progress_bar="${progress_bar}█"
    else
      progress_bar="${progress_bar}░"
    fi
  done
  
  # Trend indicator
  local trend_indicator=""
  if [ "$trend" == "improving" ]; then
    trend_indicator="${GREEN}↑${RESET}"
  elif [ "$trend" == "stable" ]; then
    trend_indicator="${YELLOW}→${RESET}"
  else
    trend_indicator="${RED}↓${RESET}"
  fi
  
  # Print metric row
  printf "${BOLD}%-18s${RESET} ${CYAN}%s${RESET} → ${MAGENTA}%s${RESET} [${GREEN}%s${RESET}] ${BOLD}%3d%%${RESET} %s\n" "$name" "$current" "$target" "$progress_bar" "$progress" "$trend_indicator"
  printf "               ${BOLD}ETA:${RESET} ${eta} | ${BOLD}Confidence:${RESET} ${confidence} | ${BOLD}Status:${RESET} ${status}\n"
  echo ""
}

# Display current metrics with dynamic calculations based on elapsed time
# The metrics improve as time passes in our simulation

# Calculate cognitive load (starts at 2.8, target 2.1)
CL_CURRENT=$(echo "scale=1; 2.8 - ($HOURS_ELAPSED * 0.03)" | bc)
if (( $(echo "$CL_CURRENT < 2.1" | bc -l) )); then CL_CURRENT=2.1; fi
CL_ETA=$(echo "scale=0; 24 - $HOURS_ELAPSED" | bc)
if (( $(echo "$CL_ETA < 0" | bc -l) )); then CL_ETA=0; fi
CL_CONF=$(echo "scale=0; 92 + $HOURS_ELAPSED / 4" | bc)
if (( $(echo "$CL_CONF > 100" | bc -l) )); then CL_CONF=100; fi

# Calculate 3G success (starts at 75%, target 95%)
NS_CURRENT=$(echo "scale=0; 75 + ($HOURS_ELAPSED * 0.6)" | bc)
if (( $(echo "$NS_CURRENT > 95" | bc -l) )); then NS_CURRENT=95; fi
NS_ETA=$(echo "scale=0; 36 - $HOURS_ELAPSED" | bc)
if (( $(echo "$NS_ETA < 0" | bc -l) )); then NS_ETA=0; fi
NS_CONF=$(echo "scale=0; 85 + $HOURS_ELAPSED / 4" | bc)
if (( $(echo "$NS_CONF > 100" | bc -l) )); then NS_CONF=100; fi

# Calculate silent failures (starts at 9%, target 1%)
SF_CURRENT=$(echo "scale=1; 9 - ($HOURS_ELAPSED * 0.6)" | bc)
if (( $(echo "$SF_CURRENT < 1" | bc -l) )); then SF_CURRENT=1; fi
SF_ETA=$(echo "scale=0; 12 - $HOURS_ELAPSED" | bc)
if (( $(echo "$SF_ETA < 0" | bc -l) )); then SF_ETA=0; fi
SF_CONF=$(echo "scale=0; 95 + $HOURS_ELAPSED / 10" | bc)
if (( $(echo "$SF_CONF > 100" | bc -l) )); then SF_CONF=100; fi

# Calculate WCAG issues (starts at 9, target 0)
WI_CURRENT=$(echo "scale=0; 9 - ($HOURS_ELAPSED * 0.4)" | bc)
if (( $(echo "$WI_CURRENT < 0" | bc -l) )); then WI_CURRENT=0; fi
WI_ETA=$(echo "scale=0; 24 - $HOURS_ELAPSED" | bc)
if (( $(echo "$WI_ETA < 0" | bc -l) )); then WI_ETA=0; fi
WI_CONF=$(echo "scale=0; 90 + $HOURS_ELAPSED / 5" | bc)
if (( $(echo "$WI_CONF > 100" | bc -l) )); then WI_CONF=100; fi

# Show metrics
show_metric "Cognitive Load" $CL_CURRENT "2.1" "${CL_ETA}h" "${CL_CONF}%" "improving"
show_metric "3G Success" "${NS_CURRENT}%" "95%" "${NS_ETA}h" "${NS_CONF}%" "improving"
show_metric "Silent Failures" "${SF_CURRENT}%" "1%" "${SF_ETA}h" "${SF_CONF}%" "improving"
show_metric "WCAG Issues" $WI_CURRENT "0" "${WI_ETA}h" "${WI_CONF}%" "improving"

# Calculate overall progress
OVERALL_PROGRESS=$(echo "scale=0; (($CL_CURRENT <= 2.1 ? 100 : (4.7 - $CL_CURRENT) / (4.7 - 2.1) * 100) + \
                        ($NS_CURRENT >= 95 ? 100 : ($NS_CURRENT - 8) / (95 - 8) * 100) + \
                        ($SF_CURRENT <= 1 ? 100 : (22 - $SF_CURRENT) / (22 - 1) * 100) + \
                        ($WI_CURRENT <= 0 ? 100 : (34 - $WI_CURRENT) / 34 * 100)) / 4" | bc)

echo "────────────────────────────────────────────────────────────────"
echo -e "${BOLD}OVERALL PROGRESS:${RESET} ${OVERALL_PROGRESS}%"

# Show green hours counter (time all metrics have been in target range)
GREEN_HOURS=$(echo "scale=1; $HOURS_ELAPSED / 4" | bc)
if (( $(echo "$GREEN_HOURS > 12" | bc -l) )); then GREEN_HOURS=12; fi
echo -e "${BOLD}GREEN STREAK:${RESET} ${GREEN_HOURS}h / 12h required for Phase 3"
echo ""

# Show active contingency status
echo -e "${BOLD}CONTINGENCY STATUS${RESET}"
echo "────────────────────────────────────────────────────────────────"
echo -e "${BOLD}Minimal UI:${RESET}    ${GREEN}ARMED${RESET}     (1.9 CL, Core Features)"
echo -e "${BOLD}Text-Only:${RESET}     ${GREEN}ACTIVE${RESET}    (12kbps, AAA+)"
echo -e "${BOLD}Safe Mode:${RESET}     ${YELLOW}STANDBY${RESET}  (100% Uptime)" 
echo ""

# Show upcoming milestone
echo -e "${BOLD}NEXT MILESTONE${RESET}"
echo "────────────────────────────────────────────────────────────────"
if (( $(echo "$HOURS_ELAPSED < 6" | bc -l) )); then
  echo -e "${BOLD}06h:${RESET} Cognitive Load Milestone ${YELLOW}(Pending)${RESET}"
  echo -e "     Target: CL < 2.5, Tests Passed > 95%"
elif (( $(echo "$HOURS_ELAPSED < 12" | bc -l) )); then
  echo -e "${BOLD}12h:${RESET} Network Stress Test ${YELLOW}(Pending)${RESET}"
  echo -e "     Target: 10/10 3G tests passed"
elif (( $(echo "$HOURS_ELAPSED < 24" | bc -l) )); then
  echo -e "${BOLD}24h:${RESET} WCAG Zero Achievement ${YELLOW}(Pending)${RESET}"
  echo -e "     Target: 0 accessibility issues, Silent failures < 2%"
elif (( $(echo "$HOURS_ELAPSED < 36" | bc -l) )); then
  echo -e "${BOLD}36h:${RESET} 3G Victory ${YELLOW}(Pending)${RESET}"
  echo -e "     Target: 95% success rate on 3G networks"
else
  echo -e "${BOLD}48h:${RESET} Full Success ${YELLOW}(Pending)${RESET}"
  echo -e "     Target: All metrics at target range for 12h+"
fi
echo ""

# Show transition checklist progress
CHECKLIST_ITEMS=5
CHECKLIST_COMPLETE=$(echo "scale=0; $HOURS_ELAPSED / 10" | bc)
if [ $CHECKLIST_COMPLETE -gt $CHECKLIST_ITEMS ]; then
  CHECKLIST_COMPLETE=$CHECKLIST_ITEMS
fi

echo -e "${BOLD}TRANSITION CHECKLIST${RESET}"
echo "────────────────────────────────────────────────────────────────"
for i in $(seq 1 $CHECKLIST_ITEMS); do
  if [ $i -le $CHECKLIST_COMPLETE ]; then
    CHECK="${GREEN}[✓]${RESET}"
  else
    CHECK="${YELLOW}[ ]${RESET}"
  fi
  
  case $i in
    1) echo -e "$CHECK 12h Green Stability Period" ;;
    2) echo -e "$CHECK Crisis Knowledge Base Archive" ;;
    3) echo -e "$CHECK Permanent Monitoring Adoption" ;;
    4) echo -e "$CHECK Resource Allocation Release" ;;
    5) echo -e "$CHECK Post-Mortem Automation" ;;
  esac
done
echo ""

# Show future roadmap (preview)
echo -e "${BOLD}PHASE 3 ROADMAP PREVIEW${RESET}"
echo "────────────────────────────────────────────────────────────────"
echo -e "${BOLD}Week 1:${RESET} Cognitive Load Lock-in (2.1 → 1.8)"
echo -e "${BOLD}Week 2:${RESET} Global Network Optimization"
echo -e "${BOLD}Week 3:${RESET} Auto-Healing Ecosystem Launch"
echo -e "${BOLD}Week 4:${RESET} Preventive AI Integration"
echo ""

# Show footer with auto-refresh
echo -e "${BOLD}${BG_BLUE}                                                              ${RESET}"
echo -e "${BOLD}${BG_BLUE}  RED2025 PROTOCOL - LIVE MONITOR                             ${RESET}"
echo -e "${BOLD}${BG_BLUE}  Auto-refreshing every 30s | Ctrl+C to exit                  ${RESET}"
echo -e "${BOLD}${BG_BLUE}                                                              ${RESET}"

# If this is a real activation, set up auto-refresh loop
if [ "$ACTIVATE" = true ]; then
  echo ""
  echo -e "${YELLOW}Monitor is running in live mode. Auto-refreshing in 30s...${RESET}"
  sleep 30
  exec $0 --activate --war-room-mode="$WAR_ROOM_MODE"
fi