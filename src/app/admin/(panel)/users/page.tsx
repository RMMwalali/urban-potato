import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { adminSetUserPassword, adminToggleUser } from "@/app/actions/admin";
import { ActionForm } from "@/components/ActionForm";
import { Empty, PageHeader } from "@/components/ui";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const users = await db.user.findMany({
    where: { business: { isShowcase: false }, ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { business: { name: { contains: q, mode: "insensitive" } } }] } : {}) },
    include: { business: { select: { id: true, name: true, timezone: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div>
      <PageHeader title="Users" sub="Everyone who can log in to a salon account">
        <form className="relative w-full sm:w-auto">
                    <input name="q" defaultValue={q} placeholder="Name, email or salon…" className="input w-full sm:w-72" />
        </form>
      </PageHeader>
      <div className="card overflow-x-auto">
        {users.length === 0 ? <Empty title="No users found" /> : (
          <table className="table">
            <thead><tr><th>User</th><th>Salon</th><th>Role</th><th>Joined</th><th>Reset password</th><th /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.active ? "" : "opacity-60"}>
                  <td><span className="font-semibold">{u.name}</span><span className="block text-xs text-stone-500">{u.email}</span></td>
                  <td><Link href={`/admin/businesses/${u.business.id}`} className="hover:text-brand-600">{u.business.name}</Link></td>
                  <td className="text-xs font-semibold">{u.role}</td>
                  <td className="text-xs whitespace-nowrap">{fmtDate(u.createdAt, u.business.timezone)}</td>
                  <td>
                    <ActionForm action={adminSetUserPassword} submit="Set" submitClass="btn-secondary btn-sm" className="flex flex-wrap items-center gap-1">
                      <input type="hidden" name="userId" value={u.id} />
                      <input name="password" type="text" minLength={8} placeholder="New password" className="input w-36 py-1.5 text-xs" autoComplete="off" />
                    </ActionForm>
                  </td>
                  <td className="text-right"><form action={adminToggleUser.bind(null, u.id)}><button className="btn-ghost btn-sm">{u.active ? "Disable" : "Enable"}</button></form></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
