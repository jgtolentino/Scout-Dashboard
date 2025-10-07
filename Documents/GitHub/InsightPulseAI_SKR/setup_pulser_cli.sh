#!/bin/bash
# Setup script to create a convenient alias for the Pulser CLI

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_PATH="${SCRIPT_DIR}/pulser-cli/bin/pulser.js"

# Create alias function
create_pulser_alias() {
    echo "#!/bin/bash" > /usr/local/bin/pulser-new
    echo "node \"${CLI_PATH}\" \"\$@\"" >> /usr/local/bin/pulser-new
    chmod +x /usr/local/bin/pulser-new
    echo "✓ Created pulser-new command at /usr/local/bin/pulser-new"
}

# Check if we can write to /usr/local/bin
if [ -w /usr/local/bin ]; then
    create_pulser_alias
else
    echo "Creating pulser-new command requires sudo access:"
    sudo bash -c "$(declare -f create_pulser_alias); create_pulser_alias"
fi

echo ""
echo "Pulser CLI is now available as 'pulser-new' command"
echo "Usage examples:"
echo "  pulser-new --version"
echo "  pulser-new scaffold page mypage --path src/pages/mypage.tsx"
echo "  pulser-new inject nav --items \"Home:/\" \"About:/about\""
echo ""
