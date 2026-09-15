# The Endless Archive

## 추가해야 하는 요소
- 사운드
- 이미지
- 효과 이미지(공격 이펙트 같은)

## 이번 작업에서 추가된 구조
- `asset-config.js` : 이미지/VFX/사운드 경로 중앙 관리
- `assets/runtime-assets.js` : UI 클릭음 로딩, 덱/스킬 키워드 기반 전용 VFX 출력
- `assets/styles/visual-upgrade.css` : 전투 배경 및 외부 VFX 표시 스타일
- `assets/images/backgrounds/battle-grid.svg` : 기본 전투 배경
- `assets/vfx/` : 출혈, 맹독, 빙결, 탄환, 정신, 광휘, 물결, 나무 VFX
- `assets/images/characters/` : 캐릭터 이미지 슬롯
- `assets/images/bosses/` : 보스 이미지 슬롯
- `assets/audio/` : UI/전투/BGM 오디오 슬롯

## 남은 실제 에셋
- 캐릭터 WebP 이미지
- 보스 WebP 이미지
- 실제 UI/전투 효과음
- 전투/편성 BGM

공통 섬광/슬래시 VFX는 사용하지 않고, 식별 가능한 공격 타입에만 해당 VFX가 나오도록 구성한다.
