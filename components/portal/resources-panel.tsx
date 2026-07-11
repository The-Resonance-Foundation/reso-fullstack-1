"use client"

import { useState } from "react"
import { useActionState } from "react"
import { toast } from "sonner"
import {
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Link2,
  Music,
  Plus,
  Trash2,
  Video,
} from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { addResource, deleteResource } from "@/app/actions/resources"
import { FormFieldError } from "@/components/forms/form-field-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { DataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EmptyState } from "@/components/ui/empty-state"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { timeAgo } from "@/lib/utils"
import type { ResourceFormState } from "@/lib/validations/phase23"
import type { Chapter, Resource, Student } from "@/types/database"
import type { ResourceStorageType } from "@/types/enums"

const STORAGE_TYPE_OPTIONS: { value: ResourceStorageType; label: string }[] = [
  { value: "link", label: "Link" },
  { value: "drive", label: "Google Drive" },
  { value: "supabase", label: "Upload file" },
]

// Kept in sync with the server-side allowlist in app/actions/resources.ts and
// the 'resources' bucket config (supabase/migrations/20260710000001_portal_hardening.sql).
const UPLOAD_ACCEPT = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "video/mp4",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",")

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Uploads carry no stored mime type — infer an icon from the object's file extension. */
function getResourceIcon(resource: Resource) {
  if (resource.storage_type === "link") return Link2
  if (resource.storage_type === "drive") return FolderOpen
  const ext = resource.storage_path?.split(".").pop()?.toLowerCase() ?? ""
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return ImageIcon
  if (["mp3", "wav", "m4a"].includes(ext)) return Music
  if (["mp4", "mov", "webm"].includes(ext)) return Video
  return FileText
}

export function AddResourceDialog({
  chapters,
  students,
  trigger,
}: {
  chapters: Chapter[]
  students?: Student[]
  trigger?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [storageType, setStorageType] = useState<ResourceStorageType>("link")
  const [file, setFile] = useState<File | null>(null)

  const [state, formAction, pending] = useActionState(
    async (prev: ResourceFormState, formData: FormData) => {
      const result = await addResource(prev, formData)
      if (result?.success) {
        toast.success(result.message ?? "Resource added.")
        setOpen(false)
        setStorageType("link")
        setFile(null)
      } else if (result?.message) {
        toast.error(result.message)
      }
      return result
    },
    undefined
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setStorageType("link")
          setFile(null)
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4" aria-hidden />
            Add resource
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a resource</DialogTitle>
          <DialogDescription>
            Share sheet music, links, or files with your chapter or a specific
            student.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chapterId">Chapter</Label>
            <Select name="chapterId" required>
              <SelectTrigger id="chapterId">
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormFieldError errors={state?.errors?.chapterId} />
          </div>

          {students && students.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="studentId">Student (optional)</Label>
              <Select name="studentId">
                <SelectTrigger id="studentId">
                  <SelectValue placeholder="Chapter-wide" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required />
            <FormFieldError errors={state?.errors?.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storageType">Type</Label>
            <Select
              name="storageType"
              required
              value={storageType}
              onValueChange={(value) => setStorageType(value as ResourceStorageType)}
            >
              <SelectTrigger id="storageType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {STORAGE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {storageType === "supabase" ? (
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept={UPLOAD_ACCEPT}
                required
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <span className="shrink-0">{formatFileSize(file.size)}</span>
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground">
                PDF, image, audio, video, text, or Office document. Up to 20MB.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="url">URL</Label>
              <Input id="url" name="url" type="url" placeholder="https://..." />
            </div>
          )}

          {state?.message && !state?.success ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner size="sm" /> : null}
              {pending ? "Adding..." : "Add resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteResourceAction({ resource }: { resource: Resource }) {
  return (
    <ConfirmDialog
      trigger={
        <Button
          size="sm"
          variant="outline"
          className="border-destructive text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Delete
        </Button>
      }
      title="Delete this resource?"
      description={`"${resource.title}" will no longer be available to anyone it was shared with${
        resource.storage_path ? ", and the uploaded file will be deleted" : ""
      }.`}
      confirmLabel="Delete"
      onConfirm={async () => {
        const formData = new FormData()
        formData.set("id", resource.id)
        const result = await deleteResource(undefined, formData)
        if (result?.success) {
          toast.success(result.message ?? "Resource removed.")
        } else if (result?.message) {
          toast.error(result.message)
        }
      }}
    />
  )
}

function buildResourceColumns(canDelete: boolean): ColumnDef<Resource>[] {
  return [
    {
      id: "resource",
      header: "Resource",
      accessorFn: (row) => `${row.title} ${row.description ?? ""}`,
      cell: ({ row }) => {
        const Icon = getResourceIcon(row.original)
        return (
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{row.original.title}</p>
              {row.original.description ? (
                <p className="truncate text-xs text-muted-foreground">
                  {row.original.description}
                </p>
              ) : null}
            </div>
          </div>
        )
      },
    },
    {
      id: "scope",
      header: "Scope",
      accessorFn: (row) =>
        row.students
          ? `${row.students.first_name} ${row.students.last_name}`
          : row.chapters?.name ?? "Chapter",
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.students
            ? `${row.original.students.first_name} ${row.original.students.last_name}`
            : row.original.chapters?.name ?? "Chapter-wide"}
        </Badge>
      ),
    },
    {
      id: "added",
      header: "Added",
      accessorFn: (row) => row.created_at,
      enableGlobalFilter: false,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {timeAgo(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableGlobalFilter: false,
      cell: ({ row }) => {
        const resource = row.original
        const isUpload = resource.storage_type === "supabase"
        return (
          <div className="flex justify-end gap-2">
            {isUpload ? (
              <Button asChild size="sm" variant="outline">
                <a href={`/api/resources/${resource.id}/download`}>
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  Download
                </a>
              </Button>
            ) : resource.url ? (
              <Button asChild size="sm" variant="outline">
                <a href={resource.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Open
                </a>
              </Button>
            ) : null}
            {canDelete ? <DeleteResourceAction resource={resource} /> : null}
          </div>
        )
      },
    },
  ]
}

export function ResourcesList({
  resources,
  canDelete,
}: {
  resources: Resource[]
  canDelete?: boolean
}) {
  const columns = buildResourceColumns(Boolean(canDelete))

  return (
    <DataTable
      columns={columns}
      data={resources}
      searchPlaceholder="Search resources..."
      pageSize={10}
      emptyState={
        <EmptyState
          icon={<FolderOpen aria-hidden />}
          title="No resources yet"
          description="Sheet music, links, and files shared with your chapter will show up here."
        />
      }
    />
  )
}
