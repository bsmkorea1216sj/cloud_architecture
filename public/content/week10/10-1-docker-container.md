---
title: 'Docker 컨테이너 이미지 빌드 (26)'
week: 10
session: 1
awsServices:
  - Amazon ECR
learningObjectives:
  - 컨테이너의 개념과 가상머신과의 차이점을 이해할 수 있습니다.
  - Docker의 기본 개념과 구성요소(이미지, 컨테이너, 레지스트리)를 설명할 수 있습니다.
  - Dockerfile을 작성하여 컨테이너 이미지를 빌드할 수 있습니다.
---

# Docker 컨테이너 이미지 빌드 (26)

> [!TIP]
> 이 실습에서는 **Docker 이미지**를 빌드하고 **컨테이너**를 실행한 후, **Amazon ECR**에 이미지를 푸시하여 컨테이너 기술의 기본을 학습합니다.

> [!CONCEPT] Docker 컨테이너란?
>
> Docker는 애플리케이션을 **컨테이너**라는 격리된 환경에서 실행하는 플랫폼입니다.
>
> - **이미지(Image)**: 애플리케이션 코드, 런타임, 라이브러리를 포함한 읽기 전용 템플릿입니다.
> - **컨테이너(Container)**: 이미지를 기반으로 실행되는 격리된 프로세스입니다.
> - **Dockerfile**: 이미지를 빌드하기 위한 명령어를 정의한 텍스트 파일입니다.
> - **레지스트리(Registry)**: 이미지를 저장하고 배포하는 저장소입니다 (Amazon ECR, Docker Hub 등).
>
> 가상머신(VM)과 달리 컨테이너는 OS 커널을 공유하므로 가볍고 빠르게 시작됩니다.

## 실습 시작 전 · AWS 계정과 콘솔 준비

**교안 25–27페이지**를 보면서 진행합니다. 이번 실습은 **CloudShell에서 Node.js 컨테이너를 빌드하고 ECR에 저장**하는 데까지입니다. 29페이지의 Nginx 예제는 레이어 설명용이며, 30페이지의 ECS 배포는 10-2에서 진행합니다.

1. 수업에서 제공한 **AWS 실습 계정 또는 역할**로 콘솔에 로그인합니다. 교육 포털에서 계정을 시작하는 방식이라면 세션이 활성화된 뒤 AWS 콘솔을 엽니다. 계정이 아직 배정되지 않았다면 담당자에게 요청합니다.
2. 콘솔 오른쪽 위에서 계정과 역할을 확인하고 **서울(ap-northeast-2)** 리전을 선택합니다.
3. 실습 역할에는 CloudShell 시작 및 콘솔 자격 증명 전달, ECR 비공개 저장소 생성·조회와 이미지 푸시 권한이 필요합니다. 수업 종료 시 정리하는 역할에는 실습 저장소 삭제 권한도 필요합니다. 권한 오류가 나면 작업 이름과 오류 메시지를 담당자에게 전달합니다.
4. CloudShell은 콘솔 로그인 자격 증명을 사용합니다. PC에 AWS CLI나 Docker를 설치하거나 액세스 키를 발급할 필요가 없습니다.

## 태스크 1: Docker 환경 설정

### 1.1 CloudShell에서 Docker 환경 확인

1. 콘솔 상단의 **CloudShell** 아이콘을 누르고 서울 리전의 기본 환경을 엽니다. 터미널 프롬프트가 나타날 때까지 기다립니다.

2. 아래 명령을 한 줄씩 실행해 로그인 계정과 Docker 서버 상태를 확인합니다.

```bash
export AWS_REGION=ap-northeast-2
export AWS_DEFAULT_REGION=ap-northeast-2
aws sts get-caller-identity
docker version
```

> [!NOTE]
> STS 출력의 Account가 배정된 계정과 일치하고, Docker 출력에 Client와 Server가 모두 표시되어야 합니다. 서버가 연결되지 않으면 CloudShell 환경이 준비되었는지 확인하고 새 세션에서 다시 시도합니다.

3. 작업 디렉토리를 생성합니다:

```bash
mkdir -p ~/docker-lab
```

✅ **태스크 완료**: CloudShell에서 Docker 환경이 준비되었습니다.


## 태스크 2: 웹 애플리케이션 생성

> [!CONCEPT] Node.js와 Express
>
> Node.js는 서버 측 JavaScript 런타임이며, Express는 가장 널리 사용되는 Node.js 웹 프레임워크입니다. 이 실습에서는 Express로 간단한 웹 서버를 만들고 Docker로 컨테이너화합니다.

### 2.1 Node.js 애플리케이션 파일 생성

4. `package.json` 파일을 생성합니다:

```bash
cat > ~/docker-lab/package.json << 'EOF'
{
  "name": "cloudarchitect-lab-app",
  "version": "1.0.0",
  "description": "CloudArchitect Lab Docker Container Application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
EOF
```

5. Express 서버 파일을 생성합니다:

```bash
cat > ~/docker-lab/server.js << 'SERVEREOF'
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>CloudArchitect Week 10-1 Docker App</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                padding: 40px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                background: rgba(255,255,255,0.1);
                padding: 40px;
                border-radius: 10px;
            }
            h1 { font-size: 2.5em; margin-bottom: 20px; }
            .info { font-size: 1.2em; margin: 20px 0; }
            .highlight { color: #FFD700; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🐳 CloudArchitect Week 10-1 Docker Application</h1>
            <div class="info">
                <p>Docker 컨테이너가 성공적으로 실행되고 있습니다.</p>
                <p class="highlight">CloudArchitect AWS 가이드 - Week 10-1</p>
                <p>실행 시간: ${new Date().toLocaleString()}</p>
                <p>포트: 3000</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'CloudArchitect Week 10-1 Docker App is running'
  });
});

app.listen(port, () => {
  console.log(`CloudArchitect Week 10-1 Docker App running on port ${port}`);
});
SERVEREOF
```

✅ **태스크 완료**: Node.js 웹 애플리케이션 파일이 생성되었습니다.


## 태스크 3: Dockerfile 작성 및 이미지 빌드

> [!CONCEPT] Dockerfile 주요 명령어
>
> | 명령어 | 설명 | 예시 |
> |--------|------|------|
> | `FROM` | 베이스 이미지를 지정합니다 | `FROM node:24-alpine` |
> | `LABEL` | 이미지 메타데이터를 추가합니다 | `LABEL version="1.0"` |
> | `WORKDIR` | 컨테이너 내 작업 디렉토리를 설정합니다 | `WORKDIR /app` |
> | `COPY` | 호스트 파일을 컨테이너로 복사합니다 | `COPY package.json ./` |
> | `RUN` | 이미지 빌드 시 실행할 명령어입니다 | `RUN npm install` |
> | `USER` | 컨테이너 실행 사용자를 지정합니다 | `USER appuser` |
> | `EXPOSE` | 컨테이너가 사용하는 포트를 명시합니다 (문서화) | `EXPOSE 3000` |
> | `HEALTHCHECK` | 컨테이너 상태 확인 명령어를 정의합니다 | `HEALTHCHECK CMD curl localhost` |
> | `CMD` | 컨테이너 시작 시 실행할 기본 명령어입니다 | `CMD ["npm", "start"]` |
>
> **주요 차이점:**
>
> **RUN vs CMD:**
> - **RUN**: 이미지 **빌드 시점**에 실행되며, 실행 결과가 새로운 레이어로 저장됩니다
>   - 예: **RUN npm install**은 빌드할 때 의존성을 설치하고 그 결과를 이미지에 포함
>   - 여러 번 사용 가능하며, 각각 새로운 레이어를 생성합니다
> - **CMD**: 컨테이너 **실행 시점**에 실행되며, 이미지에는 명령어만 저장됩니다
>   - 예: **CMD ["npm", "start"]**는 컨테이너가 시작될 때마다 애플리케이션을 실행
>   - Dockerfile에 하나만 존재하며, 마지막 CMD만 유효합니다
>   - **docker run** 명령어로 덮어쓸 수 있습니다
>
> **EXPOSE의 실제 동작:**
> - **EXPOSE 3000**은 컨테이너가 3000번 포트를 사용한다는 것을 **문서화**하는 역할만 합니다
> - 실제로 포트를 외부에 노출하지 않으며, 방화벽 규칙도 생성하지 않습니다
> - 실제 포트 매핑은 **docker run -p 8080:3000** 명령어의 **-p** 옵션으로 수행합니다
>   - **-p 8080:3000**: 호스트의 8080 포트를 컨테이너의 3000 포트에 연결
> - EXPOSE는 개발자 간 커뮤니케이션과 자동화 도구를 위한 메타데이터입니다
>
> **COPY vs ADD:**
> - **COPY**: 단순히 파일/디렉토리를 복사합니다 (권장)
> - **ADD**: 복사 + URL 다운로드 + tar 자동 압축 해제 기능 (복잡하므로 특별한 경우만 사용)

### 3.1 Dockerfile 생성

6. Dockerfile을 작성합니다:

```bash
cat > ~/docker-lab/Dockerfile << 'EOF'
# 베이스 이미지 지정 - Alpine Linux 기반의 경량 Node.js 24 LTS 이미지
# Docker Hub 공식 이미지(node:24-alpine)와 같은 이미지를 Amazon ECR Public에서 받음
FROM public.ecr.aws/docker/library/node:24-alpine

# 메타데이터 - 이미지에 대한 정보를 레이블로 추가
LABEL maintainer="CloudArchitect Student"
LABEL description="CloudArchitect Week 10-1 Docker Container Application"
LABEL version="1.0"

# 작업 디렉토리 설정 - 이후 모든 명령어는 이 디렉토리에서 실행됨
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
# package.json과 package-lock.json을 먼저 복사하여 Docker 레이어 캐싱 최적화
COPY package*.json ./
# --omit=dev: 개발 의존성 제외, npm cache clean: 캐시 삭제로 이미지 크기 감소
RUN npm install --omit=dev && npm cache clean --force

# 애플리케이션 코드 복사
# 의존성 설치 후 코드를 복사하면 코드 변경 시 의존성 재설치를 방지할 수 있음
COPY server.js .

# 비특권 사용자 생성 및 전환 (보안 모범 사례)
# root 권한으로 컨테이너를 실행하지 않아 보안 위험을 줄임
RUN addgroup -g 10001 -S nodejs && \
    adduser -S appuser -u 10001 && \
    chown -R appuser:nodejs /app
USER appuser

# 포트 노출 - 컨테이너가 3000번 포트를 사용함을 명시 (문서화 목적)
EXPOSE 3000

# 헬스체크 추가 - 컨테이너의 상태를 주기적으로 확인
# --interval: 30초마다 체크, --timeout: 3초 내 응답, --start-period: 시작 후 5초 대기
# --retries: 3번 실패 시 unhealthy 상태로 표시
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 애플리케이션 실행 - 컨테이너 시작 시 실행될 기본 명령어
CMD ["npm", "start"]
EOF
```

> [!NOTE]
> 베이스 이미지는 Docker Hub의 `node:24-alpine`과 같은 공식 이미지를 **Amazon ECR Public** 경로에서 받습니다. 여러 학생이 동시에 빌드해도 Docker Hub의 비로그인 다운로드 제한(`toomanyrequests`)에 걸리지 않습니다.

> [!TIP]
> `USER appuser`로 비특권 사용자를 사용하면 컨테이너가 root 권한으로 실행되지 않아 보안이 강화됩니다. 프로덕션 환경에서는 반드시 적용해야 하는 모범 사례입니다.

### 3.2 Docker 이미지 빌드

7. Docker 이미지를 빌드합니다:

```bash
docker build -t cloudarchitect-lab-app:latest ~/docker-lab/
```

> [!NOTE]
> - `-t cloudarchitect-lab-app:latest`: 이미지에 이름(태그)을 지정합니다
>   - `cloudarchitect-lab-app`: 이미지 이름
>   - `latest`: 이미지 버전 태그 (기본값)
> - `~/docker-lab/`: Dockerfile이 있는 디렉토리 경로 (빌드 컨텍스트)

8. 빌드된 이미지를 확인합니다:

```bash
docker images cloudarchitect-lab-app
```

> [!OUTPUT]
> ```
> REPOSITORY                TAG       IMAGE ID       CREATED          SIZE
> cloudarchitect-lab-app    latest    abc123def456   10 seconds ago   (환경별로 다름)
> ```

> [!NOTE]
> 이미지 ID와 크기는 베이스 이미지 버전 및 빌드 환경에 따라 달라집니다. REPOSITORY와 TAG를 확인하세요.

✅ **태스크 완료**: Dockerfile을 작성하고 Docker 이미지를 빌드했습니다.


## 태스크 4: 컨테이너 실행 및 테스트

### 4.1 컨테이너 실행

9. 컨테이너를 백그라운드로 실행합니다:

```bash
docker run -d --name cloudarchitect-lab-app -p 8080:3000 cloudarchitect-lab-app:latest
```

> [!WARNING]
> 다시 실행할 때 `Conflict. The container name "/cloudarchitect-lab-app" is already in use` 오류가 나면 이전 컨테이너를 지운 뒤 위 명령을 다시 실행합니다.
>
> ```bash
> docker rm -f cloudarchitect-lab-app
> ```

> [!NOTE]
> Docker run 옵션 설명:
> - `-d`: 백그라운드(detached) 모드로 실행합니다
> - `--name cloudarchitect-lab-app`: 컨테이너에 이름을 지정합니다 (관리 편의성)
> - `-p 8080:3000`: 포트 매핑 (호스트:컨테이너)
>   - 호스트의 8080 포트로 들어오는 요청을 컨테이너의 3000 포트로 전달합니다
> - `cloudarchitect-lab-app:latest`: 실행할 이미지 이름과 태그

10. 컨테이너 상태를 확인합니다:

```bash
docker ps
```

> [!OUTPUT]
> ```
> CONTAINER ID   IMAGE                          STATUS          PORTS                    NAMES
> abc123def456   cloudarchitect-lab-app:latest   Up 5 seconds    0.0.0.0:8080->3000/tcp   cloudarchitect-lab-app
> ```

### 4.2 애플리케이션 테스트

11. **같은 CloudShell 터미널에서** 웹 페이지 응답을 확인합니다. 여기서 localhost는 학생 PC가 아니라 Docker를 실행한 CloudShell 호스트입니다.

```bash
curl http://localhost:8080
```

> [!NOTE]
> `curl` 명령어는 HTTP 요청을 보내고 응답을 확인하는 도구입니다. 컨테이너가 정상적으로 실행 중이면 HTML 페이지가 출력됩니다.

12. 헬스 체크 엔드포인트를 확인합니다:

```bash
curl http://localhost:8080/health
```

> [!OUTPUT]
> ```json
> {"status":"healthy","timestamp":"2025-xx-xxTxx:xx:xx.xxxZ","message":"CloudArchitect Week 10-1 Docker App is running"}
> ```

13. 컨테이너 로그를 확인합니다:

```bash
docker logs cloudarchitect-lab-app
```

> [!NOTE]
> 컨테이너 내부에서 출력되는 모든 로그(console.log 등)를 확인할 수 있습니다. 애플리케이션 디버깅에 유용합니다.

✅ **태스크 완료**: Docker 컨테이너가 정상적으로 실행되고 웹 애플리케이션에 접근할 수 있습니다.


## 태스크 5: Amazon ECR 리포지토리 생성 및 이미지 푸시

> [!CONCEPT] Amazon ECR(Elastic Container Registry)
>
> Amazon ECR은 Docker 컨테이너 이미지를 저장, 관리, 배포하는 **완전 관리형 컨테이너 레지스트리**입니다. Amazon ECS, EKS 등 AWS 컨테이너 서비스와 네이티브로 통합되며, IAM 기반 접근 제어를 제공합니다.

> [!WARNING]
> CloudShell은 키보드나 마우스 입력이 20–30분 없으면 세션이 종료됩니다. `~/docker-lab`의 파일은 남지만 빌드한 이미지와 실행 중인 컨테이너, 설정한 변수는 사라질 수 있습니다. 세션이 다시 시작되었다면 먼저 이미지가 있는지 확인합니다.
>
> ```bash
> docker images cloudarchitect-lab-app
> ```
>
> 목록이 비어 있으면 **7번 이미지 빌드**부터 다시 실행합니다. 이어서 **15번**에서 `ACCOUNT_ID`를 다시 설정한 뒤 로그인·태그·푸시를 진행합니다.

### 5.1 Amazon ECR 리포지토리 생성

14. AWS 콘솔 검색창에서 **Elastic Container Registry**를 엽니다. 서울 리전의 **Private registry → Repositories → Create repository**를 선택합니다. 이름은 `cloudarchitect-lab-app`으로 지정하고 생성합니다. 공유 계정이라면 담당자가 지정한 학생별 저장소 이름을 사용하고, 아래 태그·푸시·검증·정리 명령에도 같은 이름을 적용합니다.

   저장소 상세 화면에서 **URI**를 복사합니다. 형식은 `계정ID.dkr.ecr.ap-northeast-2.amazonaws.com/cloudarchitect-lab-app`입니다. 재실습에서 기존 저장소를 사용하려면 본인에게 배정된 저장소인지 먼저 확인합니다.

15. 계정 ID를 변수에 저장합니다:

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "계정 ID: $ACCOUNT_ID"
```

### 5.2 Amazon ECR 로그인 및 이미지 푸시

16. ECR에 로그인합니다:

```bash
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com
```

> [!NOTE]
> AWS CLI로 ECR 인증 토큰을 받아 Docker에 로그인합니다. 파이프(`|`)를 사용하여 비밀번호를 안전하게 전달합니다.

> [!OUTPUT]
> ```
> Login Succeeded
> ```

17. 이미지에 ECR 태그를 추가합니다:

```bash
docker tag cloudarchitect-lab-app:latest $ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/cloudarchitect-lab-app:latest
```

> [!NOTE]
> 로컬 이미지에 ECR 리포지토리 경로를 포함한 새로운 태그를 추가합니다. 하나의 이미지에 여러 태그를 붙일 수 있습니다.

18. 이미지를 ECR에 푸시합니다:

```bash
docker push $ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/cloudarchitect-lab-app:latest
```

> [!NOTE]
> 로컬 이미지를 ECR 리포지토리에 업로드합니다. 이미지 크기에 따라 수 초에서 수 분이 소요될 수 있습니다.

### 5.3 Amazon ECR 콘솔에서 확인

19. 상단 검색창에서 `ECR`을 검색하고 **Elastic Container Registry**를 선택합니다.

20. ECR 콘솔의 왼쪽 메뉴에서 **Private registry** 섹션 아래의 **Repositories**를 선택합니다.

21. `cloudarchitect-lab-app` 리포지토리를 선택합니다.

22. `latest` 태그가 있는 이미지가 표시되는지 확인합니다.

✅ **태스크 완료**: Docker 이미지가 Amazon ECR에 성공적으로 저장되었습니다.

## 리소스 정리

> [!WARNING]
> 실습 완료 후 **반드시** 리소스를 정리하여 불필요한 비용을 방지하세요.

### 태스크 1: CloudShell에서 Docker 리소스 정리

1. CloudShell에서 실행 중인 컨테이너를 정지하고 삭제합니다:

```bash
docker stop cloudarchitect-lab-app
docker rm cloudarchitect-lab-app
```

2. 로컬 Docker 이미지를 삭제합니다:

```bash
docker rmi cloudarchitect-lab-app:latest
```

3. ECR 푸시용으로 붙인 로컬 태그를 삭제합니다. 이 명령은 CloudShell에 있는 태그만 지우며, ECR에 올라간 이미지는 다음 태스크 2에서 콘솔로 삭제합니다.

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
docker rmi $ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/cloudarchitect-lab-app:latest
```

4. 작업 파일은 다시 실습할 때 재사용할 수 있습니다. 삭제하려면 `~/docker-lab`에 본인 실습 파일만 있는지 확인한 뒤 정리합니다.

### 태스크 2: Amazon ECR 리포지토리 삭제

5. **ECR 콘솔 → 서울 → Private registry → Repositories**에서 본인 실습용 저장소를 선택합니다. 이미지를 삭제한 후 저장소를 삭제합니다. 공용 저장소라면 담당자 지시에 따라 본인 태그만 정리합니다.

### 태스크 3: 최종 확인

6. 상단 검색창에서 `ECR`을 검색하고 **Elastic Container Registry**를 선택합니다.

7. 왼쪽 메뉴에서 **Repositories**를 선택합니다.

8. 본인 실습용 리포지토리(`cloudarchitect-lab-app` 또는 배정된 이름)가 목록에 없는지 확인합니다. 공용 저장소를 사용했다면 저장소 안에 본인 태그가 남아 있지 않은지 확인합니다.

9. CloudShell에서 Docker 이미지 목록을 확인합니다:

```bash
docker images
```

10. `cloudarchitect-lab-app` 관련 이미지가 없는지 확인합니다.

✅ **리소스 정리 완료**: 모든 Docker 컨테이너, 이미지, ECR 리포지토리가 삭제되었습니다.


## 💡 핵심 포인트 정리

🏗️
이미지 빌드 및 테스트
Docker 이미지를 빌드하고 로컬에서 컨테이너를 실행하여 애플리케이션을 테스트했습니다

🚀
배포 준비
ECR에 저장된 이미지를 Amazon ECS 등 AWS 컨테이너 서비스에서 배포할 수 있습니다


## 코랩에서 실행할 경우

CloudShell 대신 코랩에서 **전체 과정을 진행**하고 웹 앱의 **HTML 화면을 코랩 안에서 확인**할 수 있습니다. 코랩에는 Docker 엔진이 없으므로 `docker build`, `docker run`, `docker push`는 **AWS CodeBuild**가 대신 실행하고, 코랩은 명령을 보내고 결과를 보여줍니다.

| 가이드 | 코랩 셀 | 실행 위치 |
|---|---|---|
| 실습 준비: 계정·리전 확인 | 셀 1–2 | 코랩 |
| 태스크 2: Node.js 앱 생성 | 셀 3–6 | 코랩 |
| HTML 화면 미리 보기 | 셀 7 | 코랩에서 Node.js로 실행 |
| 태스크 5.1: ECR 저장소 생성 | 셀 8 | 코랩 → ECR |
| 태스크 1·3·4·5.2: Docker 확인 → 빌드 → `8080:3000` 실행 → `/health` → 푸시 | 셀 9–11 | CodeBuild |
| 태스크 5.3: `latest` 태그와 컨테이너 화면 확인 | 셀 12 | 코랩 |
| 리소스 정리 | 셀 13 | 코랩 |

> [!WARNING]
> 코랩 방식은 S3 버킷, CodeBuild 프로젝트, IAM 역할을 새로 만듭니다. 실습 자격 증명에 STS, ECR, S3, CodeBuild, CloudWatch Logs 권한과 `iam:CreateRole`, `iam:PutRolePolicy`, `iam:PassRole` 권한이 필요합니다. IAM 역할을 만들 수 없으면 담당자가 준 CodeBuild 역할 ARN을 셀 2의 `EXISTING_ROLE_ARN`에 넣습니다. CodeBuild는 빌드 시간(보통 2–4분)만큼 요금이 발생하므로 실습 후 셀 13으로 정리합니다.

**셀 1 · 설치**  

`boto3`를 설치하고, Node.js가 없거나 18 미만이면 Node.js 24를 설치합니다.

```python
%pip -q install boto3

import shutil, subprocess

def node_major():
    if not shutil.which("node"):
        return 0
    version = subprocess.run(["node", "-v"], capture_output=True, text=True).stdout
    return int(version.strip().lstrip("v").split(".")[0])

if node_major() < 18:
    !curl -fsSL https://deb.nodesource.com/setup_24.x | bash - > /dev/null
    !apt-get install -y -qq nodejs > /dev/null

!node -v
!npm -v
```

**셀 2 · AWS 인증 확인과 실습 이름 설정**  

수업에서 발급한 실습 자격 증명을 Colab 왼쪽 **보안 비밀**에 등록하고 노트북 접근을 허용합니다. `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`를 사용하며, 임시 자격 증명이면 `AWS_SESSION_TOKEN`도 함께 등록합니다. 키는 코드에 붙여넣거나 출력하지 않습니다. 공유 계정이면 `SUFFIX`에 본인을 구분하는 소문자 접미사(예: `-s01`)를 넣습니다.

```python
import boto3
from google.colab import userdata

REGION = "ap-northeast-2"
SUFFIX = ""             # 공유 계정이면 소문자 접미사 (예: "-s01")
EXISTING_ROLE_ARN = ""  # 담당자가 CodeBuild 역할을 준 경우 ARN 입력

REPO = f"cloudarchitect-lab-app{SUFFIX}"
PROJECT = f"cloudarchitect-lab-docker-build{SUFFIX}"
ROLE_NAME = f"cloudarchitect-lab-codebuild-role{SUFFIX}"
POLICY_NAME = "cloudarchitect-lab-codebuild"

try:
    token = userdata.get("AWS_SESSION_TOKEN")
except userdata.SecretNotFoundError:
    token = None

session = boto3.Session(
    aws_access_key_id=userdata.get("AWS_ACCESS_KEY"),
    aws_secret_access_key=userdata.get("AWS_SECRET_KEY"),
    aws_session_token=token,
    region_name=REGION,
)
account = session.client("sts").get_caller_identity()["Account"]
BUCKET = f"cloudarchitect-lab-{account}-{REGION}{SUFFIX}"
REGISTRY = f"{account}.dkr.ecr.{REGION}.amazonaws.com"

ecr = session.client("ecr")
s3 = session.client("s3")
iam = session.client("iam")
cb = session.client("codebuild")
logs = session.client("logs")

print("AWS 계정:", account, "| 리전:", REGION)
print("ECR 저장소:", REPO, "| CodeBuild 프로젝트:", PROJECT, "| S3 버킷:", BUCKET)
```

**셀 3 · 작업 폴더 생성**  

```python
import os

APP_DIR = "/content/docker-lab"
os.makedirs(APP_DIR, exist_ok=True)
print("작업 폴더:", APP_DIR)
```

**셀 4 · package.json**  

```python
%%writefile /content/docker-lab/package.json
{
  "name": "cloudarchitect-lab-app",
  "version": "1.0.0",
  "description": "CloudArchitect Lab Docker Container Application",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

**셀 5 · server.js**  

태스크 2의 5번과 같은 Express 서버입니다. `/`는 HTML 화면을, `/health`는 상태 JSON을 돌려줍니다.

```python
%%writefile /content/docker-lab/server.js
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>CloudArchitect Week 10-1 Docker App</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: rgba(255,255,255,0.1);
                padding: 40px;
                border-radius: 10px;
            }
            h1 { font-size: 2.5em; margin-bottom: 20px; }
            .info { font-size: 1.2em; margin: 20px 0; }
            .highlight { color: #FFD700; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🐳 CloudArchitect Week 10-1 Docker Application</h1>
            <div class="info">
                <p>Docker 컨테이너가 성공적으로 실행되고 있습니다.</p>
                <p class="highlight">CloudArchitect AWS 가이드 - Week 10-1</p>
                <p>실행 시간: ${new Date().toLocaleString()}</p>
                <p>포트: 3000</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'CloudArchitect Week 10-1 Docker App is running'
  });
});

app.listen(port, () => {
  console.log(`CloudArchitect Week 10-1 Docker App running on port ${port}`);
});
```

**셀 6 · Dockerfile**  

태스크 3.1과 같은 Dockerfile입니다.

```python
%%writefile /content/docker-lab/Dockerfile
FROM public.ecr.aws/docker/library/node:24-alpine

LABEL maintainer="CloudArchitect Student"
LABEL description="CloudArchitect Week 10-1 Docker Container Application"
LABEL version="1.0"

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY server.js .

RUN addgroup -g 10001 -S nodejs && \
    adduser -S appuser -u 10001 && \
    chown -R appuser:nodejs /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["npm", "start"]
```

**셀 7 · HTML 화면 미리 보기**  

같은 `server.js`를 코랩에서 Node.js로 실행해 화면을 셀 안에 표시합니다. 코랩에는 Docker가 없으므로 앱 포트 3000을 직접 엽니다. `-p 8080:3000` 실행은 셀 11의 CodeBuild에서 진행합니다. 화면이 비어 있으면 `output.serve_kernel_port_as_window(3000)`을 실행해 새 탭으로 엽니다.

```python
import json, subprocess, time, urllib.request
from google.colab import output

!cd /content/docker-lab && npm install --omit=dev --no-audit --no-fund --silent

if "server" in globals() and server.poll() is None:
    server.terminate()
    server.wait()

server = subprocess.Popen(
    ["node", "server.js"],
    cwd=APP_DIR,
    stdout=open(f"{APP_DIR}/server.log", "w"),
    stderr=subprocess.STDOUT,
)

for _ in range(20):
    try:
        with urllib.request.urlopen("http://localhost:3000/health", timeout=2) as r:
            health = json.load(r)
        break
    except OSError:
        time.sleep(1)
else:
    raise RuntimeError("서버가 시작되지 않았습니다. /content/docker-lab/server.log를 확인하세요.")

print("GET /health →", health)
output.serve_kernel_port_as_iframe(3000, height=460)
```

**셀 8 · ECR 저장소 만들기**  

이미 있으면 그대로 사용합니다. 공유 계정이라면 본인에게 배정된 저장소인지 확인합니다.

```python
try:
    repo = ecr.create_repository(repositoryName=REPO)["repository"]
    print("저장소를 만들었습니다.")
except ecr.exceptions.RepositoryAlreadyExistsException:
    repo = ecr.describe_repositories(repositoryNames=[REPO])["repositories"][0]
    print("기존 저장소를 사용합니다.")

print("ECR 저장소 URI:", repo["repositoryUri"])
```

**셀 9 · 빌드 명령 buildspec.yml**  

CodeBuild가 실행할 명령입니다. 태스크 1·3·4·5.2에서 CloudShell에 입력하는 명령과 같은 순서입니다.

```python
%%writefile /content/docker-lab/buildspec.yml
version: 0.2

phases:
  pre_build:
    commands:
      - echo "== 태스크 1. Docker 환경 확인 =="
      - docker version
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
  build:
    commands:
      - echo "== 태스크 3. 이미지 빌드 =="
      - docker build -t cloudarchitect-lab-app:latest .
      - docker images cloudarchitect-lab-app
      - echo "== 태스크 4. 컨테이너 실행 8080 -> 3000 =="
      - docker run -d --name cloudarchitect-lab-app -p 8080:3000 cloudarchitect-lab-app:latest
      - for i in $(seq 1 15); do curl -sf http://localhost:8080/health > health.json && break; sleep 2; done
      - docker ps
      - cat health.json
      - grep -q '"status":"healthy"' health.json
      - curl -sf http://localhost:8080 > index.html
      - docker logs cloudarchitect-lab-app
      - echo "== 태스크 5. ECR 푸시 =="
      - docker tag cloudarchitect-lab-app:latest $ECR_REGISTRY/$REPO:latest
      - docker push $ECR_REGISTRY/$REPO:latest

artifacts:
  files:
    - health.json
    - index.html
```

**셀 10 · CodeBuild 준비**  

S3 버킷을 만들고 앱 파일을 업로드한 뒤, CodeBuild 서비스 역할과 Docker를 쓸 수 있는(privileged) 프로젝트를 만듭니다. 새 IAM 역할은 반영되는 데 수십 초가 걸릴 수 있어 프로젝트 생성을 몇 번 다시 시도합니다.

```python
import io, json, time, zipfile

# 1) S3 버킷
try:
    s3.create_bucket(Bucket=BUCKET, CreateBucketConfiguration={"LocationConstraint": REGION})
    print("S3 버킷을 만들었습니다:", BUCKET)
except s3.exceptions.BucketAlreadyOwnedByYou:
    print("기존 S3 버킷을 사용합니다:", BUCKET)

# 2) 소스 압축 업로드
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w") as z:
    for name in ["package.json", "server.js", "Dockerfile", "buildspec.yml"]:
        z.write(f"{APP_DIR}/{name}", name)
s3.put_object(Bucket=BUCKET, Key="source/docker-lab.zip", Body=buf.getvalue())
print("소스 업로드:", f"s3://{BUCKET}/source/docker-lab.zip")

# 3) CodeBuild 서비스 역할
if EXISTING_ROLE_ARN:
    role_arn = EXISTING_ROLE_ARN
else:
    trust = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "codebuild.amazonaws.com"},
            "Action": "sts:AssumeRole",
        }],
    }
    policy = {
        "Version": "2012-10-17",
        "Statement": [
            {"Effect": "Allow",
             "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
             "Resource": "*"},
            {"Effect": "Allow",
             "Action": ["s3:GetObject", "s3:GetObjectVersion", "s3:PutObject",
                        "s3:GetBucketLocation", "s3:GetBucketAcl"],
             "Resource": [f"arn:aws:s3:::{BUCKET}", f"arn:aws:s3:::{BUCKET}/*"]},
            {"Effect": "Allow", "Action": "ecr:GetAuthorizationToken", "Resource": "*"},
            {"Effect": "Allow",
             "Action": ["ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload",
                        "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage",
                        "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"],
             "Resource": repo["repositoryArn"]},
        ],
    }
    try:
        role_arn = iam.create_role(
            RoleName=ROLE_NAME, AssumeRolePolicyDocument=json.dumps(trust)
        )["Role"]["Arn"]
        print("IAM 역할을 만들었습니다:", ROLE_NAME)
    except iam.exceptions.EntityAlreadyExistsException:
        role_arn = iam.get_role(RoleName=ROLE_NAME)["Role"]["Arn"]
        print("기존 IAM 역할을 사용합니다:", ROLE_NAME)
    iam.put_role_policy(RoleName=ROLE_NAME, PolicyName=POLICY_NAME, PolicyDocument=json.dumps(policy))

# 4) CodeBuild 프로젝트
project = dict(
    name=PROJECT,
    source={"type": "S3", "location": f"{BUCKET}/source/docker-lab.zip"},
    artifacts={"type": "S3", "location": BUCKET, "path": "output", "name": "build", "packaging": "NONE"},
    environment={
        "type": "LINUX_CONTAINER",
        "image": "aws/codebuild/standard:7.0",
        "computeType": "BUILD_GENERAL1_SMALL",
        "privilegedMode": True,
        "environmentVariables": [
            {"name": "REPO", "value": REPO},
            {"name": "ECR_REGISTRY", "value": REGISTRY},
        ],
    },
    serviceRole=role_arn,
    timeoutInMinutes=15,
)
for attempt in range(12):
    try:
        try:
            cb.create_project(**project)
            print("CodeBuild 프로젝트를 만들었습니다:", PROJECT)
        except cb.exceptions.ResourceAlreadyExistsException:
            cb.update_project(**project)
            print("CodeBuild 프로젝트 설정을 갱신했습니다:", PROJECT)
        break
    except cb.exceptions.InvalidInputException as e:
        if "role" not in str(e).lower() or attempt == 11:
            raise
        print("IAM 역할이 반영되는 중입니다. 10초 후 다시 시도합니다.")
        time.sleep(10)
```

**셀 11 · 빌드 실행과 로그 확인**  

빌드는 보통 2–4분 걸립니다. 로그에서 `docker version`, `docker images`, `docker ps`의 `0.0.0.0:8080->3000/tcp`, `/health`의 `healthy`, `docker push` 결과를 차례로 확인합니다.

```python
build_id = cb.start_build(projectName=PROJECT)["build"]["id"]
print("빌드 시작:", build_id)

phase = None
while True:
    build = cb.batch_get_builds(ids=[build_id])["builds"][0]
    if build["currentPhase"] != phase:
        phase = build["currentPhase"]
        print(time.strftime("%H:%M:%S"), phase)
    if build["buildStatus"] != "IN_PROGRESS":
        break
    time.sleep(10)

print("빌드 결과:", build["buildStatus"])
print("-" * 60)

log = build.get("logs", {})
if log.get("groupName") and log.get("streamName"):
    events = logs.get_log_events(
        logGroupName=log["groupName"], logStreamName=log["streamName"], startFromHead=True
    )["events"]
    print("".join(e["message"] for e in events))

if build["buildStatus"] != "SUCCEEDED":
    raise RuntimeError("빌드가 실패했습니다. 위 로그의 마지막 오류를 확인하세요.")
```

**셀 12 · 컨테이너 화면과 ECR latest 확인**  

CodeBuild에서 실행한 컨테이너가 돌려준 `/health` 응답과 HTML 화면을 표시하고, ECR에 `latest` 이미지가 있는지 확인합니다.

```python
import html, json
from IPython.display import HTML, display

objects = s3.list_objects_v2(Bucket=BUCKET, Prefix="output/").get("Contents", [])
keys = {o["Key"].rsplit("/", 1)[-1]: o["Key"] for o in objects}

container_health = json.loads(s3.get_object(Bucket=BUCKET, Key=keys["health.json"])["Body"].read())
print("컨테이너 GET /health →", container_health)
assert container_health["status"] == "healthy", "healthy가 아닙니다."

page = s3.get_object(Bucket=BUCKET, Key=keys["index.html"])["Body"].read().decode("utf-8")
print("컨테이너 GET / 화면:")
display(HTML(f'<iframe srcdoc="{html.escape(page)}" style="width:100%;height:460px;border:0"></iframe>'))

image = ecr.describe_images(repositoryName=REPO, imageIds=[{"imageTag": "latest"}])["imageDetails"][0]
print("ECR 이미지:", f"{repo['repositoryUri']}:latest")
print("이미지 다이제스트:", image["imageDigest"])
print("푸시 시각:", image["imagePushedAt"])
```

**셀 13 · 실습 리소스 삭제**  

`CLEANUP = True`로 바꾸고 실행하면 코랩 Node.js 서버, ECR 저장소, CodeBuild 프로젝트와 로그, S3 버킷, 이 노트북이 만든 IAM 역할을 삭제합니다. `EXISTING_ROLE_ARN`을 쓴 경우 역할은 삭제하지 않습니다. 공용 ECR 저장소를 썼다면 저장소를 지우지 말고 담당자 지시에 따라 본인 태그만 정리합니다.

```python
CLEANUP = False  # 실습을 마친 뒤 True로 바꾸고 실행

def empty_and_delete_bucket():
    for pg in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET):
        for o in pg.get("Contents", []):
            s3.delete_object(Bucket=BUCKET, Key=o["Key"])
    s3.delete_bucket(Bucket=BUCKET)

def delete_role():
    iam.delete_role_policy(RoleName=ROLE_NAME, PolicyName=POLICY_NAME)
    iam.delete_role(RoleName=ROLE_NAME)

if CLEANUP:
    if "server" in globals() and server.poll() is None:
        server.terminate()
        print("삭제: 코랩 Node.js 서버")
    steps = [
        ("ECR 저장소", lambda: ecr.delete_repository(repositoryName=REPO, force=True)),
        ("CodeBuild 프로젝트", lambda: cb.delete_project(name=PROJECT)),
        ("CodeBuild 로그 그룹", lambda: logs.delete_log_group(logGroupName=f"/aws/codebuild/{PROJECT}")),
        ("S3 버킷", empty_and_delete_bucket),
    ]
    if not EXISTING_ROLE_ARN:
        steps.append(("IAM 역할", delete_role))
    for name, fn in steps:
        try:
            fn()
            print("삭제:", name)
        except Exception as e:
            print("건너뜀:", name, "-", type(e).__name__)
else:
    print("CLEANUP = True로 바꾸고 다시 실행하면 실습 리소스를 삭제합니다.")
```

**문제 해결**  

| 증상 | 확인할 것 |
|---|---|
| 셀 2에서 `SecretNotFoundError` 또는 `NotebookAccessError` | 보안 비밀 이름과 노트북 접근 허용 스위치 |
| 셀 2에서 `ExpiredToken` | 임시 자격 증명이 만료됨. 새 값으로 보안 비밀을 바꾸고 셀 2부터 다시 실행 |
| 셀 7 화면이 비어 있음 | `output.serve_kernel_port_as_window(3000)`으로 새 탭에서 열기 |
| 셀 10에서 `AccessDenied` (`iam:CreateRole`) | 담당자에게 CodeBuild 역할 ARN을 받아 `EXISTING_ROLE_ARN`에 입력 |
| 셀 11에서 `AccountLimitExceededException` | 새 계정의 CodeBuild 동시 실행 한도. 담당자에게 문의 |
| 셀 11 로그의 `docker push`에서 `denied` | 셀 8의 저장소 이름과 `REPO`가 같은지, 역할 정책이 반영됐는지 확인 |

참고 문서

- [CloudShell에서 Docker 빌드 및 ECR 푸시](https://docs.aws.amazon.com/cloudshell/latest/userguide/tutorial-docker-cli.html)
- [CloudShell 접근 권한](https://docs.aws.amazon.com/cloudshell/latest/userguide/sec-auth-with-identities.html)
- [CodeBuild에서 Docker 이미지 빌드 및 ECR 푸시](https://docs.aws.amazon.com/codebuild/latest/userguide/sample-docker.html)
- [CodeBuild buildspec 참조](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html)
- [Node.js 릴리스 지원 현황](https://nodejs.org/en/about/previous-releases)
