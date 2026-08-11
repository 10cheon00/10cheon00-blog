---
title: VSCode에서 STM32F411CEU6(Black-Pill) 개발환경 구축하기
date: "2026-01-22T16:36:02+09:00"
tags: ["embedded"]
category:
  name: "Embedded"
---

# 개발 환경

| 대상 | 버전 |
| --- | --- |
| OS | Windows 10 24H2(Desktop), MacOS Sequoia 15.5(24F74)(MacBook M2 Air) |
| STM32CubeMX | 6.16.1 |
| STM32CubeProg | 2.21.0 |
| 보드 | STM32F411CEU6 |
| 펌웨어 | V24J46S7 |

# 동기

![](<./assets/vscode-black-pill-01.jpg>)![](<./assets/vscode-black-pill-02.jpg>)

두 번째 사진처럼 작은 LCD 스크린에 영상을 띄워보고 싶다는 욕심이 들었다. 그래서 먼저 GPT를 통해 STM32사 칩중에 LCD 스크린에 영상을 띄우기 적절한 칩을 추천해달라고 하니 Black-Pill(이하 블랙필)을 추천해주었다.

그래서 알리익스프레스를 통해 보드와 LCD 스크린(ST7789)을 주문했고 4 ~ 5일 후 받아볼 수 있었다. 자주 쓰던 Nucleo 보드와 별 차이 없이 개발할 수 있겠다고 생각하여 CubeMX를 사용해 기본 코드만 생성 후 디버깅하여 실행을 하려고 했는데...안되더라.

그냥 CubeIDE를 쓰면 되겠지만, 초기환경을 구축해보는 것도 도움이 되지 않을까 생각해 VSCode에서 디버깅하는 방법을 찾아보았다.

# ST-Link V2

![](<./assets/vscode-black-pill-03.jpg>)

우선 Nucleo 보드는 ST-Link가 보드에 내장되어 있다. 위 사진에서 노란색 부분이다. 디버깅을 위해서는 ST-Link 같은 디버거가 필요한데, 블랙필 보드에는 따로 내장되어 있지 않다. 그래서 ST-Link를 연결해야한다.

![](<./assets/vscode-black-pill-04.jpg>)

ST-LINK를 검색하면 상당히 오래되어 보이는 케이블을 볼 수 있는데 가격이 좀 비싸다(45,000원). 거창한게 필요하지 않고, 보드에 있는 4핀 SWD만 이용하면 된다. 그러므로 저 45,000원짜리 케이블을 살 필요까진 없고 미니 케이블 정도만 있으면 된다. 네이버 쇼핑에서 검색해보면 몇천원정도로 얻을 수 있다.

# 펌웨어 업데이트

환경을 다 구축한 후 디버깅하려고 ST-Link를 연결하면 펌웨어를 업데이트하라고 한다. 그러니 미리 STM32CubeProgrammer 프로그램을 통해 펌웨어를 업데이트 해야한다.

![](<./assets/vscode-black-pill-05.png>)

> 이 사진은 펌웨어 업데이트 이후 찍은 사진이어서 펌웨어 버전이 최신으로 되어 있습니다. 초기 펌웨어 버전은 V2J36~ 이었던 것 같습니다.

ST-Link 케이블을 4핀 커넥터에 각각 연결하고(3.3V, GND, SWDIO=DIO, SWCLK=SCK) 케이블을 컴퓨터에 꽂으면 위 사진처럼 ST-LINK로 잘 인식되는걸 볼 수 있다. 이 때 USB-C타입에는 연결하지 않아도 된다.

![](<./assets/vscode-black-pill-06.png>)

펌웨어 업그레이드 버튼을 누르고 업데이트 모드로 진입하려고 하면, **DFU mode**가 아니라고 에러가 발생한다.

> DFU 모드는 Device Firmware Update mode로 펌웨어 업그레이드 모드다. [https://theapplewiki.com/wiki/DFU\_Mode](https://theapplewiki.com/wiki/DFU_Mode)

DFU 모드에 진입하기 위해서는 보드에 있는 BOOT0 버튼을 누른 채로 NRST 버튼을 눌렀다 떼야한다. DFU 모드를 설정하고 다시 USB를 다시 연결하면 펌웨어 업데이트가 가능하다.

# VSCode 설정

CubeMX로 LED(PC13)를 토글하는 간단한 프로젝트를 만든 후 CMake 툴체인을 사용하여 빌드하도록 설정했다.

![](<./assets/vscode-black-pill-07.png>)

VSCode로 프로젝트 폴더를 열고 STM32 확장프로그램의 Setup STM32Cube project(s)를 누른다. 디바이스는 STM32F411CEU6을 선택하고 Configure를 누른다. 그러면 Debug와 Release 중 하나를 선택하라고 나오는데 Debug를 선택한다.

![](<./assets/vscode-black-pill-08.png>)

STM32 확장프로그램을 사용해 디버깅을 하려면 launch.json이 필요하다. Run and Debug 탭에서 create launch.json file을 누르고 STM32Cube : STLink GDB Server를 선택하면 끝난다.

![](<./assets/vscode-black-pill-09.png>)

디버깅을 하면 위 사진과 같이 잘 되는 것을 확인할 수 있다.
