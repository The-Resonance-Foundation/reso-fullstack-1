-- Parents may only insert students for chapters where they hold student_parent role.

DROP POLICY IF EXISTS students_insert_parent ON public.students;

CREATE POLICY students_insert_parent
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      parent_user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'student_parent'
          AND ur.status = 'active'
          AND ur.chapter_id = chapter_id
      )
    )
    OR public.is_board(auth.uid())
    OR public.can_manage_chapter(auth.uid(), chapter_id)
  );
