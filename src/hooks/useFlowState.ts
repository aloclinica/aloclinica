import { useCallback, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  canTransition,
  getAllowedNextStates,
  hasPermission,
  canAccessRoute,
  supportsService,
  shouldNotify,
  type UserRole,
  type ServiceType,
} from "@/lib/flow-orchestrator";
import { logError } from "@/lib/logger";

export interface FlowStateHookOptions {
  onTransitionError?: (fromState: string, toState: string) => void;
  onPermissionDenied?: (permission: string) => void;
}

/**
 * Hook for managing user flow state and permissions
 * Provides utilities to check state transitions, permissions, and route access
 */
export function useFlowState(options: FlowStateHookOptions = {}) {
  const { profile, user } = useAuth();
  const [currentState, setCurrentState] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Determine user role from profile/auth
  const userRole = ((profile as any)?.role ?? "patient") as UserRole;
  const serviceType = ((profile as any)?.service_type ?? "telemedicina") as ServiceType;

  useEffect(() => {
    setIsLoading(false);
  }, [profile]);

  /**
   * Attempt to transition from one state to another
   * Returns true if transition was successful
   */
  const transitionTo = useCallback(
    async (targetState: string): Promise<boolean> => {
      if (!canTransition(userRole, currentState, targetState)) {
        logError(
          `Invalid state transition`,
          new Error(`Cannot transition from ${currentState} to ${targetState}`),
          { role: userRole, currentState, targetState },
          false
        );
        options.onTransitionError?.(currentState, targetState);
        return false;
      }

      setCurrentState(targetState);
      return true;
    },
    [userRole, currentState, options]
  );

  /**
   * Get all allowed next states
   */
  const getNextStates = useCallback((): string[] => {
    return getAllowedNextStates(userRole, currentState);
  }, [userRole, currentState]);

  /**
   * Check if user has a specific permission
   */
  const checkPermission = useCallback(
    (permission: string): boolean => {
      const has = hasPermission(userRole, permission);
      if (!has) {
        logError(
          `Permission denied`,
          new Error(`User lacks permission: ${permission}`),
          { role: userRole, permission },
          false
        );
        options.onPermissionDenied?.(permission);
      }
      return has;
    },
    [userRole, options]
  );

  /**
   * Check if user can access a specific route
   */
  const canAccess = useCallback(
    (route: string): boolean => {
      return canAccessRoute(userRole, route);
    },
    [userRole]
  );

  /**
   * Check if user's service type is valid
   */
  const supportsCurrentService = useCallback((): boolean => {
    return supportsService(userRole, serviceType);
  }, [userRole, serviceType]);

  /**
   * Check if a notification should be sent
   */
  const shouldSendNotification = useCallback(
    (notificationType: string): boolean => {
      return shouldNotify(userRole, notificationType);
    },
    [userRole]
  );

  /**
   * Guard function for protected operations
   * Returns true if operation is allowed
   */
  const guard = useCallback(
    (
      operation: string,
      options?: {
        requireService?: ServiceType;
        requirePermissions?: string[];
        requireState?: string[];
      }
    ): boolean => {
      // Check service type
      if (options?.requireService && !supportsService(userRole, options.requireService)) {
        logError(
          `Service not supported`,
          new Error(`${userRole} does not support ${options.requireService}`),
          { role: userRole, service: options.requireService },
          false
        );
        return false;
      }

      // Check permissions
      if (options?.requirePermissions) {
        for (const permission of options.requirePermissions) {
          if (!hasPermission(userRole, permission)) {
            logError(
              `Permission denied for operation`,
              new Error(`Operation '${operation}' requires permission: ${permission}`),
              { role: userRole, operation, permission },
              false
            );
            (options as any).onPermissionDenied?.(permission);
            return false;
          }
        }
      }

      // Check state
      if (options?.requireState && !options.requireState.includes(currentState)) {
        logError(
          `Invalid state for operation`,
          new Error(
            `Operation '${operation}' requires one of states: ${options.requireState.join(", ")}`
          ),
          { role: userRole, operation, currentState, requiredStates: options.requireState },
          false
        );
        return false;
      }

      return true;
    },
    [userRole, serviceType, currentState, options]
  );

  return {
    // State
    currentState,
    setCurrentState,
    isLoading,
    userRole,
    serviceType,

    // State transitions
    transitionTo,
    getNextStates,

    // Permissions & Access
    checkPermission,
    canAccess,
    supportsCurrentService,
    shouldSendNotification,

    // Guard
    guard,

    // Utils
    isAuthenticated: !!user,
    isApproved: (profile as any)?.is_approved ?? false,
    isActive: (profile as any)?.is_active ?? false,
  };
}

/**
 * Hook to guard a specific operation
 */
export function useGuardedOperation(
  operation: string,
  requirements?: {
    requireService?: ServiceType;
    requirePermissions?: string[];
    requireState?: string[];
  }
) {
  const flow = useFlowState();

  const isAllowed = flow.guard(operation, requirements);

  return {
    isAllowed,
    requiresAuth: !flow.isAuthenticated,
    requiresApproval: !flow.isApproved,
    requiresService: requirements?.requireService
      ? !flow.supportsCurrentService()
      : false,
    flow,
  };
}

export default useFlowState;
