export function FormFieldError({
  errors,
}: {
  errors?: string[] | undefined
}) {
  if (!errors?.length) return null
  return <p className="text-sm text-destructive">{errors[0]}</p>
}
