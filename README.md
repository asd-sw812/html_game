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


## 3D 캐릭터·보스·전투 연출

- `assets/subculture-3d.js`: 전투 장면, 캐릭터 카드 렌더링과 게임 이벤트 연결
- `assets/models/toon-models.js`: 셀 셰이딩 캐릭터, 얼굴 텍스처, 의상·무기와 관절 동작
- `assets/models/archive-stage.js`: 보스 3종과 입체적인 아카이브 전장
- `assets/models/combat-fx.js`: 덱별 효과, 파티클 및 블룸 처리
- `assets/3D-ART-NOTES.md`: 구현 범위와 현재 에셋의 한계
- `tests/visual-runtime-smoke.cjs`: 전투·렌더링·모바일 회귀 확인

96명은 남성 19명·여성 77명으로 구성되며, 외부 WebP 없이도 편성 카드와 전투 모델이 표시된다. 위의 이미지 슬롯은 별도 원화로 교체할 때 사용할 수 있다. WebGL2를 지원하는 브라우저에서 실행해야 한다.
