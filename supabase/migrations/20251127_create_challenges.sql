-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  goal_seconds integer NOT NULL,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT challenges_pkey PRIMARY KEY (id)
);

-- Create challenge_participants table
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  progress_seconds integer NOT NULL DEFAULT 0,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT challenge_participants_pkey PRIMARY KEY (challenge_id, user_id)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Policies for challenges
DROP POLICY IF EXISTS "Users can view challenges they are participating in" ON public.challenges;
CREATE POLICY "Users can view challenges they are participating in" ON public.challenges
  FOR SELECT USING (
    auth.uid() = creator_id OR 
    EXISTS (
      SELECT 1 FROM public.challenge_participants 
      WHERE challenge_id = challenges.id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create challenges" ON public.challenges;
CREATE POLICY "Users can create challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Policies for participants
DROP POLICY IF EXISTS "Users can view participants of challenges they are in" ON public.challenge_participants;
CREATE POLICY "Users can view participants of challenges they are in" ON public.challenge_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.challenge_id = challenge_participants.challenge_id AND cp.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_participants.challenge_id AND c.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join challenges or creators can add" ON public.challenge_participants;
CREATE POLICY "Users can join challenges or creators can add" ON public.challenge_participants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id AND c.creator_id = auth.uid()
    )
  );

-- Trigger to update progress automatically when a study session is logged
CREATE OR REPLACE FUNCTION public.update_challenge_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update progress for all challenges the user is part of, 
  -- where the session falls within the challenge dates
  UPDATE public.challenge_participants cp
  SET progress_seconds = cp.progress_seconds + NEW.duration
  FROM public.challenges c
  WHERE cp.challenge_id = c.id
    AND cp.user_id = NEW.user_id
    AND NEW.created_at >= c.start_date 
    AND NEW.created_at <= c.end_date;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_challenge_progress_trigger ON public.study_sessions;
CREATE TRIGGER update_challenge_progress_trigger
AFTER INSERT ON public.study_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_challenge_progress();
