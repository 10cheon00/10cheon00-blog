# 10cheon00의 Archive

Gatsby 기반 `old-blog`와 루트의 Markdown 문서를 함께 이식하기 위한 Astro 블로그입니다.

## 선택한 프레임워크

Astro를 사용합니다.

- Markdown/MDX 콘텐츠 컬렉션을 공식 지원합니다.
- 기본 빌드 결과가 정적 HTML이라 개인 서버에서 운영하기 쉽습니다.
- 레이아웃은 `.astro` 컴포넌트와 CSS로 직접 수정할 수 있어 유지보수가 단순합니다.
- 필요하면 React, Vue, Svelte 같은 UI 프레임워크를 부분적으로 붙일 수 있습니다.

## 시작하기

```bash
cd astro-blog
npm install
npm run migrate
npm run dev
```

현재 작업 환경에 Node.js가 없다면 Node.js 24 LTS 이상을 설치한 뒤 실행합니다.

## 콘텐츠 구조

```text
src/content/blog/
  posts/Gatsby-사이트-구축기/index.md
  computer-network/링크-레이어/index.md
  freertos/FreeRTOS-인터럽트.md
public/
  루트 Markdown에서 /파일명.png 형태로 참조하던 이미지
```

Gatsby 글은 기존처럼 `글 폴더/index.md`와 같은 위치의 이미지를 함께 둡니다. 루트 Markdown 글은 `src/content/blog/freertos/`로 복사되고, `/이미지.png` 링크가 계속 동작하도록 루트 이미지 파일은 `public/`에 복사됩니다.

## 기존 글 다시 이식하기

```bash
npm run migrate
```

이 명령은 다음을 수행합니다.

- `../old-blog/content/blog/**`를 `src/content/blog/**`로 복사
- `../*.md`를 `src/content/blog/freertos/`로 복사
- `../*.png`, `../*.jpg`, `../*.pdf` 등을 `public/`으로 복사

## 새 글 작성

```bash
npm run new:post -- "글 제목" posts
```

생성된 글은 `draft: true` 상태입니다. 공개하려면 frontmatter에서 `draft: false`로 바꾸거나 해당 줄을 제거합니다.

## 빌드

```bash
SITE_URL=https://blog.example.com npm run build
```

결과물은 `dist/`에 생성됩니다.

## 배포

서버 배포 방식은 [docs/deployment.md](docs/deployment.md)를 참고합니다.
