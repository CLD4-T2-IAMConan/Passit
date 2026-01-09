# Passit

정가로 안전하게 공연·스포츠 티켓을 실시간 중개하는 고가용성 MSA 플랫폼

---

## 📚 문서 모음

### 배포 및 운영

- [Pod 배포 가이드](POD_DEPLOYMENT_GUIDE.md) - ArgoCD/Helm/kubectl 배포 방법
- [Fargate 로깅 빠른 시작](FARGATE_LOGGING_QUICKSTART.md) - CloudWatch Logs 설정 (1분 완료)
- [인프라 최적화 및 보안](INFRASTRUCTURE_OPTIMIZATION.md) - 비용 절감, 보안 강화, 실제 적용 조치

### 환경 및 비용

- [환경별 비교](docs/ENVIRONMENT_COMPARISON.md) - Dev/Prod/DR 환경 특징 및 성능
- [비용 분석](docs/COST_BREAKDOWN.md) - AWS 리소스별 비용 상세 내역
- [프로젝트 현황](docs/PROJECT_SUMMARY.md) - 현재 단계 및 성공 기준

---

## 🚀 빠른 시작

### Dev 환경 배포

```bash
# ArgoCD 자동 배포 (권장)
cd deployment-scripts
./deploy-argocd-dev.sh

# Pod 상태 확인
./check-pods-dev.sh
```

### 문서 위치

- 배포 스크립트: `deployment-scripts/`
- Terraform 코드: `terraform/`
- Helm 차트: `helm/`

---

**최종 업데이트**: 2026-01-08
