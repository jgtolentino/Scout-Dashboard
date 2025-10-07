#!/bin/bash
# run-device-health.sh - Script to run device health check for a specific store ID

# Text formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}╔════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${BLUE}║  Device Health Check for Store                     ║${RESET}"
echo -e "${BOLD}${BLUE}╚════════════════════════════════════════════════════╝${RESET}"
echo ""

# Check if store ID is provided
if [ $# -eq 0 ]; then
  echo -e "${YELLOW}Usage: $0 <store_id>${RESET}"
  echo -e "${YELLOW}Example: $0 112${RESET}"
  
  # List available stores
  echo -e "\n${BLUE}Available stores:${RESET}"
  echo -e "  - ${GREEN}112${RESET} (North Region - Flagship)"
  echo -e "  - ${GREEN}143${RESET} (East Region - Standard)"
  echo -e "  - ${GREEN}156${RESET} (West Region - Express)"
  echo -e "  - ${GREEN}119${RESET} (South Region - Standard)"
  echo -e "  - ${GREEN}127${RESET} (North Region - Express)"
  exit 1
fi

STORE_ID=$1

# Get store details based on store ID
case $STORE_ID in
  "112")
    STORE_NAME="North Flagship"
    REGION="North"
    TYPE="Flagship"
    DEVICES=24
    ACTIVE_DEVICES=24
    HEALTH_STATUS="Excellent"
    HEALTH_PERCENT=100
    LAST_SYNC="2025-05-14 01:32:15"
    ;;
  "143")
    STORE_NAME="East Main"
    REGION="East"
    TYPE="Standard"
    DEVICES=18
    ACTIVE_DEVICES=17
    HEALTH_STATUS="Good"
    HEALTH_PERCENT=94.4
    LAST_SYNC="2025-05-14 00:47:22"
    ;;
  "156")
    STORE_NAME="West Express"
    REGION="West"
    TYPE="Express"
    DEVICES=12
    ACTIVE_DEVICES=9
    HEALTH_STATUS="Needs Attention"
    HEALTH_PERCENT=75.0
    LAST_SYNC="2025-05-13 22:15:43"
    ;;
  "119")
    STORE_NAME="South Central"
    REGION="South"
    TYPE="Standard"
    DEVICES=16
    ACTIVE_DEVICES=16
    HEALTH_STATUS="Excellent"
    HEALTH_PERCENT=100
    LAST_SYNC="2025-05-14 02:05:11"
    ;;
  "127")
    STORE_NAME="North Express"
    REGION="North"
    TYPE="Express"
    DEVICES=10
    ACTIVE_DEVICES=8
    HEALTH_STATUS="Fair"
    HEALTH_PERCENT=80.0
    LAST_SYNC="2025-05-13 19:42:38"
    ;;
  *)
    echo -e "${RED}Error: Store ID $STORE_ID not found.${RESET}"
    echo -e "${YELLOW}Available store IDs: 112, 143, 156, 119, 127${RESET}"
    exit 1
    ;;
esac

# Display store information
echo -e "${BOLD}${BLUE}Store Information:${RESET}"
echo -e "${BLUE}------------------${RESET}"
echo -e "Store ID:      ${BOLD}$STORE_ID${RESET}"
echo -e "Store Name:    ${BOLD}$STORE_NAME${RESET}"
echo -e "Region:        $REGION"
echo -e "Type:          $TYPE"
echo -e ""

# Display device health summary
echo -e "${BOLD}${BLUE}Device Health Summary:${RESET}"
echo -e "${BLUE}----------------------${RESET}"
echo -e "Total Devices:    $DEVICES"
echo -e "Active Devices:   $ACTIVE_DEVICES"

# Display health status with color coding
echo -ne "Health Status:    "
case $HEALTH_STATUS in
  "Excellent")
    echo -e "${GREEN}$HEALTH_STATUS${RESET}"
    ;;
  "Good")
    echo -e "${GREEN}$HEALTH_STATUS${RESET}"
    ;;
  "Fair")
    echo -e "${YELLOW}$HEALTH_STATUS${RESET}"
    ;;
  "Needs Attention")
    echo -e "${RED}$HEALTH_STATUS${RESET}"
    ;;
  *)
    echo -e "$HEALTH_STATUS"
    ;;
esac

echo -e "Health Percent:   $HEALTH_PERCENT%"
echo -e "Last Sync:        $LAST_SYNC"
echo -e ""

# Display device details
echo -e "${BOLD}${BLUE}Device Details:${RESET}"
echo -e "${BLUE}--------------${RESET}"

# Generate device details
for ((i=1; i<=$DEVICES; i++)); do
  DEVICE_ID="${STORE_ID}-DEV-$(printf %02d $i)"
  
  # Randomize device type
  DEVICE_TYPES=("POS" "Kiosk" "Tablet" "Inventory Scanner" "Digital Signage")
  DEVICE_TYPE=${DEVICE_TYPES[$((RANDOM % 5))]}
  
  # Set device status
  if [ $i -le $ACTIVE_DEVICES ]; then
    DEVICE_STATUS="Online"
    STATUS_COLOR=$GREEN
    
    # Randomize last activity time (within last hour)
    MINUTES_AGO=$((RANDOM % 60))
    LAST_ACTIVITY="$(date -v-${MINUTES_AGO}M +"%Y-%m-%d %H:%M:%S")"
    
    # Randomize battery level for mobile devices
    if [[ $DEVICE_TYPE == "Tablet" || $DEVICE_TYPE == "Inventory Scanner" ]]; then
      BATTERY_LEVEL=$((50 + RANDOM % 50))
      BATTERY_INFO="Battery: ${BATTERY_LEVEL}%"
    else
      BATTERY_INFO="AC Powered"
    fi
  else
    DEVICE_STATUS="Offline"
    STATUS_COLOR=$RED
    
    # Randomize last activity time (4-24 hours ago)
    HOURS_AGO=$((4 + RANDOM % 20))
    LAST_ACTIVITY="$(date -v-${HOURS_AGO}H +"%Y-%m-%d %H:%M:%S")"
    BATTERY_INFO="Unknown"
  fi
  
  # Print device info
  echo -e "Device ID:   ${BOLD}$DEVICE_ID${RESET}"
  echo -e "Type:        $DEVICE_TYPE"
  echo -e "Status:      ${STATUS_COLOR}$DEVICE_STATUS${RESET}"
  echo -e "Last Active: $LAST_ACTIVITY"
  echo -e "Power:       $BATTERY_INFO"
  echo -e "${BLUE}------------------------------${RESET}"
done

# Display recommendation
echo -e "\n${BOLD}${BLUE}Recommendation:${RESET}"
if (( $(echo "$HEALTH_PERCENT < 90" | bc -l) )); then
  echo -e "${RED}Store $STORE_ID ($STORE_NAME) requires attention. Please schedule a device maintenance visit.${RESET}"
  
  # List devices that need attention
  echo -e "\n${BOLD}${RED}Devices requiring attention:${RESET}"
  for ((i=$ACTIVE_DEVICES+1; i<=$DEVICES; i++)); do
    DEVICE_ID="${STORE_ID}-DEV-$(printf %02d $i)"
    echo -e "- ${RED}$DEVICE_ID${RESET}"
  done
  
  echo -e "\n${BOLD}${YELLOW}Recommended actions:${RESET}"
  echo -e "1. Contact store manager to verify device physical status"
  echo -e "2. Schedule remote diagnostics for offline devices"
  echo -e "3. If remote restart fails, dispatch technician to store location"
  
elif (( $(echo "$HEALTH_PERCENT < 100" | bc -l) )); then
  echo -e "${YELLOW}Store $STORE_ID ($STORE_NAME) has minor issues. Consider scheduling preventative maintenance.${RESET}"
  
  echo -e "\n${BOLD}${YELLOW}Recommended actions:${RESET}"
  echo -e "1. Attempt remote restart of offline devices"
  echo -e "2. Check network connectivity at store location"
  echo -e "3. Schedule routine maintenance in the next 7 days"
else
  echo -e "${GREEN}Store $STORE_ID ($STORE_NAME) devices are all in excellent condition. No action required.${RESET}"
fi