# legacy — 기존 프로토타입 (참고용, 수정 금지)

`미수금.zip` 의 원본 React 프로토타입을 그대로 보존한 디렉터리입니다.
in-browser Babel + 전역(window.AppData) 방식이라 그대로는 빌드되지 않습니다.

다음 단계에서 이 파일들을 `../screens/` 의 모듈형 컴포넌트로 이식하면서
`window.AppData.buildDataset()` 호출을 `../api.js` 의 백엔드 호출로 교체합니다.

| 원본 | 이식 대상 |
|------|-----------|
| App.jsx          | ../App.jsx (네비/라우팅) |
| ReceivablesList.jsx | ../screens/ReceivablesList.jsx |
| Dashboard.jsx    | ../screens/Dashboard.jsx |
| BankMatching.jsx | ../screens/BankMatching.jsx |
| Flows.jsx        | ../screens/ClosureBoard.jsx, PendingBoard.jsx |
| drawer.jsx       | 회원 상세 드로어 컴포넌트 |
| ui.jsx           | 공통 UI 컴포넌트 |
| data.jsx         | 백엔드 billing.py + models.py 로 이미 이식 |
