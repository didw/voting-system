import Link from "next/link";

const pages = [
  {
    href: "/devices",
    title: "Devices",
    desc: "연결된 기기 현황 모니터링",
  },
  {
    href: "/voting",
    title: "Voting",
    desc: "팀별 투표 진행 및 실시간 결과 표시",
  },
  {
    href: "/judge",
    title: "Judge",
    desc: "심사위원 점수 입력",
  },
  {
    href: "/ranking",
    title: "Ranking",
    desc: "최종 순위 발표",
  },
  {
    href: "/lucky-draw",
    title: "Lucky Draw",
    desc: "행운권 추첨",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-2 text-4xl font-bold text-center">Voting System</h1>
      <p className="mb-12 text-center text-[var(--foreground)]/60">
        실시간 투표 및 행운권 추첨 시스템
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pages.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="block rounded-lg border border-[var(--card-border)] bg-[var(--card)] p-6 transition-colors hover:border-[var(--accent)]"
          >
            <h2 className="mb-1 text-xl font-semibold">{p.title}</h2>
            <p className="text-sm text-[var(--foreground)]/60">{p.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
