# CD12-1 미니 쇼핑몰 실습 진행 기록

기준: 2026-11-17.

1. [RDS IAM 인증 적용](https://github.com/bsmkorea1216sj/cloud_architecture/commit/3b9d47c0066b4d6fa8bf0fe6635d1b0ce0c86eac): Colab에 등록된 AWS_ACCESS_KEY와 AWS_SECRET_KEY를 읽어 AWS 인증을 확인하고, PostgreSQL 연결마다 임시 IAM 토큰을 발급한다. 임시 자격 증명은 AWS_SESSION_TOKEN도 필요하다.
2. [실행 셀 통합](https://github.com/bsmkorea1216sj/cloud_architecture/commit/88f054bbeb413e7025da0fa83e12496bce3aaa8a): 검증 셀을 먼저 실행했을 때 발생한 new_lab_schema NameError를 해결하기 위해 AWS 인증, 테이블 생성, 검증, 웹앱 열기를 한 셀로 통합했다. 교안도 준비 → 실행 → 정리 순서로 맞췄다.
3. [RDS CA 자동 다운로드](https://github.com/bsmkorea1216sj/cloud_architecture/commit/c0aacb1dd6156b3c6e362d20fec2baa9d114eed9): CA 파일 누락 오류를 해결하기 위해 AWS 공식 인증서를 자동으로 내려받게 했다. TLS 인증서와 호스트 검증은 유지한다.

기존 Colab과 교안 링크는 그대로다. 키 값, 토큰 및 AWS 계정 정보는 이 저장소에 포함하지 않았다.

확인 완료: Python 구문, 인증서 다운로드 성공·실패 모의 테스트, 교안 링크와 문구 반영. **실제 AWS 접속은 미검증**: Colab 실행 화면에 연결하는 과정에서 시간 초과가 났다.

다음 확인: Colab 탭을 새로고침하고 이미 등록한 두 보안 비밀의 노트북 액세스가 켜져 있는지 확인한 뒤 2단계 셀을 실행한다. '연결 확인' 출력은 RDS TLS 접속을, '통과' 출력은 주문·품절·취소 검증을 각각 의미한다.
