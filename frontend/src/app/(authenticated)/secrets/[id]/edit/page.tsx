import { EditSecretForm } from "@/components/forms/editSecretForm"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth-config"
import { getSecret } from "@/lib/db/operations"
import { notFound, redirect } from "next/navigation"
import { mapDrizzleSecretToSupabaseShape } from "@/lib/db/secret-mapper"

interface EditSecretPageProps {
  params: Promise<{ id: string }>
}

export default async function EditSecretPage({ params }: EditSecretPageProps) {
  const { id } = await params
  const session = await getServerSession(authConfig)

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Get secret using our database operations
  try {
    const secret = await getSecret(id, session.user.id)
    if (!secret) {
      notFound()
    }

    const mapped = mapDrizzleSecretToSupabaseShape(secret)

    const initialData = {
      title: mapped.title,
      recipient_name: mapped.recipient_name,
      recipient_email: mapped.recipient_email || "",
      recipient_phone: mapped.recipient_phone || "",
      contact_method: mapped.contact_method,
      check_in_days: mapped.check_in_days,
    }

    return (
      <div className="mx-auto sm:px-4 py-8 max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold">Edit Secret</h1>
        <EditSecretForm initialData={initialData} secretId={mapped.id} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
