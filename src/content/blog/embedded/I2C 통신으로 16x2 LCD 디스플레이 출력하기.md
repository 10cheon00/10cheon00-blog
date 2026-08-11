---
title: I2C 통신으로 16x2 LCD 디스플레이 출력하기
date: "2025-06-30T16:36:02+09:00"
tags: ["embedded"]
category:
  name: "Embedded"
---

# 개발 환경

| 대상 | 버전 |
| --- | --- |
| OS | Windows 10 24H2(Desktop), MacOS Sequoia 15.5(24F74)(MacBook M2 Air) |
| STM32CubeIDE | 1.18.1 |
| STM32CubeMX | 6.14.1 |
| STM32CubeProg | 2.19.0 |
| STM32CubeCLT | 1.18.0 |
| 보드 | Nucleo-F103RB |
| 펌웨어 | V24J46M32 |

# 사용한 모듈과 데이터 시트

| 모듈 | 데이터시트 |
| --- | --- |
| B10K Potentiometer | [https://www.mouser.com/datasheet/2/13/RV24AF-1658492.pdf](https://www.mouser.com/datasheet/2/13/RV24AF-1658492.pdf) |
| HD44780U | [https://cdn.sparkfun.com/assets/9/5/f/7/b/HD44780.pdf](https://cdn.sparkfun.com/assets/9/5/f/7/b/HD44780.pdf) |
| PCF8574 | [https://www.ti.com/lit/ds/symlink/pcf8574.pdf](https://www.ti.com/lit/ds/symlink/pcf8574.pdf) |

# I2C는?

Inter-Integrated Circuit의 줄임말이다. I가 두 번 등장해서 $ I^2C $ 가 올바른 줄임말인데, 발음하려면 I square 2라서 I2C로 부른다.

# I2C의 통신 방식

![](<./assets/i2c-lcd-01.svg>)

풀업 저항이 연결된 SDA와 클럭인 SCL 두 라인으로 직렬 통신을 한다. 사진처럼 여러 Master가 여러 Slave에 연결될 수 있다. SPI처럼 하나의 Master가 여러 Slave를 관리할 수 있지만, 데이터를 전송할 때에는 한 번에 한 Slave에게만 전송할 수 있다. 이는 데이터 프레임에 주소가 붙기 때문인데, 주소를 표현하기 위해 7비트를 사용한다. 이 주소는 Slave의 고유한 ID값이다. 모듈 하드웨어 자체에 내장되어 있다.

실제 데이터가 전송되는 과정은 아래 사진과 같다.

![](<./assets/i2c-lcd-02.png>)

출처 : ['A Basic Guide to I2C](https://www.ti.com/lit/an/sbaa565/sbaa565.pdf?ts=1751166887201#3.2)

SCL 라인이 rising edge였다가 falling edge가 될 동안 SDA 라인이 high였다면 1, low였다면 0으로 이해하는 방식이다.

## 주소가 동일하다면?

주소가 7비트면 최대 128개의 Slave를 연결할 수 있지만, 어쩌다 충돌하는 경우가 생길 수도 있다는 생각이 들어 찾아보았다.

['serial - How to resolve I2C address clashes? - Electrical Engineering Stack Exchange'](https://electronics.stackexchange.com/a/392155)

위 링크에 여러 해결방법이 제시되어 있다. 주소가 겹치는 경우에 별도 핀을 더 사용하여 주소값이 같은 모듈마다 하나씩 할당하고, 메세지를 전송할 때 SDA라인에 강제로 high 상태를 만들어서 주소를 읽지 못하도록 만들면 된다.

또는 같은 주소를 가진 모듈에게 신호를 분배할 수 있는 MUX를 부착하는 방법도 있다.

# CubeMX 설정

Nucleo-F103RB보드는 두 개의 I2C를 지원한다. Slave로 동작한다면 7비트의 주소를 가질 수 있고, Master모드로 동작한다면 7비트와 10비트 주소를 모두 사용 가능하다. 또한 표준 모드와 고속 모드를 지원한다.

> Up to two I²C bus interfaces can operate in multimaster and slave modes. They can support standard and fast modes.  
> They support dual slave addressing (7-bit only) and both 7/10-bit addressing in master mode. A hardware CRC generation/verification is embedded.  
> They can be served by DMA and they support SM Bus 2.0/PM Bus.

![](<./assets/i2c-lcd-03.png>)

-   속도  
    I2C의 속도는 표준으로 정해져 있다. 표준 모드(Standard)는 100kbit/s이고, 저속 모드는 10kbit/s이다. 패스트 모드(Fast)는 400kbit/s, 고속 모드(High-speed)는 3.4Mbit/s이다. HD44780U 데이터 시트를 참조하면 고속 모드를 지원한다고 되어 있다. 보드의 데이터시트에는 표준 모드와 고속 모드만 지원한다고 되어 있어서 둘 중에 아무거나 선택해도 된다.
-   주소 비트  
    ['HD44780 2004 LCD Display Bundle 4x20 characters with I2C interface'](https://www.az-delivery.de/en/products/hd44780-2004-lcd-display-bundle-4x20-zeichen-mit-i2c-schnittstelle)  
    위 링크를 참조하면 이 모듈의 I2C 주소가 정해져 있다는걸 알 수 있다. 따라서 7비트로만 설정하면 된다.

그 외 설정은 건드리지 않았다.

추가로, LCD를 통해 포텐셔미터의 값을 출력할 계획이었고 테스트를 위해 UART 통신도 사용하기 위해 다음과 같이 핀맵을 설정했다.

![](<./assets/i2c-lcd-04.png>)

# 전송할 데이터 형식(데이터시트 읽기...)

## 인터페이스 모듈

LCD 모듈과 연결된 모듈이 있어서 I2C 데이터 전송을 위해서는 이 인터페이스 모듈인 **PCF8574에 의존해야한다**. 이 인터페이스는 8개의 핀이 LCD와 연결되어 있다. 12개의 핀이 모두 납땜되어 있는데 PCF8574 모듈이 아래 사진처럼 8개의 핀만 출력되고 있다.

> 이게 납땜되어 있지 않았다면 12개의 핀을 직접 연결했을텐데 인두기를 갖고 있지 않아서 불가능했다...

LCD 데이터 시트를 참고하면, 명령어 입력 방식에 2가지가 있다. 명령어(8) + RS(1) + RW(1) + @(2) 총 12비트로 명령어를 입력하는 방식(8-bit operation)과 명령어 비트를 4+4로 나누어 입력하는 방식(4-bit operation)이 있다. LCD에 글자를 출력하기 위해서는 PCF8574모듈을 통해 통신해야하는데, 8-bit operation은 12개의 핀이 필요하므로 어쩔 수 없이 4-bit operation을 선택해야한다.

## 쓰기 주소

> The 8th bit of this frame following the address, is the read-write (R/W) bit. If this bit is 1, the controller is asking to read data from the target device. If this bit is 0, the controller asks to write data to the target device.

주소에 사용할 7비트 다음에 등장하는 8번째 비트는 읽기/쓰기 비트로, 이 비트가 1이면 Slave가 Master에게 데이터를 보내고, 0이면 Master가 Slave에게 데이터를 전송한다. HAL 라이브러리에서는 이 비트를 사용자가 직접 설정하지 말고 `HAL_I2C_Master_Transmit`이나 `HAL_I2C_Master_Receive`와 같은 함수를 사용하도록 제공하고 있다. 대신에 주소 비트를 8비트로 설정하고 상위 7개 비트에 주소값을 넣어야 한다.

## 4-Bit Operation

먼저 8비트 명령어를 4+4로 쪼개어 보내야하므로 두 번 보내야한다. I2C 데이터 전송은 SPI처럼 클럭에 맞추어 데이터를 전송하는 형태이므로 SCL핀을 rising edge로 만들었다가 falling edge로 만들어야 한다.

데이터시트에서 4-bit operation에서는 다음과 같이 데이터를 전송하면 된다고 명시하고 있다.

![](<./assets/i2c-lcd-05.png>)

한 번에 8비트를 전송하지만 RS(1)와 RW(1), 명령어(4), E(1) 총 7개 비트만 설정한다. 나머지 하나는 백라이트용인데 항상 1로 해두어야 화면에 글자가 보이는 것 같다.

타이밍 다이어그램을 보면 알 수 있듯이 한 번 전송할 때 **E(enable) 비트를 falling edge상태**로 만들어야 Slave가 데이터를 읽을 수 있다. 따라서 **보내야할 데이터는 2개**인데, E 비트를 falling edge상태로 만들기 위해 **2번씩 전송**해야하므로 **명령어 하나를 전송하기 위해 4번 Transmit이 발생**한다.

```
void LCD_Send(uint8_t cmd, uint8_t RS, uint8_t RW, uint8_t Backlight) {
    uint8_t high_nibble = cmd & 0xF0;       // 0x00
    uint8_t low_nibble = (cmd << 4) & 0xF0; // 0x10
    uint8_t control = ((Backlight & 1) << 3) | ((RW & 1) << 1) | (RS & 1);
    uint8_t enable = 1 << 2;
    uint8_t hb_en = high_nibble | control | enable;
    uint8_t lb_en = low_nibble | control | enable;
    uint8_t hb_no = hb_en & ~enable;
    uint8_t lb_no = lb_en & ~enable;

    // send upper 4 bit and lower 4bit with falling edge.(enable 1 to 0)
    uint8_t seq[4] = {hb_en, hb_no, lb_en, lb_no};
    HAL_I2C_Master_Transmit(&hi2c1, WRITE_ADDR, seq, 4, 0xFF);
    HAL_Delay(1);
}
```

`high_nibble`과 `low_nibble`은 명령어를 쪼갠 것이고, `control`은 백라이트와 RS, RW, E비트를 조합한 것이다. 4번 전송하여야 하기 때문에 보낼 데이터를 배열에 담아 전송한다.

### 초기화 단계

아주 착하게도 데이터시트에서 초기화 과정에 대해 설명해준다.

> The program must set all functions prior to the 4-bit operation (Table 12). When the power is turned on, 8-bit operation is automatically selected and the first write is performed as an 8-bit operation. Since DB0 to DB3 are not connected, a rewrite is then required. However, since one operation is completed in two accesses for 4-bit operation, a rewrite is needed to set the functions (see Table 12). Thus, DB4 to DB7 of the function set instruction is written twice.

![](<./assets/i2c-lcd-06.png>)

1.  전원이 들어오면 일정 시간을 기다린다.
2.  4-bit operation 활성화를 위해 Function set 명령을 전송하고 일정 시간을 기다린다. 이 과정을 3번 정도 반복하면 4-bit operation으로 모드가 변경된다.
3.  4-bit operation이 활성화되면 여러 초기화 설정을 위한 명령을 전송한다.

```
// lcd.h
#define LCD_INSTRUCTION_CLEAR_DISPLAY 0x01
#define LCD_INSTRUCTION_RETURN_HOME 0x02
#define LCD_INSTRUCTION_ENTRY_MODE_SET 0x04
#define LCD_INSTRUCTION_DISPLAY_CONTROL 0x08
#define LCD_INSTRUCTION_CURSOR_DISPLAY_SHIFT 0x10
#define LCD_INSTRUCTION_FUNCTION_SET 0x20
#define LCD_INSTRUCTION_SET_DDRAM_ADDRESS 0x80

/* Entry mode set flags */
#define LCD_INSTRUCTION_FLAG_INCREMENT 0x02
#define LCD_INSTRUCTION_FLAG_DECREMENT 0x00
#define LCD_INSTRUCTION_FLAG_SHIFT 0x01
#define LCD_INSTRUCTION_FLAG_NO_SHIFT 0x00
/* Display on/off control flags */
#define LCD_INSTRUCTION_FLAG_DISPLAY_ON 0x04
#define LCD_INSTRUCTION_FLAG_DISPLAY_OFF 0x00
#define LCD_INSTRUCTION_FLAG_CURSOR_ON 0x02
#define LCD_INSTRUCTION_FLAG_CURSOR_OFF 0x00
#define LCD_INSTRUCTION_FLAG_BLINK_ON 0x01
#define LCD_INSTRUCTION_FLAG_BLINK_OFF 0x00
/* Cursor or display shift flags */
#define LCD_INSTRUCTION_FLAG_DISPLAY_SHIFT 0x08
#define LCD_INSTRUCTION_FLAG_CURSOR_SHIFT 0x00
#define LCD_INSTRUCTION_FLAG_SHIFT_TO_RIGHT 0x04
#define LCD_INSTRUCTION_FLAG_SHIFT_TO_LEFT 0x00
/* Function set flags */
#define LCD_INSTRUCTION_FLAG_DATA_LENGTH_8BIT 0x10
#define LCD_INSTRUCTION_FLAG_DATA_LENGTH_4BIT 0x00
#define LCD_INSTRUCTION_FLAG_2LINE 0x80
#define LCD_INSTRUCTION_FLAG_1LINE 0x00
#define LCD_INSTRUCTION_FLAG_5X10_DOTS 0x04
#define LCD_INSTRUCTION_FLAG_5X8_DOTS 0x00
/* Reads busy flag */
#define LCD_INSTRUCTION_FLAG_BUSY 0x80

/**
 * Refer to "4-bit operation, 8-digit ´ 1-line display with internal reset"
 * section, page 39, HD44780U datasheet.
 * Send 0b00000011 thrice, and send 0b00000010 once. That change operation from
 * 8 bit to 4 bit.
 */
#define __LCD_CHANGE_TO_4BIT_OPERATION()                                       \
    LCD_Send(0x03, 0, 0, 1);                                                   \
    HAL_Delay(5);                                                              \
    LCD_Send(0x03, 0, 0, 1);                                                   \
    HAL_Delay(1);                                                              \
    LCD_Send(0x03, 0, 0, 1);                                                   \
    HAL_Delay(1);                                                              \
    LCD_Send(0x02, 0, 0, 1);                                                   \
    HAL_Delay(1);

#define __LCD_SET_CURSOR_MOVE_RIGHT_AND_NO_DISPLAY_SHIFT()                     \
    LCD_Send(LCD_INSTRUCTION_ENTRY_MODE_SET | LCD_INSTRUCTION_FLAG_INCREMENT | \
                 LCD_INSTRUCTION_FLAG_NO_SHIFT,                                \
             0, 0, 1);                                                         \
    HAL_Delay(1);

#define __LCD_SHOW_DISPLAY_AND_HIDE_CURSOR_AND_BLINK()                         \
    LCD_Send(                                                                  \
        LCD_INSTRUCTION_DISPLAY_CONTROL | LCD_INSTRUCTION_FLAG_CURSOR_ON |     \
            LCD_INSTRUCTION_FLAG_DISPLAY_OFF | LCD_INSTRUCTION_FLAG_BLINK_OFF, \
        0, 0, 1);                                                              \
    HAL_Delay(1);

void LCD_Init();
```

```
// lcd.c
void LCD_Init() {
    __LCD_CHANGE_TO_4BIT_OPERATION();
    __LCD_SET_CURSOR_MOVE_RIGHT_AND_NO_DISPLAY_SHIFT();
    __LCD_SHOW_DISPLAY_AND_HIDE_CURSOR_AND_BLINK();

    uint8_t initMsg[2][17] = {"Initializing....", "       Completed"};
    LCD_Print(initMsg);
    HAL_Delay(1000);
}
```

매크로 값들의 근거는 데이터시트 24쪽부터 27쪽에 자세히 작성되어 있다.

실행 결과는 아래 사진과 같다.

![](<./assets/i2c-lcd-07.jpg>)

# 참고 자료

['I²C - 위키백과, 우리 모두의 백과사전'](https://ko.wikipedia.org/wiki/I%C2%B2C)

['STM32 - LCD 문자 출력 (I2C)'](https://insoobaik.tistory.com/624)

['아무개가하는초짜블로그 :: \[STM32\] HAL을 사용한 I2C LCD 제어'](https://ddtxrx.tistory.com/entry/STM32HAL%EC%9D%84-%EC%82%AC%EC%9A%A9%ED%95%9C-I2C-LCD-%EC%A0%9C%EC%96%B4)

# 전체 코드

[https://github.com/10cheon00/STM32-Study/tree/main/LCD\_with\_Potentiometer](https://github.com/10cheon00/STM32-Study/tree/main/LCD_with_Potentiometer)
