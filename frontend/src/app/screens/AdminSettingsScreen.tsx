import { useState, useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { Reveal } from "@/app/components/common/Reveal";
import { PrimaryButton } from "@/app/components/common/Button";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";

export function AdminSettingsScreen() {
  const { hasPermission } = useAdminAuth();
  const canManage = hasPermission("settings.manage");

  const queryClient = useQueryClient();

  const { data: maintenanceData } = useQuery({
    queryKey: ["admin", "settings", "maintenance"],
    queryFn: () => adminApi.getMaintenanceSetting(),
  });

  const [localMaintenance, setLocalMaintenance] = useState(false);
  const [localReason, setLocalReason] = useState("");

  useEffect(() => {
    if (maintenanceData) {
      setLocalMaintenance(maintenanceData.maintenance);
      setLocalReason(maintenanceData.reason);
    }
  }, [maintenanceData]);

  const maintenanceMutation = useMutation({
    mutationFn: (input: { maintenance: boolean; reason: string }) => adminApi.updateMaintenanceSetting(input),
    onSuccess: (data) => {
      queryClient.setQueryData(["admin", "settings", "maintenance"], data);
      toast.success("점검 모드가 업데이트되었습니다.");
    },
    onError: () => {
      toast.error("점검 모드 업데이트에 실패했습니다.");
    }
  });

  const handleSaveMaintenance = () => {
    if (!canManage) return;
    maintenanceMutation.mutate({ maintenance: localMaintenance, reason: localReason });
  };

  return (
    <AdminLayout
      title="설정"
      description="점검 모드를 관리합니다."
      actions={
        canManage ? (
          <PrimaryButton
            onClick={handleSaveMaintenance}
            disabled={maintenanceMutation.isPending}
            className="px-5 py-2.5 text-xs active:scale-[0.98] transition-transform"
          >
            {maintenanceMutation.isPending ? "저장 중…" : "점검 설정 저장"}
          </PrimaryButton>
        ) : null
      }
    >
      <div className="max-w-3xl">
        <Reveal>
          <section className="bg-white border border-border p-5 sm:p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">점검 모드</h2>
            <div className="flex items-center justify-between gap-4 py-4 border-b border-muted">
              <div className="min-w-0">
                <p className="text-sm text-foreground font-medium">점검 모드 활성화</p>
                <p className="text-xs text-caption break-keep mt-0.5">활성화하면 사용자에게 점검 안내 화면이 표시됩니다.</p>
              </div>
              <button
                onClick={() => canManage && setLocalMaintenance(!localMaintenance)}
                className={`flex items-center justify-center w-16 h-8 rounded-full font-bold text-xs transition-colors duration-200 ${
                  localMaintenance
                    ? "bg-primary text-white"
                    : "bg-muted text-caption hover:bg-muted/80"
                } ${!canManage && "opacity-50 cursor-not-allowed"}`}
              >
                {localMaintenance ? "ON" : "OFF"}
              </button>
            </div>

            {localMaintenance && (
              <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label htmlFor="mt-reason" className="block text-xs font-medium text-label mb-1.5">
                  점검 사유 (선택)
                </label>
                <textarea
                  id="mt-reason"
                  value={localReason}
                  onChange={(e) => setLocalReason(e.target.value)}
                  disabled={!canManage}
                  placeholder="예) 서버 정기 점검으로 인해 서비스 이용이 제한됩니다."
                  className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50 h-24 resize-none"
                />
              </div>
            )}

            {localMaintenance && (
              <div
                className="mt-4 flex items-start gap-3 bg-hanji border border-border-warm px-4 py-3"
                role="alert"
              >
                <TriangleAlert size={15} className="text-seal mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-primary leading-relaxed break-keep">
                  점검 모드가 켜져 있는 동안 사용자는 작명 요청을 할 수 없습니다. 우측 상단의 '점검 설정 저장' 버튼을 눌러야 반영됩니다.
                </p>
              </div>
            )}
          </section>
        </Reveal>
      </div>
    </AdminLayout>
  );
}
