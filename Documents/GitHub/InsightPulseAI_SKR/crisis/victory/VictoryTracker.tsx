import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, Progress, Heading, Badge, Grid, 
         Divider, useColorModeValue, VStack, HStack,
         Stat, StatLabel, StatNumber, StatHelpText, StatArrow } from '@chakra-ui/react';
import { CheckCircleIcon, TimeIcon, RepeatIcon, WarningIcon } from '@chakra-ui/icons';
import { Line } from 'react-chartjs-2';

interface VictoryMetric {
  name: string;
  baseline: number;
  current: number;
  target: number;
  velocity: number;
  velocityUnit: string;
  eta: number;
  history: Array<{timestamp: string, value: number}>;
  status: 'complete' | 'in_progress' | 'at_risk';
}

interface VictoryStatus {
  startTime: string;
  currentTime: string;
  targetCompletion: string;
  greenStreakHours: number;
  requiredGreenHours: number;
  overallProgress: number;
  metrics: VictoryMetric[];
  nextMilestone: {
    name: string;
    description: string;
    eta: number;
  };
  contingency: {
    minimalUi: {
      status: string;
      lastTested: string;
    };
    textOnly: {
      status: string;
      lastTested: string;
    };
    safeMode: {
      status: string;
      lastTested: string;
    };
  };
  transitionChecklist: Array<{
    item: string;
    complete: boolean;
  }>;
}

export const VictoryTracker = () => {
  const [status, setStatus] = useState<VictoryStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('red.600', 'red.300');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  
  useEffect(() => {
    // Simulate fetching victory status
    setTimeout(() => {
      setStatus({
        startTime: "2025-05-03T10:00:00Z",
        currentTime: new Date().toISOString(),
        targetCompletion: "2025-05-06T17:00:00Z",
        greenStreakHours: 6.9,
        requiredGreenHours: 12,
        overallProgress: 85,
        metrics: [
          {
            name: "Cognitive Load",
            baseline: 4.7,
            current: 2.8,
            target: 2.1,
            velocity: 0.3,
            velocityUnit: "per hour",
            eta: 24,
            history: Array(24).fill(0).map((_, i) => ({
              timestamp: new Date(Date.now() - (24-i) * 3600000).toISOString(),
              value: 4.7 - (i * 0.08)
            })),
            status: 'in_progress'
          },
          {
            name: "3G Success",
            baseline: 8,
            current: 75,
            target: 95,
            velocity: 1.2,
            velocityUnit: "per hour",
            eta: 36,
            history: Array(24).fill(0).map((_, i) => ({
              timestamp: new Date(Date.now() - (24-i) * 3600000).toISOString(),
              value: 8 + (i * 2.8)
            })),
            status: 'in_progress'
          },
          {
            name: "Silent Failures",
            baseline: 22,
            current: 9,
            target: 1,
            velocity: 0.4,
            velocityUnit: "per hour",
            eta: 12,
            history: Array(24).fill(0).map((_, i) => ({
              timestamp: new Date(Date.now() - (24-i) * 3600000).toISOString(),
              value: 22 - (i * 0.5)
            })),
            status: 'in_progress'
          },
          {
            name: "WCAG Issues",
            baseline: 34,
            current: 9,
            target: 0,
            velocity: 0.3,
            velocityUnit: "per hour",
            eta: 24,
            history: Array(24).fill(0).map((_, i) => ({
              timestamp: new Date(Date.now() - (24-i) * 3600000).toISOString(),
              value: 34 - (i * 1)
            })),
            status: 'in_progress'
          }
        ],
        nextMilestone: {
          name: "3G Victory",
          description: "95% success rate on 3G networks",
          eta: 36
        },
        contingency: {
          minimalUi: {
            status: "ARMED",
            lastTested: new Date(Date.now() - 3600000).toISOString()
          },
          textOnly: {
            status: "ACTIVE",
            lastTested: new Date(Date.now() - 1800000).toISOString()
          },
          safeMode: {
            status: "STANDBY",
            lastTested: new Date(Date.now() - 7200000).toISOString()
          }
        },
        transitionChecklist: [
          { item: "12h Green Stability Period", complete: false },
          { item: "Crisis Knowledge Base Archive", complete: true },
          { item: "Permanent Monitoring Adoption", complete: false },
          { item: "Resource Allocation Release", complete: false },
          { item: "Post-Mortem Automation", complete: false }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);
  
  if (loading) {
    return <Box p={5}>Loading victory tracker...</Box>;
  }
  
  if (error || !status) {
    return <Box p={5} color="red.500">Error loading victory tracker: {error}</Box>;
  }
  
  // Calculate time remaining
  const now = new Date();
  const targetCompletion = new Date(status.targetCompletion);
  const hoursRemaining = Math.max(0, (targetCompletion.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  return (
    <Box p={5} bg={bgColor} borderRadius="lg" boxShadow="lg">
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg" color={headingColor}>🏁 VICTORY TRACKER</Heading>
        <Badge colorScheme="red" p={2} fontSize="md">RED2025 COUNTDOWN</Badge>
      </Flex>
      
      <Flex justify="space-between" mb={6} align="center">
        <Stat>
          <StatLabel>Green Streak</StatLabel>
          <StatNumber>{status.greenStreakHours.toFixed(1)}h / {status.requiredGreenHours}h</StatNumber>
          <StatHelpText>For Phase 3 transition</StatHelpText>
        </Stat>
        
        <Stat>
          <StatLabel>Overall Progress</StatLabel>
          <StatNumber>{status.overallProgress}%</StatNumber>
          <Progress colorScheme="green" size="sm" value={status.overallProgress} w="100%" />
        </Stat>
        
        <Stat>
          <StatLabel>Time Remaining</StatLabel>
          <StatNumber>{hoursRemaining.toFixed(1)}h</StatNumber>
          <StatHelpText>Until target completion</StatHelpText>
        </Stat>
      </Flex>
      
      <Heading size="md" mb={3}>Real-Time Progress Snapshot</Heading>
      <Box overflowX="auto">
        <Box minW="750px">
          <Grid 
            templateColumns="1fr 1fr 1fr 1fr 1fr" 
            gap={2} 
            p={2} 
            bg="gray.100" 
            color="gray.800" 
            fontWeight="bold" 
            borderBottomWidth={2}
          >
            <Text>Metric</Text>
            <Text>Baseline</Text>
            <Text>Current</Text>
            <Text>Velocity</Text>
            <Text>ETA</Text>
          </Grid>
          
          {status.metrics.map(metric => (
            <Grid 
              key={metric.name} 
              templateColumns="1fr 1fr 1fr 1fr 1fr" 
              gap={2} 
              p={2} 
              borderBottomWidth={1} 
              borderBottomColor="gray.200"
              _hover={{ bg: "gray.50" }}
            >
              <Text fontWeight="bold">{metric.name}</Text>
              <Text>{metric.baseline}</Text>
              <Text>{metric.current}</Text>
              <Flex align="center">
                <StatArrow type={metric.name === '3G Success' ? 'increase' : 'decrease'} />
                <Text>{metric.velocity} {metric.velocityUnit}</Text>
              </Flex>
              <Text>{metric.eta}h</Text>
            </Grid>
          ))}
        </Box>
      </Box>
      
      <Divider my={6} />
      
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6} mb={6}>
        <Box>
          <Heading size="md" mb={3}>Contingency Verification Matrix</Heading>
          <Box>
            {Object.entries(status.contingency).map(([key, value], index) => {
              const modeName = key === 'minimalUi' ? 'Minimal UI' : 
                             key === 'textOnly' ? 'Text-Only' : 'Safe Mode';
              const colorScheme = value.status === 'ARMED' || value.status === 'ACTIVE' ? 'green' : 
                               value.status === 'STANDBY' ? 'yellow' : 'gray';
              
              return (
                <Flex key={key} justify="space-between" p={2} borderBottomWidth={1} borderBottomColor="gray.200">
                  <Text fontWeight="bold">{modeName}</Text>
                  <Badge colorScheme={colorScheme}>{value.status}</Badge>
                </Flex>
              );
            })}
          </Box>
        </Box>
        
        <Box>
          <Heading size="md" mb={3}>Victory Transition Checklist</Heading>
          <VStack align="stretch" spacing={2}>
            {status.transitionChecklist.map((item, index) => (
              <Flex key={index} p={2} borderBottomWidth={1} borderBottomColor="gray.200">
                <Box as="span" mr={2} color={item.complete ? "green.500" : "yellow.500"}>
                  {item.complete ? "✓" : "○"}
                </Box>
                <Text>{item.item}</Text>
              </Flex>
            ))}
          </VStack>
        </Box>
      </Grid>
      
      <Divider my={6} />
      
      <Flex direction="column" mb={4}>
        <Heading size="md" mb={3}>Next Milestone</Heading>
        <Box p={4} bg="yellow.50" borderRadius="md">
          <Heading size="sm" color="yellow.700">{status.nextMilestone.name}</Heading>
          <Text>{status.nextMilestone.description}</Text>
          <Text fontWeight="bold" mt={2}>ETA: {status.nextMilestone.eta}h</Text>
        </Box>
      </Flex>
      
      <Text fontSize="sm" color="gray.500" mt={4} textAlign="center">
        Auto-refreshing every 30s | RED2025 Protocol | Final Transition Expected: May 6 17:00 UTC
      </Text>
    </Box>
  );
};

export default VictoryTracker;
