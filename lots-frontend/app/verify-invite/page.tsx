import VerifyInviteClient from "./VerifyInviteClient"

type SearchParams = Promise<{ token?: string }>

export default async function VerifyInvitePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  return <VerifyInviteClient token={params.token || ""} />
}
