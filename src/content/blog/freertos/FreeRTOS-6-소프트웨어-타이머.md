---
title: FreeRTOS (6) - 소프트웨어 타이머
date: "2026-07-05"
updated: "2026-07-06"
tags: ["freertos"]
category:
  name: "FreeRTOS"
series:
  name: "FreeRTOS"
  order: 6
---


> [FreeRTOS Documentation - FreeRTOS™](https://www.freertos.org/Documentation/02-Kernel/07-Books-and-manual/01-RTOS_book)
> 
> 이 문서에서 제공하는 PDF를 읽고 정리한 글입니다.
> 
> 생성 일 : 2026-07-05
> 최종 수정일 : 2026-07-06

---

# 소프트웨어 타이머

소프트웨어 타이머는 하드웨어 없이 순수 FreeRTOS 커널에 의해 구현되고 실행되는 타이머다. 소프트웨어 타이머는 주기적으로 또는 미래의 특정한 시기에 함수를 실행하는 기능을 가지고 있다. 소프트웨어 타이머에 의해 실행되는 함수를 **소프트웨어 타이머 콜백 함수**라고 부른다. 

소프트웨어 타이머 함수 기능을 사용하려면 다음의 절차대로 수행해야한다.

1. timer.c를 프로젝트에 포함시켜야 한다.
2. 다음 매크로들을 정의해야한다.

    - `configUSE_TIMER`
        `1`로 설정해야한다.
    - `configTIMER_TASK_PRIORITY`
    - `configTIMER_QUEUE_LENGTH`
        타이머 명령 큐(?)의 길이를 설정한다.
    - `configTASK_STACK_DEPTH`
        타이머 서비스 태스크가 가지는 스택의 크기(워드 단위)를 설정한다.

# 소프트웨어 타이머 콜백 함수

```c
void ATimerCallback( TimerHandle_t xTimer );
```

모든 소프트웨어 타이머 콜백함수의 시그니처는 위와 같다.

이 함수를 실행하면서 *Blocked* 상태가 되어서는 안된다. 즉, `xQueueReceive()`의 대기 시간 인자에 0을 넣어 호출하는건 괜찮지만, `vTaskDelay()`같이 호출자가 *Blocked* 상태로 진입하는 FreeRTOS API 함수를 사용해서는 안된다. 

# 용어

- Period(주기)

    소프트웨어 타이머가 시작된 시점부터 타이머 콜백 함수가 실행되기 전까지의 시간을 의미한다.

- one-shot

    스케줄러에 의해 소프트웨어 타이머가 시작된 이후 한 번만 실행하고 종료되는 타이머 콜백 함수를 말한다. 스스로 다시 시작할 수 없고 다른 태스크가 수동으로 재시작해야한다.

- auto-reload

    스스로 재시작 가능한 소프트웨어 타이머를 말한다. 즉, 주기적으로 정해진 시간이 지나면 콜백 함수를 실행한다.

# 소프트웨어 타이머 상태 

소프트웨어 타이머의 상태는 두 가지가 있다.

- Dormant(휴면 상태)

    소프트웨어 타이머가 생성되었지만 실행되진 않은 상태다. 타이머가 흐르지 않으므로 콜백 함수는 실행되지 않는다.

- Running(활성 상태)

    소프트웨어 타이머의 시간이 흐르고 있는 상태다. 활성 상태로 전이된 시점부터 시간을 확인하여 콜백 함수를 실행한다.

소프트웨어 타이머의 상태도는 종류에 따라 다르다.

- auto-reload 소프트웨어 타이머의 상태도
    ![Auto-reload 소프트웨어 타이머 상태도](<./assets/Auto-reload 소프트웨어 타이머 상태도.png>)

- one-shot 소프트웨어 타이머의 상태도
    ![One-shot 소프트웨어 타이머 상태도](<./assets/One-shot 소프트웨어 타이머 상태도.png>)

Auto-reload 소프트웨어 타이머는 타이머를 수동으로 멈추는게 아니라면 계속 *Running* 상태에 있지만 One-shot 소프트웨어 타이머는 타이머가 만료되거나 함수를 실행한 뒤에는 *Dormant* 상태가 된다는 차이점이 있다.

# 소프트웨어 타이머 삭제

```c
BaseType_t xTimerDelete( TimerHandle_t xTimer, TickType_t xTicksToWait );
```

- `xTimer` : 지울 타이머의 핸들
- `xTicksToWait` : 타이머 명령 큐에 삽입되기를 기다리는 대기 시간

대기 시간동안 자리가 생길 경우 `pdPASS`를, 대기 시간 동안 자리가 생기지 못해 제거 명령을 큐에 못 넣은 경우 `pdFAIL`을 반환한다.

> 타이머 명령 큐에 대해서는 후술한다.

# RTOS 데몬 태스크(타이머 서비스 태스크)

모든 소프트웨어 타이머 콜백 함수를 이 태스크가 실행시킨다. 스케줄링이 시작될 때 자동으로 생성되는 태스크 중 하나며, 이 태스크의 스택과 우선순위는 각각 `configTIMER_TASK_STACK_DEPTH`, `configTIMER_TASK_PRIORITY` 매크로에 의해 정해진다.

이전에 소프트웨어 타이머 콜백 함수 안에서, 태스크를 *Blocked* 상태가 되게 만드는 API 호출을 하면 안된다고 말했는데 그 이유가 여기에 있다. **데몬 태스크가 *Blocked* 상태에 빠진다면 다른 콜백 함수들이 실행되지 못하기** 때문이다.

# 소프트웨어 타이머 명령 큐

소프트웨어 타이머 API 함수들은 모두 타이머 명령 큐에 들어가 실행된다. 타이머 시작, 정지, 초기화 등등. 스케줄링이 시작될 때 큐가 생성되며 큐의 길이는 `configTIMER_QUEUE_LENGTH` 매크로에 의해 정해진다.

소프트웨어 타이머 API 함수를 호출하는 경우 아래 그림과 같이 타이머 명령 큐를 통해 데몬 태스크에게 전달된다. 

![데몬-태스크-타이머-명령-큐](<./assets/데몬-태스크-타이머-명령-큐.png>)

# RTOS 데몬 태스크 스케줄링

데몬 태스크는 타이머 명령 큐에 담긴 명령들을 수행하고, 콜백 함수들을 직접 호출한다. 데몬 태스크도 태스크이기 때문에 우선순위에 따라 선점하거나 선점당한다.

## 데몬 태스크 우선순위 < 호출 태스크 우선순위

데몬 태스크의 우선순위가 소프트웨어 타이머 API를 호출하는 호출 태스크의 우선순위보다 낮다면 아래 사진처럼 실행된다.

![데몬 태스크 우선순위 예시 1](<./assets/데몬-태스크-우선순위-예시1.png>)

t1에는 데몬 태스크보다 호출 태스크의 우선순위가 더 높기 때문에 데몬 태스크는 *Blocked* 상태다. t2에서 호출 태스크가 `xTimerStart()` 함수를 호출한다. 하지만 데몬 태스크의 우선순위가 낮기 떄문에 호출 시점에 바로 타이머가 시작되지는 않고 명령 큐에만 메세지가 들어가고, t3 시점에 명령 큐 삽입이 완료된다.

t4에서 호출 태스크가 *Blocked* 상태가 되었다. 그제서야 데몬 태스크가 가장 높은 우선순위이므로 선점한다. 이 때부터 타이머가 돌아가게 된다. 하지만 타이머 시작 시간은 데몬 태스크에서 명령 큐를 통해 타이머 시작을 수신한 시간이 아닌, **호출 태스크에서 명령 큐에 타이머 시작을 송신한 시간**이다. 타이머 명령 큐에는 이러한 시간을 의미하는 값이 전달되므로 타이머 시작 시점을 정확히 알 수 있다.

t5에서는 데몬 태스크가 처리를 끝낸 후 타이머 명령 큐를 확인했지만 큐가 비어있으므로 *Blocked* 상태로 전환되어 유휴 태스크가 실행된 모습이다.

## 데몬 태스크 우선순위 > 호출 태스크 우선순위

반대로 데몬 태스크의 우선순위가 호출 태스크의 우선순위보다 높다면 아래 사진처럼 실행된다.

![데몬 태스크 우선순위 예시 2](<./assets/데몬-태스크-우선순위-예시2.png>)


호출 태스크는 t2에서 `xTimerStart()`를 호출한다. 호출하자마자 타이머 명령 큐로 메세지가 전달되고, 데몬 태스크가 *Ready* 상태가 되므로 우선순위에 의해 선점한다. 데몬 태스크는 바로 타이머 시작 요청을 처리하고 다시 큐를 확인하지만 큐가 비어있으므로 *Blocked* 상태가 된다. 

t3에서 데몬 태스크가 *Blocked* 상태로 바뀌므로 다시 호출 태스크가 선점한다. `xTimerStart()`의 실행은 t4에 완료된다. t5시점엔 호출 태스크가 *Blocked* 상태로 진입한다.

# 소프트웨어 타이머 생성

```c
TimerHandle_t xTimerCreate( 
    const char * const pcTimerName,
    const TickType_t xTimerPeriodInTicks,
    const BaseType_t xAutoReload,
    void * const pvTimerID,
    TimerCallbackFunction_t pxCallbackFunction );
```

- `pcTimerName` : 디버깅용 타이머 이름
- `xTimerPeriodInTicks` : 타이머가 흐를 시간 설정
- `const BaseType_t xAutoReload` : `pdTRUE`이면 auto-reload 타이머, `pdFALSE`면 one-shot 타이머
- `void * const pvTimerID` : [타이머 ID](#타이머-id) (후술)
- `TimerCallbackFunction_t pxCallbackFunction` : 소프트웨어 타이머 콜백 함수

반환값이 `NULL`이면 힙 메모리 부족으로 타이머 생성에 실패했다는 뜻이다. `NULL`이 아니면 타이머의 핸들이 반환된다.

# 소프트웨어 타이머 시작

```c
BaseType_t xTimerStart( TimerHandle_t xTimer, TickType_t xTicksToWait );
```

- `xTimer` : 시작시킬 타이머의 핸들
- `xTicksToWait` : 타이머 명령 큐에 자리가 생기길 기다리는 대기 시간

이 함수는 타이머의 상태를 *Dormant*에서 *Running*으로 바꾼다.

> 이 함수를 ISR에서 쓰면 안된다. 타이머 명령 큐에 자리가 없으면 *Blocked* 상태가 되기 때문에 ISR에서 쓰고자 한다면 `xTimerStartFromISR()`를 써야 한다.

반환값이 `pdPASS`면 타이머 명령 큐에 타이머를 시작하는 메세지가 삽입된 것이다. `pdFAIL`이면 타이머 명령 큐에 자리가 없어서 메세지를 삽입하지 못한 것이다.

# 예시 1

```c
int main() {
    oneShotTimer = xTimerCreate(
        "oneShot",
        pdMS_TO_TICKS(3333),
        pdFALSE,
        0,
        oneShotCallback // 단순 출력용 콜백
    );
    autoReloadTimer = xTimerCreate(
        "autoReload",
        pdMS_TO_TICKS(500),
        pdTRUE,
        0
        autoReloadCallback // 단순 출력용 콜백
    );
    xTimerStart(oneShotTimer, 0);
    xTimerStart(autoReloadTimer, 0);
    /* ... */
}
```

위와 같이 타이머 설정을 마치고 스케줄링을 한다고 하면 실행 결과는 아래와 같다.

```text
auto-reload callback function called at 500ms.
auto-reload callback function called at 1000ms.
auto-reload callback function called at 1500ms.
auto-reload callback function called at 2000ms.
auto-reload callback function called at 2500ms.
auto-reload callback function called at 3000ms.
one-shot callback function called at 3333ms.
auto-reload callback function called at 3500ms.
auto-reload callback function called at 4000ms.
...
```

# 소프트웨어 타이머 ID

모든 소프트웨어 타이머는 ID값을 갖는다. 커널이 다루는 ID값은 아니고, 콜백 함수 안에서 참조하는 값이다. 소프트웨어 타이머 ID는 타이머가 생성될 때, 그리고 `vTimerSetTimerID`를 호출할 때 바뀐다.

## 소프트웨어 타이머 ID 설정, 조회

소프트웨어 타이머 ID를 설정하거나 조회하는 함수는 타이머 명령 큐에 메세지를 전하진 않기 때문에 어디서든지 호출해도 문제가 없다.

```c
void vTimerSetTimerID( const TimerHandle_t xTimer, void *pvNewID );
```

- `xTimer` : 타이머 ID를 설정할 타이머 핸들
- `pvNewId` : 새로운 타이머 ID를 가리키는 주소값

```c
void *pvTimerGetTimerID( const TimerHandle_t xTimer );
```

- `xTimer` : 타이머 ID를 조회할 타이머 핸들

반환값으로 항상 타이머 ID의 주소값이 전달된다.

## 소프트웨어 타이머 ID의 용도

하나의 소프트웨어 타이머 콜백 함수가 여러 타이머에 의해 호출될 수 있다. 이럴 때 콜백 함수 내에서 어떤 타이머에 의해 호출되었는지 알기 위해 타이머 ID가 존재한다. 타이머 ID의 타입이 void인것도 단순히 int같은 값을 쓰지 않고 구조체 타입을 씀으로 여러 정보를 추가할 수 있다는 의미다.

# 소프트웨어 타이머 주기 수정

소프트웨어 타이머의 주기는 타이머 생성 시에만 결정되지 않고 실행 중에 변경이 가능하다.

```c
BaseType_t xTimerChangePeriod( 
    TimerHandle_t xTimer,
    TickType_t xNewPeriod,
    TickType_t xTicksToWait );
```

- `xTimer` : 주기를 변경할 타이머의 핸들
- `xNewPeriod` : 새로운 주기
- `xTicksToWait` : 타이머 명령 큐에 삽입되기를 기다리는 대기 시간

대기 시간동안 자리가 생길 경우 `pdPASS`를, 대기 시간 동안 자리가 생기지 못해 주기 수정 명령을 큐에 못 넣은 경우 `pdFAIL`을 반환한다.

> 이 함수도 타이머 명령 큐에 삽입을 위해 *Blocked* 상태로 갈 수 있으므로 ISR에서 호출하면 안된다. `xTimerChangePeriodFromISR()`을 사용해야한다.

타이머가 *Running* 상태일 때 주기를 수정한다면, 타이머가 만료되는 시간을 다시 계산한다. 이 때 `xTimerChangePeriod()` 함수가 호출된 시점을 기준으로 만료되는 시간을 계산하게 된다. 

타이머가 *Dormant* 상태일 때 주기를 수정한다면, 함수가 호출된 시점을 기준으로 타이머가 만료되는 시간을 다시 계산하면서 타이머를 실행하게 된다.

# 소프트웨어 타이머 리셋

소프트웨어 타이머를 리셋한다면 타이머 만료 시간이 리셋 시점부터 다시 계산된다. 예시는 아래 사진과 같다.

![](<./assets/타이머-리셋-만료시간-재계산.png>)

t1 시점에 타이머 1이 시작되어 예상 만료 시간은 t7이었다. 그러나 t5에 타이머가 리셋되면서 만료 시간이 재계산되었고 t11에 만료될 것으로 계산되었다. 그러나 t9에 다시 타이머를 리셋하면서 t15에 만료될 것으로 재계산 되었다.

```c
BaseType_t xTimerReset( TimerHandle_t xTimer, TickType_t xTicksToWait );
```

> 이 명령도 ISR 내부에서 쓰면 안된다. 대신 `xTimerResetFromISR()`을 써야 한다.

> 인자값, 반환값이 다른 함수의 시그니처와 동일하기 때문에 생략한다.

타이머 리셋을 활용하는 예시로는, 입력될 때마다 라이트를 켜고, 일정 시간동안 추가 입력이 없으면 라이트를 끄는 기능을 구현하는 것이다. 타이머를 시작시키고 키가 입력될 때마다 타이머를 리셋한다. 그러면 마지막 키 입력 시점을 기준으로 타이머 만료 시간이 다시 계산되어 라이트가 계속 켜져 있게 된다.
