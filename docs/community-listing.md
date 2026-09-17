# Figma Community listing

Copy these fields into the publish form (**Plugins → Manage plugins → Frame Name Control → Publish**).

| Field | Value |
| --- | --- |
| Name | Frame Name Control |
| Tagline | Hide frame name labels on the canvas with one keyboard shortcut |
| Category | Design tools |
| Icon | `assets/icon.png` (128 × 128) |
| Thumbnail | `assets/cover.mp4` (video, 1920 × 1080). If the form rejects it, use `assets/cover.png`. |
| Carousel (optional) | `assets/cover.gif`, `assets/cover.png` |
| Support contact | https://github.com/belleyejinkim/figma-frame-control/issues |
| Network access | None |

## Description

Paste everything between the lines. The English part comes first, then Korean.

---

Hide the name labels above frames and sections to see a clean canvas. Press the same shortcut to bring them back.

HIGHLIGHTS
• Free
• Menu commands keep fixed names, so you can bind a macOS keyboard shortcut to them
• Restores the exact original names, even after you close and reopen the file
• Explains what it changes the first time you run it

SET UP A SHORTCUT (macOS desktop app)
1. Open System Settings → Keyboard → Keyboard Shortcuts… → App Shortcuts.
2. Click +, choose Figma, and enter the menu title: Toggle Frame Names
3. Click the shortcut field, press ⌥⌘F, and click Done.
4. Quit Figma with ⌘Q and open it again.

Tip: ⌥⌘F is awkward with one hand. Hold ⌘⌥ on the right side of the keyboard with your right hand, and press F with your left.

No setup: run the plugin once, then press ⌥⌘P (Run last plugin). On Windows, press Ctrl+Alt+P.

COMMANDS
• Toggle Frame Names: hides names, or restores them if they're hidden
• Hide Frame Name Labels / Show Frame Name Labels
• Restore All Frame Names: restores every page, whatever the scope
• Frame Name Settings: scope (this page, all pages, selection), sections, components, instances, nested frames, language, and a shortcut helper

HOW IT WORKS
Figma's plugin API can't switch off canvas labels. The plugin renames each frame to an invisible character (U+2800) and stores the original name in the layer's plugin data. Because of that:
• Names look blank in the Layers panel too
• Collaborators see the change
• ⌘Z brings names back, and version history is a safe fallback
• Variant components are never renamed, and instances are off by default

Feedback: https://github.com/belleyejinkim/figma-frame-control/issues
Made by Belle Kim · https://www.linkedin.com/in/belleyejinkim/
Source code: https://github.com/belleyejinkim/figma-frame-control

―――――

캔버스의 프레임·섹션 이름 라벨을 숨겨 화면을 깔끔하게 보고, 같은 단축키로 다시 켭니다.

특징
• 무료입니다
• 메뉴 명령 이름이 바뀌지 않아 macOS 단축키를 붙일 수 있습니다
• 파일을 닫았다 열어도 원래 이름을 정확히 되돌립니다
• 처음 실행할 때 무엇을 바꾸는지 안내합니다

단축키 지정 (macOS 데스크톱 앱)
1. 시스템 설정 → 키보드 → 키보드 단축키… → 앱 단축키를 엽니다.
2. + 버튼을 누르고 Figma를 고른 뒤, 메뉴 제목에 Toggle Frame Names를 입력합니다.
3. 키보드 단축키 칸을 누르고 ⌥⌘F를 누른 다음 완료를 누릅니다.
4. Figma를 ⌘Q로 종료했다가 다시 엽니다.

팁: ⌥⌘F는 한 손으로 누르기 어렵습니다. 오른손으로 키보드 오른쪽의 ⌘⌥를 누른 채 왼손으로 F를 누르면 편합니다.

설정 없이 쓰려면 한 번 실행한 뒤 ⌥⌘P(마지막 플러그인 다시 실행)를 누르세요. Windows에서는 Ctrl+Alt+P입니다.

명령
• Toggle Frame Names: 이름을 숨기고, 숨겨져 있으면 되돌립니다
• Hide Frame Name Labels / Show Frame Name Labels
• Restore All Frame Names: 범위와 상관없이 모든 페이지를 되돌립니다
• Frame Name Settings: 적용 범위(이 페이지, 모든 페이지, 선택 영역), 섹션·컴포넌트·인스턴스·중첩 프레임 포함 여부, 언어, 단축키 도우미

동작 방식
Figma 플러그인 API로는 캔버스 라벨을 끌 수 없습니다. 그래서 프레임 이름을 보이지 않는 문자(U+2800)로 바꾸고, 원래 이름은 레이어의 plugin data에 보관합니다. 이 방식에는 이런 특징이 있습니다.
• 레이어 패널에서도 이름이 비어 보입니다
• 같은 파일을 보는 동료에게도 보입니다
• ⌘Z나 버전 기록으로 되돌릴 수 있습니다
• 배리언트 컴포넌트는 이름을 바꾸지 않고, 인스턴스는 기본으로 빠져 있습니다

피드백: https://github.com/belleyejinkim/figma-frame-control/issues
만든 사람: Belle Kim · https://www.linkedin.com/in/belleyejinkim/
소스 코드: https://github.com/belleyejinkim/figma-frame-control

---

## Security disclosure (optional form)

- Collects user data: no
- Network access: none (`networkAccess.allowedDomains` is `["none"]`)
- Stores data: layer names in each layer's plugin data (saved in the file), and settings in `figma.clientStorage` (local to the user)
