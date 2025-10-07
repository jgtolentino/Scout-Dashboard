import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, Progress, Stat, StatLabel, StatNumber, 
         StatHelpText, StatArrow, Heading, Badge, Grid, 
         Divider, useColorModeValue, VStack, HStack } from '@chakra-ui/react';
import { CheckCircleIcon, TimeIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons';

interface StatusData {
  protocol: string;
  phase: string;
  status: string;
  last_updated: string;
  uptime_streak: {
    green_hours: number;
    remaining_for_phase3: number;
    started_at: string;
  };
  metrics: {
    [key: string]: {
      current: number;
      target: number;
      status: string;
      trend: string;
      progress_percent: number;
      eta_hours: number;
      confidence: number;
    };
  };
  telemetry: {
    nasa_tlx_score: number;
    '3g_test_results': {
      tests_run: number;
      tests_passed: number;
      success_rate: number;
      last_run: string;
    };
    task_escape_rate: number;
    rage_clicks_last_hour: number;
    average_recovery_time_ms: number;
  };
  overall: {
    progress_percent: number;
    eta_complete_hours: number;
    target_completion: string;
    confidence: number;
  };
  next_milestone: {
    name: string;
    target_hour: number;
    status: string;
    description: string;
    eta_hours: number;
  };
  contingency: {
    [key: string]: {
      status: string;
      description: string;
    };
  };
}

const defaultStatus: StatusData = {
  protocol: "RED2025",
  phase: "2.5",
  status: "loading",
  last_updated: new Date().toISOString(),
  uptime_streak: {
    green_hours: 0,
    remaining_for_phase3: 12,
    started_at: new Date().toISOString()
  },
  metrics: {
    cognitive_load: {
      current: 2.8,
      target: 2.1,
      status: "in_progress",
      trend: "improving",
      progress_percent: 70,
      eta_hours: 24,
      confidence: 92
    },
    "3g_success_rate": {
      current: 75,
      target: 95,
      status: "in_progress",
      trend: "improving",
      progress_percent: 77,
      eta_hours: 36,
      confidence: 85
    },
    silent_failures: {
      current: 9,
      target: 1,
      status: "in_progress",
      trend: "improving",
      progress_percent: 62,
      eta_hours: 12,
      confidence: 95
    },
    wcag_issues: {
      current: 9,
      target: 0,
      status: "in_progress",
      trend: "improving",
      progress_percent: 74,
      eta_hours: 24,
      confidence: 90
    }
  },
  telemetry: {
    nasa_tlx_score: 2.8,
    "3g_test_results": {
      tests_run: 5,
      tests_passed: 3,
      success_rate: 60,
      last_run: new Date().toISOString()
    },
    task_escape_rate: 9,
    rage_clicks_last_hour: 12,
    average_recovery_time_ms: 1200
  },
  overall: {
    progress_percent: 70,
    eta_complete_hours: 36,
    target_completion: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    confidence: 90
  },
  next_milestone: {
    name: "Cognitive Milestone",
    target_hour: 6,
    status: "pending",
    description: "CL < 2.5, Tests Passed > 95%",
    eta_hours: 6
  },
  contingency: {
    minimal_ui: {
      status: "armed",
      description: "1.9 CL, Core Features Only"
    },
    text_only: {
      status: "standby",
      description: "12kbps, WCAG AAA+"
    },
    safe_mode: {
      status: "standby",
      description: "100% Uptime"
    }
  }
};

// Function to format time as friendly readable string
const formatTimeRemaining = (hours: number) => {
  if (hours === 0) return 'Complete';
  if (hours < 1) return `${Math.ceil(hours * 60)}m`;
  return `${Math.floor(hours)}h ${Math.ceil((hours % 1) * 60)}m`;
};

// Function to get status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'complete': return 'green';
    case 'in_progress': return 'blue';
    case 'pending': return 'yellow';
    case 'armed': return 'green';
    case 'active': return 'green';
    case 'standby': return 'yellow';
    default: return 'gray';
  }
};

export const FinalCountdownMonitor = ({ location = 'hero', refreshInterval = 30 }) => {
  const [status, setStatus] = useState<StatusData>(defaultStatus);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('blue.600', 'blue.300');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const subtleTextColor = useColorModeValue('gray.600', 'gray.400');
  
  // Fetch status data
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/public/status.json');
        if (!response.ok) throw new Error('Failed to fetch status data');
        const data = await response.json();
        setStatus(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching status:', err);
        setError('Failed to load status data. Using offline data.');
        // Use default data in case of failure
        setLoading(false);
      }
    };
    
    fetchStatus();
    
    // Set up polling
    const intervalId = setInterval(fetchStatus, refreshInterval * 1000);
    return () => clearInterval(intervalId);
  }, [refreshInterval]);
  
  // Compact view for sidebar
  if (location === 'sidebar') {
    return (
      <Box 
        p={3} 
        bg={bgColor} 
        borderRadius="md" 
        borderLeft="4px solid" 
        borderColor="blue.500"
        boxShadow="sm"
      >
        <Flex justify="space-between" align="center" mb={2}>
          <Badge colorScheme="blue" fontSize="sm">{status.protocol} PROTOCOL</Badge>
          <Badge colorScheme="green">PHASE {status.phase}</Badge>
        </Flex>
        
        <Heading size="sm" color={headingColor} mb={2}>🧿 FINAL COUNTDOWN MONITOR</Heading>
        
        <Box mb={2}>
          <Text fontSize="sm" color={subtleTextColor}>Overall Progress</Text>
          <Progress 
            value={status.overall.progress_percent} 
            size="sm" 
            colorScheme="blue" 
            hasStripe 
            mb={1} 
          />
          <Flex justify="space-between" fontSize="xs">
            <Text>{status.overall.progress_percent}%</Text>
            <Text>ETA: {formatTimeRemaining(status.overall.eta_complete_hours)}</Text>
          </Flex>
        </Box>
        
        <Divider my={2} />
        
        <Flex justify="space-between" fontSize="xs" color={subtleTextColor}>
          <Text>Green Streak: {status.uptime_streak.green_hours}h</Text>
          <Text>Next Phase: {formatTimeRemaining(status.uptime_streak.remaining_for_phase3)}</Text>
        </Flex>
      </Box>
    );
  }
  
  // Full view for homepage and dashboard
  return (
    <Box 
      p={5} 
      bg={bgColor} 
      borderRadius="lg" 
      borderLeft="6px solid" 
      borderColor="blue.500"
      boxShadow="md"
      position="relative"
      overflow="hidden"
    >
      {/* Background pattern for crisis mode */}
      <Box 
        position="absolute" 
        top="0" 
        right="0" 
        bottom="0" 
        width="50px" 
        bg="repeating-linear-gradient(45deg, rgba(255,0,0,0.05), rgba(255,0,0,0.05) 10px, rgba(0,0,0,0) 10px, rgba(0,0,0,0) 20px)"
        zIndex="0" 
      />
      
      {/* Header */}
      <Flex justify="space-between" align="center" mb={4} position="relative" zIndex="1">
        <Flex align="center">
          <TimeIcon color="blue.500" w={5} h={5} mr={2} />
          <Heading size="md" color={headingColor}>🧿 FINAL COUNTDOWN MONITOR · LIVE STATUS</Heading>
        </Flex>
        <Flex>
          <Badge colorScheme="blue" fontSize="sm" mr={2}>{status.protocol}</Badge>
          <Badge colorScheme="green">PHASE {status.phase}</Badge>
        </Flex>
      </Flex>
      
      {/* Introduction text */}
      <Text color={textColor} mb={4}>
        The RED2025 Emergency Protocol is nearing resolution. Systems are stabilizing ahead of schedule, 
        and all critical metrics are approaching full success thresholds.
      </Text>
      
      {/* Main metrics dashboard */}
      <Heading size="sm" mb={3} color={headingColor}>📊 Current Operational Metrics:</Heading>
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4} mb={4}>
        {Object.entries(status.metrics).map(([key, metric]) => {
          const metricIcon = key === 'cognitive_load' ? '🧠' : 
                             key === '3g_success_rate' ? '📶' : 
                             key === 'silent_failures' ? '🔕' : '♿';
          
          const formattedKey = key.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          return (
            <Stat 
              key={key} 
              p={3} 
              bg={useColorModeValue('gray.50', 'gray.700')} 
              borderRadius="md"
              boxShadow="sm"
            >
              <Flex justify="space-between">
                <StatLabel fontSize="sm">{metricIcon} {formattedKey}</StatLabel>
                <Badge colorScheme={getStatusColor(metric.status)}>{metric.status}</Badge>
              </Flex>
              <StatNumber fontSize="xl">
                {metric.current}{key === '3g_success_rate' ? '%' : ''}
                {metric.status !== 'complete' && (
                  <Text as="span" fontSize="md" color={subtleTextColor}> → {metric.target}{key === '3g_success_rate' ? '%' : ''}</Text>
                )}
                {metric.status === 'complete' && (
                  <Text as="span" ml={2} fontSize="sm" color="green.500">✓</Text>
                )}
              </StatNumber>
              <Progress 
                value={metric.progress_percent} 
                size="xs" 
                colorScheme={metric.status === 'complete' ? 'green' : 'blue'} 
                hasStripe={metric.status !== 'complete'}
                mt={1} mb={2}
              />
              <StatHelpText mb={0} fontSize="xs">
                {metric.trend === 'improving' && <StatArrow type="increase" />}
                {metric.trend === 'declining' && <StatArrow type="decrease" />}
                {metric.status === 'complete' ? 'Target met' : `ETA: ${formatTimeRemaining(metric.eta_hours)}`}
              </StatHelpText>
            </Stat>
          );
        })}
      </Grid>
      
      {/* Streak and overall progress */}
      <HStack spacing={4} mb={4}>
        <Stat 
          p={3} 
          bg={useColorModeValue('blue.50', 'blue.900')} 
          borderRadius="md"
          boxShadow="sm"
          flex="1"
        >
          <StatLabel fontSize="sm">🕐 Uptime Streak</StatLabel>
          <StatNumber fontSize="xl">
            {status.uptime_streak.green_hours}h green
          </StatNumber>
          <StatHelpText fontSize="xs" mb={0}>
            {status.uptime_streak.remaining_for_phase3}h remaining until Phase 3
          </StatHelpText>
        </Stat>
        
        <Stat 
          p={3} 
          bg={useColorModeValue('green.50', 'green.900')} 
          borderRadius="md"
          boxShadow="sm"
          flex="1"
        >
          <StatLabel fontSize="sm">🎯 Full Resolution Projected</StatLabel>
          <StatNumber fontSize="xl">
            {formatTimeRemaining(status.overall.eta_complete_hours)}
          </StatNumber>
          <StatHelpText fontSize="xs" mb={0}>
            Confidence: {status.overall.confidence}%
          </StatHelpText>
        </Stat>
      </HStack>
      
      {/* Next milestone */}
      <Flex 
        p={3} 
        bg={useColorModeValue('yellow.50', 'yellow.900')} 
        borderRadius="md"
        mb={4}
        align="center"
      >
        <InfoIcon mr={2} color="yellow.500" />
        <Box>
          <Text fontWeight="bold">Next milestone: <strong>{status.next_milestone.name} @ {status.next_milestone.target_hour}h</strong></Text>
          <Text fontSize="sm">{status.next_milestone.description}, projected ahead of schedule.</Text>
        </Box>
      </Flex>
      
      {/* Footer */}
      <Text fontSize="xs" color={subtleTextColor} textAlign="center">
        📍 Monitoring continues in war room mode with updates every {refreshInterval}s.
        {error && <Text color="red.500"> • {error}</Text>}
      </Text>
    </Box>
  );
};

export default FinalCountdownMonitor;