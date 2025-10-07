#!/bin/bash
# Resource limits for code execution

# Set default limits if not provided
MAX_CPU=${MAX_CPU:-1}          # Default: 1 CPU core
MAX_MEMORY=${MAX_MEMORY:-256}  # Default: 256 MB
TIMEOUT=${TIMEOUT:-30}         # Default: 30 seconds
DISK_QUOTA=${DISK_QUOTA:-100}  # Default: 100 MB

echo "Setting resource limits:"
echo "  CPU: $MAX_CPU core(s)"
echo "  Memory: $MAX_MEMORY MB"
echo "  Execution timeout: $TIMEOUT seconds"
echo "  Disk quota: $DISK_QUOTA MB"

# Apply CPU limits using cgroups if running as root
if [ $(id -u) -eq 0 ]; then
    if [ -d "/sys/fs/cgroup/cpu" ]; then
        echo "Setting CPU limits using cgroups"
        # Create a cgroup for this container
        mkdir -p /sys/fs/cgroup/cpu/pulsedev
        echo $$ > /sys/fs/cgroup/cpu/pulsedev/tasks
        
        # Set CPU quota (100000 = 100% of one core)
        cpu_quota=$((100000 * $MAX_CPU))
        echo $cpu_quota > /sys/fs/cgroup/cpu/pulsedev/cpu.cfs_quota_us
        echo 100000 > /sys/fs/cgroup/cpu/pulsedev/cpu.cfs_period_us
    else
        echo "Warning: CPU limits not applied (cgroups not available)"
    fi
else
    echo "Warning: CPU limits not applied (not running as root)"
fi

# Set memory limits via the ulimit command
ulimit -v $(($MAX_MEMORY * 1024)) 2>/dev/null || echo "Warning: Memory limit not applied"

# Set file size limit to protect disk space
ulimit -f $(($DISK_QUOTA * 1024)) 2>/dev/null || echo "Warning: Disk quota not applied"

# Timeout will be handled by runtime.sh using the 'timeout' command

# Set process limits to prevent fork bombs
ulimit -u 50 2>/dev/null || echo "Warning: Process limit not applied"