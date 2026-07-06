import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import type { Screen } from "@/app/types";
import { isValidEmail } from "@/app/utils/validation";
import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { Reveal } from "@/app/components/common/Reveal";
import { PrimaryButton } from "@/app/components/common/Button";
import { Switch } from "@/app/components/ui/switch";

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

export function AdminSettingsScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [settings, setSettings] = useState<Settings>(INITIAL);
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    if (!isValidEmail(settings.supportEmail)) {
      setEmailError("올바른 이메일 형식이 아닙니다.");
      return;
    }
    // TODO: API 연동 — 저장 시뮬레이션
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("저장되었습니다 (시안 — 실제 반영되지 않음)");
    }, 800);
  };

  return (
    <AdminLayout
      active="adminSettings"
      title="설정"
      description="서비스 기본 정보와 추천 결과 표시 방식을 관리합니다."
      onNavigate={onNavigate}
      actions={
        <PrimaryButton
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 text-xs active:scale-[0.98] transition-transform"
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 border-2 border-background/40 border-t-background rounded-full"
                style={{ animation: "mg-spin 0.7s linear infinite" }}
                aria-hidden="true"
              />
              저장 중…
            </span>
          ) : (
            "변경사항 저장"
          )}
        </PrimaryButton>
      }
    >
      <div className="grid gap-4 max-w-3xl">
        {/* 기본 정보 */}
        <Reveal>
          <section className="bg-white border border-border p-5 sm:p-6">
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
                  className="w-full px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
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
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "st-email-err" : undefined}
                  className={`w-full px-3 py-2.5 text-sm border bg-white focus:outline-none transition-all ${
                    emailError
                      ? "border-destructive focus:ring-1 focus:ring-destructive"
                      : "border-border focus:ring-1 focus:ring-primary focus:border-primary"
                  }`}
                />
                {emailError && (
                  <p id="st-email-err" role="alert" className="text-xs text-destructive mt-1">
                    {emailError}
                  </p>
                )}
              </div>
            </div>
          </section>
        </Reveal>

        {/* 추천 설정 */}
        <Reveal delay={60}>
          <section className="bg-white border border-border p-5 sm:p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">추천 결과</h2>
            <div className="mb-2">
              <label htmlFor="st-count" className="block text-xs font-medium text-label mb-1.5">
                기본 추천 개수
              </label>
              <select
                id="st-count"
                value={settings.defaultResults}
                onChange={(e) => set("defaultResults", e.target.value)}
                className="w-full sm:w-40 px-3 py-2.5 text-sm border border-border bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
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
              onChange={(v) => set("showHanjaSource", v)}
            />
            <SettingRow
              label="81수리 4격 표시"
              description="원격·형격·이격·정격 길흉 풀이를 노출합니다."
              checked={settings.showSuri}
              onChange={(v) => set("showSuri", v)}
            />
            <SettingRow
              label="인명용 한자 등재 여부 표시"
              description="대법원 인명용 한자 목록 대조 결과를 노출합니다."
              checked={settings.showBeopryeong}
              onChange={(v) => set("showBeopryeong", v)}
            />
            <SettingRow
              label="학술 논문 근거 표시"
              description="KCI 논문 인용 정보를 노출합니다."
              checked={settings.showNonmun}
              onChange={(v) => set("showNonmun", v)}
            />
          </section>
        </Reveal>

        {/* 운영 */}
        <Reveal delay={120}>
          <section className="bg-white border border-border p-5 sm:p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">운영</h2>
            <SettingRow
              label="점검 모드"
              description="활성화하면 사용자에게 점검 안내 화면이 표시됩니다."
              checked={settings.maintenance}
              onChange={(v) => set("maintenance", v)}
            />
            {settings.maintenance && (
              <div
                className="mt-4 flex items-start gap-3 bg-hanji border border-border-warm px-4 py-3"
                role="alert"
                style={{ animation: "mg-fadein 0.25s ease-out both" }}
              >
                <TriangleAlert size={15} className="text-seal mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-xs text-primary leading-relaxed break-keep">
                  점검 모드가 켜져 있는 동안 사용자는 작명 요청을 할 수 없습니다. 저장을 눌러야
                  적용됩니다.
                </p>
              </div>
            )}
          </section>
        </Reveal>
      </div>
    </AdminLayout>
  );
}
