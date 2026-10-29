---
title: '(26) Amazon API Gateway 서비스 구축 — AWS 콘솔 실습'
week: 9
session: 3
awsServices:
  - Amazon API Gateway
  - AWS Lambda
  - Amazon DynamoDB
  - Amazon S3
learningObjectives:
  - AWS 콘솔에서 DynamoDB와 Lambda 실행 역할을 구성할 수 있습니다.
  - REST API의 리소스, Lambda 프록시 통합, CORS와 dev 배포를 설정할 수 있습니다.
  - HTML 웹 화면에서 사용자 조회와 등록을 확인하고 웹 URL과 API URL을 구분할 수 있습니다.
---

# (26) Amazon API Gateway — AWS 콘솔 기반 사용자 관리 서비스

**2026-10-29 개정.** 코랩에서 구성한 서비스를 AWS Management Console에서 직접 설정합니다. 설치 스크립트나 코랩 실행 없이 완료할 수 있습니다. **Lambda 코드와 index.html 전체 소스를 아래 본문에 포함했습니다. 다운로드하지 않아도 코드 블록을 복사하여 진행할 수 있습니다.** 화면의 버튼 이름은 콘솔 언어와 업데이트에 따라 다를 수 있습니다.

> [!TIP]
> 구조: **HTML 웹 화면 → API Gateway REST API → Lambda → DynamoDB**.
> API URL은 JSON 데이터를 반환하며, HTML 웹 URL은 사용자 조회·등록 화면을 엽니다.
> GET·POST와 선택 개별 조회를 실습합니다. DELETE API는 구현하지 않습니다.

## 실습 준비와 파일

1. AWS 콘솔에 로그인하고 리전을 **서울(ap-northeast-2)**로 선택합니다. IAM은 글로벌 서비스입니다.
2. 필요한 콘솔 권한: DynamoDB·Lambda·API Gateway·CloudWatch Logs 관리, IAM 역할 생성/정책 연결 및 iam:PassRole. 웹 배포에는 S3 버킷·객체·버킷 정책 권한이 필요합니다.
3. 이 콘솔 실습에는 액세스 키 입력이 필요하지 않습니다. 코랩용 AWS_ACCESS_KEY, AWS_SECRET_KEY를 Lambda 코드나 HTML에 넣지 마세요.
4. 기존 동명 리소스가 있다면 계정·리전·용도·설정을 먼저 확인합니다. 공유 중인 리소스를 덮어쓰거나 삭제하지 않습니다. 기존 Lambda를 수정한다면 Code에서 ZIP을 내려받고 환경 변수·실행 역할을 기록합니다.
5. 실습에서 새로 만든 리소스의 이름과 API ID, 버킷 이름을 기록합니다. 유료 사용량이 발생할 수 있으므로 종료 후 정리합니다.

> [!DOWNLOAD]
> - 파일 링크는 보조 수단입니다. 아래 **1.2의 Lambda 전체 코드**, **5.1의 index.html 전체 코드**를 복사해 사용하세요.
> - [Lambda 코드: lambda_function.py](https://bsmkorea1216sj.github.io/cloud_architecture/files/week9/console-26/lambda_function.py) — 아래 본문에도 전체 코드를 제공합니다.
> - [웹 화면: index.html](https://bsmkorea1216sj.github.io/cloud_architecture/files/week9/console-26/index.html) — 아래 본문 코드를 index.html로 저장한 뒤 S3에 업로드할 수 있습니다.
> - [개정 전 원본 문서](https://github.com/bsmkorea1216sj/cloud_architecture/blob/main/backups/2026-10-29/week9/9-3-api-gateway.before-26.md)

| 리소스 | 이름 또는 설정 |
|---|---|
| DynamoDB | CloudArchitect-Lab-Users, 파티션 키 id(String), 온디맨드 |
| Lambda 실행 역할 | CloudArchitect-Lab-LambdaRole |
| Lambda | CloudArchitect-Lab-UsersAPI, Python 3.12 |
| REST API | CloudArchitect-Lab-UsersAPI, Regional, dev |
| 웹 버킷 | ca9-3-users-web-계정ID-ap-northeast-2 등 전역 고유 이름 |

## 태스크 0: DynamoDB 테이블과 샘플 데이터

1. **DynamoDB → Tables → Create table**을 선택합니다.
2. Table name에 `CloudArchitect-Lab-Users`, Partition key에 `id`, 유형 **String**을 입력합니다. Sort key는 비워 둡니다.
3. Table settings에서 **Customize settings → Capacity mode: On-demand**를 선택합니다. 나머지 설정을 확인하고 생성합니다. 기존 테이블을 재사용하면 id(String) 단일 파티션 키인지 확인하며 용량 모드를 임의 변경하지 않습니다.
4. 상태가 **Active**가 되면 **Explore table items → Create item → JSON view**에서 아래 일반 JSON을 입력합니다. DynamoDB JSON 보기 옵션이 있다면 끄고 일반 JSON을 사용합니다.
5. 각 항목을 따로 생성합니다. 기존 id가 있다면 덮어쓰지 말고 내용을 확인합니다.

```json
{"id":"user001","name":"김철수","email":"chulsoo@example.com","age":25,"department":"컴퓨터공학과","status":"active"}
```

```json
{"id":"user002","name":"이영희","email":"younghee@example.com","age":23,"department":"정보시스템학과","status":"active"}
```

**완료 확인:** 두 id가 테이블에 보입니다. 테이블의 **Overview → Additional info** 등에서 ARN을 복사합니다.

## 태스크 1: Lambda 실행 역할과 함수

### 1.1 IAM 역할

1. **IAM → Roles → Create role → AWS service → Lambda**를 선택합니다.
2. 권한 정책 **AWSLambdaBasicExecutionRole**을 연결하고 역할 이름을 `CloudArchitect-Lab-LambdaRole`로 생성합니다.
3. 생성한 역할의 **Permissions → Add permissions → Create inline policy → JSON**에서 아래 정책을 입력합니다. `ACCOUNT_ID`를 본인 12자리 계정 ID로 바꾸거나 Resource를 앞에서 복사한 실제 테이블 ARN으로 교체합니다.
4. 정책 이름은 `CA9-3UsersTableAccess`로 저장합니다. DynamoDB 전체 접근 정책은 필요하지 않습니다.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Scan"],
    "Resource": "arn:aws:dynamodb:ap-northeast-2:ACCOUNT_ID:table/CloudArchitect-Lab-Users"
  }]
}
```

**Trust relationships**에는 Lambda 서비스가 역할을 맡을 수 있는 아래 신뢰 정책이 있어야 합니다.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
```

### 1.2 Lambda 생성과 코드 배포

1. **Lambda → Functions → Create function → Author from scratch**를 선택합니다.
2. Function name: `CloudArchitect-Lab-UsersAPI`, Runtime: **Python 3.12**.
3. **Change default execution role → Use an existing role**에서 위 역할을 선택하고 생성합니다. 역할이 목록에 없으면 전파를 기다린 뒤 새로고침합니다.
4. **Code → lambda_function.py**의 전체 내용을 아래 **Lambda 전체 코드**로 교체하고 **Deploy**합니다. 파일을 ZIP으로 만들 필요는 없습니다.
5. **Configuration → Environment variables → Edit**에서 다음 두 값을 저장합니다.

| 키 | 값 |
|---|---|
| TABLE_NAME | CloudArchitect-Lab-Users |
| ALLOWED_ORIGIN | * |

6. **Configuration → General configuration → Edit**에서 Timeout **30초**, Memory **128MB**를 설정합니다.
7. Runtime settings의 Handler가 `lambda_function.lambda_handler`인지 확인합니다. **Configuration → Permissions**에서 실행 역할도 확인합니다.

#### Lambda 전체 코드 — lambda_function.py

아래 코드 블록 전체를 복사해 Lambda 편집기의 `lambda_function.py`에 붙여넣고 **Deploy**합니다. 위의 환경 변수 두 개도 설정해야 합니다.

```python
"""Week 9-3: REST API proxy (payload v1.0), small-table lab."""
import json
import os
import logging
from decimal import Decimal
import boto3

logger = logging.getLogger(__name__)
table = boto3.resource('dynamodb').Table(os.environ['TABLE_NAME'])

def decimal_default(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    raise TypeError('Unsupported JSON type')

def reply(status, body, headers=None):
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': os.environ.get('ALLOWED_ORIGIN', '*'),
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    **(headers or {})},
        'body': json.dumps(body, default=decimal_default, ensure_ascii=False),
    }

def reject_constant(value):
    raise ValueError('Non-finite JSON number')

def lambda_handler(event, context):
    try:
        # REST API proxy v1.0. HTTP API v2.0 needs a separate event adapter.
        if not isinstance(event, dict):
            return reply(400, {'error': '이벤트는 객체여야 합니다'})
        method, path = event.get('httpMethod'), event.get('path')
        if not isinstance(method, str) or not isinstance(path, str):
            return reply(400, {'error': 'REST API v1.0의 httpMethod와 path가 필요합니다'})

        if path == '/users' and method == 'GET':
            # One Scan reads at most 1 MB. Aggregate pages for this small lab.
            users, options = [], {'ConsistentRead': True}
            while True:
                page = table.scan(**options)
                users.extend(page.get('Items', []))
                last_key = page.get('LastEvaluatedKey')
                if not last_key:
                    break
                options['ExclusiveStartKey'] = last_key
            return reply(200, {
                'message': 'CloudArchitect Week 9-3 - Lambda와 DynamoDB 연동',
                'users': users, 'count': len(users),
            })

        if path.startswith('/users/') and method == 'GET':
            user_id = (event.get('pathParameters') or {}).get('id')
            if not isinstance(user_id, str) or not user_id.strip():
                return reply(400, {'error': '문자열 id가 필요합니다'})
            profile = (event.get('queryStringParameters') or {}).get('profileType', 'basic')
            if profile not in ('basic', 'detailed'):
                return reply(400, {'error': 'profileType은 basic 또는 detailed여야 합니다'})
            item = table.get_item(Key={'id': user_id}, ConsistentRead=True).get('Item')
            if item is None:
                return reply(404, {'error': '사용자를 찾을 수 없습니다', 'id': user_id})
            user = {key: item.get(key) for key in ('id', 'name', 'email')} if profile == 'basic' else item
            return reply(200, {'message': f'사용자 프로필 조회 성공 ({profile})', 'user': user})

        if path == '/users' and method == 'POST':
            if event.get('isBase64Encoded'):
                return reply(400, {'error': '이 실습은 일반 JSON 본문을 사용합니다'})
            raw = event.get('body')
            if not isinstance(raw, str):
                return reply(400, {'error': 'body는 JSON 문자열이어야 합니다'})
            try:
                body = json.loads(raw, parse_float=Decimal, parse_constant=reject_constant)
            except (ValueError, TypeError):
                return reply(400, {'error': '올바른 JSON 본문이 필요합니다'})
            if not isinstance(body, dict):
                return reply(400, {'error': 'JSON 본문은 객체여야 합니다'})
            for key in ('id', 'name', 'email'):
                if not isinstance(body.get(key), str) or not body[key].strip():
                    return reply(400, {'error': f'{key}는 비어 있지 않은 문자열이어야 합니다'})
            age = body.get('age')
            if age is not None and (isinstance(age, bool) or not isinstance(age, (int, Decimal)) or age < 0 or age > 150 or age != int(age)):
                return reply(400, {'error': 'age는 0~150의 정수여야 합니다'})
            # PutItem replaces the whole item; it is not a partial update.
            result = table.put_item(Item=body, ReturnValues='ALL_OLD')
            replaced = bool(result.get('Attributes'))
            return reply(200 if replaced else 201, {
                'message': '사용자 전체 교체 성공' if replaced else '사용자 생성 성공',
                'id': body['id'],
            })

        if path == '/users' or path.startswith('/users/'):
            allowed = 'GET, POST' if path == '/users' else 'GET'
            return reply(405, {'error': '지원하지 않는 HTTP 메서드'}, {'Allow': allowed})
        return reply(404, {'error': '지원하지 않는 경로'})
    except Exception:
        logger.exception('Users API request failed')
        return reply(500, {'error': '내부 서버 오류'})
```

### 1.3 Lambda 자체 테스트

**Test → Create new event**에서 아래 이벤트를 저장하고 실행합니다.

```json
{"httpMethod":"GET","path":"/users"}
```

**예상 결과:** 실행 성공, `statusCode: 200`, body 문자열에 `users`와 `count: 2`. 기존 데이터를 재사용하면 개수는 다를 수 있습니다. 이 단계가 실패하면 API Gateway를 만들기 전에 환경 변수·실행 역할·로그를 확인합니다.

코드는 Scan 페이지를 합쳐 조회하고, JSON 및 필수 문자열 id/name/email과 age(0~150 정수)를 검증합니다. POST는 같은 id의 **항목 전체를 교체**하며 최초 생성 **201**, 교체 **200**을 반환합니다. 부분 수정이 아닙니다.

## 태스크 2: REST API와 리소스 생성

1. **API Gateway → Create API → REST API → Build**를 선택합니다. HTTP API나 REST API Private을 선택하지 않습니다.
2. **New API**, API name `CloudArchitect-Lab-UsersAPI`, Endpoint type **Regional**로 생성합니다.
3. **Resources**에서 루트 `/`를 선택하고 **Create resource**를 누릅니다.
4. Resource name `users`, Resource path `/users`로 생성합니다.

**완료 확인:** Resources에 `/users`가 보입니다. 기존 동명 API가 여러 개라면 API ID로 구분합니다.

## 태스크 3: Lambda 프록시 통합과 CORS

### 3.1 GET과 POST 메서드

1. `/users` 선택 → **Create method → GET**.
2. Integration type **Lambda function**, **Lambda proxy integration 활성화**, Lambda Region **ap-northeast-2**, 함수 `CloudArchitect-Lab-UsersAPI`를 선택합니다.
3. Authorization **NONE**, API key required **끄기**로 생성합니다. Lambda 호출 권한 추가 안내가 있으면 허용합니다.
4. 같은 리소스에 **POST**도 동일하게 생성합니다.
5. Lambda의 **Configuration → Permissions → Resource-based policy statements**에서 API Gateway 서비스의 InvokeFunction 권한이 있는지 확인합니다. 콘솔이 생성한 권한의 API ID가 이번 API인지 확인합니다.

> [!NOTE]
> 실습 API는 인증 없이 공개 호출됩니다. 샘플 데이터만 사용합니다. CORS는 인증 기능이 아닙니다.
> 실행 역할은 Lambda → DynamoDB 권한이고, 리소스 기반 정책은 API Gateway → Lambda 호출 권한입니다.
> GET 요청도 API Gateway 내부의 Lambda 호출 통합 메서드는 POST입니다. 프록시 통합에는 별도 본문 매핑 템플릿을 만들지 않습니다.

### 3.2 OPTIONS와 CORS

1. `/users`에서 **Enable CORS**를 선택합니다.
2. Methods에서 **GET, POST**를 선택하고, OPTIONS가 만들어지는지 확인합니다.
3. Allow-Origin `*`, Allow-Methods `GET,POST,OPTIONS`, Allow-Headers `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`을 설정합니다.
4. Gateway responses의 **Default 4XX, Default 5XX**도 선택하고 저장합니다. 메뉴가 분리되어 있으면 **Gateway responses**에서 해당 오류 응답에 `Access-Control-Allow-Origin: '*'`를 설정합니다.
5. `/users` 아래 GET·POST·OPTIONS를 확인합니다. OPTIONS는 **MOCK** 통합이며 200 응답에 위 CORS 헤더가 있어야 합니다.

**Lambda 프록시의 GET/POST 실제 응답 헤더는 Lambda 코드가 반환합니다.** OPTIONS만 구성해서는 충분하지 않습니다. 학습용 `*`는 쿠키를 사용하는 credentialed CORS와 함께 사용할 수 없습니다.

### 3.3 선택: 개별 사용자 조회

1. `/users` 선택 → Create resource → 이름 `id`, 경로 `{id}`로 `/users/{id}`를 만듭니다.
2. **GET** 메서드를 같은 Lambda 프록시 통합으로 생성합니다.
3. 이 리소스에도 CORS를 켜서 **GET·OPTIONS**를 허용합니다.
4. 배포 후 `/users/user001?profileType=detailed`로 조회합니다. 기본 basic은 id/name/email, detailed는 전체 항목을 반환합니다. 없는 id는 404입니다.

## 태스크 4: dev 배포와 API 테스트

### 4.1 배포와 URL 기록

1. **Deploy API → New stage → Stage name: dev → Deploy**.
2. **Stages → dev**의 **Invoke URL**을 복사합니다.
3. 아래 두 주소를 기록합니다. 대괄호 부분을 본인 값으로 바꿉니다.

| 구분 | URL |
|---|---|
| Invoke URL | https://[api-id].execute-api.ap-northeast-2.amazonaws.com/dev |
| 사용자 API URL(JSON) | https://[api-id].execute-api.ap-northeast-2.amazonaws.com/dev/users |

**리소스·메서드·통합·CORS를 변경하면 dev에 다시 배포해야 합니다.** Lambda 코드 변경은 Lambda Deploy가 필요합니다.

### 4.2 콘솔 GET/POST 테스트

1. **Resources → /users → GET → Test → Test**에서 HTTP 200과 사용자 목록을 확인합니다.
2. **POST → Test**의 Request body에 아래 JSON을 넣고 실행합니다.

```json
{"id":"user003","name":"박민수","email":"park@example.com","age":28,"department":"소프트웨어학과"}
```

3. 새 id면 상태 **201**, 본문 `{"message":"사용자 생성 성공","id":"user003"}`를 확인합니다. 같은 id로 재실행하면 전체 교체 **200**입니다.
4. GET을 다시 실행하여 user003이 보이는지 확인합니다.
5. `{"id":"invalid-user"}`로 POST하면 필수 값 누락 **400**이어야 합니다.
6. 브라우저 주소창에 **사용자 API URL**을 붙여넣어 GET JSON을 확인합니다. 콘솔 Test는 배포된 공개 URL 테스트를 대신하지 않습니다.

프록시 응답의 statusCode는 실제 HTTP 상태가 됩니다. 외부 JSON 본문에 statusCode가 다시 들어 있어야 하는 것은 아닙니다.

## 태스크 5: HTML 웹 화면과 S3 URL

### 5.1 HTML 소스 저장과 로컬 확인

1. 아래 **index.html 전체 코드**를 복사하여 메모장 또는 VS Code에 붙여넣습니다. **다른 이름으로 저장 → 파일 이름: index.html → 파일 형식: 모든 파일 → 인코딩: UTF-8**로 저장합니다. `index.html.txt`가 되지 않도록 파일 확장자를 확인합니다. 코드 블록의 시작/끝 표시인 백틱 세 개는 파일에 넣지 않습니다.
2. 브라우저에서 파일을 엽니다. **API 연결 주소** 입력란에 태스크 4의 **/dev/users 전체 API URL**을 붙여넣습니다.
3. **연결 확인 · 사용자 조회**를 누르면 상태·사용자 표가 표시됩니다.
4. **사용자 등록 후 확인**을 눌러 POST와 GET 재조회를 확인합니다. 같은 테스트 ID는 전체 교체합니다. 새 항목을 만들려면 **새 테스트 ID**를 누릅니다.

HTML에는 AWS 키를 넣지 않습니다. 이 HTML은 공개 REST API만 호출합니다. 브라우저의 로컬 파일 제한으로 호출이 실패하면 아래 S3 HTTPS URL에서 테스트합니다.

#### index.html 전체 코드

API 연결 주소는 실행한 화면의 입력란에 `/dev/users`까지 입력합니다. 코드에 AWS 키나 계정 비밀번호를 넣지 않습니다. 파일을 저장한 뒤 브라우저로 열거나 아래 S3 업로드 절차를 진행합니다.

```html
<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CA9-3 사용자 관리</title>
<style>*{box-sizing:border-box}body{margin:0;background:#eef3fa;color:#182b49;font:16px system-ui,sans-serif}main{max-width:1100px;margin:28px auto;padding:20px}header{background:#142b4e;color:white;padding:28px;border-radius:18px}h1{margin:6px 0;font-size:30px}small{opacity:.8}.card{background:white;border:1px solid #dce5f2;border-radius:16px;padding:24px;margin-top:18px;box-shadow:0 5px 20px #19365c08}.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}label{display:block;font-weight:600;margin-bottom:6px}input{font:inherit;width:100%;padding:12px;border:1px solid #cbd6e5;border-radius:8px}button{font:inherit;border:0;border-radius:9px;padding:12px 20px;background:#2563eb;color:white;cursor:pointer;margin:10px 8px 0 0}button:disabled{opacity:.5;cursor:wait}.muted{color:#61738c}#status{padding:14px;background:#edf4ff;border-radius:8px;margin:14px 0;white-space:pre-wrap}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:13px;border-bottom:1px solid #e4eaf3}th{background:#f5f8fc}.table-wrap{overflow:auto}details{margin-top:16px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f3f6fa;padding:14px}@media(max-width:650px){.grid{grid-template-columns:1fr}main{padding:10px}h1{font-size:24px}}</style>
<main><header><small>CLOUD ARCHITECTURE · WEEK 9-3</small><h1>서버리스 사용자 관리</h1><p>웹 브라우저 → API Gateway → Lambda → DynamoDB</p></header>
<section class="card"><label for="endpoint">API 연결 주소</label><input id="endpoint" type="url" placeholder="https://[api-id].execute-api.ap-northeast-2.amazonaws.com/dev/users"><button id="refresh">연결 확인 · 사용자 조회</button><div id="status" role="status">연결 준비 중…</div><p class="muted">이 화면은 브라우저에서 API를 직접 호출합니다. JSON 데이터는 아래 사용자 표로 표시됩니다.</p></section>
<section class="card"><h2>사용자 등록</h2><p class="muted">실습용 정보만 입력하세요. 같은 ID로 등록하면 기존 항목 전체가 교체됩니다.</p><form id="form"><div class="grid"><div><label for="uid">사용자 ID</label><input id="uid" required readonly></div><div><label for="uname">이름</label><input id="uname" value="웹실습 사용자" required maxlength="100"></div><div><label for="email">이메일</label><input id="email" type="email" value="web-lab@example.com" required></div><div><label for="age">나이</label><input id="age" type="number" min="0" max="150" step="1" value="28" required></div><div><label for="dept">학과·부서</label><input id="dept" value="소프트웨어학과"></div></div><button type="submit">사용자 등록 후 확인</button><button type="button" id="newid">새 테스트 ID</button></form></section>
<section class="card"><h2>사용자 목록 <span id="count">—</span></h2><div class="table-wrap"><table><thead><tr><th>ID</th><th>이름</th><th>이메일</th><th>나이</th><th>학과·부서</th></tr></thead><tbody id="users"></tbody></table></div><details><summary>원본 JSON 응답 보기</summary><pre id="raw"></pre></details></section></main>
<script>
(()=>{const $=id=>document.getElementById(id);$('endpoint').value='';let busy=false;
function newId(){$('uid').value='ca93-web-'+(crypto.randomUUID?crypto.randomUUID().replaceAll('-',''):Math.random().toString(36).slice(2)).slice(0,12)}
function status(s){$('status').textContent=s}
function setBusy(v){busy=v;document.querySelectorAll('button').forEach(b=>b.disabled=v)}
function url(){const u=new URL($('endpoint').value.trim());if(u.protocol!=='https:'||!u.pathname.endsWith('/users'))throw Error('HTTPS 주소와 /users 경로를 확인하세요.');return u.href}
async function request(method,payload){const start=performance.now();const r=await fetch(url(),{method,mode:'cors',credentials:'omit',headers:payload?{'Content-Type':'application/json'}:{},body:payload?JSON.stringify(payload):undefined,signal:AbortSignal.timeout(30000)});const text=await r.text();let data;try{data=JSON.parse(text)}catch{throw Error('JSON이 아닌 응답: HTTP '+r.status)}$('raw').textContent=JSON.stringify(data,null,2);if(!r.ok)throw Error('HTTP '+r.status+': '+(data.error||data.message||text));return {data,code:r.status,ms:Math.round(performance.now()-start)}}
function render(data){if(!Array.isArray(data.users))throw Error('응답에 users 배열이 없습니다.');$('users').replaceChildren();for(const u of data.users){const tr=document.createElement('tr');for(const key of ['id','name','email','age','department']){const td=document.createElement('td');td.textContent=u[key]??'—';tr.appendChild(td)}$('users').appendChild(tr)}$('count').textContent='('+data.users.length+'명)'}
async function load(){if(busy)return;setBusy(true);status('조회 중…');try{const r=await request('GET');render(r.data);status('✅ 연결 성공 · GET HTTP '+r.code+' · '+r.ms+'ms · '+new Date().toLocaleTimeString())}catch(e){status('❌ '+e.message+'\n연결 주소·배포 상태·CORS 설정을 확인하세요.')}finally{setBusy(false)}}
$('refresh').onclick=load;$('newid').onclick=newId;$('form').onsubmit=async e=>{e.preventDefault();if(busy)return;setBusy(true);status('등록 중…');try{const payload={id:$('uid').value,name:$('uname').value.trim(),email:$('email').value.trim(),age:Number($('age').value),department:$('dept').value.trim()};const p=await request('POST',payload);const r=await request('GET');render(r.data);if(!r.data.users.some(u=>u.id===payload.id))throw Error('등록 후 재조회에서 ID를 찾지 못했습니다.');status('✅ '+p.data.message+' · POST HTTP '+p.code+' · 저장 후 재조회 확인 완료')}catch(e){status('❌ '+e.message)}finally{setBusy(false)}};newId();status('API 연결 주소를 입력한 뒤 사용자 조회를 누르세요.');})();
</script></html>
```

### 5.2 AWS 콘솔에서 HTML 업로드

1. **S3 → Create bucket → General purpose**, 서울 리전, 전역 고유 버킷 이름을 사용합니다. 예: `ca9-3-users-web-본인계정ID-ap-northeast-2`.
2. **Object Ownership: Bucket owner enforced(ACL disabled)**와 기본 암호화 **SSE-S3**를 사용합니다. 실습용 전용 버킷을 생성합니다.
3. 버킷의 **Objects → Upload → Add files**에서 index.html을 루트에 업로드합니다.
4. 객체를 선택하고 **Properties → Metadata**에서 Content-Type이 `text/html`인지 확인합니다. 다른 값이면 **Actions → Edit metadata**에서 System defined Content-Type을 `text/html; charset=utf-8`로 수정합니다.
5. 버킷 **Permissions → Block public access → Edit**에서 정책을 통한 공개 읽기에 관련된 두 항목을 해제합니다. **BlockPublicPolicy**, **RestrictPublicBuckets**가 꺼져야 하며 ACL 관련 두 차단은 켜 둡니다. 콘솔 설명을 읽어 정책 관련 항목인지 확인하고 변경을 저장합니다.
6. **Bucket policy → Edit**에 아래 정책을 넣되 `YOUR_BUCKET_NAME`을 실제 이름으로 바꿉니다. index.html 하나만 공개합니다.

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadWebIndexOnly",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/index.html"
  }]
}
```

계정·조직 수준 공개 접근 차단이 적용되어 있으면 버킷 설정만으로 공개되지 않습니다. 조직의 차단을 임의로 해제하지 말고 관리자에게 확인하거나 CloudFront와 OAC 방식으로 구성합니다.

### 5.3 웹 URL 표시와 최종 확인

1. **S3 → Objects → index.html → Properties → Object URL**을 복사합니다.
2. 이 실습은 HTTPS **객체 URL**로 HTML을 엽니다. Static website hosting은 켤 필요가 없습니다.
3. 아래 두 주소를 각각 메모하고 링크를 브라우저에서 엽니다.

| 출력/기록할 이름 | 실제 주소 형식 | 정상 결과 |
|---|---|---|
| **웹 화면 URL(HTML)** | https://YOUR_BUCKET_NAME.s3.ap-northeast-2.amazonaws.com/index.html | 사용자 관리 HTML 화면, HTTP 200 |
| **API URL(JSON)** | https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/dev/users | 사용자 목록 JSON, HTTP 200 |

4. 웹 화면에서 본인 API URL을 입력하고 조회·등록합니다. AWS 콘솔의 DynamoDB에서도 새 테스트 ID가 저장되었는지 확인합니다.
5. 웹 화면 403이면 Object URL·버킷 정책·공개 접근 차단·파일 이름을 확인합니다. 다운로드만 된다면 Content-Type과 Content-Disposition을 확인하고 attachment 설정을 제거합니다.
6. 웹 화면은 열리지만 조회/등록이 실패하면 브라우저 개발자 도구 Network에서 API 요청과 OPTIONS 응답을 확인합니다. S3 버킷 CORS를 바꾸는 것으로 API Gateway CORS 문제가 해결되지는 않습니다.

> [!IMPORTANT]
> API URL을 열어 JSON이 보이는 것은 정상입니다. 사용자 관리 화면을 보려면 S3의 **index.html Object URL**을 열어야 합니다.
> API URL을 수정한 뒤 별도 재표시 탭을 실행할 필요 없이 화면 입력란에서 주소를 바꾸고 조회 버튼을 누르면 됩니다.

## 태스크 6: CloudWatch 확인과 문제 해결

1. **Lambda → Monitor → View CloudWatch logs**에서 `/aws/lambda/CloudArchitect-Lab-UsersAPI` 로그 그룹을 확인합니다.
2. 최근 로그 스트림에서 요청 시간과 오류를 확인합니다. 로그 생성/지표 반영에는 지연이 있습니다.
3. **CloudWatch → Metrics → AWS/Lambda**에서 함수의 Invocations, Errors, Duration을 확인합니다. Lambda가 예외를 잡아 HTTP 500 객체를 반환하면 Errors가 0일 수 있으므로 API 응답과 로그를 함께 봅니다.

| 증상 | 확인할 설정 |
|---|---|
| AccessDenied | 실패한 서비스·작업의 IAM 권한. 권한 오류는 리소스가 없다는 뜻이 아닙니다 |
| Lambda 초기화 오류 | TABLE_NAME 환경 변수, 테이블 리전, Python 코드 및 Handler |
| Lambda 500 | 실행 역할의 GetItem/PutItem/Scan 권한, 로그의 예외 |
| Missing Authentication Token | URL의 dev/users 경로, 메서드, dev 재배포 |
| Invalid permissions on Lambda | API Gateway 호출 권한의 API ID·메서드·경로 |
| 브라우저만 CORS 오류 | OPTIONS·Lambda 실제 응답·Gateway 4XX/5XX CORS, 재배포 |
| 재실행 POST 200 | 같은 id를 전체 교체한 정상 응답 |
| 웹 화면 403 | S3 index.html 공개 읽기 정책과 버킷/계정 공개 차단 |

## 리소스 정리

실습에서 **새로 만든 전용 리소스만** 삭제합니다. 이전 실습에서 재사용한 리소스는 소유자와 의존 관계를 확인합니다. 코랩/원본 cleanup 스크립트만으로 S3·API Gateway·로그가 모두 정리되는 것은 아닙니다.

1. **S3**: index.html과 이 실습용 객체/백업을 삭제하거나 버킷을 Empty한 뒤 전용 버킷을 삭제합니다. 버전 관리를 켰다면 객체 버전·삭제 마커도 정리합니다. 버킷을 보존한다면 공개 정책을 제거하고 정책 기반 공개 접근 차단을 다시 켭니다.
2. **API Gateway**: 정확한 API ID의 REST API를 선택하고 Delete API를 실행합니다. 스테이지·배포·리소스도 함께 제거됩니다.
3. **Lambda**: 전용 함수 CloudArchitect-Lab-UsersAPI를 삭제합니다. 재사용 API에 실습용 호출 권한만 추가했다면 해당 권한을 확인하고 제거합니다.
4. **DynamoDB**: 전용 테이블 CloudArchitect-Lab-Users를 삭제하고 삭제 완료를 기다립니다.
5. **IAM**: 전용 역할에 붙인 실습 인라인 정책과 관리형 정책을 확인하고 역할을 삭제합니다. 다른 함수가 사용하는 역할은 보존합니다.
6. **CloudWatch Logs**: 전용 로그 그룹 /aws/lambda/CloudArchitect-Lab-UsersAPI를 삭제합니다.
7. 각 서비스에서 정확한 이름·리전·API ID로 부재를 확인합니다. 태그 검색 결과가 없다는 이유만으로 정리 완료로 판단하지 않습니다.

## 💡 핵심 포인트 정리

🌐
REST API
/users의 GET·POST를 Lambda 프록시로 연결하고 dev에 배포했습니다.

🔐
권한과 CORS
실행 역할·Lambda 호출 정책·브라우저 CORS의 역할을 구분했습니다.

🖥️
HTML과 API URL
S3 index.html은 화면을, API Gateway /dev/users는 JSON 데이터를 제공합니다.

## 📚 참고:

- [AWS: Lambda 프록시 통합](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html)
- [AWS: REST API CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
- [AWS: S3 웹 공개 접근 권한](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteAccessPermissionsReqd.html)
