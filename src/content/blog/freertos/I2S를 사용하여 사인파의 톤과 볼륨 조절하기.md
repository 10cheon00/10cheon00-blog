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

# 톤과 주파수의 관계

![](<./assets/i2s-tone-volume-01.png>)

위 사진을 보면 각 음계와 옥타브에 따라 어떤 주파수인지 알 수 있다.

그리고 특정 음계(note)에서 N만큼 떨어진 음계를 구하는 공식은 다음 사이트에서 찾았다.

[https://techlib.com/reference/musical\_note\_frequencies.htm](https://techlib.com/reference/musical_note_frequencies.htm)

공식은 다음과 같다.

$$ Frequency = note \* 2^{\\frac{N}{12}} $$

예를 들어 현재 음계가 E5(659.25 Hz)라고 하자. 이 주파수값으로 A5(880 Hz)를 구하려 한다면 E5는 A5로부터 5칸 떨어져 있으니까 다음 계산을 통해 얻어낼 수 있다.

$$ 659.25 \* 2^{\\frac{5}{12}} = 879.99.. \\approx 880 $$

# 볼륨 설정

볼륨 설정은 어렵지 않은데, 단순히 볼륨값을 0~1사이의 실수로 놓고 프레임에 곱하면 된다.

# CubeMX 설정

톤을 조절할 포텐셔미터, 볼륨을 조절할 포텐셔미터 두 개의 아날로그 입력을 받아야 하므로 ADC1을 쓰고 두 개의 채널을 사용했다.

![](<./assets/i2s-tone-volume-02.png>)

각각 PA0과 PA1핀을 사용한다.

![](<./assets/i2s-tone-volume-03.png>)

한 개의 ADC에서 두 개의 채널을 스캔해야하므로 Scan Conversion과 Continuous Conversion을 모두 활성화 시켰다. 그리고 DMA를 통해 결과를 받기 위해 DMA Continuous Request도 활성화 시킨다. 스캔할 채널 수만큼 Number of conversion을 설정한다.

![](<./assets/i2s-tone-volume-04.png>)

각 채널별 설정은 위 사진과 같다.

![](<./assets/i2s-tone-volume-05.png>)

DMA Request는 위 사진과 같이 Circular로 설정한다.

# 구현

## ADC

ADC처리 결과를 콜백으로 가져올 수 있지만, 이전에 I2S를 사용할 때에도 콜백을 쓰고 있기 때문에, 일단은 ADC의 인터럽트를 끈다. 인터럽트 우선순위에 대해 생각하는 것은 어려워서, 대신 DMA가 쓸 다음 위치에 대한 값을 조회하여 그 전 위치에 쓰인 값을 조회하는 형식을 선택했다.

```
/* USER CODE BEGIN PD */
#define ADC1_CHANNEL_SIZE 2
#define ADC1_SAMPLES_PER_CHANNEL 64
#define ADC1_BUFFER_SIZE ADC1_CHANNEL_SIZE* ADC1_SAMPLES_PER_CHANNEL
/* USER CODE END PD */

// 생략 ...

/* USER CODE BEGIN PV */
int16_t* tx_buf;

volatile uint16_t adc_buf[ADC1_BUFFER_SIZE];
/* USER CODE END PV */

// 생략 ...

/* USER CODE BEGIN PFP */
// [0]CH0, [1]CH1, [2]CH0, [3]CH1, [4]CH0, [5]CH1 ... 순으로 저장되어 있음
static inline uint16_t getADC1Value(uint8_t channel_idx) {
  uint32_t ndtr = __HAL_DMA_GET_COUNTER(&hdma_adc1);  // 남은 전송 수
  uint32_t pos =
      (ADC1_BUFFER_SIZE - ndtr) % ADC1_BUFFER_SIZE;  // 현재 쓰기가 일어날 위치
  uint32_t dma_frame =
      (pos / ADC1_CHANNEL_SIZE) *
      ADC1_CHANNEL_SIZE;  // 현재 dma 프레임?(ch0, ch1)에서 첫 인덱스
  uint32_t base = (dma_frame - ADC1_CHANNEL_SIZE + ADC1_BUFFER_SIZE) %
                  ADC1_BUFFER_SIZE;  // 이전 dma 프레임의 첫 인덱스
  return adc_buf[base + channel_idx];
}
/* USER CODE END PFP */
```

버퍼 사이즈를 알고 있으니 남은 전송 수를 구한다면 인덱스를 구할 수 있다.

인덱스를 구해도 내가 원한 채널의 인덱스인지 모른다. 왜냐하면, 여러 채널로부터 ADC값을 처리하게 될 때 버퍼에는 이렇게 저장된다.

| 인덱스 | 채널 |
| --- | --- |
| 0 | CH0 |
| 1 | CH1 |
| 2 | CH0 |
| 3 | CH1 |
| 4 | CH0 |
| 5 | CH1 |
| ... | ... |

따라서 이전에 DMA가 쓴 프레임의 주소를 베이스로 삼아 접근해야 올바른 ADC값을 획득할 수 있다. 위에서는 그 베이스에 채널을 인덱스로 삼아 접근하고 있다.

```
// int main() 내부에서, 

  // 생략 ...

  /* USER CODE BEGIN 2 */
  /* ADC1 DMA 연속 시작: 길이=1 로 변수 계속 갱신 */
  HAL_ADC_Start_DMA(&hadc1, (uint32_t*)&adc_buf, ADC1_BUFFER_SIZE);
  __HAL_DMA_DISABLE_IT(&hdma_adc1, DMA_IT_HT | DMA_IT_TC);

  // 생략 ...
```

인터럽트 충돌 문제를 일으키지 않기 위해 인터럽트 자체를 꺼버린다.

## 톤과 볼륨값 조절

이렇게 읽어온 ADC값은 메인함수의 while문에서 일정 시간마다 읽어서 수정하도록 다음과 같이 작성했다.

```
  // 생략 ...

  uint32_t lastTick = 0;
  /* USER CODE END 2 */

  /* Infinite loop */
  /* USER CODE BEGIN WHILE */
  while (1) {
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
    if (HAL_GetTick() - lastTick > 100) {
      UDA_SetToneByADC(getADC1Value(0));
      UDA_SetVolumeByADC(getADC1Value(1));
      lastTick = HAL_GetTick();
    }
  }
  /* USER CODE END 3 */
}
```

adc값은 위와 같이 작성한 라이브러리의 함수로 넘겨져 `freq`과 `step`값, 그리고 `volume`을 변경시킨다.

라이브러리 전체 코드는 다음과 같다.

```
#include "uda1334a.h"

#include <math.h>

static int16_t sine_table[SINE_TABLE_LEN + 1];  // 보간을 위해 1칸을 추가
static int16_t tx_buf[FRAMES_PER_HALF * STEREO * 2];

static float freq;
static float volume;

// 상위 16비트를 정수로, 하위 16비트를 소수로 활용 = Q16.16
#define FRAC 16
static uint32_t phase;
static uint32_t step;

int16_t* UDA_Init() { 
  UDA_BuildSineTable();
  UDA_SetToneByADC(TONE_HZ);
  UDA_SetVolumeByADC(2048);
  UDA_FillHalf(&tx_buf[0]);
  UDA_FillHalf(&tx_buf[FRAMES_PER_HALF*STEREO]);

  return tx_buf;
 }

// 0부터 2pi만큼의 사인파를 테이블 길이만큼 잘라 테이블 구성
void UDA_BuildSineTable(void) {
  for (uint32_t n = 0; n < SINE_TABLE_LEN; n++) {
    float ph = 2.0f * (float)M_PI * ((float)n / (float)SINE_TABLE_LEN);
    sine_table[n] = (int16_t)lroundf(sinf(ph) * AMP);
  }
  sine_table[SINE_TABLE_LEN] = sine_table[0];
  phase = 0;
  return tx_buf;
}

int16_t calculateSampleOut(uint32_t* phase, uint32_t step) {
  // 위상 이동
    *phase += step;
    *phase &= (((uint32_t)SINE_TABLE_LEN << FRAC) - 1);

    // 샘플값 선형 보간
    const uint32_t index = (*phase) >> FRAC;
    int16_t v1 = sine_table[index];
    int16_t v2 = sine_table[index+1];
    uint32_t frac = (*phase) & 0xFFFF;
    int32_t out = ( v1 * (int32_t)(0x10000 - frac) + v2 * (int32_t)frac ) >> FRAC;

  // 샘플값 클리핑
    if (out > 32767) out = 32767;
    if (out < -32768) out = -32768;

    return (int16_t)out;
}

void UDA_FillHalf(int16_t* buf) {
  if (step < 1) step = 1;
  for (int i = 0; i < FRAMES_PER_HALF; i++) {
    int16_t s = calculateSampleOut(&phase, step) * volume;
    /* Left channel */
    buf[STEREO * i + 0] = s;
    /* Right channel */
    buf[STEREO * i + 1] = s;
  }
}

void UDA_SetToneByADC(uint16_t adc_tone) {
  uint16_t note = ((float)adc_tone / 4096.0f) * 12;
  freq = TONE_HZ * powf(2, (float)note / 12);
  step = (uint32_t)lroundf((freq * (float)SINE_TABLE_LEN / (float)SAMPLE_RATE) * 65536.0f);
}

void UDA_SetVolumeByADC(uint16_t adc_volume) {
  volume = ((float)adc_volume / 4096.0f);
}
```

먼저 `UDA_Init()`에서는 이전처럼 사인파 테이블을 만들고, 톤과 볼륨값을 초기화한 후 버퍼를 채운다. 버퍼를 채울 때 보정을 원활하게 하기 위해 테이블의 끝에 1칸을 더 추가한다. 임의의 톤값과 볼륨값을 설정한 후 각각 함수에 넘긴다. `UDA_SetToneByADC()`에서는 ADC값을 0~12 범위의 정수로 만들고 그 값을 노트로 사용하여 주파수를 결정한다. 이 때 `step`값도 한 번에 구한다. 구하는 방법은 이전 게시글에 작성해두었다. 여기서는 _Q16.16_포맷에 맞추기 위해 강제로 65536.0f을 곱한 모습이다(float타입이므로 16비트 시프트를 못하니까). 볼륨값은 0~1 범위의 실수로 만든다. 나중에 버퍼를 채울 때 샘플링된 데이터에 곱하는 용도로 사용된다.

### Q16.16

[https://en.wikipedia.org/wiki/Q\_(number\_format)](https://en.wikipedia.org/wiki/Q_(number_format))

고정소수점 방식이다. 위상을 변환시킬 때 이 방법을 사용하는데, `uint32_t`타입을 절반 쪼개서 상위 16비트는 정수부, 하위 16비트는 소수부로 사용하는 것이다. 아마 부동소수점 연산을 최대한 피하는 대신 정밀도를 높이기 위해 선택한 것 같다.

```
int16_t calculateSampleOut(uint32_t* phase, uint32_t step) {
    // 위상 이동
  *phase += step;
  *phase &= (((uint32_t)SINE_TABLE_LEN << FRAC) - 1);

    // 생략 ...
}
```

코드를 설명하기 위해 다시 들고 왔다. `step`은 Q16.16포맷에 맞추어 미리 정수값으로 처리해두었으니 위상에 그대로 더해도 된다. 그 다음으로 위상이 사인파 테이블의 범위를 벗어나지 않도록 클리핑해준다. 여기서는 테이블 길이가 2048이므로 하위 11+16비트를 1로 놓고 AND 연산한다. 따로 소수점 연산을 하지 않지만, 정수타입으로 소수를 기억하고 있으니 위상을 변화시킬 때 좀 더 정밀한 연산이 가능하다.

# 결과

![](<./assets/i2s-tone-volume-06.jpg>)

동영상 서비스가 종료되어 해당 콘텐츠를 재생할 수 없습니다.

Audacity로 녹음을 하면서 스펙트로그램을 열어보면 실제로 톤이 변경됨과 볼륨이 잘 조절되는 모습을 볼 수 있다.

# 코드

[https://github.com/10cheon00/STM32-Study/tree/main/AudioOutput\_ex](https://github.com/10cheon00/STM32-Study/tree/main/AudioOutput_ex)

# 참고 자료

[https://techlib.com/reference/musical\_note\_frequencies.htm](https://techlib.com/reference/musical_note_frequencies.htm)

[https://github.com/rbarreiros/stm32f407\_dds\_i2s\_dma/blob/master/source/src/dds.c](https://github.com/rbarreiros/stm32f407_dds_i2s_dma/blob/master/source/src/dds.c)