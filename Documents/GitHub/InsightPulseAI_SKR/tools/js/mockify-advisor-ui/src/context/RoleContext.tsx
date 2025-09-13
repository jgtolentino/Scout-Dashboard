import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the available roles
export type UserRole = 'client' | 'internal';

// Define the context shape
interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isInternalView: boolean;
  isClientView: boolean;
}

// Create the context with default values
const RoleContext = createContext<RoleContextType>({
  role: 'client',
  setRole: () => {},
  isInternalView: false,
  isClientView: true
});

// Hook for using the role context
export const useRole = () => useContext(RoleContext);

// Provider component
interface RoleProviderProps {
  children: ReactNode;
  initialRole?: UserRole;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({
  children,
  initialRole = 'client'
}) => {
  // Initialize state from localStorage if available
  const [role, setRoleState] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole && (savedRole === 'client' || savedRole === 'internal')) {
      return savedRole as UserRole;
    }
    return initialRole;
  });
  
  // Computed properties for convenience
  const isInternalView = role === 'internal';
  const isClientView = role === 'client';
  
  // Function to set the role and persist to localStorage
  const setRole = (newRole: UserRole) => {
    localStorage.setItem('userRole', newRole);
    setRoleState(newRole);
  };
  
  // Provide context value
  const contextValue: RoleContextType = {
    role,
    setRole,
    isInternalView,
    isClientView
  };
  
  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  );
};

export default RoleContext;