#!/bin/bash

# Hotel Wi-Fi Debug & Network Reset Script

echo "Hotel Wi-Fi Debug Tool"
echo "====================="

# Function to show network info
show_network_info() {
    echo -e "\n📡 Current Network Status:"
    echo "-------------------------"
    # Current Wi-Fi network
    /System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | grep -E "SSID|BSSID|channel"
    
    # IP info
    echo -e "\n🌐 IP Configuration:"
    ifconfig en0 | grep -E "inet |ether"
    
    # DNS servers
    echo -e "\n🔍 DNS Servers:"
    scutil --dns | grep "nameserver\[[0-9]*\]" | head -5
}

# Function to reset network
reset_network() {
    echo -e "\n🔄 Resetting network stack..."
    
    # Flush DNS
    sudo dscacheutil -flushcache
    sudo killall -HUP mDNSResponder 2>/dev/null
    
    # Reset Wi-Fi interface
    sudo ifconfig en0 down
    sleep 2
    sudo ifconfig en0 up
    
    # Clear DHCP lease
    sudo ipconfig set en0 DHCP
    
    echo "✓ Network reset complete"
}

# Function to test captive portal
test_captive_portal() {
    echo -e "\n🔍 Testing captive portal detection..."
    
    ENDPOINTS=(
        "http://captive.apple.com"
        "http://connectivitycheck.gstatic.com/generate_204"
        "http://www.msftconnecttest.com/connecttest.txt"
    )
    
    for endpoint in "${ENDPOINTS[@]}"; do
        echo -e "\nTesting: $endpoint"
        RESPONSE=$(curl -s -I -m 5 "$endpoint" | head -1)
        LOCATION=$(curl -s -I -m 5 "$endpoint" | grep -i "location:" | cut -d' ' -f2 | tr -d '\r')
        
        echo "Response: $RESPONSE"
        if [ -n "$LOCATION" ]; then
            echo "Redirect to: $LOCATION"
        fi
    done
}

# Function to extract portal details
analyze_portal() {
    local portal_url="$1"
    echo -e "\n📋 Analyzing portal page..."
    
    # Download page
    curl -s -L "$portal_url" -o /tmp/portal_analysis.html
    
    echo -e "\n🔍 Form fields found:"
    grep -oE 'name="[^"]*"' /tmp/portal_analysis.html | sort -u | head -20
    
    echo -e "\n🔗 Form actions:"
    grep -oE 'action="[^"]*"' /tmp/portal_analysis.html | head -5
    
    echo -e "\n📝 Sample login command:"
    echo "curl -X POST 'FORM_ACTION_URL' \\"
    echo "  -d 'field1=value1' \\"
    echo "  -d 'field2=value2' \\"
    echo "  -c cookies.txt"
    
    rm -f /tmp/portal_analysis.html
}

# Main menu
while true; do
    echo -e "\n🏨 Hotel Wi-Fi CLI Tools"
    echo "1) Show network info"
    echo "2) Reset network stack"
    echo "3) Test captive portal"
    echo "4) Analyze portal URL"
    echo "5) Quick connection test"
    echo "6) Exit"
    
    read -p "Choose option (1-6): " choice
    
    case $choice in
        1) show_network_info ;;
        2) reset_network ;;
        3) test_captive_portal ;;
        4) 
            read -p "Enter portal URL: " url
            analyze_portal "$url"
            ;;
        5)
            echo -e "\n🌐 Testing internet connection..."
            if ping -c 1 -t 2 8.8.8.8 > /dev/null 2>&1; then
                echo "✓ Internet connection working!"
            else
                echo "✗ No internet connection"
            fi
            ;;
        6) 
            echo "Goodbye!"
            exit 0
            ;;
        *) echo "Invalid option" ;;
    esac
done