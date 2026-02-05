# CELDYQUE Website (Optimized)

## 적용된 최적화

### 1. 모바일 메뉴 (완전 구현)
- 햄버거 → X 애니메이션
- 슬라이드 드로어 메뉴
- 오버레이 클릭으로 닫기
- ESC 키로 닫기
- 메뉴 열릴 때 body 스크롤 잠금

### 2. 터치 최적화
- 모든 터치 타겟 최소 48px
- `:active` 상태 추가
- Passive event listeners
- iOS 입력 확대 방지

### 3. 접근성 (a11y)
- ARIA 속성 (aria-label, aria-expanded, aria-hidden)
- Skip to content 링크
- focus-visible 스타일
- prefers-reduced-motion 지원
- Semantic HTML

### 4. 성능
- Preconnect (fonts, images)
- Lazy loading (이미지)
- fetchpriority="high" (히어로 이미지)
- 최소화된 CSS

### 5. 모바일 UX
- Safe area insets (노치 대응)
- 100dvh (동적 뷰포트)
- theme-color 메타태그
- apple-mobile-web-app-capable

## 배포

```bash
git add .
git commit -m "Add optimized mobile menu and touch support"
git push origin main
```

## 파일
- `index.html` - 홈
- `shop.html` - 제품 + 필터
- `about.html` - 브랜드 스토리
- `store.html` - 판매처
- `faq.html` - FAQ