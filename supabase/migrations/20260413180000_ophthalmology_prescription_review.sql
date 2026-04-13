-- Add review workflow to prescriptions
ALTER TABLE public.ophthalmology_prescriptions
ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX idx_ophthalmology_prescriptions_review_status
ON public.ophthalmology_prescriptions(review_status, prescribed_at DESC);
