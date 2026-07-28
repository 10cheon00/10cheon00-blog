# 개인 서버 배포 가이드

이 프로젝트는 Astro 정적 빌드 결과물인 `dist/`를 배포합니다. 서버에서는 Node.js 앱을 계속 띄울 필요가 없고, Nginx가 정적 파일만 서빙하면 됩니다.

## 로컬 또는 서버에서 직접 배포

```bash
cd astro-blog
cp .env.example .env
npm install
npm run migrate
SITE_URL=https://blog.example.com npm run build
```

빌드 결과는 `astro-blog/dist/`에 생성됩니다. 서버의 Nginx 문서 루트로 이 폴더 내용을 복사합니다.

```bash
sudo mkdir -p /var/www/blog
sudo rsync -az --delete dist/ /var/www/blog/
```

Nginx 서버 블록 예시:

```nginx
server {
  listen 80;
  server_name blog.example.com;
  root /var/www/blog;
  index index.html;

  location / {
    try_files $uri $uri/ $uri.html =404;
  }
}
```

HTTPS는 서버 환경에 맞게 Certbot 또는 리버스 프록시에서 설정합니다.

## Docker Compose 배포

서버에 Docker와 Docker Compose가 있다면 다음처럼 실행할 수 있습니다.

```bash
cd astro-blog
cp .env.example .env
docker compose up -d --build
```

기본 포트는 `8080`입니다. `.env`에서 변경할 수 있습니다.

```env
SITE_URL=https://blog.example.com
BLOG_PORT=8080
```

Nginx Proxy Manager, Caddy, Traefik 같은 리버스 프록시를 쓴다면 외부 도메인을 `BLOG_PORT`로 연결하면 됩니다.

## GitHub Actions 배포

`.github/workflows/deploy.yml`은 다음 순서로 실행됩니다.

1. 콘텐츠 마이그레이션
2. Astro 검사 및 정적 빌드
3. 빌드 산출물 업로드
4. 서버로 `rsync` 배포

GitHub 저장소 Settings에서 다음 값을 등록합니다.

Variables:

- `SITE_URL`: 실제 블로그 URL
- `DEPLOY_HOST`: 서버 호스트명 또는 IP
- `DEPLOY_USER`: SSH 사용자
- `DEPLOY_PATH`: 서버의 정적 파일 배포 경로, 예: `/var/www/blog`

Secrets:

- `DEPLOY_SSH_KEY`: 서버에 접속 가능한 private key

서버에는 해당 public key가 `~/.ssh/authorized_keys`에 등록되어 있어야 합니다.
