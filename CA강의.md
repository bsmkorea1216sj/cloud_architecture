# CA강의 작업 규칙 (26)

클라우드 아키텍처 강의자료와 실습 가이드를 ChatGPT, Codex, Claude Code에서 이어서 작업하기 위한 공통 기준입니다.

## 최신본과 작업 범위

- 강의자료는 작업을 시작할 때 Drive에서 사용자가 마지막으로 저장한 파일을 다시 확인합니다. 이전에 만든 로컬 사본을 원본으로 삼지 않습니다.
- 반영 직전에 버전 또는 수정 시각을 확인합니다. 새 저장이 있으면 최신본에 요청한 변경만 다시 적용합니다.
- 페이지 번호와 슬라이드 링크가 다르면 두 위치의 제목과 내용을 확인해 대상을 식별합니다. 장을 삽입한 경우 바뀐 페이지 번호를 알려줍니다.
- 요청한 산출물에만 반영합니다. 가이드와 코랩 설정 추가는 GitHub 가이드북의 해당 차시 문서에서 작업합니다. 강의자료 변경도 요청된 경우 최신 Drive 파일에 반영합니다.

## 제목과 서체

- 수정 시 차시의 목차·탐색 제목, 문서의 상단 제목과 제목 메타데이터 끝에 **(26)**을 붙입니다. 기존 표기가 있으면 한 번만 유지합니다.
- PPTX 파일명은 확장자 앞에 **(26)**을 넣습니다. 예를 들어 `10-1(SJ)(26).pptx`입니다.
- 두껍고 장식적인 코드 서체를 사용하지 않습니다. 영문 코드는 Consolas 같은 읽기 쉬운 고정폭 서체, 한글 주석은 맑은 고딕 같은 일반 서체를 사용합니다.
- 약어가 있는 슬라이드 하단에는 영문 원어와 짧은 한국어 뜻을 넣습니다. 본문과 출처 링크가 겹치지 않는지 확인합니다.

## 강의자료와 실습 가이드

- 강의자료의 실습 순서, 태스크 번호, 명령, 포트, 확인 결과를 현재 가이드와 대조합니다. 본문뿐 아니라 발표자 노트도 확인합니다.
- 빅테크 사례는 관련 챕터에 배치하고 공식 출처를 남깁니다. 사례의 측정 조건과 학생이 실습에서 실제로 하는 작업을 구분합니다.
- 이미지 누락이 있으면 사용자가 지정한 PDF에서 해당 도식을 확인해 보강합니다. 코드와 텍스트는 편집 가능한 형태를 우선합니다.
- **10-1**은 CloudShell에서 Docker 확인 → Node.js 앱 준비 → 이미지 빌드 → `8080:3000` 실행 → `/health`의 `healthy` 확인 → ECR의 `latest` 태그 확인 순서입니다.
- **Nginx `8080:80`**은 정적 웹앱 참고 예제입니다. **10-2**의 ECS 배포는 별도 환경 설정으로 진행합니다. **9-3**의 API Gateway와 Lambda는 앞 차시 비교 사례로 사용합니다.

## GitHub 가이드북 작업

- AWS 환경이 준비되지 않은 학생을 기준으로 시작합니다. 실습 계정 또는 역할로 콘솔에 로그인하고, 리전과 권한을 확인한 후 CloudShell을 엽니다.
- 가이드 본문은 콘솔에서 진행하는 순서를 중심으로 작성합니다. Docker 빌드·실행과 같이 명령이 필요한 작업은 콘솔의 CloudShell에서 실행할 위치와 기대 결과를 함께 안내합니다.
- 코랩 설정 코드는 가이드 맨 끝의 **코랩에서 실행할 경우**에 추가합니다. `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, 임시 자격 증명용 `AWS_SESSION_TOKEN`은 코랩 보안 비밀에서 읽습니다. 실제 키나 토큰은 저장소, 노트북 출력, 강의자료에 넣지 않습니다.
- GitHub Pages 프로젝트 링크에는 `/cloud_architecture/` 경로를 포함합니다. 실습에 필요한 HTML과 Python 소스는 본문 코드 블록으로도 제공합니다. 파일 저장 이름과 인코딩을 안내합니다.
- 기존 파일 백업을 요청받은 경우 수정 전 버전을 보존합니다. 링크, 코드 문법, 가이드 내용, Pages 배포 상태를 확인합니다. 실제 AWS 실행을 검증하지 않았다면 그 범위를 명시합니다.

## 저장소 위치

| 항목 | 위치 |
|---|---|
| 목차와 차시 제목 | `src/data/curriculum.ts` |
| 9-3 가이드 | `public/content/week9/9-3-api-gateway.md` |
| 10-1 가이드 | `public/content/week10/10-1-docker-container.md` |
| 10-2 가이드 | `public/content/week10/10-2-ecs-service-deploy.md` |
| 파일 다운로드 | `public/files/weekN/` |

- [9-3 API Gateway 가이드](https://bsmkorea1216sj.github.io/cloud_architecture/week/9/session/3)
- [10-1 Docker·ECR 가이드](https://bsmkorea1216sj.github.io/cloud_architecture/week/10/session/1)
- [10-2 ECS 배포 가이드](https://bsmkorea1216sj.github.io/cloud_architecture/week/10/session/2)

## Claude Code에 전달할 시작 문구

> 이 저장소의 `CA강의.md`를 먼저 읽고 이번 작업에 적용해 주세요. 현재 파일과 배포된 가이드 내용을 확인한 후 요청한 차시만 수정해 주세요. 최신 저장본을 기준으로 작업하고, 수정한 제목 끝의 (26) 표기와 실습 순서·포트·검증 기준을 확인해 주세요.

## 2026-11-18 작업 기록 · 클라우드데이터베이스 12-1~3

클라우드 아키텍처 교안의 약어 표기 기준을 클라우드데이터베이스 12장에 적용했다. 여성 액세서리 쇼핑몰을 공통 사례로 사용하며, 개념과 사례 설명을 마친 뒤에 Colab 실습과 과제를 진행한다. 실습 안내표의 단계 이름은 해당 코랩 셀로 연결하고, 코랩의 교안 쪽수도 실제 순서에 맞췄다.

| 차시 | 실습 시작 | 실습 흐름 |
|---|---:|---|
| [12-1 DB·웹앱 교안](https://docs.google.com/presentation/d/1Gu6kZNfazuj6jpYexa_Jd7aVNd0XVwmu/edit) · [Colab](https://colab.research.google.com/drive/1URPntHhY0jY96psj9cK0Khrzq3gLb8KX) | 32쪽 | 상품 주문·품절·취소와 재고 복구를 웹앱에서 확인하고 RDS 중지 |
| [12-2 개념 모델링 교안](https://docs.google.com/presentation/d/1VBrZI-xw8Nk5BPrE5m9cQudmQDjx7dfB/edit) · [Colab](https://colab.research.google.com/drive/1bUdKHLpCey3gCNt-3Qyx-8SCy9QCZfTY) | 25쪽 | 같은 RDS의 `shop`을 이어받아 결제·배송·리뷰와 CRUD를 확인하고 RDS 중지 |
| [12-3 논리·물리 모델링 교안](https://docs.google.com/presentation/d/15z0sVLvy--Je1DqqJD9ZxK24g03mDOaJ/edit) · [Colab](https://colab.research.google.com/drive/16zKCRFtxxvxd3m9DJeg2F73dIiQWhCVN) | 54쪽 | 논리 제약과 물리 설계를 비교하고, 마지막 8번 셀에서 실습 RDS 최종 삭제 |

- 약어가 나오는 70쪽(12-1 15쪽, 12-2 17쪽, 12-3 38쪽) 하단에 영문 원어와 한글 뜻을 표기했다. 예를 들어 `FK: Foreign Key (외래키)`로 표시한다.
- **12-3 필팩터 강의 설명 기록.** 테이블에 새 행을 넣을 때 `100`은 갱신 공간을 따로 예약하지 않고, `90`과 `80`은 각각 약 10%, 20%를 남긴다. 귀걸이 재고를 1개에서 0개로 바꿀 때 PostgreSQL은 새 행 버전을 저장한다. 같은 페이지에 자리가 있고 `stock`이 일반 인덱스에 쓰이지 않으면 새 인덱스 항목 없이 HOT(Heap-Only Tuple) 갱신을 할 수 있다. 낮은 필팩터는 같은 페이지 갱신 가능성을 높이는 대신 초기 페이지 수를 늘린다. [PostgreSQL 필팩터 문서](https://www.postgresql.org/docs/current/sql-createtable.html) · [HOT 문서](https://www.postgresql.org/docs/current/storage-hot.html)
- 교안 29·30쪽의 Colab 4번 셀에서는 같은 2만 행을 넣고 10%를 갱신하여 **100과 80**의 페이지 수와 HOT 비율을 비교한다. 7번 셀의 **90**은 쇼핑몰 물리 설계에 적용하는 설정값이다. 이 설명은 인수인계용으로 기록했다.
- 교안 3개와 Colab 3개를 기존 Drive 링크에 저장하고 재다운로드 대조를 마쳤다. 이번 교안과 코랩 개편의 전체 AWS 실서버 실행은 미검증이다. [수정 스크립트와 작업 기록](https://github.com/bsmkorea1216sj/chatbot/tree/claude/setup-claude-cli-AS1R6/db-course/cd12-series)
