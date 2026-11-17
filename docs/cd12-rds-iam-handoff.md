# CD12-1 · Colab에서 RDS PostgreSQL IAM 인증

2026-11-17 변경 기록. 수업 자료와 노트북은 기존 Drive 파일의 내용만 교체했다.

- Colab 보안 비밀 `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`로 Boto3 세션을 만든다. 임시 자격 증명은 `AWS_SESSION_TOKEN`도 필요하다. AWS STS로 인증을 먼저 확인한다.
- `AWS_REGION`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`를 보안 비밀에 등록한다. 실제 RDS 엔드포인트와 AWS CA 번들을 사용한다.
- 새 PostgreSQL 연결마다 `generate_db_auth_token`을 호출해 발급한 임시 토큰을 비밀번호 인수로 전달한다. TLS 인증서 및 호스트 검증(`verify-full`)을 유지한다.
- RDS 인스턴스의 IAM DB 인증, AWS 주체의 대상 DB 사용자에 대한 `rds-db:connect`, DB 사용자의 `rds_iam` 역할과 실습 DB CONNECT/CREATE 권한을 준비한다. Colab 런타임에서 RDS로 가는 네트워크 경로도 필요하다.
- 교안의 AWS 실습 범위와 준비 슬라이드 및 발표자 노트를 수정했다. 주문·재고·배송 흐름은 그대로다.
- 검증: 전체 노트북 코드 셀의 Python 구문 검사 및 PPTX 압축·XML 검사 완료. 사용자 AWS 실계정과 DB 연결은 미검증이다. Colab 0단계에서 STS와 TLS 연결을 먼저 확인한 뒤 기존 4단계 검증을 실행한다.

[AWS 공식 Python 연결 가이드](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.Connecting.Python.html)
