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
| MAX7219 | [https://www.alldatasheet.co.kr/datasheet-pdf/view/73745/MAXIM/MAX7219.html](https://www.alldatasheet.co.kr/datasheet-pdf/view/73745/MAXIM/MAX7219.html) |

# SPI는?

Serial Peripheral Interface bus의 줄임말이다. Master-Slave 구조이며, 하나의 Master가 여러 Slave들에게 데이터를 송신하거나 수신받을 수 있다.

## Serial

Serial은 직렬 통신을 의미한다.

![ ](<./assets/serial-communication.png>)

출처 : ['What is Serial Communication and How it works? \[Explained\]'](https://www.codrey.com/embedded-systems/serial-communication-basics/#What_is_Serial_communication)

위 사진을 참고하면, Transmitter(Master)가 Receiver(Slave)에게 데이터를 매 클럭마다 1비트씩 보내는 것을 알 수 있다.

# SPI의 통신 방식

![image](<./assets/spi-diagram.png>)

출처 : ['SPI | Tizen Docs'](https://docs.tizen.org/iot/guides/peripheral-io-api-spi/)

Master와 Slave는 4개의 선으로 연결된다.

-   MISO(Master-In Slave-Out) : Slave가 Master에게 데이터를 전송하는 라인
-   MOSI(Master-Out Slave-In) : Master가 Slave들에게 데이터를 전송하는 라인
-   CLK(Clock) : 데이터 전송을 위한 클럭 라인
-   CS(Chip Select) : 데이터를 받을 Slave를 선택하는 라인

SPI 통신을 사용하기 위해서 설정해야하는 것들은 다음과 같다.

-   모드
    
    | CPOL(Clock Polarity) | CPHA(Clock Phase) | 동작 |
    | --- | --- | --- |
    | 0 | 0 | 클럭이 low인 상태에서 rising edge가 될 때 데이터를 전송한다. |
    | 0 | 1 | 클럭이 low인 상태에서 high였다가 falling edge가 될 때 데이터를 전송한다. |
    | 1 | 0 | 클럭이 high인 상태에서 falling edge가 될 때 데이터를 전송한다. |
    | 1 | 1 | 클럭이 high인 상태에서 low였다가 rising edge가 될 때 데이터를 전송한다. |
    
    글로 정리하려니 어려운데 그림을 보면 어느 위치에서 데이터를 전송하는지 쉽게 알 수 있다.출처 : ['SPI | Tizen Docs'](https://docs.tizen.org/iot/guides/peripheral-io-api-spi/)
-   ![](<./assets/spi-mode.png>)
    
-   SPI의 4가지 모드는 다음과 같다.
-   클럭
-   CLK라인에 전송될 클럭은 제한이 없으나, Slave가 받을 수 있도록 적절히 설정해야한다.
-   비트 순서
-   직렬로 데이터를 전달하기 때문에, MSB부터 전달할지 LSB부터 전달할지 설정해야한다.
-   워드? 크기(데이터 크기)
-   한 번에 전송할 수 있는 데이터 크기를 의미한다. 일반적으로 8비트이고, 이 역시 Slave에 따라 16비트로도 설정할 수 있다. (CubeMX에서는 16비트까지 설정이 가능한데, 이론적으로는 한 번에 전송 가능한 데이터량을 의미하니까 더 많이 보낼 수 있지 않을까?)

# CubeMX 설정

Connectivity > SPI1을 누르고 Mode를 **Half Duplex Master**나 **Transmit Only Master**로 설정한다. 도트매트릭스를 사용할 거니까, Slave로부터 전달되는 데이터가 없으므로 괜찮다.

![](https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2Fzdknj%2FbtsOUYl9B2z%2FAAAAAAAAAAAAAAAAAAAAAH0jbLXtr-KI2v6FaKE2S1UHzv5F18mVDJUibgGTalnwQHTtJVEYOYgzzP-SVG_mTewOu38UH0ms5cuBJ5qlRGGvXyfR1DdHpEyGvCvv-yqW%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1751295599%26allow_ip%3D%26allow_referer%3D%26signature%3DV6JpiDkDNIGvmObOrBDfG%252B4PgC4%253D)

그 외 설정은 위와 같이 한다. 내가 사용한 도트 매트릭스는 LED만 있지 않고 아래 사진처럼 인터페이스 모듈이 부착되어 있어서, 인터페이스의 모듈의 데이터시트에 기반하여 설정했다.

![](<./assets/max7219-8x8-dot-matrix.jpg>)

출처 : ['Buy 8x8 Dot Matrix Module - Cascadable, MAX7219 with cheap price'](https://www.robotistan.com/8x8-dot-matrix-module-cascadable-max7219)

데이터시트를 확인하면 DIN(SPI의 MOSI)으로 데이터가 전송되는데, MAX7219 모듈은 16비트 입력을 받고 있다. 그래서 Data Size를 16비트로 설정했다.

타이밍 다이어그램을 보면 CS에 의해 이 모듈이 선택되면(falling edge일 때 선택됨) CLK가 rising edge일 때 데이터 입력을 받도록 되어 있다. 따라서 CPOL을 Low로 설정했다. 이 때 가장 먼저 D15부터 입력을 받도록 되어 있으므로 MSB를 먼저 보내도록 설정했다.

> CPOL을 High로 해도 정상 작동하는데, 정확한 이유를 모르겠다. High로 설정한다면 PA5와 연결된 LED가 점등되는 차이점이 있다.

Baud Rate는 도트 매트릭스와 큰 상관없기 때문에 어떻게 설정하든 괜찮다. (왜 그런지 이유에 대해서 공부가 필요하다.)

그외 추가 설정은 건드리지 않았다.

# 전송할 데이터 형식(데이터시트 읽기...)

## CS핀 할당

위와 같이 설정했다면 16비트의 데이터를 전송하여 MAX7219 모듈을 다룰 수 있다. 주의할 점은 타이밍 다이어그램에서 해당 Slave를 선택하는 CS를 High에서 Low로 바꿨을 때 데이터 전송이 이루어진다는 점이다. 따라서 GPIO를 사용해 CS핀을 하나 할당한다.

![](<./assets/spi-kakao-01.png>)

F103RB보드에서는 SPI로 PA5와 PA7을 사용중이어서 PA6을 GPIO Output으로 설정하여 CS핀으로 동작하도록 만들었다.

## 데이터 전송 함수

CS핀을 사용해 Falling edge를 만든 후 데이터 전송을 하기 위해 다음과 같이 전송 함수를 작성했다.

```
#define PIN_CS GPIO_PIN_6

void LED_Matrix_Send(SPI_HandleTypeDef *hspi1, uint16_t data) {
    HAL_GPIO_WritePin(GPIOA, PIN_CS, GPIO_PIN_RESET);
    HAL_SPI_Transmit(hspi1, (uint8_t *)&data, 1, 0xFF);
    HAL_GPIO_WritePin(GPIOA, PIN_CS, GPIO_PIN_SET);
}
```

전송 함수를 호출할 때 데이터 인자 타입이 `uint8_t` 인데, 앞서 데이터 사이즈를 16비트로 설정했다면 `HAL_SPI_Transmit()`함수 내부에서 검사 후 `uint16_t` 타입으로 변환하여 전송한다.

```
HAL_StatusTypeDef HAL_SPI_Transmit(SPI_HandleTypeDef *hspi, const uint8_t *pData, uint16_t Size, uint32_t Timeout)
{
  // ... 생략

  /* Transmit data in 16 Bit mode */
  if (hspi->Init.DataSize == SPI_DATASIZE_16BIT)
  {
    if ((hspi->Init.Mode == SPI_MODE_SLAVE) || (initial_TxXferCount == 0x01U))
    {
      hspi->Instance->DR = *((const uint16_t *)hspi->pTxBuffPtr);
      hspi->pTxBuffPtr += sizeof(uint16_t);
      hspi->TxXferCount--;
    }
    /* Transmit data in 16 Bit mode */
    while (hspi->TxXferCount > 0U)
    {
      /* Wait until TXE flag is set to send data */
      if (__HAL_SPI_GET_FLAG(hspi, SPI_FLAG_TXE))
      {
        hspi->Instance->DR = *((const uint16_t *)hspi->pTxBuffPtr);
        hspi->pTxBuffPtr += sizeof(uint16_t);
        hspi->TxXferCount--;
      }
      else
      {
        /* Timeout management */
        if ((((HAL_GetTick() - tickstart) >=  Timeout) && (Timeout != HAL_MAX_DELAY)) || (Timeout == 0U))
        {
          hspi->State = HAL_SPI_STATE_READY;
          __HAL_UNLOCK(hspi);
          return HAL_TIMEOUT;
        }
      }
    }
  }
  /* Transmit data in 8 Bit mode */
  else
  {
    // ... 생략
  }
}
```

## 도트 매트릭스 초기화

위에 명시해둔 데이터 시트를 보면 알겠지만, MAX7219 모듈은 사실 0~7의 정수를 표현하는 7-segment LED를 다루기 위해 제작된 모듈이다. 그래서 대부분의 내용이 7-segment에 맞추어 작성되어 있는데, LED를 점등하기 위해 총 16개의 출력핀을 사용하고 있다. 이게 전부 도트 매트릭스에 연결되어 있으므로 기존 용도 대신 직접 출력 핀을 제어하는 방법을 사용하면 도트 매트릭스의 LED를 자유자재로 키고 끌 수 있다.

7페이지에서 **Initial Power-Up** 항목을 확인하면 다음과 같이 작동된다고 한다.

1.  파워가 연결되면 모든 레지스터가 초기화 된다.
2.  먼저 셧다운 모드로 설정된다.
3.  1개의 digit만 스캔하는 모드로 설정된다.
4.  밝기 레지스터도 최소로 설정된다.

> 레지스터의 종류는 다음과 같다.
> 
> -   셧다운 레지스터
> -   디코드 레지스터
> -   밝기 레지스터
> -   스캔 제한? 레지스터
> -   디스플레이 테스트 레지스터

위 절차가 끝난 이후에 SPI 통신을 통해 몇가지 설정을 할 수 있다.

셧다운 모드가 활성화되면 모든 LED가 꺼지게 되므로 비활성화 해야한다. 그리고 디코드 모드 역시 7-segment를 위한 동작이므로 디코드 하지 않고 입력을 곧바로 출력시키도록 설정해야한다. 디스플레이 테스트 역시 불필요하므로 비활성화 해야하고, 스캔 제한 모드는 항상 최대로 설정해야한다(사실 어떤 역할인지 잘 모르겠다).

```
// matrix.h
#define LED_MATRIX_SHUTDOWN_MODE_ADDRESS 0x0C00
#define LED_MATRIX_DECODE_MODE_ADDRESS 0x0900
#define LED_MATRIX_SCAN_MODE_ADDRESS 0x0B00
#define LED_MATRIX_DISPLAY_TEST_ADDRESS 0x0F00
#define LED_MATRIX_INTENSITY_ADDRESS 0x0A00

#define LED_MATRIX_SHUTDOWN_MODE_ENABLE 0x0000
#define LED_MATRIX_SHUTDOWN_MODE_DISABLE 0x0001
#define LED_MATRIX_DECODE_MODE_DISABLE 0x0000
#define LED_MATRIX_SCAN_MODE_ALL 0x0007
#define LED_MATRIX_DISPLAY_TEST_DISABLE 0x0000
#define LED_MATRIX_DISPLAY_TEST_ENABLE 0x0001
/**
 * Intensity value range is [1,16).
 * parameter will be extended to [1, 32) with step 2
 */
#define LED_MATRIX_INTENSITY_VALUE(X) (MAX(0, MIN((2 * X - 1), 31)))
void LED_Matrix_Init(SPI_HandleTypeDef *hspi);
```

매크로 값의 근거는 데이터 시트에서 확인할 수 있다.

```
// matrix.c
void LED_Matrix_Init(SPI_HandleTypeDef *hspi) {
    // 셧다운 모드 탈출
    LED_Matrix_Send(hspi, LED_MATRIX_SHUTDOWN_MODE_ADDRESS |
                              LED_MATRIX_SHUTDOWN_MODE_DISABLE);
    // 디코드 모드 해제
    LED_Matrix_Send(hspi, LED_MATRIX_DECODE_MODE_ADDRESS |
                              LED_MATRIX_DECODE_MODE_DISABLE);
    // 디스플레이 테스트 모드 해제
    LED_Matrix_Send(hspi, LED_MATRIX_DISPLAY_TEST_ADDRESS |
                              LED_MATRIX_DISPLAY_TEST_DISABLE);
    // 스캔 모드 활성화
    LED_Matrix_Send(hspi,
                    LED_MATRIX_SCAN_MODE_ADDRESS | LED_MATRIX_SCAN_MODE_ALL);
    // 밝기 최소로 설정
    LED_Matrix_Send(hspi, LED_MATRIX_INTENSITY_ADDRESS |
                              LED_MATRIX_INTENSITY_VALUE(1));
}
```

## LED 출력

Functional Diagram을 확인하면 모듈의 출력으로 Segment Driver와 Digit Driver가 있다.

![](<./assets/spi-kakao-02.png>)

Segment Driver는 LED와 곧바로 연결되어 있어서 위 사진과 같이 어느 비트가 어느 LED와 연결되어 있는지 알 수 있다. Table 1과 5를 참고하면 Segment Driver가 하위 8비트, Digit Driver가 상위 8비트임을 유추할 수 있다. 그리고 도트 매트릭스의 경우 행과 열에 따라 LED를 점등하므로 Segment Driver8비트를 열으로, Digit Driver를 행으로 설정하여 데이터를 전송하면 LED를 점등시킬 수 있다.

```
void LED_Matrix_Print(SPI_HandleTypeDef *hspi, uint8_t *matrix) {
    for (int i = 0; i < 8; i++) {
        uint16_t addr = 0x0100 * (i + 1);
        LED_Matrix_Send(hspi, addr | matrix[i]);
    }
}
```

위와 같이 함수를 작성하였다.

실행 결과는 아래 사진과 같다.

![](<./assets/spi-kakao-03.jpg>)

# 참고 자료

[https://controllerstech.com/led-dot-matrix-and-stm32/](https://controllerstech.com/led-dot-matrix-and-stm32/)

# 전체 코드

[https://github.com/10cheon00/STM32-Study/tree/main/Dot\_Matrix\_SPI\_ex](https://github.com/10cheon00/STM32-Study/tree/main/Dot_Matrix_SPI_ex)
