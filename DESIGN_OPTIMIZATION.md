# 🎨 Design & Performance Optimization Guide

## Design System Improvements (Aplicados)

### ✅ Implemented
1. **OftalmologistDashboard**
   - Gradient background
   - Animated stat cards (framer-motion)
   - Responsive grid (1 → 2 → 3 cols)
   - Hover effects & transitions
   - Icons com cor (blue, green, purple)
   - Loading spinner customizado
   - Empty states com emoji + cor

2. **BookOftalmologyAppointment**
   - Gradient header cards
   - Back button com transition
   - Animated form cards
   - Color-coded sections (blue, purple, green)
   - Responsive button layout
   - Better spacing & typography

### 📋 To Apply to Other Pages

```tsx
// Use este padrão em todas as páginas

import { motion } from "framer-motion";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Título</h1>
          <p className="text-gray-600 mt-2">Descrição</p>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Cards with hover effects */}
          <Card className="hover:shadow-md transition-shadow border-0">
            {/* ... */}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
```

## Color Palette

```
Primary:    Blue (#3B82F6, #1E40AF)
Secondary:  Purple (#A855F7, #6D28D9)
Success:    Green (#10B981, #047857)
Warning:    Amber (#F59E0B, #D97706)
Danger:     Red (#EF4444, #B91C1C)
Neutral:    Gray (#6B7280 → #111827)
```

## Performance Optimizations

### 1. Code Splitting (Already in App.tsx)
```tsx
const Page = lazy(() => import('./pages/Page'));

// ✅ Já implementado em App.tsx
// Cada página lazy-loaded = chunks menores
```

### 2. Image Optimization
```tsx
// ❌ Evitar
<img src="large.jpg" />

// ✅ Fazer
<img 
  src="optimized.webp" 
  alt="description"
  loading="lazy"
  sizes="(max-width: 640px) 100vw, 50vw"
/>
```

### 3. Bundle Size Reduction
```bash
# Analisar bundle
npm run build
npm install -D @next/bundle-analyzer
npx next-bundle-analyzer

# Remover dependências não usadas
npm prune
npm audit
```

### 4. React Query/Tanstack Optimization
```tsx
// ✅ Já configurado em App.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 min
      gcTime: 10 * 60 * 1000,          // 10 min
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});
```

### 5. Animation Performance
```tsx
// ✅ Use Framer Motion com GPU acceleration
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
  style={{ willChange: 'transform, opacity' }}
>
```

### 6. Memoization
```tsx
import { memo, useMemo, useCallback } from 'react';

// Memoize componentes pesados
const HeavyComponent = memo(({ data }: Props) => {
  return <div>{data}</div>;
});

// Memoize callbacks
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);

// Memoize computações
const value = useMemo(() => {
  return expensive(data);
}, [data]);
```

### 7. Lighthouse Optimization

**Target Scores:**
- Performance: 85+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 95+

**Key Metrics:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### 8. Network Optimization
```tsx
// Prefetch críticas
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    import('./pages/Critical');
  });
}

// Cache headers
// Set via Vercel.json ou nginx
```

## Responsive Design Checklist

- [ ] Mobile first (sm: 640px)
- [ ] Tablet (md: 768px, lg: 1024px)
- [ ] Desktop (xl: 1280px, 2xl: 1536px)
- [ ] Touch targets min 48px (mobile)
- [ ] Font sizes responsive (text-sm → text-lg)
- [ ] Grid columns responsive (1 → 2 → 3 → 4)
- [ ] Padding/gaps responsive (p-4 → p-8)

## Typography Hierarchy

```tsx
<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
<h2 className="text-2xl sm:text-3xl font-bold">
<h3 className="text-xl sm:text-2xl font-semibold">
<p className="text-base sm:text-lg text-gray-600">
```

## Component Best Practices

### Loading State
```tsx
{loading ? (
  <div className="flex justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
  </div>
) : (
  // content
)}
```

### Empty State
```tsx
<Card className="border-dashed border-2 bg-blue-50 border-blue-200">
  <CardContent className="pt-6 text-center">
    <Icon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
    <p className="text-blue-700 font-medium">Nenhum item</p>
    <p className="text-sm text-blue-600">Descrição</p>
  </CardContent>
</Card>
```

### Card with Hover
```tsx
<Card className="hover:shadow-md transition-shadow hover:border-blue-300 group">
  <CardContent className="p-4">
    <h3 className="group-hover:text-blue-600 transition-colors">Title</h3>
  </CardContent>
</Card>
```

## Accessibility Improvements

```tsx
// Semantic HTML
<button aria-label="Close">X</button>
<img alt="description" />

// Focus visible
<input className="focus:ring-2 focus:ring-blue-500" />

// ARIA labels
<div role="status" aria-live="polite">Loading...</div>

// Keyboard navigation
onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
```

## Testing Performance

```bash
# Lighthouse
npm run lighthouse

# WebPageTest
# https://www.webpagetest.org

# Bundle analyzer
npm run analyze

# Performance monitoring
npm install @sentry/react

# Monitor em produção
// Setup Sentry para rastrear erros
```

## Deployment Checklist

- [ ] `npm run build` sem warnings
- [ ] `npm run lint` passa
- [ ] Lighthouse score 85+
- [ ] No console errors
- [ ] Responsive em mobile/tablet/desktop
- [ ] Animações fluidas (60fps)
- [ ] Sem memory leaks (DevTools)

---

**Last Updated:** 2026-04-13

Aplicar este guia em todas as páginas para design consistente e performance otimizada.
