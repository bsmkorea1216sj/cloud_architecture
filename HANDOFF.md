# 진행 기록 · Claude → Codex 인수인계 (26)

> 기준 시각: 2026-11-11 23:24 (KST). 작업 규칙은 [`CA강의.md`](CA강의.md)를 따릅니다.
> 실제 강의자료(PPTX)와 코랩 노트북(ipynb)은 Google Drive에만 있고, 이 저장소에는 가이드와 기록만 있습니다.

## 1. Drive 위치

| 항목 | 위치 |
|---|---|
| 강의자료 폴더 | `(G)Lesson/AWS강좌/(G)클라우드아키텍처/(G)CA_강의자료` |
| 코랩 실습자료 폴더 | `CA실습자료` (folder id `1V1x7aJ37AX8Cyhhpk6_IaJ7p2SyvEpca`) |
| 11-1(26).pptx | id `1GDS8uSk2jlFlybv877cEMCAEGhksnhbZ` |
| CA11-1 실습과제1 노트북 | [1uyrbEzc9E8II8IhYRsSkYuRSi4oDn5n5](https://colab.research.google.com/drive/1uyrbEzc9E8II8IhYRsSkYuRSi4oDn5n5) (링크가 있는 사용자 보기 공유) |
| CA11-1 실습과제2 노트북 | [1Ih65s9xM_Z3DhdWvMNiyTD5MRhDWr3j2](https://colab.research.google.com/drive/1Ih65s9xM_Z3DhdWvMNiyTD5MRhDWr3j2) (링크가 있는 사용자 보기 공유) |

## 2. 차시별 진행 상황

### 10-1 · 컨테이너 이미지와 ECR
- 가이드 [10-1](https://bsmkorea1216sj.github.io/cloud_architecture/week/10/session/1)을 AWS 환경이 초기화된 학생 기준으로 점검·수정하고 커밋했습니다.
- 전체 공정을 코랩(CodeBuild 사용, HTML UI 확인 포함)으로 다시 작성해 `CA실습자료`에 저장하고 가이드 끝 **코랩에서 실행할 경우**에 연결했습니다. Fargate 정리 링크도 추가했습니다.

### 10-2 · ECS
- 콘솔 실습 순서를 정리하고 코랩 확인 셀을 추가했습니다. 차시 제목에 (26)을 붙였습니다(커밋 완료).
- 강의자료: ECS·EKS 비교 이미지 슬라이드(P8 다음), 14쪽 컨테이너 이미지 워크플로 설명과 노트 보강, 15쪽 사례를 Pinterest로 교체, 19쪽 ECS 구성요소·워크플로 반영.

### 10-3 · EKS
- 10-2와 같은 방식으로 전체를 (26)으로 개편해 `10-3(26).pptx`로 저장했습니다.
- **남은 일:** 10-3 실습 가이드 초안은 아직 작성하지 않았습니다.

### 11-1 · 글로벌 인프라 (`11-1(26).pptx`, 20장)
- 11쪽 연결선 정리, 10·11쪽을 짝 구조로 재구성(설명 캡션 포함), 표지·12쪽 보정.
- **13쪽 실습과제 1:** 서울 리전 가용 영역을 조회하는 코랩(조회만, 리소스 생성 없음)을 만들고 쪽 하단과 노트에 링크를 넣었습니다.
- **14쪽 실습과제 2:** 제목과 본문을 "9-3 이벤트 웹앱" → "9-3 **사용자 관리** 웹앱"으로 바로잡았습니다(9-3 가이드의 앱은 사용자 관리 앱). 쪽 하단과 노트에 실습과제2 코랩 링크를 넣고, 제출 줄을 0.11in 올려 링크 자리를 만들었습니다. 23:23 저장.
- 실습과제2 노트북 구성(HANDOFF 방식: 도우미 셀 `#@title` 숨김, `input()` 미션 즉시 ✅/❌·3회 재입력, 미션 앵커 `mission_m1`, `mission_hw`):
  1. A 인증: 보안 비밀 `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`
  2. B 9-3 환경 구성: DynamoDB `CloudArchitect-Lab-Users` → IAM 역할 `CloudArchitect-Lab-LambdaRole` → Lambda `CloudArchitect-Lab-UsersAPI` → REST API `/users` GET·POST·CORS → `dev` 배포
  3. C 앱 확인: HTTPS 요청 테스트, S3 웹 페이지 `ca9-3-users-web-{계정}-{리전}` 게시
  4. D 요청 경로 확인: 웹·API 응답 측정(호스트, 원본 리전, 지연, `X-Cache`, `Via`), 가용 영역 표, 퀴즈 4문항, 제출문 생성
  5. E 정리: `RUN_CLEANUP=True`일 때 S3 버킷(버전 포함)·API·Lambda·역할·테이블 삭제 후 삭제 확인 표
- 문법 검사와 미정의 이름 검사는 통과했습니다. **실제 AWS 계정에서 끝까지 실행해 보지는 않았습니다.**

### 11-2 · CloudFront 배포
- `11-2(26).pptx`를 같은 제작 패턴으로 수정하고 중간 과제를 넣어 새 파일로 저장했습니다. 폴더에 `11-2(26) (1).pptx`가 따로 생겼는데 Claude가 만든 파일은 아닙니다.
- 19쪽 과제와 27쪽 참고 도식의 "9-3 이벤트 앱"을 9-3 가이드에 맞춰 **사용자 관리 앱**으로 바꿨습니다. 27쪽 도식은 `GET·POST /users` → Lambda 하나(`UsersAPI`) → DynamoDB `Users`로 다시 그렸고, 과제의 `/api/events`는 `/api/users`로 바꿨습니다(노트 포함, 23:30 저장).
- 가이드 `public/content/week11/11-2-cloudfront-deploy.md`와 `src/data/curriculum.ts` 제목 (26) 수정은 **로컬에만 있고 아직 커밋하지 않았습니다**(강의자 확인 대기).

## 3. 확인 필요 / 다음 할 일
1. 11-2 가이드 변경분을 커밋할지 결정합니다.
2. 10-3 실습 가이드 초안을 작성합니다.
3. 실습과제2 노트북을 실습 계정에서 한 번 끝까지 실행해 확인합니다.

## 4. 작업 시 주의
- 강의자가 Google Slides에서 동시에 편집합니다. 쓰기 직전 Drive 수정 시각을 다시 확인하고, 바뀌었으면 최신본을 다시 받아 그 위에 적용합니다.
- Google Slides가 재저장하면 도형 이름·슬라이드 파일 번호가 바뀝니다. 도형과 슬라이드는 **텍스트(제목)로** 찾습니다.
- 코랩 노트북을 덮어쓴 뒤에는 열려 있던 탭을 새로고침하도록 안내합니다(옛 탭의 자동 저장이 새 버전을 덮어씀).
- 키·토큰은 코드, 출력, 저장소, 강의자료에 넣지 않습니다.
