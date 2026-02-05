# CELDYQUE Website

b-lab 스타일을 적용한 CELDYQUE 브랜드 홈페이지입니다.

## 🚀 GitHub Pages 배포 방법

### 방법 1: 가장 간단한 방법 (권장)

1. **GitHub 저장소 생성**
   - GitHub.com에서 `celdyque.github.io` 또는 원하는 이름으로 새 저장소 생성
   - Public으로 설정

2. **파일 업로드**
   - 저장소에서 "Add file" → "Upload files" 클릭
   - `index.html` 파일 업로드
   - "Commit changes" 클릭

3. **GitHub Pages 활성화**
   - 저장소 Settings → Pages로 이동
   - Source: "Deploy from a branch" 선택
   - Branch: `main` 선택, 폴더: `/ (root)` 선택
   - Save 클릭

4. **접속**
   - 몇 분 후 `https://[username].github.io/[repo-name]` 에서 확인 가능

### 방법 2: Git 사용 (로컬 작업)

```bash
# 1. 저장소 클론
git clone https://github.com/[username]/[repo-name].git
cd [repo-name]

# 2. 파일 복사 (index.html을 저장소 루트에)
cp path/to/index.html .

# 3. 커밋 & 푸시
git add .
git commit -m "Initial website"
git push origin main
```

## 🌐 커스텀 도메인 연결 (선택사항)

1. **도메인 DNS 설정** (도메인 제공업체에서)
   - A 레코드 추가:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
   - 또는 CNAME 레코드: `[username].github.io`

2. **GitHub 설정**
   - Settings → Pages → Custom domain에 도메인 입력
   - "Enforce HTTPS" 체크

3. **CNAME 파일 생성**
   ```
   www.celdyque.com
   ```

## 📁 파일 구조

```
/
├── index.html      # 메인 페이지 (전체 코드 포함)
├── CNAME          # 커스텀 도메인용 (선택)
└── README.md      # 이 파일
```

## ✏️ 커스터마이징

### 이미지 교체
`index.html`에서 Unsplash 이미지 URL을 실제 제품 이미지로 교체:

```html
<!-- 현재 -->
<img src="https://images.unsplash.com/..." alt="...">

<!-- 변경 -->
<img src="images/your-image.jpg" alt="...">
```

### 색상 변경
CSS 변수 수정:

```css
:root {
    --color-accent: #c9a96e;  /* 골드 → 원하는 색상 */
    --color-text: #1a1a1a;
}
```

### 연락처 정보
Footer와 CTA 섹션의 이메일, 링크 업데이트

## 🔄 더 나은 대안들

| 옵션 | 장점 | 단점 |
|------|------|------|
| **GitHub Pages** | 무료, 간단, 커스텀 도메인 | 정적 사이트만 |
| **Netlify** | 무료, CI/CD, 폼 기능 | 약간의 학습 필요 |
| **Vercel** | 무료, 빠름, 미리보기 | 상업용 제한 |
| **Cloudflare Pages** | 무료, 빠른 CDN | 설정 복잡 |

**추천**: GitHub Pages로 시작하고, 필요시 Netlify로 마이그레이션

## 📞 지원

문제가 있으면 GitHub Issues를 통해 문의하세요.

---

*Built with ❤️ for CELDYQUE*