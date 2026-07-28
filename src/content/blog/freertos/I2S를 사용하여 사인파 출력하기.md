# 개발 환경

| 대상 | 버전 |
| --- | --- |
| OS | Windows 10 24H2(Desktop), MacOS Sequoia 15.5(24F74)(MacBook M2 Air) |
| STM32CubeIDE | 1.18.1 |
| STM32CubeMX | 6.14.1 |
| STM32CubeProg | 2.19.0 |
| STM32CubeCLT | 1.18.0 |
| 보드 | **Nucleo-F446RE**(F103RB는 I2S를 지원하지 않아서 다른 보드를 구매했습니다.) |
| 펌웨어 | V24J46M32 |

# 사용한 모듈과 데이터 시트

| 모듈 | 데이터시트 |
| --- | --- |
| UDA1334ATS | [https://cdn-shop.adafruit.com/product-files/3678/UDA1334ATS.pdf](https://cdn-shop.adafruit.com/product-files/3678/UDA1334ATS.pdf) |

# I2S는?

I2C와 비슷하게, Inter-Integrated Sound의 줄임말이다. I2S는 Master와 Slave 대신 Transmitter와 Receiver라고 부른다. I2C와느 다르게 3개의 라인을 쓴다. 데이터 전송을 위한 클럭(SCK), 오디오 데이터(SD), 좌우 채널(WS)로 구성되어 있다.

이 3개의 라인을 어떻게 구축하느냐에 따라 Transmitter가 Master 역할을 할 수도 있고 Receiver가 Master 역할을 할 수도 있다. 또는 Transmitter와 Receiver사이에 컨트롤러가 개입하여 Master 역할을 할 수 있다.

![](<./assets/i2s-sine-01.webp>)

이번 프로젝트에서는 단순 사인파 출력이므로 MCU가 Transmitter, UDA1334A가 Receiver가 된다.

# I2S의 통신 방식

SCK에 따라 SD라인을 1비트씩 읽는다. 미리 정해진 채널의 비트 수에 따라 한 채널에 전달될 오디오 데이터를 읽고 WS가 변하면서 다음 채널에 전달될 오디오 데이터를 읽는 형식이다.

![](<./assets/i2s-sine-02.webp>)

Receiver는 SCK에 따라 오디오 데이터를 읽는다. Transmitter가 오디오의 재생속도보다 느리게 보내거나 빠르게 보내버릴 경우 오디오 데이터가 이상하게 출력된다. 따라서 SCK값은 오디오 데이터의 형식에 맞추어 정해져야한다.

## 오디오 데이터 형식

오디오 데이터는 **샘플링 레이트**와 **채널 비트 수(Bit depth)**, **채널 수**에 따라 결정된다. 예를 들어 샘플링레이트가 _44.1Khz\_이고 채널 비트 수가 \*16bit\_이고 \*스테레오 채널(채널 수가 2)_ 이라면 44100 \* 16 \* 2 = 1411200 = 1.4112Mhz이 된다. SCK는 이 주파수 값을 가져야한다.

쉽게 생각하자면 WS의 주파수는 샘플링레이트와 같다. 샘플링된 데이터 1개를 전송하고 채널을 바꾸기 때문에 샘플링레이트와 동일한 주파수가 된다. WS의 주파수에 채널 비트 수와 채널 수를 곱하면 SCK의 주파수 값이 된다.

$$ F\_{WS} \* {채널\\ 비트\\ 수} \* {채널\\ 수} = F\_{SCK} $$

오디오 데이터의 형식은 사인파를 생성할 때와 프레임을 생성할 때 필요하다.

# CubeMX 설정

F103RB보드는 I2S를 지원하지 않아서 이번 글에서는 F446RB보드를 사용했다.

![](<./assets/i2s-sine-03.png>)

I2S1을 Half-Duplex Master로 설정하면 이렇게 3개 라인이 활성화된다.

![](<./assets/i2s-sine-04.png>)

파라미터 설정은 위와 같이 설정했다. 오디오 주파수를 44Khz로 설정하면 전송될 오디오 데이터의 샘플링레이트가 44.1Khz에 가깝게 설정된다(Real Audio frequency와 에러율이 같이 뜬다). 그다음에는 채널 비트 수를 16비트로 결정했으므로 Data and Frame Format을 **16 Bits Data On ~** 으로 설정한다. 뒤에 붙는 것들은 데이터를 16비트에 담을 건지 32비트 프레임에 담을건지 선택하는 것이다.

그리고 폴링을 쓰지 않고 DMA를 써서 향후 다른 작업을 할 수 있도록 만들어주려고 한다. DMA Request Mode는 Circular로 설정하여 한 번 보내기로 하면 계속 가져가도록 했다. 주의할 점은 채널 비트 수를 16비트로 설정했으므로 Data with 역시 Half-Word(16비트)로 설정해야한다. (모르고 Byte로 설정해두었다가 며칠 삽질했다...)

![](<./assets/i2s-sine-05.png>)

## 핀 연결

UDA1334A에는 핀아웃이 꽤 많지만 WSEL(WS), BCLK(SCK), DIN(SD) 이 3가지만 연결하면 된다. NUCLEO-F446RE보드와 같은 경우 I2S1에는 각각 PA4(WS=WSEL), PA5(SD=DIN), PA7(SCK=BCLK)이다.

# 구현

메인 함수에서는 단순하게 제반 작업을 하고 `HAL_I2S_Trasmit_DMA()`를 호출하기만 하면 된다. 제반 작업에는 I2S로 보낼 데이터를 만드는 작업(사인파 테이블 생성)과 DMA 콜백에 따라서 적절히 버퍼에 데이터를 채워넣는 작업이다.

사인파 테이블을 생성했다면, 미리 정해진 톤(주파수)에 따라 테이블을 순회하며 데이터를 가져와 버퍼에 채움으로 오디오 데이터를 만든다. 이 작업을 DMA 콜백 함수에서 수행함으로 계속 사인파를 출력하도록 만든다.

## 초기화 및 사인파 테이블 생성

```
#define SAMPLE_RATE I2S_AUDIOFREQ_44K  // 44.1 kHz
#define SINE_TABLE_LEN 2048            // 사인파 테이블 길이
#define FRAMES_PER_HALF 512            // half-buffer 프레임 수
#define STEREO 2                       // 채널 수
#define AMP 8000                       // 적당한 증폭값


static float freq;
static int16_t sine_table[SINE_TABLE_LEN];
static int16_t tx_buf[FRAMES_PER_HALF * STEREO * 2];

// 주파수 설정 및 인덱스 스탭 설정
int16_t* UDA_Init(void) {
  freq = 1000.0f;
  step = (uint32_t)lroundf((freq * (float)SINE_TABLE_LEN / (float)SAMPLE_RATE));

  return tx_buf;  // HAL_I2S_Transmit_DMA에서 사용할 버퍼 주소값 반환
}

// 0부터 2pi만큼의 사인파를 테이블 길이만큼 잘라 테이블 구성
void UDA_BuildSineTable(void) {
  for (uint32_t n = 0; n < SINE_TABLE_LEN; n++) {
    float ph = 2.0f * (float)M_PI * ((float)n / (float)SINE_TABLE_LEN);
    sine_table[n] = (int16_t)lroundf(sinf(ph) * AMP);
  }
}
```

`UDA_Init()`에서는 출력할 톤과 그 톤에 따른 인덱스 스탭을 설정한다. 이 인덱스 스탭에 따라 사인파 테이블을 순회하며 버퍼를 채울 것이다.

스탭을 계산하는 공식은 다음과 같다.

$$ F\_s = 샘플링\\ 레이트\\newline f = 만들려는\\ 음계의\\ 주파수 \\newline 샘플링\\ 레이트\\ 당\\ 위상의\\ 증가량(\\Delta\\theta) = \\frac{2\\pi f}{F\_s}(라디안/샘플) \\newline 사인파\\ 테이블\\ 1칸의\\ 위상 = \\frac{2\\pi}{N}(라디안/인덱스) \\newline 샘플\\ 당\\ 인덱스(스탭) step = \\frac{2\\pi f}{F\_s} \* \\frac{N}{2\\pi} = \\frac{fN}{F\_s}\\newline $$

샘플링레이트로부터 내가 원하는 주파수의 위상(샘플당 위상이므로 라디안/샘플 단위)을 구하고, 사인파 테이블에 적합하도록 라디안/샘플 단위를 라디안/인덱스 단위로 변환해주면 된다.

`UDA_BuildSineTable()`에서는 사인파 테이블의 길이에 따라 0에서 2$\\pi$만큼의 사인값을 저장하되 적절한 증폭값을 곱하여 미리 테이블을 구성한다.

## DMA 콜백

`HAL_I2S_Transmit_DMA()`를 실행하면 버퍼에 담긴 데이터를 절반 복사한 후, 모두 복사한 후 콜백이 발생한다. 따라서 절반 복사가 되었을 때 복사한 자리를 새로운 버퍼로 덮어씌우면 된다.

```
/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */
void HAL_I2S_TxHalfCpltCallback(I2S_HandleTypeDef* hi2s) {
  UDA_FillHalf(&tx_buf[0]);
}

void HAL_I2S_TxCpltCallback(I2S_HandleTypeDef* hi2s) {
  UDA_FillHalf(&tx_buf[FRAMES_PER_HALF * STEREO]);
}
/* USER CODE END 0 */
```

`UDA_Init()`에서 얻은 `tx_buf`주소값을 여기서 활용한다. `UDA_FillHalf()`는 버퍼의 절반길이만큼 새로운 오디오 데이터를 채우는 함수다. 콜백함수에서 적절한 주소값을 넘겨주면 그 위치부터 오디오 데이터를 쓸 것이다.

```
void UDA_FillHalf(int16_t* buf) {
  int16_t s;
  for (int i = 0; i < FRAMES_PER_HALF; i++) {
    phase += step;
    if (phase > SINE_TABLE_LEN) {
      phase -= SINE_TABLE_LEN;
    }
    s = sine_table[phase];

    /* Left channel */
    buf[STEREO * i + 0] = s;
    /* Right channel */
    buf[STEREO * i + 1] = s;
  }
}
```

![](<./assets/i2s-sine-06.png>)

위 타이밍도를 보면 왼쪽 채널과 오른쪽 채널을 번갈아 전송함을 알 수 있다. 따라서 버퍼에 데이터를 쓸 때도 왼쪽 채널에 들어갈 데이터와 오른쪽 채널에 들어갈 데이터를 번갈아 써야 스테레오 채널을 모두 사용한다.

## 메인함수

```

// 생략 ...

/* USER CODE BEGIN PV */
int16_t* tx_buf;
/* USER CODE END PV */

/* Private user code ---------------------------------------------------------*/
/* USER CODE BEGIN 0 */
void HAL_I2S_TxHalfCpltCallback(I2S_HandleTypeDef* hi2s) {
  UDA_FillHalf(&tx_buf[0]);
}

void HAL_I2S_TxCpltCallback(I2S_HandleTypeDef* hi2s) {
  UDA_FillHalf(&tx_buf[FRAMES_PER_HALF * STEREO]);
}

/* USER CODE END 0 */

/**
  * @brief  The application entry point.
  * @retval int
  */
int main(void) {

  // 생략 ...

  /* USER CODE BEGIN 2 */


  tx_buf = UDA_Init();
  UDA_BuildSineTable();
  UDA_FillHalf(&tx_buf[0]);                      // 미리 첫 버퍼의 절반 채우기
  UDA_FillHalf(&tx_buf[FRAMES_PER_HALF*STEREO]); // 미리 첫 버퍼의 절반 채우기

  if (HAL_I2S_Transmit_DMA(&hi2s1, (uint16_t*)tx_buf, FRAMES_PER_HALF * STEREO * 2) !=
      HAL_OK) {
    Error_Handler();
  }
  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1) {
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
  }
  /* USER CODE END 3 */

  // 생략...
}
```

# 결과

모듈은 아래 사진처럼 연결했다.

![](<./assets/i2s-sine-07.jpg>)

동영상 서비스가 종료되어 해당 콘텐츠를 재생할 수 없습니다.

보드에 부착된 잭에 헤드폰을 꽂고 Audacity로 녹음하면 동영상처럼 1000hz 대역만 강하게 출력이 나오는 것을 볼 수 있다.

다음 게시글에는 포텐셔미터를 사용해서 톤을 변경하는 것과 간단한 볼륨 조절을 하는 방법을 써봐야겠다.

# 코드

[https://github.com/10cheon00/STM32-Study/tree/b05b2f6fca48a99c1bd6eefb2c0babf545b16f90/AudioOutput\_ex](https://github.com/10cheon00/STM32-Study/tree/b05b2f6fca48a99c1bd6eefb2c0babf545b16f90/AudioOutput_ex)

\[STM32-Study/AudioOutput\_ex at b05b2f6fca48a99c1bd6eefb2c0babf545b16f90 · 10cheon00/STM32-Study

Contribute to 10cheon00/STM32-Study development by creating an account on GitHub.

github.com\]([https://github.com/10cheon00/STM32-Study/tree/b05b2f6fca48a99c1bd6eefb2c0babf545b16f90/AudioOutput\_ex](https://github.com/10cheon00/STM32-Study/tree/b05b2f6fca48a99c1bd6eefb2c0babf545b16f90/AudioOutput_ex))

# 참고 자료

[https://lcav.gitbook.io/dsp-labs/passthrough/updating\_stm32\_peripherals](https://lcav.gitbook.io/dsp-labs/passthrough/updating_stm32_peripherals)

\[2.2 Updating peripherals | DSP Labs

Copy2. AUDIO PASSTHROUGH2.2 Updating peripherals The initialization code we generated in the blinking LED example will need to be updated as it does not perform the setup for the two I2S buses we will need for the microphone and the DAC. But first, we will

lcav.gitbook.io\]([https://lcav.gitbook.io/dsp-labs/passthrough/updating\_stm32\_peripherals](https://lcav.gitbook.io/dsp-labs/passthrough/updating_stm32_peripherals))

[https://github.com/rbarreiros/stm32f407\_dds\_i2s\_dma/blob/master/source/src/dds.c](https://github.com/rbarreiros/stm32f407_dds_i2s_dma/blob/master/source/src/dds.c)

\[stm32f407\_dds\_i2s\_dma/source/src/dds.c at master · rbarreiros/stm32f407\_dds\_i2s\_dma

DDS generator using I2S and DAC. Contribute to rbarreiros/stm32f407\_dds\_i2s\_dma development by creating an account on GitHub.

github.com\]([https://github.com/rbarreiros/stm32f407\_dds\_i2s\_dma/blob/master/source/src/dds.c](https://github.com/rbarreiros/stm32f407_dds_i2s_dma/blob/master/source/src/dds.c))