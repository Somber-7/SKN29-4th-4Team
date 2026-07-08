import { useState, useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { isValidEmail } from "@/app/utils/validation";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { Reveal } from "@/app/components/common/Reveal";
import { PrimaryButton } from "@/app/components/common/Button";
import { Switch } from "@/app/components/ui/switch";
import { useAdminAuth } from "@/app/providers/AdminAuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/api/admin";

type Tab = "general" | "maintenance";

interface Settings {
  serviceName: string;
  supportEmail: string;
  defaultResults: string;
  showHanjaSource: boolean;
  showSuri: boolean;
  showBeopryeong: boolean;
  showNonmun: boolean;
  maintenance: boolean;
}

const INITIAL: Settings = {
  serviceName: "명가작명소",
  supportEmail: "hello@myeongga.co.kr",
  defaultResults: "5",
  showHanjaSource: true,
  showSuri: true,
  showBeopryeong: true,
  showNonmun: true,
  maintenance: false,
};

function SettingRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-muted last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm text-foreground font-medium">{label}</p>
        <p className="text-xs text-caption break-keep mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

export function AdminSettingsScreen() {
  const { hasPermission } = useAdminAuth();
  const canManage = hasPermission("settings.manage");

  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [settings, setSettings] = useState<Settings>(INITIAL);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

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

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSaveGeneral = () => {
    if (!canManage) return;
    if (!isValidEmail(settings.supportEmail)) {
      setEmailError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("운영 설정이 저장되었습니다 (시안)");
    }, 800);
  };

  return (
    <AdminLayout
      title="설정"
      description="서비스 운영을 관리합니다."
      actions={
        activeTab === "general" && canManage ? (
          <PrimaryButton
            onClick={handleSaveGeneral}
            disabled={saving}
            className="px-5 py-2.5 text-xs active:scale-[0.98] transition-transform"
          >
            {saving ? "저장 중…" : "운영 설정 저장"}
          </PrimaryButton>
        ) : activeTab === "maintenance" && canManage ? (
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
      <div className="mb-6 flex gap-2 border-b border-border">
        {(
          [
            { id: "general", label: "운영 설정" },
            { id: "maintenance", label: "점검 모드" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-faint hover:text-label hover:border-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-3xl">
        {activeTab === "general" && (
          <Reveal>
            <section className="bg-white border border-border p-5 sm:p-6 mb-6">
              <h2 className="text-sm font-medium text-foreground mb-4">기본 정보</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="st-name" className="block text-xs font-medium text-label mb-1.5">
                    서비스명
                  </label>
                  <input
                    id="st-name"
                    value={settings.serviceName}
                    onChange={(e) => set("serviceName", e.target.value)}
                    disabled={!canManage}
                    className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="st-email" className="block text-xs font-medium text-label mb-1.5">
                    지원 이메일
                  </label>
                  <input
                    id="st-email"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => {
                      set("supportEmail", e.target.value);
                      setEmailError(undefined);
                    }}
                    disabled={!canManage}
                    aria-invalid={!!emailError}
                    className={`w-full px-3 py-2.5 text-sm border bg-white focus:outline-none transition-all disabled:opacity-50 ${
                      emailError
                        ? "border-destructive focus:ring-1 focus:ring-destructive"
                        : "border-border focus:ring-1 focus:ring-primary focus:border-primary"
                    }`}
                  />
                  {emailError && (
                    <p role="alert" className="text-xs text-destructive mt-1">
                      {emailError}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="bg-white border border-border p-5 sm:p-6">
              <h2 className="text-sm font-medium text-foreground mb-4">추천 결과 설정</h2>
              <div className="mb-2">
                <label htmlFor="st-count" className="block text-xs font-medium text-label mb-1.5">
                  기본 추천 개수
                </label>
                <select
                  id="st-count"
                  value={settings.defaultResults}
                  onChange={(e) => set("defaultResults", e.target.value)}
                  disabled={!canManage}
                  className="w-full sm:w-40 px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                >
                  {["3", "5", "7", "10"].map((n) => (
                    <option key={n} value={n}>
                      {n}개
                    </option>
                  ))}
                </select>
              </div>

              <SettingRow
                label="한자 자원오행 근거 표시"
                description="이름 카드에 자원오행 출처 칩을 노출합니다."
                checked={settings.showHanjaSource}
                onChange={(v) => canManage && set("showHanjaSource", v)}
              />
              <SettingRow
                label="81수리 4격 표시"
                description="원격·형격·이격·정격 길흉 풀이를 노출합니다."
                checked={settings.showSuri}
                onChange={(v) => canManage && set("showSuri", v)}
              />
              <SettingRow
                label="인명용 한자 등재 여부 표시"
                description="대법원 인명용 한자 목록 대조 결과를 노출합니다."
                checked={settings.showBeopryeong}
                onChange={(v) => canManage && set("showBeopryeong", v)}
              />
              <SettingRow
                label="학술 논문 근거 표시"
                description="KCI 논문 인용 정보를 노출합니다."
                checked={settings.showNonmun}
                onChange={(v) => canManage && set("showNonmun", v)}
              />
            </section>
          </Reveal>
        )}

        {activeTab === "maintenance" && (
          <Reveal>
            <section className="bg-white border border-border p-5 sm:p-6">
              <h2 className="text-sm font-medium text-foreground mb-4">점검 모드</h2>
              <SettingRow
                label="점검 모드 활성화"
                description="활성화하면 사용자에게 점검 안내 화면이 표시됩니다."
                checked={localMaintenance}
                onChange={(v) => canManage && setLocalMaintenance(v)}
              />
              
              <div className="mt-4">
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
        )}
      </div>
    </AdminLayout>
  );
}

