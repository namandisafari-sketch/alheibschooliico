-- Reviews & ratings table for approvals
CREATE TABLE IF NOT EXISTS public.reviews_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewer_type TEXT DEFAULT 'staff',
    learner_id UUID REFERENCES public.learners(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    category TEXT,
    review_text TEXT,
    is_approved BOOLEAN,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reviews_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select reviews_ratings" ON public.reviews_ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public insert reviews_ratings" ON public.reviews_ratings FOR INSERT TO authenticated WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "Director manage reviews_ratings" ON public.reviews_ratings FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'muslim.ummahlink@gmail.com');
