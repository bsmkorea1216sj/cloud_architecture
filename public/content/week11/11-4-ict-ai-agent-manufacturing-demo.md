---
title: 'ICT 시범강의 | AI Agent 기반 제조 모니터링 웹앱 (AWS)'
week: 11
session: 4
awsServices:
  - AWS IoT Core
  - AWS Lambda
  - Amazon DynamoDB
  - Amazon VPC
  - Amazon ECS
learningObjectives:
  - 제조 센서 이벤트가 수집·검증·저장·시각화되는 시스템 워크플로우를 설명할 수 있습니다.
  - 공개·사설 서브넷과 관리형 서비스 경계를 포함한 AWS 네트워크 아키텍처를 읽을 수 있습니다.
  - Colab에서 임계치 판정 시뮬레이션을 실행하고 Codex·VS Code를 통해 서비스 코드로 발전시키는 절차를 설명할 수 있습니다.
---

> [!TIP]
> **20분 시범강의 · AI네트워크학과**
>
> 기존 제조 모니터링 웹앱의 합성 점검 데이터를 출발점으로, 센서 이벤트가 대시보드 경고로 이어지는 과정을 실습합니다. Colab에서는 5분 안에 데이터를 생성하고 임계치를 바꾸어 결과를 비교합니다. 이어 AWS 목표 아키텍처와 IoT Core 규칙·Lambda 구현 코드를 살펴보고, Codex가 제안한 변경을 VS Code에서 검토하는 개발 흐름을 연결합니다.

> [!IMPORTANT]
> **시연 환경 구분:** 기준 화면은 한국기술교육대학교 제조모니터링 서비스이며 현재 Google Cloud Run에서 제공됩니다. Colab은 별도 합성 데이터 시뮬레이션입니다. 아래 AWS 아키텍처와 코드는 AWS로 확장할 때의 목표 설계·구현 예시이며, 현재 서비스가 AWS에서 실행 중이거나 실제 센서에 연결되었다는 의미가 아닙니다. 실제 설비 제어, 운영 계정 접속, AWS 리소스 생성은 이 시범강의 범위에 포함하지 않습니다.

> [!LINK]
> **수업 자료**
>
> - [제조 모니터링 결과 화면 열기](https://koreatech-manufacturing-v1-bfqgixmeqa-du.a.run.app/)
> - [Colab 실습 노트북 열기](https://colab.research.google.com/drive/1xCX9Q7vPKoxHhVBQYOaAycIGKOKzN_ij)
> - [VS Code용 시뮬레이션 코드](https://drive.google.com/file/d/1BtHDyrPejMDg6j4hEEuvyW0CvKELIP5s/view?usp=drivesdk)
> - [VS Code 실습 안내](https://drive.google.com/file/d/1-G1DlGrfVt2JrtVOptBNhlNh0wkHLh92/view?usp=drivesdk)
> - [20분 시범강의 슬라이드](https://docs.google.com/presentation/d/1BAPI46iN_Fh0GLJgYk8UdGr-GuYAYxurmbqWT4PviO4/edit)

## 강의 흐름 | 20분

| 시간 | 단계 | 교수·학습 활동 | 확인할 산출물 |
|---|---|---|---|
| 00:00–01:00 | 문제 제시 | 제조 모니터링 화면에서 설비 상태와 경고를 확인합니다. | 화면의 원본 기록과 경고 |
| 01:00–03:00 | 워크플로우 | 센서 이벤트 → 검증 → 임계치 판정 → 저장 → 대시보드 → 담당자 검토 흐름을 읽습니다. | 입력·처리·출력 연결 |
| 03:00–06:00 | AWS 아키텍처 | OT 경계, IoT 수집, VPC 공개·사설 구간, 저장소와 운영 관측성을 설명합니다. | 서비스 배치 및 보안 경계 |
| 06:00–08:00 | 산업 사례·설계 판단 | 공장 데이터 수집 사례를 비교하고 실습 설계의 선택 근거를 확인합니다. | 사례에서 가져온 설계 원칙 |
| 08:00–13:00 | Colab 실습 | 합성 이벤트 생성, 임계치 변경, 그래프·경고 결과 비교를 수행합니다. | 기준 90°C와 변경 95°C 결과 |
| 13:00–17:00 | 코드·개발 흐름 | IoT Core SQL 규칙과 Lambda 코드를 읽고 Codex → VS Code 검토 과정을 설명합니다. | 코드의 입력·권한·저장 위치 |
| 17:00–19:00 | 품질·보안 점검 | 누락값 추정 금지, 최소 권한, 근거가 있는 요약, 사람 검토를 점검합니다. | 안전한 운영 체크 |
| 19:00–20:00 | 회고 | 학습 목표와 핵심 흐름을 짧게 확인합니다. | 종료 질문 답변 |

## 1. 시스템 워크플로우

```text
[센서 / PLC]
     │  MQTT 이벤트: machine_id, ts, temperature, unit
     ▼
[Edge Gateway] ── 인증서·장치 식별·현장 버퍼링
     │ TLS / MQTT
     ▼
[AWS IoT Core] ── IoT Rule: 토픽 필터·필드 선택
     │
     ├──► [AWS Lambda] ── 형식·범위 검증 / 경고 판정
     │                         │
     │                         ▼
     │                   [DynamoDB]
     │                         │ 조회 API
     ▼                         ▼
[운영자 대시보드] ◄──── [API / 웹 애플리케이션]
     │
     └── 경고 확인·조치 기록·사람 승인
```

### 이벤트 처리 규칙

- 원본 시각·측정값·단위를 그대로 보존하고 화면 표시값과 원본값을 구분합니다.
- 예시 경고 조건: `temperature >= 90`이면 `ALERT`, 그 외는 `NORMAL`.
- 측정이 없는 시각은 임의로 보간하지 않습니다. 결측 여부를 별도 상태로 표시합니다.
- 재전송에 대비해 `deviceId + eventTime`을 키로 사용하고 중복 이벤트를 식별합니다.
- AI 요약은 저장된 이벤트 ID와 근거값을 함께 제시하고, 조치 결정은 담당자가 승인합니다.

## 2. AWS 네트워크 아키텍처

```text
운영자 브라우저
    │ HTTPS :443
    ▼
Route 53 ── DNS 응답
    │
    ▼
┌──────────────────────────── AWS Region ────────────────────────────┐
│  VPC (예: 10.20.0.0/16)                                             │
│  ┌──────────── Public Subnet / AZ-a ───────┐                       │
│  │ Application Load Balancer (HTTPS)       │                       │
│  └──────────────────┬──────────────────────┘                       │
│                     │ 대상 그룹                                    │
│  ┌──────────────────▼──────────────┐  ┌─────────────────────────┐ │
│  │ Private App Subnet / AZ-a       │  │ Private App Subnet / AZ-b│ │
│  │ ECS Fargate task (웹/API)       │  │ ECS Fargate task         │ │
│  └──────────┬──────────────────────┘  └────────────┬────────────┘ │
│             └──── VPC Endpoint / HTTPS ────────────┘               │
└─────────────────────────────────┬─────────────────────────────────┘
                                  │ AWS 서비스 API
                     ┌────────────▼────────────┐
                     │ DynamoDB (관리형 서비스)│
                     │ 저장·조회               │
                     └─────────────────────────┘

[센서/게이트웨이] ── MQTT/TLS ──► AWS IoT Core
                                      │ IoT Rule
                                      ▼
                                  AWS Lambda ──► DynamoDB

공통 운영: IAM task role · Secrets Manager · CloudWatch Logs/Alarms
```

### 네트워크 해설

| 구간 | 배치·통신 | 설계 이유 |
|---|---|---|
| 사용자 진입 | Route 53 → ALB, HTTPS 443 | DNS와 TLS 종단을 분리하고 애플리케이션 앞단에서 요청을 분산합니다. |
| 애플리케이션 | ECS Fargate를 두 개 AZ의 사설 서브넷에 배치 | 인터넷에서 task에 직접 접근시키지 않고 가용영역 장애 영향을 줄입니다. |
| 데이터 접근 | task role로 DynamoDB API 호출, 필요하면 Gateway Endpoint 사용 | 애플리케이션 비밀키를 코드에 넣지 않고 공인 인터넷 경로 의존을 줄입니다. |
| 장치 수집 | 장치 인증서와 MQTT/TLS로 IoT Core 연결 | 장치별 인증 및 이벤트 토픽 기반 분기를 적용합니다. |
| 처리·관측 | IoT Rule → Lambda, CloudWatch 로그·지표·경보 | 수집과 계산을 분리하고 지연·오류를 관찰합니다. |

> [!NOTE]
> DynamoDB는 VPC 서브넷 안에 설치하는 데이터베이스가 아니라 AWS 관리형 서비스입니다. VPC Endpoint는 사설 서브넷에서 AWS 서비스로 연결하는 선택 구성입니다. NAT Gateway는 외부 인터넷 접근이 실제로 필요한 task가 있을 때만 배치하고 비용·보안 목적을 함께 설명합니다.

## 3. 산업 사례에서 가져오는 설계 원칙

- **Siemens Energy Connected Factory:** AWS 사례는 여러 공장과 사용 사례에서 장비 데이터를 수집하고 현장 데이터 확인을 지원합니다. 수업에서는 데이터 수집 표준화와 운영 가시성을 설계 원칙으로 가져옵니다.
- **Toyota 제조 운영:** AWS IoT SiteWise 고객 사례는 생산라인 가용성 향상을 보고합니다. 수업에서는 KPI 개선을 주장하기 전에 기준 기간·측정 방법·원본 로그를 먼저 확인하는 태도를 다룹니다.
- **BMW Group 데이터 플랫폼:** 차량 데이터 허브 사례는 대규모 이벤트 수집 및 분석 파이프라인 예시입니다. 공장 적용 결과로 오인하지 않고, 스트리밍·데이터 처리 계층 분리 사례로만 비교합니다.

> 수치는 사례 기업의 자체 보고이며 수업용 시뮬레이션의 성과가 아닙니다. 제조 현장에 그대로 일반화하지 않고 데이터 수집, 권한 분리, 모니터링이라는 설계 아이디어만 참고합니다.

## 4. 실습 | Colab에서 경고 기준을 바꾸기 (5분)

**준비:** 위 Colab 노트북을 열고 셀 실행이 가능한지 확인합니다. 실습 데이터는 합성 데이터이며 장치나 운영 저장소에 연결되지 않습니다.

1. **00:00–00:45 | 결과 읽기**  
   제조 모니터링 앱에서 원본 4건, B-냉각수 98°C·102°C, 기준 90°C 경고 2건을 확인합니다.
2. **00:45–01:45 | 입력 확인**  
   Colab에서 DataFrame의 `machine`, `time`, `temperature`, `unit` 열을 확인합니다.
3. **01:45–02:45 | 기준 변경**  
   임계치를 90°C에서 95°C로 바꾸고 경고 건수가 바뀌는지 확인합니다.
4. **02:45–04:00 | 시각화 확인**  
   설비별 원본 측정점과 기준선을 비교하고, 기록이 없는 시각은 그래프에 새 값을 만들지 않습니다.
5. **04:00–05:00 | 설명**  
   입력 → 판정 → 결과 표시를 한 문장으로 설명하고, 현장 적용 전 확인할 데이터 품질 항목을 한 가지 제안합니다.

**성공 기준**

- 같은 입력과 같은 임계치에서 결과가 재현됩니다.
- 경계값 `temperature == threshold`가 경고에 포함되는지 확인합니다.
- 누락 데이터가 정상값으로 변환되지 않습니다.

### Colab에서 보여줄 간단한 판정 코드

```python
import pandas as pd

# 확인된 B-냉각수 측정값 두 건으로 판정 원리를 보여주는 축약 예시
events = pd.DataFrame([
    {"machine_id": "B-냉각수", "temperature": 98.0, "unit": "C"},
    {"machine_id": "B-냉각수", "temperature": 102.0, "unit": "C"},
])

threshold = 90.0
events["status"] = events["temperature"].ge(threshold).map(
    {True: "ALERT", False: "NORMAL"}
)
display(events)
print("축약 예시 경고 건수:", int(events["status"].eq("ALERT").sum()))
```

> 노트북에서는 기존 셀과 데이터가 강의 화면에 표시된 기준 기록과 일치하는지 먼저 확인한 뒤 실행합니다. 위 코드는 핵심 판정 원리를 설명하는 축약 예시입니다.

## 5. AWS 구현 코드 읽기

### IoT Core Rule SQL

IoT Core 규칙에서 `factory/+/telemetry` 토픽의 필요한 필드만 Lambda로 전달하도록 구성합니다.

```sql
SELECT
  topic(2) AS machine_id,
  timestamp() AS received_at,
  temperature,
  unit
FROM 'factory/+/telemetry'
WHERE temperature IS NOT MISSING
```

### Lambda 예시 | 검증·경고 판정·DynamoDB 저장

**사전 조건:** DynamoDB 테이블의 파티션 키는 `deviceId`(문자열), 정렬 키는 `eventTime`(문자열)입니다. Lambda 실행 역할에는 해당 테이블의 `dynamodb:PutItem`만 부여합니다. 테이블명은 환경변수 `TABLE_NAME`으로 지정합니다.

```python
import json
import os
from decimal import Decimal

import boto3

table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])
THRESHOLD = Decimal("90")

def lambda_handler(event, context):
    device_id = str(event["machine_id"])
    event_time = str(event["received_at"])
    temperature = Decimal(str(event["temperature"]))
    unit = str(event.get("unit", "C"))

    if unit != "C" or temperature < Decimal("-40") or temperature > Decimal("250"):
        raise ValueError("invalid unit or out-of-range temperature")

    item = {
        "deviceId": device_id,
        "eventTime": event_time,
        "temperature": temperature,
        "unit": unit,
        "status": "ALERT" if temperature >= THRESHOLD else "NORMAL",
        "eventId": context.aws_request_id,
    }
    table.put_item(Item=item)

    return {
        "statusCode": 200,
        "body": json.dumps({
            "deviceId": device_id,
            "status": item["status"],
            "thresholdC": str(THRESHOLD),
        }),
    }
```

> [!WARNING]
> 이 예시는 교육용 최소 코드입니다. 프로덕션에서는 장치 시각과 수신 시각 구분, 멱등성 키, 재시도·실패 큐, 스키마 검증, 지표·경보, 데이터 보존, 테이블 키 설계와 IAM 정책 검토가 필요합니다. 자격 증명은 코드나 노트북에 저장하지 않습니다.

## 6. Codex → VS Code → AWS 개발 연계

1. **요구사항을 짧게 정의:** 입력 스키마, 경고 기준, 누락·범위 오류 처리, 출력 JSON, 테스트 조건을 적습니다.
2. **Codex로 코드 초안 생성:** “기존 데이터 계약을 유지하고, 임계치 판정 함수와 경계값·누락값 단위 테스트를 추가하되 배포나 비밀정보 설정은 하지 말라”고 요청합니다.
3. **VS Code에서 변경 검토:** diff를 읽고 입력 검증, 예외 처리, 테스트를 실행합니다. 생성 코드가 기존 계약을 바꾸면 수정 또는 되돌립니다.
4. **AWS 연결:** 승인된 IAM task role, IoT Rule, Lambda, DynamoDB로 연결합니다. 개발·검증·운영 환경과 권한을 분리하고 변경은 리뷰 후 배포합니다.
5. **운영 관측:** CloudWatch에서 Lambda 오류·지연·호출량과 IoT 메시지 흐름을 확인하고, 담당자가 경고와 실제 조치 기록을 대조합니다.

> 실습은 Colab에서 결과 생성까지 수행합니다. 짧은 면접 시연 중 AWS 리소스 생성·배포를 시도하지 않고, 준비된 화면·시뮬레이션·코드 읽기로 재현성을 보입니다.

## 7. 확인 질문과 평가

1. 기준값이 90°C일 때 측정값이 정확히 90°C라면 이 규칙은 어떤 상태를 반환합니까?
2. 15:00 측정이 누락됐다면 그래프와 경고 로직은 어떻게 처리해야 합니까?
3. 웹 브라우저에서 ECS task의 사설 IP로 직접 접속하지 못하게 하는 이유는 무엇입니까?
4. Lambda 코드가 DynamoDB 전체 권한을 요청하면 어떤 권한으로 줄여야 합니까?

**강의자 평가 기준**

- 시스템 흐름의 각 단계가 정확히 연결되는가
- 임계치 경계와 결측값 처리를 설명하는가
- 공개·사설 네트워크 경계를 구분하는가
- 생성형 코드를 검토하고 실행 결과를 검증하는가
- 실제 측정·운영과 합성 시뮬레이션을 혼동하지 않는가

## 핵심 정리

- **워크플로우:** 센서 이벤트 → 검증·판정 → 저장·표시 → 담당자 검토
- **네트워크:** 브라우저는 공개 ALB, 애플리케이션 task는 사설 서브넷, 데이터 서비스는 IAM 역할로 접근
- **실습:** Colab에서 임계치 변화와 경고 결과를 재현하고, Codex·VS Code에서 코드와 테스트를 검토
- **경계:** 기존 화면은 GCP Cloud Run, AWS는 확장 목표 아키텍처, 데이터는 교육용 합성 기록

## 참고 자료

- [Amazon CloudFront 배포 구성 | 11주차 2차시](https://bsmkorea1216sj.github.io/cloud_architecture/week/11/session/2)
- [AWS IoT Core rules tutorial](https://docs.aws.amazon.com/iot/latest/developerguide/iot-rules-tutorial.html)
- [AWS IoT Rule action: Lambda](https://docs.aws.amazon.com/iot/latest/developerguide/iot-lambda-rule.html)
- [Siemens Energy Connected Factory on AWS](https://aws.amazon.com/solutions/case-studies/siemens-energy-video-case-study/)
- [AWS IoT SiteWise customer stories: Toyota](https://aws.amazon.com/iot-sitewise/customers/)
- [BMW Group case study](https://aws.amazon.com/solutions/case-studies/bmw-group-case-study/)
