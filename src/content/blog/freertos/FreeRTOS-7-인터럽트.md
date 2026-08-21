---
title: FreeRTOS (7) - 인터럽트
date: "2026-07-07"
updated: "2026-07-15"
tags: ["freertos"]
category:
  name: "FreeRTOS"
---


> [FreeRTOS Documentation - FreeRTOS™](https://www.freertos.org/Documentation/02-Kernel/07-Books-and-manual/01-RTOS_book)
> 
> 이 문서에서 제공하는 PDF를 읽고 정리한 글입니다.
> 
> 생성 일 : 2026-07-07
> 최종 수정일 : 2026-07-15

---

# 서론

임베디드 시스템은 주변 환경으로부터 이벤트를 수신했다면 이를 처리해야한다. 예를 들어 TCP/IP 패킷을 받았다면 패킷에 담긴 메세지를 처리하고 메세지에 대한 응답을 해야한다. 뿐만 아니라 메세지 유형에 따라 각각 다르게 처리해야하며 이에 걸리는 시간 또한 제각각이다. 그러므로 이러한 환경속에서 이벤트를 처리하는 전략이 중요하다. 이러한 전략을 선택할 때 던질 수 있는 질문들은 이렇다.

- Q. 어떻게 이벤트를 수신해야하는가? 폴링으로도 이벤트를 처리할 수 있다.
- Q. 인터럽트를 사용해 이벤트를 수신한다면 ISR 내부에서 해당 이벤트를 얼마나 처리해야하는가?
- Q. ISR과 비-ISR코드 사이에서 어떻게 이벤트가 전달되고, 비동기적인 상황을 처리하기 위해 어떤 구조를 설계해야하는가?

FreeRTOS에는 이러한 이벤트를 처리하기 위해서 정해진 전략은 없지만 그러한 전략을 쉽고 유지보수하기 쉬운 방법들을 제공한다.

# 태스크와 인터럽트의 우선순위

태스크는 완전히 소프트웨어 기능이다. 어떤 하드웨어와도 독립적이다. 사용자가 정한 태스크 우선순위에 따라 스케줄러가 알고리즘에 의해 선택해 실행하게 된다. **반대로 인터럽트는 하드웨어 종속적이다**. 칩 설계에 의해서 하드웨어 컨트롤러가 ISR을 선택해 실행시키게 된다. ISR이 동작하지 않을 때에만 태스크가 실행되고, 가장 낮은 우선순위의 ISR이라고 하더라도 태스크가 ISR을 선점할 수는 없다.

# Interrupt-Safe API

인터럽트 내부에서 FreeRTOS가 제공하는 함수들을 그대로 쓴다면 ISR 내부에서 지연이 발생하게되고, CPU가 다른 인터럽트를 처리하는 것이 늦어지면서 CPU의 전체 처리 성능이 나빠진다. 따라서 이전에 보았듯 `~FromISR`이 붙은 함수를 호출해야한다. 

## 장점

이렇게 두 가지 방식을 제공함으로 얻는 이점은, 커널 코드가 실행될 때 ISR에서 호출된건지 아니면 태스크에서 호출된건지 알 필요가 없어져서 코드가 단순해진다는 것이다. 코드가 단순해진다는 점은 디버깅이 비교적 쉬워진다는 점이 있다. 

## 단점

그렇지만 단점도 있다. 이미 완성된 코드를 가져다 쓸 때 문제가 된다. 예시는 아래 코드다.

```c
// Third-party library code
void foo() {
    xQueueSend(/* ... */);
}

void Bar_IRQHandler() {
    foo(); // <--- 문제 발생!!
}
```

`foo()`함수는 외부에서 가져온 코드인데, 함수 내부에서는 `xQueueSend()`를 쓰고, 외부에서 가져왔으므로 이를 절대 수정할 수 없다고 하자. 문제는 ISR에서 `foo()`를 호출해야만 하는 상황이 생겼을 때 인터럽트 내에서 지연이 발생하게 된다는 점이다.

이걸 해결하려면, 다음 방법들이 있다.

1. 인터럽트에서 처리하지 말고 태스크에게 떠넘기기 
2. 직접 `~FromISR()` 함수를 호출하도록 수정하기 
3. 외부 코드에서 RTOS 추상화 계층을 제공한다면, 함수를 호출한 주체가 태스크인지 ISR인지 판단하여 API를 적절히 호출하도록 수정하기

# `xHigherPriorityTaskWoken`

실행 가능한 태스크가 다른 태스크를 선점하는 상황은 우선순위에 의해 정해진다. `configUSE_PREEMPTION`이 `1`이어야 하며 FreeRTOS API 함수에 의해 발생한다. 어떤 경우에는 호출한 API 함수가 다 실행되기도 전에 선점이 발생할 수도 있다. 예를 들어 타이머 관련 API를 호출했더니 API 함수가 끝나기도 전에 데몬 태스크가 선점해버리는 경우가 있다.

ISR 내부에서 FreeRTOS API 함수를 호출하는 경우 동작이 약간 다르다. ISR 코드가 다 실행되기 전까지는 선점이 발생하지 않는다. 대신 ISR 코드가 끝난 이후 컨텍스트 스위칭이 발생해야 한다는 정보만 저장한다. 이런 상황에서 `pxHigherPriorityTaskWoken`라는 포인터가 사용된다. 

컨텍스트 스위칭이 발생해야한다면, ISR 코드 내부에서 Interrupt-safe API 함수를 쓸 때 API 호출로 인해 더 높은 우선순위의 태스크가 실행 가능해졌다면 `*pxHigherPriorityTaskWoken`을 `pdTRUE`로 설정한다. 이 값의 의미는 ISR코드가 끝나는 시점에 컨텍스트 스위칭이 발생해야한다고 알리는 것이다. 스케줄러에게 이를 알리기 위해서는 `pxHigherPriorityTaskWoken`의 값을 `pdFALSE`로 미리 초기화해두어야 한다.

## 왜 Interrupt-safe API 내부에서 자동으로 컨텍스트 스위칭이 일어나지 않나

- 특정 상황에서 비효율적인 컨텍스트 스위칭을 방지하는 경우
    예를 들어 UART 인터럽트를 받는다고 하면, UART로 전해지는 문자열들을 모두 받고 나서 처리가 일어나야 하는데 인터럽트가 발생할 때마다 컨텍스트 스위칭을 처리하려고 하면 비효율적이기 때문이다.

- 실행 순서 제약을 두고 싶은 경우
    특정 작업을 처리할 땐 컨텍스트 스위칭을 방지하고 싶은 경우가 있다. 이건 FreeRTOS 스케줄러 락 메커니즘을 통해 구현할 수도 있다.

- 이식성, 효율성을 위해서
    하드웨어 종속적인 ISR 내부에서 컨텍스트 스위칭을 지원하는건 어려우므로 ISR이 끝날 때 컨텍스트 스위칭을 처리하도록 구현하는 편이 낫다. 이렇게 해야 다양한 아키텍처에서(특히 소형 MCU) FreeRTOS를 사용할 수 있고 코드도 단순해진다.

- 틱 인터럽트 내부에서 불필요한 컨텍스트 스위칭을 막기 위해
    틱 인터럽트 핸들러를 작성할 수 있는데, 핸들러 내부에서 컨텍스트 스위칭을 시도하면 불필요한 호출이 될 수 있다.

# ISR에서 컨텍스트 스위칭 요청하기

`taskYIELD()` 매크로는 태스크 내부에서 컨텍스트 스위칭을 요청한다. 이 매크로의 Interrupt-safe API버전은 `portYIELD_FROM_ISR()`과 `portEND_SWITCHING_ISR()`이다. 두 매크로 모두 같은 작업을 한다. FreeRTOS는 아키텍처와 컴파일러에 따라서 두 매크로중 하나를 제공하기도 하고, 둘 다 제공하기도 한다.

```c
// STM32F411CEU6 기반 FreeRTOS 코드에서 가져온 매크로 정의
#define portEND_SWITCHING_ISR( xSwitchRequired ) if( xSwitchRequired != pdFALSE ) portYIELD()
#define portYIELD_FROM_ISR( x ) portEND_SWITCHING_ISR( x )
```

`xSwitchRequired`라고 되어 있지만 `xHigherPriorityTaskWoken`을 의미한다. 이 값이 `pdFALSE`면 아무 작업도 하지 않고, `pdFALSE`가 아니라면 `portYIELD()`를 호출하게 되어 컨텍스트 스위칭을 요청한다.(컨텍스트 스위칭이 일어나지 않을 수도 있다!)

# 인터럽트 처리 미루기

대부분의 경우 ISR 내부에서 인터럽트를 처리하지 말고 태스크에게 떠넘기라고 한다. 이유는 다음과 같다.

- 태스크가 제일 높은 우선순위를 가지더라도 인터럽트가 발생하지 않아야 실행된다. ISR 처리 시간이 짧아야 태스크 처리 시간이 확보된다는 말이다. ISR이 길게 실행된다면 태스크 처리가 지연되면서 태스크의 시작 시간과 종료 시간이 뒤로 밀릴 수 있다. 
- ISR이 실행되는 동안 새로운 인터럽트나 낮은 우선순위의 인터럽트를 처리하지 못할 수 있다.
- 인터럽트 처리를 위해 ISR이 리소스에 접근한다면, ISR과 태스크가 동시에 리소스에 접근하는 상황을 예측하고 방지해야한다.
- 몇몇 포트는 중첩 인터럽트?를 허용하는데, 그런 경우 복잡성이 올라가고 예측 불가능한 상황이 발생한다. 따라서 간단한 ISR를 구성하는 편이 쉽다.

이렇게 인터럽트 처리를 태스크에게 미루는 것을 '지연된 인터럽트 처리'라고 부른다.

![](<./assets/지연된-인터럽트-처리.png>)

t2에서 인터럽트가 발생한다. ISR은 t2~t3까지 실행되는데 하드웨어 처리를 한 후 태스크 2에게 처리를 위임한다. 

t3에서 ISR이 끝난 후 컨텍스트 스위칭에 의해 태스크 2가 실행된다. t3~t4까지 인터럽트에 대한 처리를 마치고 *Blocked* 상태로 진입한다. 그 뒤로는 다시 태스크 1이 실행된다.

지연된 인터럽트 처리에 대한 절대적 규칙은 없지만, 이런 상황에서 쓰면 좋다.

- 인터럽트 처리가 간단하다면 위임할 것도 없이 바로 ISR 내부에서 처리하면 되지만, 추가 작업이 필요한 경우
- 인터럽트 처리 중에 ISR 내부에서 할 수 없는 작업들을 해야하는 경우
- 인터럽트 처리가 언제 끝날 지 모르는 작업일 경우

# 바이너리 세마포어로 지연된 인터럽트 처리

바이너리 세마포어의 interrupt-safe API를 사용한다면 인터럽트가 발생할 때 효율적으로 태스크를 동기화할 수 있다. 즉, 앞서 말했던 지연된 인터럽트 처리를 바이너리 세마포어로 구현하는 것이다. 

이전에 말했던 지연된 인터럽트 처리는 *Running* 상태의 태스크보다 더 높은 우선순위를 갖는 인터럽트 처리 태스크를 깨우기 위해 ISR에서 `portYIELD_FROM_ISR()`를 호출했다. ISR이 종료된 이후 바로 이어서 실행되는 태스크가 인터럽트 처리를 맡음으로 마치 ISR이 인터럽트를 처리하는 것처럼 실행된다. 

바이너리 세마포어를 사용한다면, 우선 먼저 인터럽트를 처리하는 태스크가 바이너리 세마포어를 가져가서 *Blocked* 상태로 진입한다. 나중에 인터럽트가 발생한다면 ISR이 세마포어를 주어 인터럽트를 처리하는 태스크를 깨어나도록 만든다. 이렇게 지연된 인터럽트 처리를 구현할 수 있다.

> 바이너리 세마포어를 길이가 1인 큐와 비슷하다고 볼 수 있다.

# 바이너리 세마포어 생성

```c
SemaphoreHandle_t xSemaphoreCreateBinary( void );SemaphoreHandle_t xSemaphoreCreateBinaryStatic(
    StaticSemaphore_t pxSemaphoreBuffer );
```

둘 다 반환값이 `NULL`이라면 힙 메모리 부족으로 생성이 안된 것이고, `NULL`이 아니라면 바이너리 세마포어의 핸들을 반환한다.

> 이 절 아래에 제시된 API들은 바이너리 세마포어와 카운팅 세마포어 모두에게 사용하는 공용 API이다.

# 세마포어 획득

```c
BaseType_t xSemaphoreTake( 
    SemaphoreHandle_t xSemaphore, 
    TickType_t xTicksToWait);
```

- `xSemaphore` : 획득하려는 세마포어 핸들
- `xTicksToWait` : 세마포어 획득을 위해 *Blocked* 상태에서 기다릴 대기 시간

반환값이 `pdFALSE`라면 대기 시간 동안 *Blocked* 상태에서 기다렸지만 획득에 실패했다는 뜻이다. 반환값이 `pdTRUE`라면 바이너리 세마포어를 획득한 것이다.

> 이 함수 역시 *Blocked* 상태로 가서 대기하므로, ISR에서는 `xSemaphoreTakeFromISR()`을 사용해야한다.

# 세마포어 반환

```c
BaseType_t xSemaphoreGiveFromISR( 
    SemaphoreHandle_t xSemaphore,
    BaseType_t *pxHigherPriorityTaskWoken );
```

`xSemaphoreGiveFromISR()`은 `xSemaphoreGive()`를 ISR에서 사용할 수 있도록 만든 함수다. 실제 매크로 정의를 봐도 아래와 같다.

```c
#define xSemaphoreGiveFromISR( xSemaphore, pxHigherPriorityTaskWoken )    xQueueGiveFromISR( ( QueueHandle_t ) ( xSemaphore ), ( pxHigherPriorityTaskWoken ) )
```

- `xSemaphore` : 반환하려는 세마포어 핸들
- `pxHigherPriorityTaskWoken` : 세마포어를 반환함으로 다른 태스크가 *Ready* 상태가 되면서 우선순위에 의한 선점이 발생하는지 여부

반환값이 `pdPASS`면 잘 반환됐다는 것이고 `pdFAIL`이면 반환에 실패했다는 것이다. API 호출 시점에서 세마포어의 카운트 값이 최대값이면 반환이 일어날 수 없기 때문에 실패한다. 

# 바이너리 세마포어를 사용한 지연된 인터럽트 처리 예시

앞서 지연된 인터럽트 처리에서 보았듯 ISR, 인터럽트 처리 태스크, 낮은 우선순위 태스크 코드가 아래와 같다.

```c
// 낮은 우선순위 태스크 코드
// 여기서는 인터럽트 처리 흐름을 위해 주기적으로 인터럽트를 일으킴
void vPeriodicTask() {
    const TickType_t delay500ms = pdMS_TO_TICKS(500);
    for (;;) {
        vTaskDelay(delay500ms);
        printf("인터럽트 생성...\n");
        // 대충 인터럽트 일으키는 코드
        printf("인터럽트 완료...\n");
    }
}
```

```c
// ISR 코드
uint32_t interruptHandler() {
    BaseType_t xHigherPriorityTaskWoken;
    // 이 값을 초기화한다면 ISR에서 세마포어를 획득하는 함수를 호출하면서 컨텍스트 스위칭이 발생할 때 pdTRUE로 바뀐다. 
    // 초기화를 안하고 NULL로 둔다면 이 값이 pdTRUE가 되지 않는다.
    xHigherPriorityTaskWoken = pdFALSE;
    
    xSemaphoreGiveFromISR( xBinarySemaphore, &xHigherPriorityTaskWoken );

    // xSemaphoreGiveFromISR()에 의해 업데이트된 xHigherPriorityTaskWoken을 인자로 전달한다.
    // 컨텍스트 스위칭이 발생해야한다면 인자에 pdTRUE가 담겨 전달되므로, ISR이 끝난 다음 컨텍스트 스위칭이 처리된다.
    portYIELD_FROM_ISR( xHigherPriorityTaskWoken );
}
```

```c
// 인터럽트 처리 태스크 코드
void handlerTask() {
    for (;;) {
        xSemaphoreTake( xBinarySemaphore, portMAX_DELAY );
        printf("핸들러 태스크 인터럽트 처리...\n");
    }
}
```

> 메인 함수에서는 태스크들을 생성하고 스케줄링을 시작하는 코드라서 생략

실행 결과는 다음과 같다.

![](<./assets/바이너리-세마포어-지연된-인터럽트-처리.png>)

낮은 우선순위 태스크(이하 주기 태스크)가 t1 시점으로부터 500ms정도 기다린 후 깨어나 선점한다. 주기 태스크는 깨어났을 때 인터럽트를 일으키는 것밖에 하지 않으므로 곧이어 인터럽트가 발생, ISR이 실행된다.

ISR은 세마포어를 반환하고 `portYIELD_FROM_ISR()`을 호출해 ISR을 종료한다. ISR이 종료된 후 컨텍스트 스위칭이 발생하도록 `xHigherPriorityTaskWoken`을 인자로 넣었고, 세마포어 반환에 성공하기 때문에 핸들러 태스크가 곧바로 깨어나서 선점하게 된다.

핸들러 태스크는 `xSemaphoreTake()`에서 *Blocked* 상태로 기다리고 있었으므로 바로 인터럽트 처리 코드를 실행하게 된다. 처리가 완료되면 다시 `xSemaphoreTake()`를 실행하며 *Blocked* 상태가 되고, 주기 태스크가 실행된다. 이 때 인터럽트를 일으키는 코드 다음 줄부터 실행되어 결과는 다음과 같다.

```text
인터럽트 생성...
핸들러 태스크 인터럽트 처리...
인터럽트 완료...
인터럽트 생성...
핸들러 태스크 인터럽트 처리...
인터럽트 완료...
인터럽트 생성...
핸들러 태스크 인터럽트 처리...
인터럽트 완료...
...
```

# 바이너리 세마포어를 사용할 때 문제점

인터럽트를 처리하는 코드가 태스크에 있다. 즉, 핸들러 태스크가 실행될 때 인터럽트가 또 발생한다면 문제가 될 수 있다. 

첫 번째 인터럽트를 처리하는 동안 두 번째 인터럽트가 발생한다면 첫 번째 인터럽트를 처리하는 코드가 다 실행된 다음 `xSemaphoreTake()` 줄부터 두 번째 인터럽트를 처리할 것이다. ISR이 실행되고 나서 바로 두 번째 인터럽트가 처리되지는 않지만 문제되지 않는다. 

그러나 첫 번째 인터럽트를 처리하는 동안 두 번째, 세 번째 인터럽트가 연이어서 발생한다면 다음 순서대로 일이 벌어진다.

1. 첫 번째 인터럽트가 발생하여 ISR이 세마포어를 반환한다. (세마포어 카운트 = 1)
2. 핸들러 태스크가 첫 번째 인터럽트를 처리한다. (세마포어 카운트 = 0)
3. 두 번째 인터럽트가 발생하여 ISR이 세마포어를 반환한다. (세마포어 카운트 = 1)
4. 세 번째 인터럽트가 발생하여 ISR이 세마포어를 반환하지만 바이너리 세마포어어이므로 반환에 실패한다. (세마포어 카운트 = 1)

그림으로 표현하면 이렇다.

![](<./assets/바이너리-세마포어-지연된-인터럽트-처리의-문제점.png>)

이 문제를 회피하는 방법은 크게 두 가지가 있다.

1. 하드웨어 버퍼에 저장된 이벤트를 모두 처리하기

    하드웨어 버퍼가 있는 상황에서만 가능하다. 예를 들어 UART와 같이 버퍼에 메시지가 쌓여있는 구조라면 매 인터럽트마다 한 글자 씩 처리하지 않고 버퍼에 쌓인 글자들을 모두 처리한다. 

2. 인터럽트가 발생할 것으로 기대되는 최대 시간만큼 타임아웃을 두기

    예제에서는 `portMAX_DELAY`를 둠으로 무한히 기다리면서 인터럽트가 발생하길 기다리는데, 이러면 **하드웨어/주변장치 이상 등 인터럽트가 발생하지 않게 되는 오류 상태를 감지하지 못한다**. 인터럽트 핸들링 태스크가 이를 감지하려면 인터럽트가 발생할 것으로 기대되는 최대 시간(또는 최악의 시간)만큼 *Blocked* 상태에서 기다리고, 깨어났을 때 인터럽트가 발생하지 않았다면 하드웨어 상태를 점검하도록 구현할 수 있다.

# 카운팅 세마포어

바이너리 세마포어는 길이가 1인 큐라고도 생각할 수 있다. 카운팅 세마포어는 길이가 n인 큐라고 생각할 수 있다. 인터럽트 핸들링 태스크는 큐(세마포어)에 무엇이 들어있는지 신경쓰지 않고, 큐에 데이터가 있는지, 몇 개인지 그것만 신경쓴다.

카운팅 세마포어를 쓰기 위해서는 `configUSE_COUNTING_SEMAPHORES` 매크로를 `1`로 만들어야 한다.

카운팅 세마포어의 용도는 보통 두 가지다.

- 카운팅 이벤트

    이벤트 핸들러가 발생한 이벤트를 알리기 위해 카운팅 세마포어를 반환한다. 태스크에서는 카운팅 세마포어를 획득하여 이벤트를 처리한다. 이 때 카운팅 세마포어의 카운트 값은 `발생한 이벤트 수 - 처리된 이벤트 수`와 같다고 할 수 있다.

- 자원 관리

    세마포어의 주된 용도는 자원을 획득하기 위함이다. 카운팅 세마포어의 카운트 값은 현재 사용 가능한 자원의 수를 의미한다. 카운트 값이 0이 된다면 더이상 이용할 수 없다는 것이고 다른 태스크가 카운팅 세마포어를 반환하기 전까지는 대기해야한다.

바이너리 세마포어는 한 개의 인터럽트만 알릴 수 있다는 한계점이 있다. 동시에 여러 개의 인터럽트가 발생하면 핸들링 태스크의 처리 시간에 따라 인터럽트가 처리되지 못할 수도 있다. 이는 단순히 카운팅 세마포어를 씀으로 해결할 수 있다. 여러 개의 인터럽트(이벤트)가 연속적으로 발생한다면 카운팅 세마포어를 통해 마치 큐에 데이터를 저장하는 것처럼 인터럽트 핸들러가 알 수 있게 기록해두는 것이다.

# 카운팅 세마포어 생성

```c
SemaphoreHandle_t xSemaphoreCreateCounting(
    UBaseType_t uxMaxCount,
    UBaseType_t uxInitialCount );
SemaphoreHandle_t xSemaphoreCreateCountingStatic(
    UBaseType_t uxMaxCount,
    UBaseType_t uxInitialCount
    StaticSemaphore_t *pxSemaphoreBuffer );

```

- `uxMaxCount` : 카운팅 세마포어의 최대 카운트 값
- `uxInitialCount` : 카운팅 세마포어의 초기 카운트 값

바이너리 세마포어와는 다르게 카운트 값에 대한 정보를 인자로 넘겨줘야 한다. 카운팅 세마포어도 정적 생성이 가능하다.

반환값이 `NULL`이면 힙 메모리 부족으로 생성하지 못했다는 의미고, `NULL`이 아니면 카운팅 세마포어의 핸들러가 반환된다.

> 카운팅 세마포어 역시 세마포어 획득, 세마포어 반환의 API는 바이너리 세마포어의 것과 같다.

# RTOS 데몬 태스크로 지연시키기

지연된 인터럽트 처리를 위해 새로 태스크를 만들어야 하는 점이 부담될 수 있다. 이미 있는 태스크인 데몬 태스크에 인터럽트 처리를 맡기는 방법도 있다.

## 장점

- 태스크를 새로 만들지 않고 기존 태스크를 재활용하므로 자원을 덜 사용한다. 
- 소프트웨어 타이머 콜백 함수처럼 단순하게 처리가 완료되면 종료하는 함수 형태로 구현하게 되어 이해하기 쉽다.

## 단점

- 핸들러 함수가 데몬 태스크에 의해 실행되므로 태스크마다 우선순위를 정할 수는 없다. 단지 데몬 태스크의 우선순위만 정할 수 있다.
- ISR에서 처리를 지연시키는 경우 타이머 명령 큐에 지연 요청이 전달되는 구조다. 그러므로 큐에 있는 명령들이 전부 처리된 뒤에 인터럽트가 처리된다.

```c
BaseType_t xTimerPendFunctionCallFromISR( 
    PendedFunction_t xFunctionToPend,
    void *pvParameter1,
    uint32_t ulParameter2,
    BaseType_t *pxHigherPriorityTaskWoken );
```

- `xFunctionToPend` : 데몬 태스크에 의해 실행될 함수. 여기서는 실제로 인터럽트를 처리할 함수다.
- `pvParameter1` : 함수에 전달될 인자 1. `void*` 타입이므로 아무거나 넘겨도 된다.
- `ulParameter2` : 함수에 전달될 인자 2.
- `pxHigherPriorityTaskWoken` : 현재 실행 중이었던 태스크보다 우선순위보다 데몬 태스크의 우선순위가 높다면 이 값이 `pdTRUE`로 설정된다. 당연히 이 값이 `pdTRUE`면 ISR의 처리가 종료되기 전에 데몬 태스크로 컨텍스트 스위칭이 완료된다.

반환값이 `pdPASS`면 타이머 명령 큐에 요청이 전달되었다는걸 의미하고, `pdFAIL`이면 타이머 명령 큐가 꽉 차서 요청이 전달되지 않았다는걸 의미한다.

> 이 함수는 `xTimerPendFunctionCall()`의 interrupt-safe 함수다.

```c
void vPendableFunction(
    void *pvParameter1, 
    uint32_t ulParameter2 );
```

데몬 태스크가 호출하는 함수의 시그니처는 위와 같다. 

## 예시

```c
// ISR
uint32_t irqHandler(void) {
    static uint32_t ulParameter = 0; // 인터럽트 발생 횟수 체크용
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    xTimerPendFunctionCallFromISR(interruptHandler, NULL, ulParameter, &xHigherPriorityTaskWoken);
    ulParameter++;
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}
```
```c
// 데몬 태스크에 의해 실행되는 핸들러 함수
void interruptHandler(void* pvParameter1, uint32_t ulParameter2) {
    printf("지연된 인터럽트 처리 %o회\n", ulParameter);
}
```
```c
// 메인함수
int main() {
    xTaskCreate(vPeriodicTask, "Periodic", 1000, NULL, configTIMER_TASK_PRIORITY - 1, NULL);
    // interruptHandler() 함수를 데몬 태스크에 등록하는 코드는 port별로 달라서 생략...

    vTaskStartScheduler();
    for (;;) {
    }
}
```

```c
// 낮은 우선순위 태스크 코드
// 여기서는 인터럽트 처리 흐름을 위해 주기적으로 인터럽트를 일으킴
void vPeriodicTask() {
    const TickType_t delay500ms = pdMS_TO_TICKS(500);
    for (;;) {
        vTaskDelay(delay500ms);
        printf("인터럽트 생성...\n");
        // 대충 인터럽트 일으키는 코드
        printf("인터럽트 완료...\n");
    }
}
```

위 예제는 인터럽트 발생을 위해 주기 태스크를 만들고, 실제로 인터럽트를 처리할 함수를 데몬 태스크에 등록하고 스케줄링을 시작한다. 실행 결과는 다음과 같다.

![](<./assets/지연된-인터럽트-처리-데몬-태스크.png>)

주기 태스크가 실행 기회를 잡아 인터럽트를 발생시키면 곧바로 ISR이 실행된다. ISR에서는 타이머 명령 큐에 발생한 인터럽트에 대한 정보(여기서는 그냥 발생 횟수만 전달한다)를 넣고 종료한다. 데몬 태스크의 우선순위가 가장 높기 때문에 컨텍스트 스위칭이 발생하고, ISR이 종료되면 바로 데몬 태스크가 실행된다.

데몬 태스크에서는 스케줄링을 시작하기 전에 등록했던 인터럽트 핸들러 함수를 호출하게 된다. 인터럽트 핸들러 함수의 처리가 끝나면 데몬 태스크는 다시 *Blocked* 상태로 전이된다. 

데몬 태스크가 *Blocked* 상태가 되면서 주기 태스크가 실행 기회를 잡게 되고, 인터럽트를 발생시키는 코드가 반환된다.

# ISR 내부에서 큐 사용하기

세마포어는 단순히 인터럽트가 발생했다는 이벤트를 전달하기만 한다. 세마포어 대신 큐를 사용한다면 이벤트 뿐만 아니라 관련 데이터도 전달할 수 있다.

이전에 ISR 내부에서 사용가능한 API를 보았다.

```c
BaseType_t xQueueSendToFrontFromISR(
    QueueHandle_t xQueue,
    const void *pvItemToQueue
    BaseType_t *pxHigherPriorityTaskWoken );
```

큐에 데이터를 넣어서 인터럽트를 처리한다는 쉬운 방법인데 이를 빠르게 처리하려면 어려움이 있다. 큐에 데이터를 넣느라 시간이 들기 때문이다. 특히 인터럽트가 자주 발생하는 경우 매번 큐에 데이터를 넣으면 비효율적이다. 이를 해결하는 방법은 세 가지가 존재한다.

1. DMA로 버퍼를 채운뒤 버퍼가 어느정도 차면 그 때 인터럽트를 발생시키는 방법
2. ISR에서 링 버퍼에 직접 넣은 뒤 태스크 notification을 보내는 방법
3. ISR에서 약간의 처리를 거쳐서 필요한 정보만 큐에 넣기

## 예시

이 예제는 인터럽트가 주기적으로 발생할 때 큐를 통해 인터럽트 처리 태스크(여기서는 그냥 출력용 태스크로 설명)에게 데이터를 전달하는 흐름을 보여준다.

```c
// 인터럽트 발생 태스크
static void vIntegerGenerator() {
    TickType_t xLastExecutionTime = xTaskGetTickCount();
    uint32_t value = 0;
    for (;;) {
        vTaskDelayUntil(&xLastExecutionTime, pdMS_TO_TICKS(200));
        for (int i=0; i<5;i++) {
            xQueueSendBack(xIntegerQueue, &value, 0);
            value++;
        }
        printf("정수값 생성 태스크 인터럽트 생성 전\n");
        /* 대충 인터럽트를 발생시키는 코드 */
        printf("정수값 생성 태스크 인터럽트 생성 후\n");
    }
}
```

```c
// ISR
static uint32_t irq_handler(void) {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    uint32_t receivedValue;
    static const char* dict[] = {
        "0번 문장",
        "1번 문장",
        "2번 문장",
        "3번 문장",
    }
    while(xQueueReceiveFromISR(xIntegerQueue,
        &receivedValue,
        &xHigherPriorityTaskWoken) != errQUEUE_EMPTY) {
        receivedValue &= 0x03;
        xQueueSendBackFromISR(xStringQueue,
            &dict[receivedValue],
            &xHigherPriorityTaskWoken)
    }
    portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
}
```

```c
// 출력용 태스크
static void printer(void *pvParameters) {
    char *pcString;
    for (;;) {
        xQueueReceive(xStringQueue, &pcString, portMAX_DELAY);
        printf("%s\n", pcString);
    }
}
```

```c
// main.c
int main() {
    xIntegerQueue = xQueueCreate( 10, sizeof( uint32_t ) );
    xStringQueue = xQueueCreate( 10, sizeof( char * ) );

    xTaskCreate( vIntegerGenerator, "IntGen", 1000, NULL, 1, NULL );
    xTaskCreate( vStringPrinter, "String", 1000, NULL, 2, NULL );

    vPortSetInterruptHandler( mainINTERRUPT_NUMBER, ulExampleInterruptHandler );
    vTaskStartScheduler();

    for(;;) {

    }
}
```

실행 결과는 다음과 같다.

![](<./assets/큐를-사용한-인터럽트-처리-데이터전달.png>)

인터럽트 발생 태스크가 주기적으로 `xIntegerQueue`에 정수값을 5개 넣은 후 인터럽트를 발생시킨다. 

ISR에서는 인터럽트 발생 시 `xIntegerQueue에서` 값을 모두 꺼낸 후 이를 인덱스로 하여 사전에 저장된 문자열의 주소를 `xStringQueue`로 전달한다.

출력용 태스크는 인터럽트 발생 태스크보다 우선순위가 높으므로, `xStringQueue`에 데이터가 들어올 때 인터럽트 발생 주기 태스크를 선점하게 된다. 따라서 큐에 들어온 데이터를 그대로 출력한다. 

출력 결과는 다음과 같다.

```txt
정수값 생성 태스크 인터럽트 생성 전
0번 문장
1번 문장
2번 문장
3번 문장
0번 문장
정수값 생성 태스크 인터럽트 생성 후
정수값 생성 태스크 인터럽트 생성 전
1번 문장
2번 문장
3번 문장
0번 문장
1번 문장
정수값 생성 태스크 인터럽트 생성 후
...
```

# 인터럽트 중첩

태스크에도 우선순위가 있듯, 인터럽트에도 우선순위가 있다. 인터럽트 우선순위는 여러 인터럽트가 동시에 발생할 때 어떤 ISR부터 호출될 지를 결정한다. 단, 모든 ISR은 하드웨어에 의해 실행되므로 태스크의 우선순위보다 항상 높으므로 태스크 우선순위와 인터럽트 우선순위는 서로 관련이 없다.

중첩 인터럽트를 사용하기 위해서는 `configMAX_SYSCALL_INTERRUPT_PRIORITY` 또는 `configMAX_API_CALL_INTERRUPT_PRIORITY` 매크로가 정의되어 있어야 한다. 이 두 매크로 모두 같은 의미인데, interrupt-safe API 함수를 사용 가능한 ISR들의 최대 우선순위값을 의미한다.

반대로 `configKERNEL_INTERRUPT_PRIORITY`는 최소 우선순위값이다. 틱 인터럽트가 이 값을 우선순위로 사용한다.

각 인터럽트는 두 개의 우선순위 값을 갖는다.

- Numeric priority(숫자 우선순위)

    인터럽트에 부여된 우선순위 값을 지칭한다.

- Logical priority(논리 우선순위)

    인터럽트 간 순서를 의미한다. 낮은 우선순위를 가진 ISR이 실행되는 중에 높은 우선순위를 가진 ISR이 실행될 수 있다. 이걸 **중첩**이라고 부른다. 

이렇게 나눈 이유는 프로세서의 아키텍처마다 숫자 우선순위대로 논리 우선순위를 결정하지는 않기 때문이다. 몇몇 아키텍처는 인터럽트에 부여된 숫자 우선순위가 낮을 경우 더 높은 우선순위라고 생각한다.

# interrupt-safe API 허용 범위

- `configMAX_SYSCALL_INTERRUPT_PRIORITY` = 3
- `configKERNEL_INTERRUPT_PRIORITY` = 1

위와 같이 매크로가 정의될 경우 각 우선순위마다 할 수 있는 행동들은 아래 그림과 같다.

![](<./assets/인터럽트-우선순위-가능한-동작.png>)

우선순위 1~3은 매크로에 의해 정의된 interrupt-safe API 허용 우선순위 범위이다. 이 범위 내 인터럽트들은 interrupt-safe API 함수들을 사용할 수 있다. 그러나, 커널이나 애플리케이션이 크리티컬 섹션에서 코드를 실행중일 때에는 그림에서 설명되어 있듯 크리티컬 섹션에 마스킹이 되어 ISR의 실행이 지연된다.

이 범위 밖 인터럽트들은 interrupt-safe API 함수들을 사용할 수 없다. 대신에 이 인터럽트들은 크리티컬 섹션에 의해서 지연되는 경우는 없다.

ISR들이 API 함수를 쓰지 않는다면 interrupt-safe API 허용 우선순위 범위를 신경쓰지 않고 우선순위를 부여할 수 있다.

# Cortex-M 시리즈에서 주의할 점

이 칩 시리즈에서는 앞서 숫자 우선순위과 논리 우선순위를 분리한 이유가 드러난다. 낮은 숫자 우선순위가 논리적으로는 높은 우선순위를 갖는다.

그리고, 우선순위를 나타내는 자료형은 8비트이지만 실제 우선순위 값을 저장하는 비트는 아키텍처마다 다르다. 예를 들어 상위 4비트를 실제 우선순위 값으로 사용할 수 있다. 그런 경우 어차피 상위 4비트만 우선순위 값으로 생각하기 때문에, 하위 4비트는 어떤 값으로 채워지든 신경쓰지 않는다. 다시 말해 하위 비트들이 1이든 0이든 상위 4비트가 같다면 같은 우선순위 값으로 본다.
