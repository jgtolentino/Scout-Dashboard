// Keyboard accessibility helper utilities

import React from 'react';

/**
 * Handles keyboard interactions for elements that should act like buttons
 * @param onClick The click handler function
 * @returns KeyboardEvent handler
 */
export function useKeyboardAction(
  onClick: (event: React.MouseEvent | React.KeyboardEvent) => void
) {
  return (event: React.KeyboardEvent) => {
    // Execute the callback on Enter or Space key
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event);
    }
  };
}

/**
 * Adds ARIA attributes for various interactive elements
 */
export const ariaAttributes = {
  // For buttons
  button: {
    role: 'button',
    tabIndex: 0,
  },
  
  // For toggle buttons
  toggleButton: (pressed: boolean) => ({
    role: 'button',
    'aria-pressed': pressed,
    tabIndex: 0,
  }),
  
  // For expandable sections
  expandable: (expanded: boolean) => ({
    'aria-expanded': expanded,
    tabIndex: 0,
  }),
  
  // For tabs
  tabPanel: (id: string, selected: boolean) => ({
    role: 'tabpanel',
    id: `panel-${id}`,
    'aria-labelledby': `tab-${id}`,
    tabIndex: 0,
    hidden: !selected,
  }),
  
  // For tab triggers
  tab: (id: string, selected: boolean) => ({
    role: 'tab',
    id: `tab-${id}`,
    'aria-controls': `panel-${id}`,
    'aria-selected': selected,
    tabIndex: selected ? 0 : -1,
  }),
  
  // For lists of tabs
  tabList: {
    role: 'tablist',
  },
  
  // For modal dialogs
  dialog: (id: string) => ({
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': `dialog-title-${id}`,
    'aria-describedby': `dialog-desc-${id}`,
  }),
  
  // For modal dialog titles
  dialogTitle: (id: string) => ({
    id: `dialog-title-${id}`,
  }),
  
  // For modal dialog descriptions
  dialogDesc: (id: string) => ({
    id: `dialog-desc-${id}`,
  }),
};

/**
 * Hook to add keyboard navigation to a collection of items
 * @param itemCount Total number of items
 * @param selectedIndex Current selected index
 * @param onChange Function to call when selection changes
 * @param options Configuration options
 * @returns KeyboardEvent handler
 */
export function useKeyboardNavigation(
  itemCount: number,
  selectedIndex: number,
  onChange: (index: number) => void,
  options?: {
    horizontal?: boolean;
    vertical?: boolean;
    loop?: boolean;
  }
) {
  const { 
    horizontal = true, 
    vertical = true, 
    loop = true 
  } = options || {};
  
  return (event: React.KeyboardEvent) => {
    let newIndex = selectedIndex;
    
    if (horizontal) {
      // Left/Right navigation
      if (event.key === 'ArrowRight') {
        newIndex = loop 
          ? (selectedIndex + 1) % itemCount 
          : Math.min(selectedIndex + 1, itemCount - 1);
        event.preventDefault();
      } else if (event.key === 'ArrowLeft') {
        newIndex = loop 
          ? (selectedIndex - 1 + itemCount) % itemCount 
          : Math.max(selectedIndex - 1, 0);
        event.preventDefault();
      }
    }
    
    if (vertical) {
      // Up/Down navigation
      if (event.key === 'ArrowDown') {
        newIndex = loop 
          ? (selectedIndex + 1) % itemCount 
          : Math.min(selectedIndex + 1, itemCount - 1);
        event.preventDefault();
      } else if (event.key === 'ArrowUp') {
        newIndex = loop 
          ? (selectedIndex - 1 + itemCount) % itemCount 
          : Math.max(selectedIndex - 1, 0);
        event.preventDefault();
      }
    }
    
    // Home/End keys
    if (event.key === 'Home') {
      newIndex = 0;
      event.preventDefault();
    } else if (event.key === 'End') {
      newIndex = itemCount - 1;
      event.preventDefault();
    }
    
    // Only trigger if the index has changed
    if (newIndex !== selectedIndex) {
      onChange(newIndex);
    }
  };
}