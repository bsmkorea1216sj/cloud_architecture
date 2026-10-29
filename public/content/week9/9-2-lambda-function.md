---
title: 'AWS Lambda 함수 개발 2(26)'
week: 9
session: 2
awsServices:
  - AWS Lambda
learningObjectives:
  - AWS Lambda의 기본 개념과 주요 특징을 이해할 수 있습니다.
  - AWS Lambda 함수를 개발하고 이벤트 소스를 구성할 수 있습니다.
  - AWS Lambda 함수를 배포하고 모니터링할 수 있습니다.
---

> [!NOTE]
> **2(26) 수정본 · 2026-10-29 반영**
>
> 기존 자료를 백업한 뒤 교안과 다운로드 ZIP을 수정했습니다.
> - Python 3.12 기준 통일 및 코랩 실행 순서·AWS CLI 설치 안내
> - Scan 페이지 처리, 필수 입력 검증, 누락 필드 처리
> - 신규 생성 201 / 기존 항목 전체 교체 200 구분과 재실행 결과 설명
> - REST API v1.0 이벤트 및 실제 HTTP 연결 범위 명시
> - Duration·Init Duration·Errors 설명 정정
> - IAM 정책·로그 그룹 정리와 리소스별 삭제 확인 보완
> - 모의 API 20개 검사, ZIP 코드 일치·셸 구문·사이트 빌드 검사 통과
>
> [수정 전 원본 백업](https://github.com/bsmkorea1216sj/cloud_architecture/tree/backup/week9-2-before-fix-20261029)


> [!TIP]
> 이 실습에서는 서버 없이 코드를 실행하는 **AWS Lambda** 함수를 생성하고, **DynamoDB**와 연동하여 사용자 데이터를 관리하는 **서버리스 API 처리 함수**를 구현합니다. 이번 차시는 Lambda 테스트 이벤트로 동작을 확인하며, 실제 HTTP 호출 URL은 9-3 API Gateway 실습에서 생성합니다.

> [!DOWNLOAD]
> [week9-2-lambda-function.zip](/files/week9/week9-2-lambda-function.zip)
>
> - `setup-9-2.sh` - 사전 환경 구축 스크립트 (Amazon DynamoDB 테이블, AWS IAM 역할, 샘플 데이터 생성)
> - `cleanup-9-2.sh` - 리소스 정리 스크립트
> - `lambda_function.py` - 아래 교안과 동일한 검증·페이지 처리 코드
> - `README.md` - 실행 순서와 재실행 시 결과 안내
> - 태스크 0: 사전 환경 구축 (setup-9-2.sh 실행)

> [!CONCEPT] AWS Lambda란?
>
> AWS Lambda는 서버를 프로비저닝하거나 관리하지 않고 코드를 실행할 수 있는 **서버리스 컴퓨팅** 서비스입니다.
>
> - **서버리스**: 서버 관리가 필요 없으며, 코드가 실행될 때만 컴퓨팅 리소스가 할당됩니다
> - **이벤트 기반**: API Gateway 요청, S3 업로드, DynamoDB 변경 등 이벤트에 의해 자동으로 실행됩니다
> - **자동 확장**: 동시 요청 수에 따라 자동으로 확장되며, 별도의 스케일링 설정이 필요 없습니다
> - **종량제 과금**: 함수 실행 횟수와 실행 시간(밀리초 단위)에 따라 과금됩니다
>
> 이 실습에서는 Lambda 함수로 DynamoDB 테이블의 사용자 데이터를 조회하고 생성하는 RESTful API를 구현합니다.

## 태스크 0: 사전 환경 구축

> [!NOTE]
> 실습을 시작하기 전에 AWS 콘솔 우측 상단에서 현재 리전을 확인하세요. 올바른 리전에서 작업하고 있는지 반드시 확인해야 합니다.

1. 위 DOWNLOAD 섹션에서 `week9-2-lambda-function.zip` 파일을 다운로드합니다.

2. AWS Management Console에 로그인한 후 상단의 **CloudShell** 아이콘을 선택하여 CloudShell을 실행합니다.

3. CloudShell 상단의 **Actions** > **Upload file**을 선택하여 다운로드한 ZIP 파일을 업로드합니다.

4. 업로드가 완료되면 다음 명령어로 압축을 해제합니다:

```bash
unzip week9-2-lambda-function.zip
```

5. setup 스크립트에 실행 권한을 부여하고 실행합니다:

```bash
chmod +x setup-9-2.sh cleanup-9-2.sh
./setup-9-2.sh
```

6. 스크립트 실행 중 생성 계획이 표시되면 `y`를 입력하여 진행합니다.

> [!NOTE]
> 사전 환경 구축에 약 1-2분이 소요됩니다. 스크립트가 완료될 때까지 기다립니다.

7. 스크립트가 완료되면 출력 메시지에서 다음 리소스가 생성되었는지 확인합니다:

| 리소스 | 이름 |
|--------|------|
| DynamoDB 테이블 | CloudArchitect-Lab-Users |
| IAM 역할 | CloudArchitect-Lab-LambdaExecutionRole |
| 샘플 데이터 | 사용자 2개 레코드 (김철수, 이영희) |

✅ **태스크 완료**: 사전 환경 구축이 완료되었습니다.

> [!TIP]
> **CloudShell 파일 정리**: 실습이 완전히 종료된 후, 업로드한 ZIP 파일과 스크립트를 삭제하여 CloudShell 스토리지를 정리할 수 있습니다:
> ```bash
> rm -f week9-2-lambda-function.zip setup-9-2.sh cleanup-9-2.sh
> ```
> CloudShell 스토리지는 리전별로 1GB까지 무료 제공되며, 파일 정리는 선택사항입니다.


## 태스크 1: 사전 구축된 환경 확인

> [!CONCEPT] Amazon DynamoDB와 AWS Lambda 연동
>
> Lambda 함수가 DynamoDB에 접근하려면 **IAM 역할**이 필요합니다. IAM 역할에 DynamoDB 읽기/쓰기 권한과 CloudWatch Logs 권한을 부여하면, Lambda 함수가 액세스 키 없이 안전하게 데이터베이스에 접근할 수 있습니다.

### 1.1 Amazon DynamoDB 테이블 확인

8. 상단 검색창에서 `DynamoDB`를 검색하고 **DynamoDB**를 선택합니다.

9. 왼쪽 메뉴에서 **Tables**를 선택합니다.

10. **CloudArchitect-Lab-Users** 테이블이 생성되어 있는지 확인합니다.

11. **CloudArchitect-Lab-Users** 테이블을 선택하여 상세 정보를 확인합니다.

12. **General information** 섹션에서 다음 설정을 확인합니다:
- **Partition key**: `id` (String)
- **Table status**: "Active"

13. **Explore table items** 버튼을 선택하여 샘플 데이터를 확인합니다.

14. 김철수(user001), 이영희(user002) 레코드가 있는지 확인합니다. 각 항목의 `id`, `name`, `email`도 확인하세요. ZIP 원본은 이메일을 포함하지만 이전 코랩 통합 스크립트로 생성한 데이터에는 이메일이 없을 수 있습니다. 재사용 테이블에서는 샘플이 자동 보충되지 않을 수 있으므로 누락 필드를 확인·보완합니다.

### 1.2 AWS IAM 역할 확인

15. 상단 검색창에서 `IAM`을 검색하고 **IAM**을 선택합니다.

16. 왼쪽 메뉴에서 **Roles**를 선택합니다.

17. 검색창에 `CloudArchitect-Lab`을 입력하여 **CloudArchitect-Lab-LambdaExecutionRole**을 찾습니다.

18. 해당 역할을 선택합니다.

19. **Permissions** 탭에서 연결된 정책을 확인합니다:
- DynamoDB 읽기/쓰기 권한
- CloudWatch Logs 권한

> [!TIP]
> IAM 역할의 **Trust relationships** 탭을 선택하면 `lambda.amazonaws.com`이 신뢰할 수 있는 엔터티로 설정되어 있는 것을 확인할 수 있습니다. 이 설정이 있어야 Lambda 서비스가 이 역할을 사용할 수 있습니다.

✅ **태스크 완료**: DynamoDB 테이블과 IAM 역할이 정상적으로 구축되어 있습니다.


## 태스크 2: AWS Lambda 함수 생성

> [!CONCEPT] AWS Lambda 함수 구성 요소
>
> Lambda 함수는 다음 요소로 구성됩니다:
>
> - **핸들러(Handler)**: 이벤트를 처리하는 진입점 함수입니다 (예: `lambda_function.lambda_handler`)
> - **런타임(Runtime)**: 코드 실행 환경입니다 (Python, Node.js, Java 등)
> - **실행 역할(Execution Role)**: 함수가 AWS 서비스에 접근할 때 사용하는 IAM 역할입니다
> - **메모리/타임아웃**: 함수에 할당되는 메모리(128MB~10GB)와 최대 실행 시간(최대 15분)입니다

### 2.1 AWS Lambda 함수 생성 시작

20. 상단 검색창에서 `Lambda`를 검색하고 **Lambda**를 선택합니다.

21. 왼쪽 메뉴에서 **Functions**를 선택하고 [[Create function]] 버튼을 클릭합니다.

22. **Author from scratch**를 선택합니다.

23. **Function name**에 `CloudArchitect-Lab-UsersAPI`를 입력합니다.

24. **Runtime**에서 **Python 3.12**를 선택합니다. 코랩 배포 코드의 `python3.12`와 통일한 실습 기준입니다.

### 2.2 실행 역할 설정

25. **Change default execution role** 섹션을 확장합니다.

26. **Execution role**에서 **Use an existing role**을 선택합니다.

27. **Existing role** 드롭다운에서 **CloudArchitect-Lab-LambdaExecutionRole**을 선택합니다.

28. [[Create function]] 버튼을 클릭합니다.

29. 함수 상세 페이지가 표시되면 상단에 "Successfully created the function" 메시지를 확인합니다.

> [!NOTE]
> 함수 상태가 **Active**인지 상단의 **Function overview** 섹션에서 확인합니다. Active 상태여야 함수를 실행할 수 있습니다.

✅ **태스크 완료**: DynamoDB 접근 권한이 있는 Lambda 함수가 생성되었습니다.


## 태스크 3: AWS Lambda 함수 코드 작성

### 3.1 함수 코드 구현

30. 생성된 Lambda 함수 페이지에서 **Code** 탭을 선택합니다.

31. 코드 편집기에서 기본 코드(`lambda_function.py`)를 모두 선택하고 다음 코드로 교체합니다:

```python
"""Week 9-2: REST API proxy (payload v1.0), small-table lab."""
import json
import logging
from decimal import Decimal
import boto3

logger = logging.getLogger(__name__)
table = boto3.resource('dynamodb').Table('CloudArchitect-Lab-Users')

def decimal_default(value):
    if isinstance(value, Decimal):
        return int(value) if value == value.to_integral_value() else float(value)
    raise TypeError('Unsupported JSON type')

def reply(status, body, headers=None):
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', **(headers or {})},
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
                'message': 'CloudArchitect Week 9-2 - Lambda와 DynamoDB 연동',
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

> [!NOTE]
> 이 코드는 **REST API Lambda 프록시 통합의 payload v1.0** 이벤트를 사용합니다. HTTP API v2.0은 `requestContext.http.method`, `rawPath` 등 필드가 다르므로 별도 변환이 필요합니다.
>
> `Scan`은 한 요청에 최대 1MB를 읽습니다. 위 코드는 `LastEvaluatedKey`로 후속 페이지를 합치며, `count`는 합친 항목 수입니다. 소규모 실습용이므로 운영에서는 응답 크기·타임아웃 한도를 고려해 API 페이지 나누기를 구현하세요. `Query`는 파티션 키 조건에 맞는 조회용이며 전체 목록 조회를 그대로 대체하지 않습니다.
>
> `PutItem`은 동일 ID의 항목 전체를 교체합니다. 생략한 기존 속성은 유지되지 않습니다. 부분 수정은 `UpdateItem`을 사용합니다. 최초 생성은 **201**, 기존 항목 교체는 **200**을 반환합니다. `Decimal` 소수의 JSON 출력 변환은 정밀도를 잃을 수 있으므로 금액 등 정밀 수치는 문자열 직렬화 정책을 별도로 정하세요.

32. [[Deploy]] 버튼을 클릭하여 코드를 배포합니다.

33. 상단에 "Successfully updated the function" 메시지가 표시되는지 확인합니다.

> [!NOTE]
> 코드에서 `boto3.resource('dynamodb')`는 AWS SDK를 통해 DynamoDB에 연결합니다. Lambda 실행 역할에 DynamoDB 권한이 있으므로 별도의 액세스 키 설정이 필요 없습니다.

✅ **태스크 완료**: DynamoDB와 연동하는 사용자 프로필 관리 함수가 배포되었습니다.


## 태스크 4: AWS Lambda 함수 테스트

> [!CONCEPT] Lambda 테스트 이벤트
>
> Lambda 함수는 **이벤트(JSON)**를 입력으로 받아 처리합니다. 콘솔에서 테스트 이벤트를 직접 작성하여 함수를 실행할 수 있습니다. API Gateway와 연동할 때 전달되는 이벤트 구조를 미리 시뮬레이션하여 함수가 올바르게 동작하는지 검증합니다.

### 4.1 특정 사용자 프로필 조회 테스트

34. **Test** 탭을 선택합니다.

35. **Create new event**를 선택합니다.

36. **Event name**에 `GetUserProfile`을 입력합니다.

37. 이벤트 JSON을 다음으로 교체합니다:

```json
{
  "httpMethod": "GET",
  "path": "/users/user001",
  "pathParameters": {
    "id": "user001"
  },
  "queryStringParameters": {
    "profileType": "basic"
  }
}
```

> [!NOTE]
> 테스트 이벤트의 각 필드 설명:
>
> | 필드 | 설명 |
> |------|------|
> | `httpMethod` | HTTP 메서드 (GET, POST 등) |
> | `path` | API 경로 (/users/user001) |
> | `pathParameters` | URL 경로에서 추출한 파라미터 |
> | `queryStringParameters` | URL 쿼리 문자열 (?profileType=basic) |

38. [[Save]] 버튼을 클릭하여 테스트 이벤트를 저장합니다.

39. [[Test]] 버튼을 클릭하여 함수를 실행합니다.

40. 실행 결과에서 **Execution result: succeeded** 메시지를 확인합니다. 이는 Lambda 실행 자체의 완료 상태입니다. 예외를 잡아 `statusCode: 500`을 반환해도 실행은 성공으로 표시될 수 있으므로 응답 코드까지 검사합니다.

41. 반환 객체의 최상위 `statusCode`가 `200`인지 확인하고, JSON 문자열인 `body`를 해석하여 사용자 프로필을 확인합니다.

> [!OUTPUT]
> ```json
> {
>   "statusCode": 200,
>   "body": "{\"message\": \"사용자 프로필 조회 성공 (basic)\", \"user\": {\"id\": \"user001\", \"name\": \"김철수\", \"email\": \"kim@example.com\"}}"
> }
> ```

### 4.2 전체 사용자 목록 조회 테스트

42. **Test** 탭에서 **Create new event**를 선택합니다.

43. **Event name**에 `GetAllUsers`를 입력합니다.

44. 이벤트 JSON을 다음으로 교체합니다:

```json
{
  "httpMethod": "GET",
  "path": "/users"
}
```

45. [[Save]] 버튼을 클릭한 후 [[Test]] 버튼을 클릭합니다.

46. 응답에서 `statusCode: 200`과 사용자 목록을 확인합니다. 아래 2명은 샘플만 있는 최초 실행 예시입니다. 재실행·공유 테이블에서는 항목 수와 순서가 다를 수 있습니다.

> [!OUTPUT]
> ```json
> {
>   "statusCode": 200,
>   "body": "{\"message\": \"CloudArchitect Week 9-2 - Lambda와 DynamoDB 연동\", \"users\": [...], \"count\": 2}"
> }
> ```

### 4.3 사용자 생성 테스트

47. **Test** 탭에서 **Create new event**를 선택합니다.

48. **Event name**에 `CreateUser`를 입력합니다.

49. 이벤트 JSON을 다음으로 교체합니다:

```json
{
  "httpMethod": "POST",
  "path": "/users",
  "body": "{\"id\": \"user003\", \"name\": \"박민수\", \"email\": \"park@example.com\", \"age\": 28, \"department\": \"소프트웨어학과\"}"
}
```

50. [[Save]] 버튼을 클릭한 후 [[Test]] 버튼을 클릭합니다.

51. `user003`이 없었다면 `statusCode: 201`과 "사용자 생성 성공"을 확인합니다. 이미 있었다면 `statusCode: 200`과 "사용자 전체 교체 성공"이 정상입니다.

> [!OUTPUT]
> ```json
> {
>   "statusCode": 201,
>   "body": "{\"message\": \"사용자 생성 성공\", \"id\": \"user003\"}"
> }
> ```

52. 상단 검색창에서 `DynamoDB`를 검색하고 **DynamoDB**를 선택합니다. 왼쪽 메뉴에서 **Tables**를 선택하고 **CloudArchitect-Lab-Users** 테이블을 선택한 후 **Explore table items**를 선택합니다.

53. 박민수(user003) 레코드가 추가되었는지 확인합니다.

54. 상단 검색창에서 `Lambda`를 검색하고 **Lambda**를 선택합니다. 왼쪽 메뉴에서 **Functions**를 선택하고 **CloudArchitect-Lab-UsersAPI** 함수를 선택합니다.

55. **Test** 탭에서 이벤트 드롭다운에서 `GetAllUsers`를 선택하고 [[Test]] 버튼을 클릭합니다.

56. 최초 2명만 있던 테이블이라면 사용자 수가 3명(`count: 3`)이 됩니다. 이미 `user003`이 존재했다면 수는 증가하지 않습니다. 기존 데이터는 유지하고 반환 목록에서 `user003`을 확인합니다.

### 4.4 잘못된 요청과 누락 사용자 확인

아래 이벤트도 Test에서 실행해 상태 코드를 확인합니다. 오류 응답도 Lambda 실행 자체는 succeeded로 표시될 수 있습니다.

| 입력 | 예상 코드 |
|---|---|
| POST /users, body가 잘못된 JSON | 400 |
| POST /users, id·name·email 누락 또는 빈 문자열 | 400 |
| POST /users, id가 숫자 | 400 |
| GET /users/{id}, 존재하지 않는 id | 404 |
| GET /users/{id}, profileType이 basic·detailed 이외의 값 | 400 |
| GET /unknown | 404 |
| DELETE /users | 405 |
| POST /users, 추가 숫자 속성 score가 12.5 | 정상 생성 201 또는 전체 교체 200 |

✅ **태스크 완료**: 조회·생성·전체 교체와 입력 오류 처리를 테스트했습니다. 실제 HTTP 연결은 9-3에서 진행합니다.


## 태스크 5: 모니터링 및 로그 확인

### 5.1 AWS Lambda 메트릭 확인

57. Lambda 함수 페이지에서 **Monitor** 탭을 선택합니다.

58. 다음 메트릭 그래프를 확인합니다:
- **Invocations**: 함수 호출 횟수
- **Duration**: 실행 시간 (밀리초)
- **Error count and success rate**: 오류 발생 횟수와 성공률

> [!TIP]
> **Duration**은 함수 실행 시간이며 콜드 스타트의 초기화 시간을 포함하지 않습니다. 초기화 시간은 로그의 `Init Duration`과 구분합니다. 첫 요청의 전체 응답 시간은 초기화로 길어질 수 있지만 항상 첫 요청이 가장 느리다고 단정하지 않습니다.
>
> **Errors**는 처리되지 않은 예외·런타임 오류 등 Lambda 실행 오류 지표입니다. 코드가 예외를 잡아 HTTP 500 형태의 객체를 반환하면 Errors에 잡히지 않을 수 있습니다. 응답 상태 코드와 애플리케이션 로그도 확인하세요. 코랩 직접 호출은 Lambda 메트릭을 만들지 않으며, 배포 후 실제 Lambda Invoke를 실행해야 합니다. 지표 반영에는 지연이 있을 수 있습니다.

### 5.2 Amazon CloudWatch Logs 확인

59. **Monitor** 탭에서 [[View CloudWatch logs]] 버튼을 클릭합니다.

60. CloudWatch Logs 콘솔에서 `/aws/lambda/CloudArchitect-Lab-UsersAPI` 로그 그룹이 표시됩니다.

61. 가장 최근 로그 스트림을 선택합니다.

62. 로그 이벤트에서 다음 정보를 확인합니다:
- **START**: 함수 실행 시작
- **END**: 함수 실행 종료
- **REPORT**: 실행 시간, 메모리 사용량, 과금 시간

> [!OUTPUT]
> ```
> REPORT RequestId: abc123-def456-...
> Duration: 45.23 ms
> Billed Duration: 46 ms
> Memory Size: 128 MB
> Max Memory Used: 67 MB
> ```

✅ **태스크 완료**: CloudWatch를 통해 Lambda 함수의 실행 상태와 성능을 확인했습니다.

## 리소스 정리

> [!WARNING]
> 실습 완료 후 **반드시** 리소스를 정리하여 불필요한 비용을 방지하세요.

### 방법 1: CloudShell에서 정리 스크립트 실행

1. AWS Management Console 상단의 **CloudShell** 아이콘을 선택합니다.

2. 다음 명령어로 정리 스크립트를 실행합니다:

```bash
./cleanup-9-2.sh
```

3. 삭제 확인 메시지가 표시되면 `y`를 입력하여 진행합니다.

4. 스크립트는 이름이 지정된 실습 Lambda 함수, DynamoDB 테이블, IAM 역할을 정리합니다. 수정된 ZIP은 해당 Lambda의 CloudWatch 로그 그룹도 정리합니다. 재사용한 테이블·역할이 다른 실습에서 사용 중이면 삭제하지 마세요.

> [!NOTE]
> 삭제 전 대상 계정·리전·리소스 이름을 확인하세요. 권한 부족 등으로 명령이 실패하면 정리가 완료된 것이 아닙니다. 아래에서 각 리소스의 부재를 확인합니다.

### 방법 2: 수동 삭제 (스크립트 실행이 불가능한 경우)

#### 태스크 1: AWS Lambda 함수 삭제

1. 상단 검색창에서 `Lambda`를 검색하고 **Lambda**를 선택합니다.

2. 왼쪽 메뉴에서 **Functions**를 선택합니다.

3. **CloudArchitect-Lab-UsersAPI** 함수를 선택하고 **Actions** > **Delete**를 선택합니다.

4. 확인 필드에 `delete`를 입력하고 [[Delete]]를 클릭합니다.

#### 태스크 2: Amazon DynamoDB 테이블 삭제

5. 상단 검색창에서 `DynamoDB`를 검색하고 **DynamoDB**를 선택합니다.

6. 왼쪽 메뉴에서 **Tables**를 선택합니다.

7. **CloudArchitect-Lab-Users** 테이블을 선택하고 **Delete**를 클릭합니다.

8. **Delete all CloudWatch alarms for this table** 체크박스를 선택합니다.

9. 확인 필드에 `confirm`을 입력하고 [[Delete]]를 클릭합니다.

#### 태스크 3: AWS IAM 역할 삭제

10. 상단 검색창에서 `IAM`을 검색하고 **IAM**을 선택합니다.

11. 왼쪽 메뉴에서 **Roles**를 선택합니다.

12. **CloudArchitect-Lab-LambdaExecutionRole**을 검색하여 선택합니다.

13. 실행 역할을 사용하는 Lambda 함수가 남아 있지 않은지 확인합니다. CLI/Boto3로 역할을 삭제할 때는 연결된 관리형 정책을 분리하고 인라인 정책도 삭제해야 합니다. 콘솔에서는 정책·연결 리소스를 확인한 후 **Delete** 버튼을 클릭합니다.

14. 확인 필드에 역할 이름을 입력하고 [[Delete]]를 클릭합니다.

#### 태스크 4: Amazon CloudWatch 로그 그룹 삭제

15. 상단 검색창에서 `CloudWatch`를 검색하고 **CloudWatch**를 선택합니다.

16. 왼쪽 메뉴에서 **Log groups**를 선택합니다.

17. `/aws/lambda/CloudArchitect-Lab-UsersAPI` 로그 그룹을 선택하고 **Actions** > **Delete log group(s)**를 선택합니다.

18. 확인 대화 상자에서 [[Delete]]를 클릭합니다.

#### 태스크 5: 최종 확인

19. Lambda 콘솔에서 서울 리전의 `CloudArchitect-Lab-UsersAPI`가 없는지 확인합니다.

20. DynamoDB 콘솔에서 같은 리전의 `CloudArchitect-Lab-Users`가 삭제 완료되었는지 확인합니다.

21. IAM 콘솔에서 `CloudArchitect-Lab-LambdaExecutionRole`이 없는지 확인합니다. IAM 역할은 리전별 리소스가 아닙니다.

22. CloudWatch Logs에서 서울 리전의 `/aws/lambda/CloudArchitect-Lab-UsersAPI`가 없는지 확인합니다.

23. Tag Editor 검색은 보조 확인에만 사용합니다. 생성 코드에는 `Name=CloudArchitect-Lab` 태그가 보장되지 않으므로 검색 결과가 없다는 이유로 삭제 완료를 판단하지 않습니다. CloudWatch 로그는 보존 기간을 설정하지 않았다면 자동 만료되지 않습니다.

✅ **리소스 정리 완료 기준**: 위 네 리소스의 부재를 각각 확인한 경우입니다.


## 💡 핵심 포인트 정리

⚙️
Lambda 함수 구성 요소
런타임(실행 언어), 핸들러(진입점 함수), 실행 역할(IAM), 메모리(128MB~10GB), 타임아웃(최대 15분)을 설정합니다.

🔐
IAM 역할 기반 권한
Lambda에 IAM 역할을 연결하면 액세스 키 없이도 다른 AWS 서비스(DynamoDB, S3 등)에 안전하게 접근할 수 있습니다.

⚡
서버리스 컴퓨팅
서버를 직접 관리하지 않고 코드만 작성하면 AWS가 자동으로 실행 환경을 제공하고 확장합니다.

🔄
이벤트 기반 실행
Lambda는 API 요청, 파일 업로드 등의 이벤트가 발생할 때만 실행되며, event 객체로 입력 데이터를 받습니다.

📊
CloudWatch 자동 로깅
함수 실행 로그와 메트릭(실행 시간, 메모리 사용량)이 자동으로 CloudWatch에 기록되어 모니터링할 수 있습니다.

💰
사용한 만큼만 과금
기본 온디맨드 Lambda는 요청 수와 실행 시간·메모리 등에 따라 과금됩니다. 프로비저닝된 동시성 등 별도 기능은 대기 중에도 비용이 발생할 수 있으며 DynamoDB·CloudWatch 비용도 별도입니다.


## 참고 문서

- [DynamoDB Scan과 페이지 처리](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html)
- [PutItem의 전체 교체 동작](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html)
- [Lambda 지표와 Duration](https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics-types.html)
- [API Gateway 이벤트 형식 1.0과 2.0](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html)

## 코랩에서 실행할 경우

[CA9-2 코랩 노트북](https://colab.research.google.com/drive/1FuQPyDit0zRlyTG8-sEto-ikY7tVP9Ky)을 사용하는 경우에도 **인증 → 테이블 확인·샘플 준비 → 함수 정의 → 기능 테스트 → Lambda 배포 → 실제 Lambda 호출 → 모니터링** 순서를 지킵니다. 코랩에서 핸들러를 직접 호출하는 테스트는 AWS Lambda 호출이 아니므로 Lambda Invocations에 집계되지 않습니다.

- `boto3` 설치는 AWS CLI 설치와 다릅니다. `!aws`나 셸 스크립트를 쓰려면 먼저 아래 설치·확인을 실행하세요. Boto3 전용 코드에는 CLI가 필요하지 않습니다.
- AWS 키는 코랩 보안비밀 `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`에서 읽고 출력하거나 저장하지 않습니다. 리전은 `AWS_REGION` 또는 서울 리전으로 명시합니다.
- 이전에 생성한 통합 셸 코드의 `[cite: …]` 문자열은 실행 코드가 아니므로 제거해야 합니다. 위 다운로드 ZIP의 원본 스크립트에는 해당 문자열이 없습니다.
- 구축 명령이 실패했는데 완료 문구만 출력되면 성공으로 판단하지 마세요. 실제 테이블 상태와 IAM 역할을 조회합니다.
- `lambda_handler`를 정의하기 전에 호출하면 `NameError`가 발생합니다. 앞의 3.1 코드를 먼저 실행하세요. 코랩에서는 Boto3 세션·테이블 연결에 보안비밀 인증을 사용하고, Lambda에서는 실행 역할을 사용합니다.

```python
!pip -q install boto3 awscli
!aws --version
```
