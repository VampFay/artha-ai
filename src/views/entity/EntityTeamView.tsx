"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { entities as entitiesApi, type EntityDetail } from "@/lib/api";
import { usePortal } from "@/lib/portal-context";
import { useNav } from "@/lib/nav-context";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, UserPlus, Shield, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { id: "tenant_admin", label: "Admin", description: "Full access to entity" },
  { id: "compliance_officer", label: "Compliance Officer", description: "Manage consents, DSRs, retention" },
  { id: "analyst", label: "Analyst", description: "Read/write financial data" },
  { id: "auditor", label: "Auditor", description: "Read-only access to all data" },
  { id: "viewer", label: "Viewer", description: "Read-only documents & reports" },
];

export default function EntityTeamView() {
  const { activeEntityId } = usePortal();
  const { navigate, params } = useNav();
  const entityId = params.entity_id || activeEntityId;
  const { toast } = useToast();
  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!entityId) {
      navigate("entity-switcher");
      return;
    }
    entitiesApi.get(entityId)
      .then((res) => {
        setEntity(res.data);
        setMembers(res.data.teamMembers || []);
      })
      .catch(() => navigate("entity-switcher"))
      .finally(() => setLoading(false));
  }, [entityId]);

  const handleInvite = async () => {
    if (!entity) return;
    if (!inviteEmail) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      const res = await entitiesApi.inviteTeam(entity.id, { email: inviteEmail, role: inviteRole });
      setMembers([...members, res.data]);
      setShowInvite(false);
      setInviteEmail("");
      toast({ title: "Team member added", description: `${inviteEmail} added as ${inviteRole}` });
    } catch (err: any) {
      toast({ title: "Failed to invite", description: err.detail || "Try again", variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 lg:px-12 pt-8 max-w-[1200px] mx-auto">
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-saffron" />
        </div>
      </div>
    );
  }

  if (!entity) return null;

  return (
    <div className="px-6 lg:px-12 pt-8 pb-24 max-w-[1200px] mx-auto w-full">
      <div className="mb-8">
        <button
          onClick={() => navigate("entity-dashboard", { entity_id: entity.id })}
          className="text-[10px] font-bold tracking-[0.2em] text-stone uppercase mb-3 hover:text-carbon transition-colors"
        >
          ← Dashboard
        </button>
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6 text-saffron" />
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-carbon">Team & Access</h1>
        </div>
        <p className="text-stone text-sm">{entity.name} · {members.length} member{members.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 px-5 py-2 bg-saffron text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-saffron/90 transition-colors"
        >
          <UserPlus className="w-3 h-3" /> Invite Member
        </button>
      </div>

      {/* Team list */}
      <div className="space-y-2">
        {members.length === 0 ? (
          <div className="p-12 border border-dashed border-carbon/10 rounded-2xl text-center">
            <Users className="w-8 h-8 text-stone/30 mx-auto mb-2" />
            <p className="text-sm text-stone">No team members yet</p>
            <p className="text-[11px] text-stone/60 mt-1">Invite team members to collaborate on this entity</p>
          </div>
        ) : (
          members.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-4 bg-white border border-carbon/5 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-saffron text-white flex items-center justify-center font-bold">
                  {m.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="text-sm font-medium text-carbon">{m.name}</p>
                  <p className="text-[10px] text-stone">{m.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={cn(
                  "text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider",
                  m.role === "tenant_admin" ? "bg-saffron/10 text-saffron" :
                  m.role === "compliance_officer" ? "bg-blue-100 text-blue-700" :
                  m.role === "analyst" ? "bg-emerald-100 text-emerald-700" :
                  m.role === "auditor" ? "bg-purple-100 text-purple-700" :
                  "bg-carbon/5 text-stone"
                )}>{m.role.replace(/_/g, " ")}</span>
                {m.acceptedAt && (
                  <p className="text-[9px] text-stone mt-1">Joined {new Date(m.acceptedAt).toLocaleDateString("en-IN")}</p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Role legend */}
      <div className="mt-12">
        <h2 className="text-sm font-bold tracking-wider text-carbon uppercase mb-4 flex items-center gap-2">
          <Shield className="w-3 h-3 text-saffron" /> Role Permissions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ROLES.map((r) => (
            <div key={r.id} className="p-4 bg-white border border-carbon/5 rounded-xl">
              <p className="text-sm font-medium text-carbon">{r.label}</p>
              <p className="text-[11px] text-stone mt-1">{r.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-carbon/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-carbon">Invite Team Member</h2>
              <button onClick={() => setShowInvite(false)} className="p-1 text-stone hover:text-carbon">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone mb-1.5">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 rounded-lg border border-carbon/10 bg-white text-sm focus:outline-none focus:border-saffron"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone mb-1.5">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-carbon/10 bg-white text-sm focus:outline-none focus:border-saffron"
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>{r.label} — {r.description}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="w-full px-4 py-2 bg-saffron text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50"
              >
                {inviting ? "Inviting..." : "Send Invitation"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
