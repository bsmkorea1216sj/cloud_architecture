---
title: 'Amazon S3 웹사이트 호스팅 (26)'
week: 5
session: 2
awsServices:
  - Amazon S3
learningObjectives:
  - Amazon S3의 기본 개념과 핵심 기능을 이해할 수 있습니다.
  - Amazon S3 버킷을 생성하고 정적 웹사이트를 호스팅할 수 있습니다.
  - Amazon S3의 데이터 관리 및 보안 기능(버전 관리, 암호화, 접근 제어)을 활용할 수 있습니다.
---

> [!TIP]
> 이 실습에서는 **S3 버킷**에 정적 웹사이트를 호스팅하는 방법을 학습합니다. S3 버킷을 생성하고 **HTML, CSS 파일**을 업로드한 후, **Static website hosting** 기능을 활성화합니다. **퍼블릭 액세스 차단** 설정을 해제하고, **버킷 정책**으로 모든 사용자에게 읽기 권한을 부여합니다. **웹사이트 엔드포인트**로 브라우저에서 접속하여 서버 없이 운영되는 웹사이트를 확인합니다.

> [!DOWNLOAD]
> 사전 구축되는 리소스가 없습니다.

> [!CONCEPT] Amazon S3 정적 웹사이트 호스팅이란?
>
> Amazon S3(Simple Storage Service)는 객체 스토리지 서비스로, 정적 웹사이트 호스팅 기능을 제공합니다.
>
> - **정적 웹사이트**: HTML, CSS, JavaScript 등 서버 측 처리가 필요 없는 웹사이트입니다
> - **장점**: 서버 관리 불필요, 자동 확장, 높은 가용성, 비용 효율적입니다
> - **버킷 정책**: 누가 버킷의 객체에 접근할 수 있는지 JSON으로 정의합니다
> - **웹사이트 엔드포인트**: S3가 자동으로 제공하는 웹사이트 접속 URL입니다

## 태스크 1: Amazon S3 버킷 생성

### 1.1 서울 리전에서 버킷 생성 화면 열기

1. 실습용 AWS 계정에 로그인하고 리전을 **아시아 태평양(서울) `ap-northeast-2`**로 선택합니다.
2. **Amazon S3 → 범용 버킷(General purpose buckets) → 버킷 만들기(Create bucket)**로 이동합니다. [서울 리전 버킷 만들기 화면](https://ap-northeast-2.console.aws.amazon.com/s3/bucket/create?region=ap-northeast-2)
3. **일반 구성(General configuration)**에서 서울 리전을 확인합니다. **버킷 유형(Bucket type)**이 표시되면 **범용(General purpose)**을 선택합니다.

### 1.2 버킷 이름과 접근 설정

4. **버킷 네임스페이스(Bucket namespace)**가 표시되면 **글로벌 네임스페이스(Global namespace)**를 선택합니다. **버킷 이름(Bucket name)**에 `cloudarchitect-lab-s3website-<실습코드>`를 입력합니다. 예시는 `cloudarchitect-lab-s3website-lab7k3`입니다. 소문자, 숫자, 하이픈으로 이름을 만들고 이미 사용 중이면 접미사를 바꿉니다.
5. **기존 버킷에서 설정 복사(Copy settings from existing bucket)**는 건너뜁니다.
6. **객체 소유권(Object Ownership)**은 **ACL 비활성화(ACLs disabled)**를 유지합니다. 버킷 정책으로 웹사이트 읽기 권한을 설정하는 실습입니다.
7. **이 버킷의 퍼블릭 액세스 차단 설정(Block Public Access settings for this bucket)**은 **모든 퍼블릭 액세스 차단(Block all public access)**을 켠 채 생성합니다. 공개 읽기는 태스크 4에서 웹사이트 실습 버킷에 한해 설정합니다.

### 1.3 버전 관리, 태그 및 암호화 확인

8. **버킷 버전 관리(Bucket Versioning)**는 **비활성화(Disable)**를 유지합니다.
9. **태그(Tags)**는 선택 항목입니다. 버킷을 구분하려면 **태그 추가(Add tag)**에서 키 `Name`, 값 `CloudArchitect-Lab-S3Website`를 입력합니다.
10. **기본 암호화(Default encryption)**는 **Amazon S3 관리형 키를 사용한 서버 측 암호화(SSE-S3)**를 유지합니다. **고급 설정(Advanced settings)**의 **객체 잠금(Object Lock)**은 비활성화 상태를 유지합니다.
11. [[Create bucket]]을 클릭합니다. 범용 버킷 목록에서 새 버킷 이름과 서울 리전을 확인한 후 태스크 2로 진행합니다.

[AWS 공식 안내 · 범용 버킷 생성](https://docs.aws.amazon.com/AmazonS3/latest/userguide/create-bucket-overview.html)


## 태스크 2: 정적 웹사이트 파일 생성 및 업로드

### 2.1 HTML 파일 생성

12. 로컬 컴퓨터에서 다음 중 하나의 텍스트 에디터를 엽니다:
- **Windows**: 메모장 (Notepad) 또는 VS Code
- **Mac**: TextEdit 또는 VS Code
- **Linux**: gedit 또는 VS Code

> [!TIP] Windows 메모장 사용 시 주의사항
>
> Windows 메모장을 사용하는 경우:
> - 파일 저장 시 "파일 형식"을 **"모든 파일 (*.*)"**로 선택합니다
> - 파일명을 `index.html`로 입력합니다 (따옴표 없이)
> - 인코딩을 **"UTF-8"**로 선택합니다
>
> 이렇게 하지 않으면 `index.html.txt`로 저장되어 웹 서버가 인식하지 못할 수 있습니다.

13. 다음 내용을 복사하여 붙여넣습니다:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudArchitect S3 웹사이트 실습</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>🌟 CloudArchitect S3 웹사이트 실습</h1>
            <p>Amazon S3를 이용한 정적 웹사이트 호스팅</p>
        </header>
        <main>
            <section class="intro">
                <h2>실습 완료!</h2>
                <p>이 웹사이트는 Amazon S3에서 호스팅되고 있습니다.</p>
                <p><strong>실습 별칭:</strong> [여기에 실습 별칭 입력]</p>
                <p><strong>실습 날짜:</strong> <span id="current-date"></span></p>
            </section>
            <section class="features">
                <h3>S3 웹사이트 호스팅의 장점</h3>
                <ul>
                    <li>서버 관리 불필요</li>
                    <li>자동 확장성</li>
                    <li>비용 효율성</li>
                    <li>높은 가용성</li>
                </ul>
            </section>
        </main>
        <footer>
            <p>&copy; 2026 CloudArchitect 실습 - S3 정적 웹사이트 호스팅</p>
        </footer>
    </div>
    <script>
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('ko-KR');
    </script>
</body>
</html>
```

14. 파일을 `index.html` 이름으로 **바탕화면**에 저장합니다.

15. `index.html` 파일에서 `[여기에 실습 별칭 입력]` 부분을 실습 별칭으로 수정하고 저장합니다. 공개 페이지에는 실제 이름이나 학번을 넣지 않습니다.

> [!TIP]
> 예: `<p><strong>실습 별칭:</strong> 실습 참가자 A</p>`

### 2.1.2 CSS 파일 생성

16. 같은 방법으로 새 파일을 열고 `style.css` 파일을 생성합니다:

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6; color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}
.container {
    max-width: 800px; margin: 50px auto; padding: 20px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 10px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}
header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #667eea; }
header h1 { color: #667eea; margin-bottom: 10px; }
header p { color: #666; font-size: 1.1em; }
.intro { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745; }
.features ul { list-style: none; padding-left: 0; }
.features li { background: #e3f2fd; margin: 8px 0; padding: 10px 15px; border-radius: 5px; border-left: 3px solid #2196f3; }
footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
```

17. 파일을 `style.css` 이름으로 **바탕화면**에 저장합니다.

> [!NOTE]
> 두 파일(`index.html`, `style.css`)이 모두 바탕화면에 저장되어 있는지 확인합니다. 다음 단계에서 이 파일들을 S3 버킷에 업로드합니다.

### 2.2 파일 업로드

18. S3 콘솔에서 생성한 버킷을 선택합니다.

19. **Objects** 탭에서 [[Upload]] 버튼을 클릭합니다.

20. [[Add files]] 버튼을 클릭하여 `index.html`과 `style.css` 파일을 선택합니다.

> [!TIP]
> [[Add files]] 버튼 대신 파일을 드래그 앤 드롭으로 업로드 영역에 직접 끌어다 놓을 수도 있습니다.

21. 파일이 추가되었는지 확인하고 [[Upload]] 버튼을 클릭합니다.

22. 업로드가 완료되면 [[Close]] 버튼을 클릭합니다.

> [!NOTE]
> S3에 업로드된 파일들은 기본적으로 비공개 상태입니다. 웹사이트로 접근하려면 정적 웹사이트 호스팅 설정과 버킷 정책을 통한 퍼블릭 읽기 권한이 필요합니다.

✅ **태스크 완료**: 웹사이트 파일이 S3 버킷에 업로드되었습니다.


## 태스크 3: 정적 웹사이트 호스팅 설정

### 3.1 웹사이트 호스팅 활성화

23. 버킷 상세 페이지 상단의 탭 메뉴에서 **Properties** 탭을 선택합니다. (Objects, Properties, Permissions, Metrics, Management, Access Points 순서로 나열되어 있습니다.)

24. **Properties** 탭 페이지에서 아래로 스크롤하여 맨 하단의 **Static website hosting** 섹션을 찾습니다.

25. [[Edit]] 버튼을 클릭합니다.

26. **Static website hosting**에서 **Enable**을 선택합니다.

27. **Hosting type**에서 **Host a static website**를 선택합니다.

28. **Index document** 필드에 `index.html`을 입력합니다.

29. **Error document** 필드에 `error.html`을 입력합니다.

30. [[Save changes]] 버튼을 클릭합니다.

### 3.2 웹사이트 엔드포인트 URL 확인

31. **Properties** 탭의 **Static website hosting** 섹션에서 **Bucket website endpoint** URL을 확인합니다.

32. URL을 복사하여 메모장에 저장합니다.

> [!IMPORTANT]
> 이 URL은 나중에 웹사이트 접속 테스트에 사용합니다. 반드시 메모장에 저장합니다. 현재 이 URL로 접속하면 403 Forbidden 오류가 발생합니다. 버킷 정책을 설정한 후(태스크 4 완료 후)에 정상적으로 접속할 수 있습니다.

✅ **태스크 완료**: 정적 웹사이트 호스팅이 활성화되었습니다.


## 태스크 4: Amazon S3 버킷 정책 설정

> [!CONCEPT] S3 버킷 정책
>
> 버킷 정책은 JSON 형식으로 작성하며, 누가(Principal) 어떤 작업(Action)을 어떤 리소스(Resource)에 대해 수행할 수 있는지 정의합니다. 웹사이트 호스팅을 위해서는 모든 사용자(`*`)에게 객체 읽기(`s3:GetObject`) 권한을 부여해야 합니다.

33. 버킷 상세 페이지 상단의 탭 메뉴에서 **Permissions** 탭을 선택합니다.

34. **Block public access (bucket settings)** → [[Edit]]에서 상위 체크박스를 해제하여 개별 설정을 편집합니다. ACL 관련 차단 두 항목은 **켜고**, 공개 버킷 정책 관련 차단 두 항목만 **끕니다**. 저장할 때 확인 창이 나타나면 화면 안내를 따릅니다. 이 설정은 실습 버킷에만 적용합니다.

    계정이나 조직 정책에서 공개 접근을 차단하면 버킷 설정만으로는 공개할 수 없습니다. 관리자가 허용한 실습 환경에서 진행하세요. [AWS 공식 안내 · 퍼블릭 액세스 차단](https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-block-public-access.html)

    이어서 **Bucket policy** 섹션에서 [[Edit]] 버튼을 클릭합니다.

35. 다음 정책을 입력합니다 (`YOUR-BUCKET-NAME`을 본인의 버킷 이름으로 변경):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

36. `YOUR-BUCKET-NAME` 부분을 본인의 실제 버킷 이름(예: `cloudarchitect-lab-s3website-lab7k3`)으로 변경합니다.

37. [[Save changes]] 버튼을 클릭합니다.

> [!TROUBLESHOOTING]
> "Access Denied" 오류가 발생하면:
> - **Permissions**에서 공개 버킷 정책 관련 차단 두 항목과 상위 계정·조직 설정을 확인합니다
> - 버킷 이름이 정확한지 확인합니다 (대소문자 구분)

✅ **태스크 완료**: 버킷 정책이 설정되어 웹사이트 파일에 퍼블릭 접근이 가능합니다.


## 태스크 5: 웹사이트 테스트 및 오류 페이지

### 5.1 웹사이트 접속 테스트

38. 새 브라우저 탭을 열고 메모장에 저장한 웹사이트 엔드포인트 URL을 붙여넣고 Enter를 누릅니다.

39. **CloudArchitect S3 웹사이트 실습** 페이지가 표시되는지 확인합니다.

40. CSS 스타일이 올바르게 적용되었는지 확인합니다 (보라색 그라데이션 배경, 카드 레이아웃).

41. JavaScript가 작동하여 현재 날짜가 표시되는지 확인합니다.

> [!TROUBLESHOOTING]
> 페이지가 로드되지 않는 경우:
> - URL이 `https://`가 아닌 `http://`로 시작하는지 확인합니다 (S3 웹사이트 엔드포인트는 HTTP만 지원)
> - 버킷 정책이 올바르게 설정되었는지 확인합니다
> - `index.html` 파일명이 정확한지 확인합니다 (대소문자 구분)

### 5.2 오류 페이지 생성 및 테스트

42. 로컬에서 `error.html` 파일을 생성합니다:

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>페이지를 찾을 수 없습니다</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin: 50px; background: #f8f9fa; }
        .error-container { max-width: 600px; margin: 0 auto; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .error-code { font-size: 72px; color: #e74c3c; margin-bottom: 20px; }
        a { color: #007dbc; text-decoration: none; }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-code">404</div>
        <h1>페이지를 찾을 수 없습니다</h1>
        <p>요청하신 페이지가 존재하지 않습니다.</p>
        <a href="/">🏠 홈으로 돌아가기</a>
    </div>
</body>
</html>
```

43. 버킷 상세 페이지의 **Objects** 탭에서 [[Upload]] 버튼을 클릭하여 `error.html` 파일을 업로드합니다.

44. 웹사이트 URL 뒤에 `/nonexistent.html`을 추가하여 접속합니다.

45. 사용자 정의 404 오류 페이지가 표시되는지 확인합니다.

> [!OUTPUT]
> ```
> 404
> 페이지를 찾을 수 없습니다
> 요청하신 페이지가 존재하지 않습니다.
> 🏠 홈으로 돌아가기
> ```

✅ **태스크 완료**: 웹사이트와 오류 페이지가 정상적으로 동작합니다.

## 리소스 정리

> [!WARNING]
> 실습 완료 후 **반드시** 리소스를 정리하여 불필요한 비용을 방지하세요.

이 실습에서는 자동 정리 스크립트가 제공되지 않으므로, 아래 단계에 따라 AWS Management Console에서 수동으로 리소스를 삭제합니다.

### 태스크 1: Amazon S3 버킷 삭제

1. 상단 검색창에서 `S3`를 검색하고 **S3**를 선택합니다.

2. 실습에서 생성한 버킷(`cloudarchitect-lab-s3website-<실습코드>`)을 선택합니다.

3. 버킷 내 모든 객체를 먼저 삭제합니다:
   - [[Empty]] 버튼 클릭
   - 확인 창에 `permanently delete` 입력
   - [[Empty]] 버튼 클릭

4. 버킷 목록으로 돌아가서 버킷을 선택합니다.

5. [[Delete]] 버튼을 클릭합니다.

6. 확인 창에 버킷 이름을 입력하고 [[Delete bucket]] 버튼을 클릭합니다.

> [!NOTE]
> 버킷을 삭제하면 버킷 정책과 웹사이트 호스팅 설정도 함께 삭제됩니다.

✅ **리소스 정리 완료**: 모든 리소스가 삭제되었습니다.


## 💡 핵심 포인트 정리

🌐
정적 웹사이트 호스팅
S3의 Static website hosting 기능으로 서버 없이 HTML, CSS, JS 파일을 웹사이트로 서빙합니다

🔒
버킷 정책
JSON 형식으로 퍼블릭 읽기 권한을 부여하여 웹사이트 접근을 허용합니다

📁
객체 스토리지
S3는 파일을 객체로 저장하며, 각 객체는 고유한 키(경로)를 가집니다

🌍
퍼블릭 액세스 설정
실습 버킷에서 공개 버킷 정책 관련 차단 두 항목을 해제하고 버킷 정책으로 읽기 권한을 부여합니다

🔗
웹사이트 엔드포인트
S3가 제공하는 HTTP 엔드포인트를 통해 브라우저에서 웹사이트에 접근할 수 있습니다

💰
비용 효율성
서버 운영 비용 없이 저장 용량과 데이터 전송량에 따라서만 과금되어 소규모 웹사이트에 적합합니다
