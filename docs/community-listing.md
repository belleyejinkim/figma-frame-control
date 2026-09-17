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
| Support contact | https://docs.google.com/forms/d/e/1FAIpQLSeSW8T6jTH7-0Vgd6DsBZE14iGYCRsVAxkcF2ton4zTk7KvVA/viewform |
| Network access | None |

## Description

Paste everything between the lines. The English part comes first, then Korean.

---

Hide the name labels above frames and sections to see a clean canvas. Press the same shortcut to bring them back.

HIGHLIGHTS
• Free
• Restores the exact original names, even after you close and reopen the file
• Explains what it changes the first time you run it

COMMANDS
• Toggle Frame Names: hides names, or restores them if they're hidden
• Hide Frame Name Labels / Show Frame Name Labels
• Restore All Frame Names: restores every page, whatever the scope
• Frame Name Settings: opens the plugin window with the status, scope (this page, all pages, selection), and language

HOW IT WORKS
Figma's plugin API can't switch off canvas labels. The plugin renames each frame to an invisible character (U+2800) and stores the original name in the layer's plugin data. Because of that:
• Names look blank in the Layers panel too
• Collaborators see the change
• ⌘Z brings names back, and version history is a safe fallback
• Instances, variants, and frames nested inside other frames keep their names

Feedback: https://docs.google.com/forms/d/e/1FAIpQLSeSW8T6jTH7-0Vgd6DsBZE14iGYCRsVAxkcF2ton4zTk7KvVA/viewform
Made by Belle Kim · https://www.linkedin.com/in/belleyejinkim/
Source code: https://github.com/belleyejinkim/figma-frame-control

―――――

캔버스의 프레임·섹션 이름 라벨을 숨겨 화면을 깔끔하게 보고, 같은 단축키로 다시 켭니다.

특징
• 무료입니다
• 파일을 닫았다 열어도 원래 이름을 정확히 되돌립니다
• 처음 실행할 때 무엇을 바꾸는지 안내합니다

명령
• Toggle Frame Names: 이름을 숨기고, 숨겨져 있으면 되돌립니다
• Hide Frame Name Labels / Show Frame Name Labels
• Restore All Frame Names: 범위와 상관없이 모든 페이지를 되돌립니다
• Frame Name Settings: 현재 상태, 적용 범위(이 페이지, 모든 페이지, 선택 영역), 언어를 보는 플러그인 창을 엽니다

동작 방식
Figma 플러그인 API로는 캔버스 라벨을 끌 수 없습니다. 그래서 프레임 이름을 보이지 않는 문자(U+2800)로 바꾸고, 원래 이름은 레이어의 plugin data에 보관합니다. 이 방식에는 이런 특징이 있습니다.
• 레이어 패널에서도 이름이 비어 보입니다
• 같은 파일을 보는 동료에게도 보입니다
• ⌘Z나 버전 기록으로 되돌릴 수 있습니다
• 인스턴스, 배리언트, 다른 프레임 안의 프레임은 이름을 바꾸지 않습니다

피드백: https://docs.google.com/forms/d/e/1FAIpQLSeSW8T6jTH7-0Vgd6DsBZE14iGYCRsVAxkcF2ton4zTk7KvVA/viewform
만든 사람: Belle Kim · https://www.linkedin.com/in/belleyejinkim/
소스 코드: https://github.com/belleyejinkim/figma-frame-control

---

## Security disclosure (optional form)

- Collects user data: no
- Network access: none (`networkAccess.allowedDomains` is `["none"]`)
- Stores data: layer names in each layer's plugin data (saved in the file), and settings in `figma.clientStorage` (local to the user)
