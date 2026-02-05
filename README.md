# CELDYQUE Website

B:Lab 스타일의 CELDYQUE 브랜드 홈페이지입니다.

## 📁 파일 구조

```
/
├── index.html      # 메인 홈페이지
├── shop.html       # 제품 페이지 (필터 기능 포함)
├── about.html      # 브랜드 스토리 + Coming Soon
├── store.html      # 외부 판매처 링크
├── faq.html        # FAQ 페이지
├── CNAME           # 커스텀 도메인 설정
└── README.md       # 이 파일
```

## 🚀 GitHub Pages 배포

### 터미널에서 실행

```bash
git add .
git commit -m "Add complete CELDYQUE website"
git push origin main
```

### Settings → Pages 확인
- Branch: `main`
- Folder: `/ (root)`

## 🌐 커스텀 도메인 설정

### 1. DNS 설정 (도메인 제공업체에서)

**A 레코드** (4개):
```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**CNAME 레코드**:
```
이름: www
값: [username].github.io
```

### 2. GitHub Pages 설정
Custom domain에 `www.celdyque.com` 입력 → Save

## 🔍 SEO/AEO 최적화 포함 항목

- ✅ Meta tags (title, description, keywords)
- ✅ Open Graph tags (Facebook/Twitter)
- ✅ Schema.org JSON-LD (Organization, WebSite, Product, FAQPage)
- ✅ Canonical URLs
- ✅ Semantic HTML5 구조
- ✅ Image alt 태그
- ✅ 모바일 반응형

## ✏️ 커스터마이징

### 이미지 교체
Unsplash 이미지 → 실제 제품 이미지로 교체

### 외부 링크 수정
`store.html`에서 `#` 링크를 실제 URL로 변경

### 제품 데이터 수정
`shop.html`의 `products` 배열 수정

---

© 2024 CELDYQUE