# 🚀 Flow Implementation Guide

## Overview

Este guia mostra como implementar e usar o sistema de fluxos centralizado em toda a aplicação AloClínica. O sistema fornece um controle centralizado de permissões, transições de estado e roteamento para todos os tipos de usuários.

## Architecture

```
┌─────────────────────────────────────────┐
│     User Interaction (Component)        │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│   useFlowState Hook (Validation Layer)  │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│  flow-orchestrator.ts (Logic Layer)     │
│  - Permissions                          │
│  - State Transitions                    │
│  - Route Access                         │
│  - Notifications                        │
└────────────────────┬────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────┐
│    AuthContext + Database               │
│    - User Role                          │
│    - Permissions                        │
│    - Service Type                       │
└─────────────────────────────────────────┘
```

## Quick Start

### 1. Use em um Componente

```tsx
import { useFlowState } from "@/hooks/useFlowState";

export function MyComponent() {
  const flow = useFlowState();

  // Verificar permissão
  if (!flow.checkPermission("view_appointments")) {
    return <AccessDenied />;
  }

  // Verificar acesso a rota
  if (!flow.canAccess("/dashboard/patient/health")) {
    return <RouteNotAllowed />;
  }

  // Transicionar estado
  const handleNext = async () => {
    const success = await flow.transitionTo("waiting_for_consultation");
    if (success) {
      console.log("Estado atualizado!");
    }
  };

  return (
    <div>
      <p>Próximos passos: {flow.getNextStates().join(", ")}</p>
      <button onClick={handleNext}>Próximo</button>
    </div>
  );
}
```

### 2. Guardar Operação

```tsx
import { useGuardedOperation } from "@/hooks/useFlowState";

export function BookAppointmentButton() {
  const guarded = useGuardedOperation("book_appointment", {
    requirePermissions: ["book_appointment"],
    requireState: ["ready_to_book", "browsing"],
  });

  if (!guarded.isAllowed) {
    if (guarded.requiresAuth) return <LoginRequired />;
    if (guarded.requiresApproval) return <PendingApproval />;
    return <OperationNotAllowed />;
  }

  return <button onClick={handleBook}>Agendar Consulta</button>;
}
```

### 3. Verificar Permissão Direta

```tsx
import { hasPermission } from "@/lib/flow-orchestrator";

export function AdminPanel({ role }) {
  if (!hasPermission(role, "manage_users")) {
    return <AccessDenied />;
  }

  return <div>Painel de Admin</div>;
}
```

## Core Functions

### flow-orchestrator.ts

#### `canTransition(role, fromState, toState): boolean`
Verifica se uma transição de estado é válida.

```tsx
if (canTransition("doctor", "ready_for_consultation", "online")) {
  // Transição permitida
}
```

#### `getAllowedNextStates(role, currentState): string[]`
Retorna todos os próximos estados permitidos.

```tsx
const nextStates = getAllowedNextStates("patient", "searching");
// ["selecting_doctor", "browsing"]
```

#### `hasPermission(role, permission): boolean`
Verifica se um usuário tem uma permissão específica.

```tsx
if (hasPermission("patient", "book_appointment")) {
  // Usuário pode agendar
}
```

#### `getPermissions(role): string[]`
Retorna todas as permissões de um usuário.

```tsx
const permissions = getPermissions("doctor");
// ["view_profile", "edit_profile", "configure_availability", ...]
```

#### `canAccessRoute(role, route): boolean`
Verifica se um usuário pode acessar uma rota.

```tsx
if (canAccessRoute("patient", "/dashboard/patient/health")) {
  // Pode acessar
}
```

#### `supportsService(role, service): boolean`
Verifica se um usuário pode usar um serviço específico.

```tsx
if (supportsService("patient", "telemedicina")) {
  // Paciente pode usar telemedicina
}
```

#### `shouldNotify(role, notificationType): boolean`
Verifica se uma notificação deve ser enviada.

```tsx
if (shouldNotify("doctor", "new_appointment")) {
  // Enviar notificação
}
```

## Hook: useFlowState

### Propriedades

```tsx
const flow = useFlowState();

// Estado
flow.currentState;          // Estado atual (string)
flow.isLoading;             // Carregando perfil? (boolean)
flow.userRole;              // Role do usuário (UserRole)
flow.serviceType;           // Tipo de serviço (ServiceType)
flow.isAuthenticated;       // Autenticado? (boolean)
flow.isApproved;            // Aprovado? (boolean)
flow.isActive;              // Ativo? (boolean)
```

### Métodos

```tsx
// State Transitions
await flow.transitionTo("next_state");    // Transicionar de estado
flow.getNextStates();                     // Get allowed next states

// Permissions & Access
flow.checkPermission("permission_name");  // Verificar permissão
flow.canAccess("/route");                 // Verificar acesso a rota
flow.supportsCurrentService();            // Suporta serviço atual?
flow.shouldSendNotification("type");      // Enviar notificação?

// Guard
flow.guard("operation", {
  requireService: "telemedicina",
  requirePermissions: ["book_appointment"],
  requireState: ["ready_to_book"],
});

// Manual State Management
flow.setCurrentState("new_state");
```

## Real-World Examples

### 1. Fluxo de Agendamento de Consulta

```tsx
import { useFlowState } from "@/hooks/useFlowState";

export function AppointmentFlow() {
  const flow = useFlowState();
  const navigate = useNavigate();

  // Verificar se está em estado correto
  useEffect(() => {
    if (flow.currentState === "profile_incomplete") {
      navigate("/onboarding");
    }
  }, [flow.currentState]);

  const handleSearch = async () => {
    // Guardar operação
    if (!flow.guard("search_doctors", {
      requirePermissions: ["search_doctors"],
      requireState: ["ready_to_book", "browsing"],
    })) {
      return;
    }

    // Transicionar
    await flow.transitionTo("searching");
  };

  const handleSelectDoctor = async () => {
    if (!flow.guard("select_doctor", {
      requireState: ["searching"],
    })) {
      return;
    }

    await flow.transitionTo("selecting_doctor");
  };

  const handleBooking = async () => {
    if (!flow.checkPermission("book_appointment")) {
      return;
    }

    // Agendar...
    await flow.transitionTo("booking");
    await flow.transitionTo("payment");
  };

  return (
    <div>
      <h2>Status: {flow.currentState}</h2>
      <p>Próximos passos: {flow.getNextStates().join(", ")}</p>
      
      <button onClick={handleSearch}>Buscar Médicos</button>
      <button onClick={handleSelectDoctor}>Selecionar Médico</button>
      <button onClick={handleBooking}>Agendar</button>
    </div>
  );
}
```

### 2. Proteção de Rota

```tsx
import { useFlowState } from "@/hooks/useFlowState";

export function ProtectedRoute({ children, requiredRole, requiredRoute }) {
  const flow = useFlowState();

  if (flow.isLoading) {
    return <LoadingSpinner />;
  }

  if (!flow.isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  if (requiredRole && flow.userRole !== requiredRole) {
    return <AccessDenied />;
  }

  if (requiredRoute && !flow.canAccess(requiredRoute)) {
    return <AccessDenied />;
  }

  if (!flow.isApproved) {
    return <PendingApproval />;
  }

  if (!flow.isActive) {
    return <AccountInactive />;
  }

  return children;
}

// Uso
<ProtectedRoute requiredRole="doctor" requiredRoute="/dashboard/doctor">
  <DoctorDashboard />
</ProtectedRoute>
```

### 3. Notificações Inteligentes

```tsx
import { useFlowState } from "@/hooks/useFlowState";
import { useEffect } from "react";

export function NotificationManager() {
  const flow = useFlowState();

  useEffect(() => {
    // Inscrever-se em eventos
    const unsubscribe = subscribeToEvents((event) => {
      // Verificar se deve enviar notificação baseado no role
      if (flow.shouldSendNotification(event.type)) {
        sendNotification(event);
      }
    });

    return unsubscribe;
  }, [flow]);

  return null;
}
```

### 4. Painel Admin com Controle de Permissões

```tsx
import { getPermissions, canAccessRoute } from "@/lib/flow-orchestrator";

export function AdminPanel() {
  const flow = useFlowState();

  const userPermissions = getPermissions(flow.userRole);
  const accessibleRoutes = [
    "/dashboard/admin",
    "/dashboard/admin/users",
    "/dashboard/admin/financial",
  ].filter(route => flow.canAccess(route));

  return (
    <div>
      <h1>Painel Admin</h1>
      
      <section>
        <h2>Suas Permissões</h2>
        <ul>
          {userPermissions.map(perm => (
            <li key={perm}>{perm}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Rotas Acessíveis</h2>
        <ul>
          {accessibleRoutes.map(route => (
            <li key={route}>
              <Link to={route}>{route}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

## Integration Patterns

### 1. Com Componentes Existentes

```tsx
// Antes (sem proteção)
export function BookAppointmentForm() {
  const handleSubmit = async () => {
    await api.bookAppointment(data);
  };
  return <form onSubmit={handleSubmit}>...</form>;
}

// Depois (com proteção)
export function BookAppointmentForm() {
  const flow = useFlowState();

  const handleSubmit = async () => {
    if (!flow.guard("book_appointment", {
      requirePermissions: ["book_appointment"],
      requireState: ["ready_to_book"],
    })) {
      return;
    }

    await api.bookAppointment(data);
    await flow.transitionTo("booking");
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 2. Com Roteamento

```tsx
// routes.tsx
import { canAccessRoute } from "@/lib/flow-orchestrator";

const routes = [
  {
    path: "/dashboard/patient",
    element: <PatientDashboard />,
    requiredRole: "patient",
  },
  {
    path: "/dashboard/doctor",
    element: <DoctorDashboard />,
    requiredRole: "doctor",
  },
  // ...
];

export function ProtectedRoutes() {
  const flow = useFlowState();

  return (
    <Routes>
      {routes.map(route => (
        <Route
          key={route.path}
          path={route.path}
          element={
            flow.canAccess(route.path) && flow.userRole === route.requiredRole ? (
              route.element
            ) : (
              <AccessDenied />
            )
          }
        />
      ))}
    </Routes>
  );
}
```

## Testing

```tsx
import { render, screen } from "@testing-library/react";
import { hasPermission, canTransition, canAccessRoute } from "@/lib/flow-orchestrator";

describe("Flow Orchestrator", () => {
  it("should allow patient to book appointment", () => {
    expect(hasPermission("patient", "book_appointment")).toBe(true);
  });

  it("should not allow patient to manage users", () => {
    expect(hasPermission("patient", "manage_users")).toBe(false);
  });

  it("should allow transition from searching to selecting", () => {
    expect(canTransition("patient", "searching", "selecting_doctor")).toBe(true);
  });

  it("should allow patient to access /dashboard/patient", () => {
    expect(canAccessRoute("patient", "/dashboard/patient")).toBe(true);
  });

  it("should not allow doctor to access /dashboard/admin", () => {
    expect(canAccessRoute("doctor", "/dashboard/admin")).toBe(false);
  });
});
```

## Extending the System

### Adicionar Nova Role

```tsx
// 1. Update UserRole type
export type UserRole = "patient" | "doctor" | ... | "new_role";

// 2. Add to FLOW_TRANSITIONS
const FLOW_TRANSITIONS: Record<UserRole, Record<string, string[]>> = {
  // ...
  new_role: {
    initial_state: ["next_state"],
    next_state: ["final_state"],
  },
};

// 3. Add to ROLE_PERMISSIONS
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  // ...
  new_role: ["permission1", "permission2"],
};

// 4. Add to ROLE_ROUTES
const ROLE_ROUTES: Record<UserRole, string[]> = {
  // ...
  new_role: ["/dashboard/new-role", "/dashboard/new-role/section"],
};

// 5. Add to SERVICE_REQUIREMENTS
const SERVICE_REQUIREMENTS: Record<UserRole, ServiceType[]> = {
  // ...
  new_role: ["telemedicina"],
};

// 6. Add to NOTIFICATION_RULES
const NOTIFICATION_RULES: Record<UserRole, Record<string, boolean>> = {
  // ...
  new_role: {
    some_event: true,
    other_event: false,
  },
};
```

### Adicionar Nova Permissão

```tsx
// 1. Use em ROLE_PERMISSIONS
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["manage_users", "new_permission"],
  // ...
};

// 2. Check em componentes
if (flow.checkPermission("new_permission")) {
  // Permitido
}
```

## Best Practices

✅ **DO**
- Sempre usar `useFlowState` em componentes que precisam de validação
- Guardar operações críticas com `.guard()`
- Verificar permissões antes de renderizar componentes sensíveis
- Transicionar estado após operações bem-sucedidas
- Usar tipos corretos (UserRole, ServiceType)

❌ **DON'T**
- Confiar apenas em UI para proteção
- Guardar estado em localStorage (use o hook)
- Fazer chamadas API sem verificar permissão
- Ignorar erros de transição
- Adicionar permissões ao frontend sem backend

## Troubleshooting

### "Transição de estado inválida"
Verifique em `FLOW_TRANSITIONS` se a transição de/para está definida.

### "Permissão negada"
Verifique em `ROLE_PERMISSIONS` se a permissão está listada.

### "Acesso a rota negado"
Verifique em `ROLE_ROUTES` se a rota está listada para o role.

### Teste com mock
```tsx
jest.mock("@/hooks/useFlowState", () => ({
  useFlowState: () => ({
    currentState: "ready_to_book",
    userRole: "patient",
    checkPermission: jest.fn(() => true),
    canAccess: jest.fn(() => true),
    transitionTo: jest.fn(() => Promise.resolve(true)),
  }),
}));
```
