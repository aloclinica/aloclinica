import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSOAPNotes } from './useSOAPNotes';
import * as supabase from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('useSOAPNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty SOAP notes', () => {
    const { result } = renderHook(() => useSOAPNotes('test-appt-id', true));

    expect(result.current.notes).toBeDefined();
    expect(result.current.notes.subjective).toBe('');
    expect(result.current.notes.objective).toBe('');
    expect(result.current.notes.assessment).toBe('');
    expect(result.current.notes.plan).toBe('');
  });

  it('should set initial active section to subjective', () => {
    const { result } = renderHook(() => useSOAPNotes('test-appt-id', true));

    expect(result.current.activeSection).toBe('subjective');
  });

  it('should update a single section', () => {
    const { result } = renderHook(() => useSOAPNotes('test-appt-id', true));

    const text = 'Patient reports fever and cough';

    act(() => {
      result.current.updateSection('subjective', text);
    });

    expect(result.current.notes.subjective).toBe(text);
  });

  it('should track dirty state after updating', () => {
    const { result } = renderHook(() => useSOAPNotes('test-appt-id', true));

    expect(result.current.isDirty).toBe(false);

    act(() => {
      result.current.updateSection('subjective', 'Test text');
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('should not allow editing when not a doctor', () => {
    const { result } = renderHook(() => useSOAPNotes('test-appt-id', false));

    expect(result.current.canEdit).toBe(false);
  });

  it('should allow editing when is a doctor', () => {
    const { result } = renderHook(() => useSOAPNotes('test-appt-id', true));

    expect(result.current.canEdit).toBe(true);
  });

  it('should export notes as JSON', () => {
    const { result } = renderHook(() => useSOAPNotes('test-appt-id', true));

    act(() => {
      result.current.updateSection('subjective', 'Test subjective');
      result.current.updateSection('objective', 'Test objective');
    });

    const json = result.current.exportJSON();
    const parsed = JSON.parse(json);

    expect(parsed.subjective).toBe('Test subjective');
    expect(parsed.objective).toBe('Test objective');
  });

  it('should format notes for PDF', () => {
    const { result } = renderHook(() => useSOAPNotes('test-appt-id', true));

    act(() => {
      result.current.updateSection('subjective', 'S: Fever and cough');
      result.current.updateSection('objective', 'O: Temp 38.5C');
      result.current.updateSection('assessment', 'A: Viral infection');
      result.current.updateSection('plan', 'P: Rest and fluids');
    });

    const formatted = result.current.formatForPDF();

    expect(formatted).toContain('Subjective');
    expect(formatted).toContain('Fever and cough');
    expect(formatted).toContain('Objective');
    expect(formatted).toContain('Temp 38.5C');
  });

  it('should update all sections at once', () => {
    const { result } = renderHook(() => useSOAPNotes('test-appt-id', true));

    const updates = {
      subjective: 'New subjective',
      objective: 'New objective',
    };

    act(() => {
      result.current.updateAllSections(updates);
    });

    expect(result.current.notes.subjective).toBe('New subjective');
    expect(result.current.notes.objective).toBe('New objective');
    expect(result.current.notes.assessment).toBe('');
  });
});
