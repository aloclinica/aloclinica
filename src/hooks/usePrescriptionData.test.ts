import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePrescriptionData } from './usePrescriptionData';
import * as supabase from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('usePrescriptionData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty data', () => {
    const { result } = renderHook(() => usePrescriptionData('test-appt-id'));

    expect(result.current.data).toBeDefined();
    expect(result.current.data.medications).toEqual([]);
    expect(result.current.data.diagnosis).toBe('');
    expect(result.current.errors).toEqual([]);
  });

  it('should add medication', () => {
    const { result } = renderHook(() => usePrescriptionData('test-appt-id'));

    act(() => {
      result.current.addMedication();
    });

    expect(result.current.data.medications).toHaveLength(1);
  });

  it('should remove medication', () => {
    const { result } = renderHook(() => usePrescriptionData('test-appt-id'));

    act(() => {
      result.current.addMedication();
      result.current.addMedication();
    });

    expect(result.current.data.medications).toHaveLength(2);

    act(() => {
      result.current.removeMedication(0);
    });

    expect(result.current.data.medications).toHaveLength(1);
  });

  it('should update medication', () => {
    const { result } = renderHook(() => usePrescriptionData('test-appt-id'));

    act(() => {
      result.current.addMedication();
    });

    const updatedMed = {
      name: 'Amoxicilina',
      dosage: '500mg',
      frequency: '8 em 8 horas',
      duration: '7 dias',
      instructions: 'Tomar com água',
    };

    act(() => {
      result.current.updateMedication(0, updatedMed);
    });

    expect(result.current.data.medications[0]).toEqual(updatedMed);
  });

  it('should update diagnosis field', () => {
    const { result } = renderHook(() => usePrescriptionData('test-appt-id'));

    const diagnosis = 'Infecção respiratória aguda';

    act(() => {
      result.current.updateField('diagnosis', diagnosis);
    });

    expect(result.current.data.diagnosis).toBe(diagnosis);
  });

  it('should validate medications', () => {
    const { result } = renderHook(() => usePrescriptionData('test-appt-id'));

    act(() => {
      result.current.addMedication();
    });

    // Empty medication should fail validation
    const isValid = result.current.validate();
    expect(isValid).toBe(false);
    expect(result.current.errors.length).toBeGreaterThan(0);
  });

  it('should pass validation with valid medications', () => {
    const { result } = renderHook(() => usePrescriptionData('test-appt-id'));

    act(() => {
      result.current.addMedication();
      result.current.updateMedication(0, {
        name: 'Amoxicilina',
        dosage: '500mg',
        frequency: '8 em 8 horas',
        duration: '7 dias',
        instructions: 'Tomar com água',
      });
    });

    const isValid = result.current.validate();
    expect(isValid).toBe(true);
    expect(result.current.errors.length).toBe(0);
  });

  it('should filter valid medications', () => {
    const { result } = renderHook(() => usePrescriptionData('test-appt-id'));

    act(() => {
      result.current.addMedication();
      result.current.addMedication();
      result.current.updateMedication(0, {
        name: 'Amoxicilina',
        dosage: '500mg',
        frequency: '8 em 8 horas',
        duration: '7 dias',
        instructions: '',
      });
    });

    expect(result.current.validMedications).toHaveLength(1);
    expect(result.current.validMedications[0].name).toBe('Amoxicilina');
  });
});
