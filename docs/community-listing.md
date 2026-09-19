# Figma Community listing

Copy these fields into the publish form (**Plugins → Manage plugins → Frame Name Control → Publish**).

| Field | Value |
| --- | --- |
| Name | Frame Name Control |
| Tagline | Hide frame name labels on the canvas with one click |
| Category | Design tools |
| Icon | `assets/icon.png` (128 × 128) |
| Thumbnail | `assets/cover.mp4` (video, 1920 × 1080). If the form rejects it, use `assets/cover.png`. |
| Carousel (optional) | `assets/cover.gif`, `assets/cover.png` |
| Support contact | https://docs.google.com/forms/d/e/1FAIpQLSeSW8T6jTH7-0Vgd6DsBZE14iGYCRsVAxkcF2ton4zTk7KvVA/viewform |
| Network access | None |

## Description

Paste everything between the lines. The English part comes first, then Korean.

---

Hide the name labels above frames to see a clean canvas. Click again to bring them back. Nothing to set up.

HIGHLIGHTS
• Free
• Restores the exact original names, even after you close and reopen the file
• Explains what it changes the first time you run it
• Adds a Hide/Show Frame Name button under Tools in the right panel after the first use

KEYBOARD SHORTCUT (macOS, optional)
Figma can't give plugins a shortcut, but macOS can bind one to a menu item. One minute, once per computer:
1. Open System Settings → Keyboard → Keyboard Shortcuts… → App Shortcuts
2. Click +, choose Figma, and enter the menu title: Toggle Frame Names
3. Click the shortcut field, press ⌥⌘F, then click Done
4. Quit Figma with ⌘Q and open it again
On Windows, use the button in the right panel.

COMMANDS
• Open: opens the plugin window with buttons to hide and restore names, plus the scope and language
• Toggle Frame Names: hides names, or restores them if they're hidden
• Hide Frame Name Labels / Show Frame Name Labels
• Restore All Frame Names: restores every page, whatever the scope

HOW IT WORKS
Figma's plugin API can't switch off canvas labels. The plugin renames each frame to an invisible character (U+2800) and stores the original name in the layer's plugin data. Because of that:
• Names look blank in the Layers panel too
• Collaborators see the change
• ⌘Z brings names back, and version history is a safe fallback
• Only frames whose names show on the canvas change. Sections, components, and frames inside other frames or groups keep their names

Feedback: https://docs.google.com/forms/d/e/1FAIpQLSeSW8T6jTH7-0Vgd6DsBZE14iGYCRsVAxkcF2ton4zTk7KvVA/viewform
Made by Belle Kim · https://www.linkedin.com/in/belleyejinkim/
Source code: https://github.com/belleyejinkim/figma-frame-control

―――――

캔버스의 프레임 이름 라벨을 숨겨 화면을 깔끔하게 보고, 다시 한 번 눌러 켭니다. 따로 설정할 것은 없습니다.

특징
• 무료입니다
• 파일을 닫았다 열어도 원래 이름을 정확히 되돌립니다
• 처음 실행할 때 무엇을 바꾸는지 안내합니다
• 한 번 쓰고 나면 오른쪽 패널 Tools에 Hide/Show Frame Name 버튼이 생깁니다

단축키 (macOS, 선택)
Figma는 플러그인에 단축키를 줄 수 없지만, macOS는 메뉴 항목에 단축키를 붙일 수 있습니다. 컴퓨터마다 한 번, 1분이면 됩니다.
1. 시스템 설정 → 키보드 → 키보드 단축키… → 앱 단축키를 엽니다
2. + 버튼을 누르고 Figma를 고른 뒤, 메뉴 제목에 Toggle Frame Names를 입력합니다
3. 키보드 단축키 칸을 누르고 ⌥⌘F를 누른 다음 완료를 누릅니다
4. Figma를 ⌘Q로 종료했다가 다시 엽니다
Windows에서는 오른쪽 패널 버튼을 쓰세요.

명령
• Open: 이름을 숨기고 되돌리는 버튼과 적용 범위, 언어가 있는 플러그인 창을 엽니다
• Toggle Frame Names: 이름을 숨기고, 숨겨져 있으면 되돌립니다
• Hide Frame Name Labels / Show Frame Name Labels
• Restore All Frame Names: 범위와 상관없이 모든 페이지를 되돌립니다

동작 방식
Figma 플러그인 API로는 캔버스 라벨을 끌 수 없습니다. 그래서 프레임 이름을 보이지 않는 문자(U+2800)로 바꾸고, 원래 이름은 레이어의 plugin data에 보관합니다. 이 방식에는 이런 특징이 있습니다.
• 레이어 패널에서도 이름이 비어 보입니다
• 같은 파일을 보는 동료에게도 보입니다
• ⌘Z나 버전 기록으로 되돌릴 수 있습니다
• 캔버스에 이름이 보이는 프레임만 바꾸고, 섹션·컴포넌트·다른 프레임이나 그룹 안의 프레임은 그대로 둡니다

피드백: https://docs.google.com/forms/d/e/1FAIpQLSeSW8T6jTH7-0Vgd6DsBZE14iGYCRsVAxkcF2ton4zTk7KvVA/viewform
만든 사람: Belle Kim · https://www.linkedin.com/in/belleyejinkim/
소스 코드: https://github.com/belleyejinkim/figma-frame-control

---

## Security disclosure (optional form)

- Collects user data: no
- Network access: none (`networkAccess.allowedDomains` is `["none"]`)
- Stores data: layer names in each layer's plugin data (saved in the file), and settings in `figma.clientStorage` (local to the user)
