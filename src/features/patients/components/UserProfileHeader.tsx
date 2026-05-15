'use client'

export type UserProfile = { name: string; role: string; workplace: string }

interface Props {
  profile: UserProfile | null
}

/**
 * 환자 리스트 좌상단 사용자 프로필 + 페이지 제목.
 * Server prefetch된 profile을 받아 layout shift 없이 즉시 렌더.
 */
export function UserProfileHeader({ profile }: Props) {
  return (
    <div className="flex flex-col gap-4 min-w-0 flex-1">
      {profile && (
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-base font-semibold text-foreground truncate min-w-0">
              {profile.name}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                {profile.role}
              </span>
            </p>
            {profile.workplace && (
              <span className="shrink-0 text-[10px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                {profile.workplace}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground/60 tracking-wider uppercase font-medium">
            Expert Healthcare Provider
          </p>
        </div>
      )}
      <h1 className="text-2xl font-bold tracking-tight">환자 목록</h1>
    </div>
  )
}
