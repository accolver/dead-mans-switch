"use client"

import { DeleteConfirm } from "@/components/delete-confirm"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  recipient_name: z.string().min(1, "Recipient name is required"),
  recipient_email: z.string().email().optional().or(z.literal("")),
  recipient_phone: z.string().optional().or(z.literal("")),
  contact_method: z.enum(["email", "phone", "both"]),
  check_in_days: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (typeof val === "string") {
        const num = parseInt(val, 10)
        return isNaN(num) ? undefined : num
      }
      return val
    })
    .pipe(
      z
        .number({
          required_error: "Check-in days is required.",
          invalid_type_error: "Check-in days must be a number.",
        })
        .min(2, "Check-in frequency must be at least 2 days.")
        .max(365),
    ),
})

type FormData = z.infer<typeof formSchema>

interface EditSecretFormProps {
  initialData: FormData
  secretId: string
}

interface EditSecretFormProps {
  initialData: FormData
  secretId: string
  isPaid?: boolean
}

export function EditSecretForm({
  initialData,
  secretId,
  isPaid = false,
}: EditSecretFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: initialData,
  })

  async function onSubmit(values: FormData) {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/secrets/${secretId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update secret")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error updating secret:", error)
      setError(
        error instanceof Error ? error.message : "Failed to update secret",
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/secrets/${secretId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete secret")
      }

      // Close modal and redirect
      setShowDeleteModal(false)
      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error deleting secret:", error)
      setError(
        error instanceof Error ? error.message : "Failed to delete secret",
      )
      setShowDeleteModal(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Secret Details Section */}
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Secret Details</h2>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Example: Important Documents Location"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Recipient Information Section */}
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">
              Recipient Information
            </h2>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="recipient_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient's Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Who should receive this secret?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Method</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="How should we contact them?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="both">
                          Both Email and Phone
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-6">
                {(form.watch("contact_method") === "email" ||
                  form.watch("contact_method") === "both") && (
                  <FormField
                    control={form.control}
                    name="recipient_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient's Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Their email address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {(form.watch("contact_method") === "phone" ||
                  form.watch("contact_method") === "both") && (
                  <FormField
                    control={form.control}
                    name="recipient_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient's Phone</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="Their phone number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Check-in Settings Section */}
          <div className="rounded-lg border p-6">
            <h2 className="mb-4 text-lg font-semibold">Check-in Settings</h2>
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="check_in_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Check-in Frequency</FormLabel>
                    <FormControl>
                      {isPaid ? (
                        <Input
                          type="number"
                          {...field}
                          min="2"
                          max="365"
                          disabled={loading}
                          placeholder="Enter custom days"
                        />
                      ) : (
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          defaultValue={field.value.toString()}
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="How often should you check in?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2">Daily</SelectItem>
                            <SelectItem value="7">Weekly</SelectItem>
                            <SelectItem value="14">Every 2 weeks</SelectItem>
                            <SelectItem value="30">Monthly</SelectItem>
                            <SelectItem value="90">Every 3 months</SelectItem>
                            <SelectItem value="180">Every 6 months</SelectItem>
                            <SelectItem value="365">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </FormControl>
                    <FormDescription>
                      {isPaid
                        ? "How often you need to check in to keep the secret active. Minimum 2 days."
                        : "How often you need to check in to keep the secret active. Upgrade to set custom intervals."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col justify-between space-y-3 pt-6 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              disabled={loading || deleteLoading}
              className="w-full sm:w-auto"
            >
              Delete Secret
            </Button>
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading || deleteLoading}
                className="w-full sm:w-auto"
                data-testid="form-cancel-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || deleteLoading}
                className="w-full sm:w-auto"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      <DeleteConfirm
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        title="Delete Secret"
        description="Are you sure you want to delete this secret? This action cannot be undone and the secret will be permanently removed."
        confirmText="Delete Secret"
        loading={deleteLoading}
      />
    </>
  )
}
