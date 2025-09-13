import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import './RobotViewer.css';

// Simple primitive robot made of basic shapes
const SimpleRobot = ({ created = false }) => {
  const group = useRef();
  const head = useRef();
  const leftEye = useRef();
  const rightEye = useRef();
  const antenna = useRef();
  const antennaBall = useRef();
  
  const [headRotation, setHeadRotation] = useState(0);
  const [eyeIntensity, setEyeIntensity] = useState(1);
  const [antennaScale, setAntennaScale] = useState(1);
  
  // Materials
  const primaryMaterial = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color('#0078d7'),
    metalness: 0.3,
    roughness: 0.3
  });
  
  const secondaryMaterial = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color('#16b9ac'),
    metalness: 0.1,
    roughness: 0.2
  });
  
  const eyeMaterial = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color('#e62f4c'),
    emissive: new THREE.Color('#e62f4c'),
    emissiveIntensity: 2,
    metalness: 0,
    roughness: 0.2
  });
  
  const metalMaterial = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color('#c8c8d0'),
    metalness: 0.9,
    roughness: 0.1
  });
  
  // Animation
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Animate head rotation
    setHeadRotation(Math.sin(time * 0.5) * 0.2);
    
    // Animate eye glow
    setEyeIntensity(1 + Math.sin(time * 2) * 0.5);
    
    // Animate antenna ball
    setAntennaScale(1 + Math.sin(time * 3) * 0.2);
    
    // Apply animations
    if (head.current) {
      head.current.rotation.y = headRotation;
    }
    
    if (leftEye.current && rightEye.current) {
      leftEye.current.material.emissiveIntensity = eyeIntensity;
      rightEye.current.material.emissiveIntensity = eyeIntensity;
    }
    
    if (antennaBall.current) {
      antennaBall.current.scale.set(antennaScale, antennaScale, antennaScale);
    }
    
    // Rotate the whole robot slowly
    if (group.current) {
      group.current.rotation.y = time * 0.1;
    }
  });
  
  if (!created) {
    return (
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#333333" transparent opacity={0.5} />
      </mesh>
    );
  }
  
  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Head */}
      <group ref={head} position={[0, 1.5, 0]}>
        <mesh material={primaryMaterial}>
          <boxGeometry args={[0.8, 0.5, 0.7]} />
        </mesh>
        
        {/* Eyes */}
        <mesh ref={leftEye} position={[-0.25, 0, 0.36]} rotation={[Math.PI/2, 0, 0]} material={eyeMaterial}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
        </mesh>
        
        <mesh ref={rightEye} position={[0.25, 0, 0.36]} rotation={[Math.PI/2, 0, 0]} material={eyeMaterial}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
        </mesh>
        
        {/* Antenna */}
        <mesh ref={antenna} position={[0, 0.4, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
        </mesh>
        
        <mesh ref={antennaBall} position={[0, 0.6, 0]} material={eyeMaterial}>
          <sphereGeometry args={[0.06, 16, 16]} />
        </mesh>
      </group>
      
      {/* Body */}
      <mesh position={[0, 0.75, 0]} material={primaryMaterial}>
        <boxGeometry args={[0.7, 0.75, 0.5]} />
      </mesh>
      
      {/* Chest panel */}
      <mesh position={[0, 0.8, 0.3]} material={secondaryMaterial}>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
      </mesh>
      
      {/* Arms */}
      <group position={[-0.4, 0.9, 0]}>
        <mesh position={[0, 0, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 8]} rotation={[0, 0, Math.PI/2]} />
        </mesh>
        <mesh position={[-0.3, -0.2, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} rotation={[0, 0, Math.PI/4]} />
        </mesh>
        <mesh position={[-0.5, -0.4, 0]} material={secondaryMaterial}>
          <sphereGeometry args={[0.1, 16, 16]} />
        </mesh>
      </group>
      
      <group position={[0.4, 0.9, 0]}>
        <mesh position={[0, 0, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.08, 0.08, 0.4, 8]} rotation={[0, 0, Math.PI/2]} />
        </mesh>
        <mesh position={[0.3, -0.2, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} rotation={[0, 0, -Math.PI/4]} />
        </mesh>
        <mesh position={[0.5, -0.4, 0]} material={secondaryMaterial}>
          <sphereGeometry args={[0.1, 16, 16]} />
        </mesh>
      </group>
      
      {/* Legs */}
      <group position={[-0.2, 0, 0]}>
        <mesh position={[0, 0.1, 0]} material={primaryMaterial}>
          <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
        </mesh>
        <mesh position={[0, -0.4, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
        </mesh>
        <mesh position={[0, -0.7, 0.1]} material={secondaryMaterial}>
          <boxGeometry args={[0.2, 0.1, 0.3]} />
        </mesh>
      </group>
      
      <group position={[0.2, 0, 0]}>
        <mesh position={[0, 0.1, 0]} material={primaryMaterial}>
          <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
        </mesh>
        <mesh position={[0, -0.4, 0]} material={metalMaterial}>
          <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
        </mesh>
        <mesh position={[0, -0.7, 0.1]} material={secondaryMaterial}>
          <boxGeometry args={[0.2, 0.1, 0.3]} />
        </mesh>
      </group>
      
      {/* Ground shadow */}
      <mesh position={[0, -0.75, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.5, 32]} />
        <shadowMaterial transparent opacity={0.2} />
      </mesh>
    </group>
  );
};

const RobotViewer = ({ created }) => {
  return <SimpleRobot created={created} />;
};

export default RobotViewer;