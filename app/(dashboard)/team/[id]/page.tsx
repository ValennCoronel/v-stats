import { TeamView } from "@/components/v-stats/team-view"

export default function TeamPage({ params }: { params: { id: string } }) {
  return <TeamView teamId={params.id} />
}
