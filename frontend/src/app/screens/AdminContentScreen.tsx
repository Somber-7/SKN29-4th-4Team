import { AdminLayout } from "@/app/components/admin/AdminLayout";
import { EmptyState } from "@/app/components/common/EmptyState";

export function AdminContentScreen() {
  return (
    <AdminLayout title="콘텐츠 관리" description="현재 관리자 콘텐츠 관리는 공지사항과 FAQ 화면으로 분리되어 있습니다.">
      <EmptyState
        title="분리된 관리 화면을 사용해주세요"
        description="공지사항은 공지 관리에서, FAQ는 FAQ 관리에서 운영합니다."
      />
    </AdminLayout>
  );
}
