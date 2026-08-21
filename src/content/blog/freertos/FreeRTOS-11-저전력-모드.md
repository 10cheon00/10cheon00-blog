---
title: FreeRTOS (11) - 저전력 모드
date: "2026-07-25"
updated: "2026-07-25"
tags: ["freertos"]
category:
  name: "FreeRTOS"
series:
  name: "FreeRTOS"
  order: 11
---


> [FreeRTOS Documentation - FreeRTOS™](https://www.freertos.org/Documentation/02-Kernel/07-Books-and-manual/01-RTOS_book)
> 
> 이 문서에서 제공하는 PDF를 읽고 정리한 글입니다.
> 
> 생성 일 : 2026-07-25
> 최종 수정일 : 2026-07-25

---

# 절전 모드

전력 소모량을 낮추기 위해 FreeRTOS는 유휴 태스크 훅을 사용하여 MCU를 절전 모드로 동작하게 할 수 있다. 그러나 이런 효과는 주기적으로 틱 인터럽트를 처리하기 위해 절전 모드를 해제했다가 다시 들어오는 작업에 의해 감소된다. 틱 인터럽트가 자주 발생하도록 주기를 짧게 설정하는 경우 절전 모드를 해제하고 다시 들어오는 작업이 빈번해지므로 절전 효과가 크지 않다(정말 가벼운 절전 모드는 예외일 수 있음).

FreeRTOS는 위와 같은 일반적인 절전 모드(매 틱마다 깨어나는 Idle Hook 방식)를 지원하고, 틱 인터럽트를 처리하지 않는 Tickless Idle 방식도 지원한다. Tickless Idle 방식은 다른 실행 가능한 태스크가 없을 때 주기적인 틱 인터럽트를 중단하고 MCU가 깊은 절전 모드로 들어가게 한다. 이 때 MCU는 외부에서 인터럽트가 발생하지 않거나 태스크가 실행 가능한 상태로 바뀌지 않는 한 깊은 절전 모드를 유지한다. 깊은 절전 모드를 탈출할 때 틱 인터럽트를 다시 시작하며 틱 카운트 값을 갱신한다.

# 슬립 모드 상태

FreeRTOS는 세 가지 슬립 모드 상태를 제공한다.

- `eAbortSleep`

    태스크가 실행 가능하거나, 컨택스트 스위칭이 지연되었거나, 스케줄러가 정지되어 있어 틱 인터럽트가 지연되었다는 것을 나타낸다. 슬립 모드로 진입하는 것을 막기 위해 FreeRTOS에게 알린다.

- `eStandardSleep`

    예측되는 유휴 시간보다 짧은 시간동안 슬립 모드에 진입할 수 있게 한다. 

- `eNoTasksWaitingTimeout`

    일정 시간만큼 기다렸을 때 아무 태스크도 실행 가능하지 않은 상태라면 슬립 모드에 진입하고, 외부 인터럽트나 리셋 신호가 와야지만 슬립 모드에서 탈출한다.

# Tickless Idle 방식 사용

Tickless Idle 방식은 `configUSE_TICKLESS_IDLE`매크로를 `1`로 설정해야 사용할 수 있다. `configUSE_TICKLESS_IDLE` 매크로가 `2`라면 사용자 정의 Tickless Idle 방식을 쓰는 것을 의미한다. 이 방식은 모든 port에서 사용 가능하다.

FreeRTOS는 두 가지 조건을 만족할 때 `portSUPPRESS_TICKS_AND_SLEEP()`을 호출하여 Tickless Idle 구간에 들어간다.

1. 유휴 태스크가 실행 가능한 유일한 태스크여야 한다. 다른 태스크들은 *Blocked* 또는 *Suspend* 상태여야 한다.

2. 최소 `n`번의 틱이 발생하는 동안 *Blocked* 상태의 태스크가 *Ready* 상태로 바뀌는 일이 없어야 한다. `n`값은 `configEXPECTED_IDLE_TIME_BEFORE_SLEEP` 매크로에 의해 정해진다.

```c
portSUPPRESS_TICKS_AND_SLEEP( xExpectedIdleTime )
```

- `xExpectedIdleTime` : 절전 모드를 유지할 수 있는 시간, 다시 말해 *Blocked* 상태에서 *Ready* 상태로 전환되기까지 남아있는 틱 주기의 개수

인자로 전해지는 시간만큼 Tickless Idle 구간에 들어간다.

> ```c
> void vPortSuppressTicksAndSleep( TickType_t xExpectedIdleTime );
> ```
> 
> 이 함수도 Tickless Idle 상태에 진입하는 함수인데 Cortex-M 시리즈의 port에만 정의되어 있다.

```c
eSleepModeStatus eTaskConfirmSleepModeStatus( void );
```

슬립 모드로 들어가도 괜찮은 상황인지 확인하는 함수다. 

반환값이 `eNoTasksWaitingTimeout`이면, Tickless Idle 구간에서 이 함수가 호출되었다는 것이며 MCU는 깊은 절전 상태를 무기한으로 유지한다. 이 상태는 두 가지를 의미한다.

- 실행해야할 소프트웨어 타이머가 없다.
- 모든 애플리케이션 태스크 상태가 *Suspend* 상태이거나 *Blocked* 상태(portMAX_DELAY만큼 기다리는 중)여서 스케줄러가 일정 시간 이후 상태를 바꾸는 일이 없는 것을 의미한다.

이 함수를 호출하여 슬립 모드에 진입할 수 있는지 조건을 검사하는데, 그동안 인터럽트가 발생해서 태스크가 *Ready* 상태가 되면 안되므로, 틱 타이머가 멈추고 슬립 모드에 진입하기 전까지는 크리티컬 섹션이어야 한다.

# 슬립 모드 진입 전/후 이벤트 매크로

```c
configPRE_SLEEP_PROCESSING( xExpectIdleTime )
configPOST_SLEEP_PROCESSING( xExpectIdleTime )
```

각각 슬립 모드 진입 전 후에 호출되며 페리퍼럴을 끄거나 클럭을 낮추는 등 작업을 할 수 있다.

# 직접 매크로 구현하기

FreeRTOS port가 `portSUPPRESS_TICKS_AND_SLEEP()` 함수를 제공하지 않는다면 직접 구현할 수 있다. 만약 기본 구현을 제공하더라도 사용자가 직접 구현한다면 덮어쓰기가 된다.

```c
#if ( configUSE_TICKLESS_IDLE == 1 )

    __attribute__( ( weak ) ) void vPortSuppressTicksAndSleep( TickType_t xExpectedIdleTime ) 
    ^^^^^^^^^^^^^^^^^^^^^^^^^~~~ weak 키워드가 붙어 있다!
    {
...
```

```c
#define portSUPPRESS_TICKS_AND_SLEEP( xIdleTime ) vApplicationSleep( xIdleTime )

void vApplicationSleep( TickType_t xExpectedIdleTime )
{
    unsigned long ulLowPowerTimeBeforeSleep, ulLowPowerTimeAfterSleep;
    eSleepModeStatus eSleepStatus;
    ulLowPowerTimeBeforeSleep = ulGetExternalTime();

    /*
    1. 틱 인터럽트 타이머 정지
    2. 인터럽트 비활성화( = 크리티컬 섹션 진입)
    3. 슬립 모드 진입 가능 여부 확인
    4-1. eAbortSleep이면 틱 타이머 재개, 인터럽트 활성화
    4-2. eNoTaskWaitingTimeout이면, 무한히 슬립
    4-3. eStandardSleep이라면, 일정 시간만 슬립 후 깨어났을 때 틱 카운트 갱신
    5. 슬립 모드 탈출 시 인터럽트 활성화 후 틱 타이머 재개
    */
    prvStopTickInterruptTimer();
    disable_interrupts();
    eSleepStatus = eTaskConfirmSleepModeStatus();
    if( eSleepStatus == eAbortSleep )
    {
        prvStartTickInterruptTimer();
        enable_interrupts();
    }
    else
    {
        if( eSleepStatus == eNoTasksWaitingTimeout )
        {
            prvSleep();
        }
        else
        {
            vSetWakeTimeInterrupt( xExpectedIdleTime );
            prvSleep();
            ulLowPowerTimeAfterSleep = ulGetExternalTime();
            vTaskStepTick( ulLowPowerTimeAfterSleep - ulLowPowerTimeBeforeSleep );
        }
        enable_interrupts();
        prvStartTickInterruptTimer();
    }
}
```

# 유휴 태스크 훅 함수

유휴 태스크 훅이 호출된다는건 유휴 태스크가 실행 가능한 유일한 태스크라는 것을 의미한다. 그러므로 
