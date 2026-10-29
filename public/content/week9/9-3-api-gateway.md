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

**2026-10-29 개정.** 코랩에서 구성한 서비스를 AWS Management Console에서 직접 설정합니다. 설치 스크립트나 코랩 실행 없이 완료할 수 있습니다. 화면의 버튼 이름은 콘솔 언어와 업데이트에 따라 다를 수 있습니다.

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
> - [Lambda 코드: lambda_function.py](/files/week9/console-26/lambda_function.py) — 다운로드 후 텍스트 편집기로 열어 Lambda 코드 편집기에 복사합니다.
> - [웹 화면: index.html](/files/week9/console-26/index.html) — 다운로드 후 S3에 업로드합니다. 화면에서 본인 API URL을 입력합니다.
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
4. **Code → lambda_function.py**의 전체 내용을 다운로드한 [Lambda 코드](/files/week9/console-26/lambda_function.py)로 교체하고 **Deploy**합니다. 파일을 ZIP으로 만들 필요는 없습니다.
5. **Configuration → Environment variables → Edit**에서 다음 두 값을 저장합니다.

| 키 | 값 |
|---|---|
| TABLE_NAME | CloudArchitect-Lab-Users |
| ALLOWED_ORIGIN | * |

6. **Configuration → General configuration → Edit**에서 Timeout **30초**, Memory **128MB**를 설정합니다.
7. Runtime settings의 Handler가 `lambda_function.lambda_handler`인지 확인합니다. **Configuration → Permissions**에서 실행 역할도 확인합니다.

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

### 5.1 HTML 다운로드와 로컬 확인

1. [index.html 다운로드](/files/week9/console-26/index.html)를 우클릭하여 링크를 다른 이름으로 저장합니다. 파일 이름은 `index.html`, 형식은 HTML로 보관합니다.
2. 브라우저에서 파일을 엽니다. **API 연결 주소** 입력란에 태스크 4의 **/dev/users 전체 API URL**을 붙여넣습니다.
3. **연결 확인 · 사용자 조회**를 누르면 상태·사용자 표가 표시됩니다.
4. **사용자 등록 후 확인**을 눌러 POST와 GET 재조회를 확인합니다. 같은 테스트 ID는 전체 교체합니다. 새 항목을 만들려면 **새 테스트 ID**를 누릅니다.

HTML에는 AWS 키를 넣지 않습니다. 이 HTML은 공개 REST API만 호출합니다. 브라우저의 로컬 파일 제한으로 호출이 실패하면 아래 S3 HTTPS URL에서 테스트합니다.

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
