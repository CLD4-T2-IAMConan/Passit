# Assets Images

이 폴더는 컴포넌트에서 import해서 사용하는 이미지 파일들을 저장합니다.

## 사용 방법

```jsx
// import로 가져오기
import logo from '../assets/images/logo.svg';
import icon from '../assets/images/icon.png';

// 사용
<img src={logo} alt="Logo" />
<Box component="img" src={icon} alt="Icon" />
```

## 권장 파일 유형

- ✅ 컴포넌트별 전용 이미지
- ✅ 작은 아이콘 (16x16, 24x24 등)
- ✅ 동적으로 변경되는 이미지
- ✅ 번들 최적화가 필요한 이미지
