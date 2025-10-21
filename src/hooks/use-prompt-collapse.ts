import { useState, useCallback } from 'react';

interface UsePromptCollapseReturn {
  isExpanded: boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
}

/**
 * Hook personalizado para manejar el estado de colapso del prompt
 */
export const usePromptCollapse = (initialExpanded = false): UsePromptCollapseReturn => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  return {
    isExpanded,
    toggle,
    expand,
    collapse,
  };
};