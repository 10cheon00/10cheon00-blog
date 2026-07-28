
> [FreeRTOS Documentation - FreeRTOS™](https://www.freertos.org/Documentation/02-Kernel/07-Books-and-manual/01-RTOS_book)
> 
> 이 문서에서 제공하는 PDF를 읽고 정리한 글입니다.
> 
> 생성 일 : 2026-07-18
> 최종 수정일 : 2026-07-21

---

# 큐 & 세마포어와 이벤트 그룹

- 공통점

    - 한 이벤트가 발생했을 때 태스크를 *Blocked* 상태로 만들 수 있다.
    - 역으로, 한 이벤트가 발생했을 때 태스크를 *Ready* 상태로 만들 수도 있다. 이 때 **그 이벤트를 기다리는 태스크 중 가장 높은 우선순위를 가진 태스크를 *Ready* 상태로 만든다**.

- 차이점

    - 이벤트 그룹은 여러 이벤트 조합의 발생을 기다리는 태스크를 *Blocked* 상태로 만들 수 있다.
    - 이벤트 그룹은 한 이벤트 또는 이벤트 조합의 발생을 기다리는 여러 태스크들을 *Ready* 상태로 만들 수 있다.

큐나 세마포어는 한 번에 한 태스크만 깨울 수 있지만, 이벤트 그룹은 여러 태스크들을 동시에 깨울 수 있다. 브로드캐스팅이나 여러 태스크 간 동기화 작업 또는 여러 작업이 완료되길 기다리는 것에 쓸 수 있다. 

# 이벤트 그룹

이벤트 그룹은 이벤트 플래그의 집합인데, **이벤트 플래그**는 `boolean` 값으로, 그 비트에 대응되는 이벤트가 발생했는지 안헀는지를 나타낸다. 값이 `0`이면 이벤트가 발생하지 않았음을, 값이 `1`이면 이벤트가 발생했음을 나타낸다. 

이벤트 플래그는 이벤트 비트로 볼 수 있고, 이벤트 그룹은 `EventBits_t`라는 타입으로 표현된다. 

# `EventBits_t`

`EventBits_t`에서 실제로 이벤트를 의미하는 비트들의 수는 `configTICK_TYPE_WIDTH_IN_BITS`에 의존한다. 

> 내부적으로 `EventBits_t`를 정의할 때, TickType_t를 재사용한다.
> 
> ```c
>/*
> * The type that holds event bits always matches TickType_t - therefore the
> * number of bits it holds is set by configTICK_TYPE_WIDTH_IN_BITS (16 bits if set to 0,
> * 32 bits if set to 1, 64 bits if set to 2.
> *
> * \defgroup EventBits_t EventBits_t
> * \ingroup EventGroup
> */
>typedef TickType_t               EventBits_t;
>```

- `configTICK_TYPE_WIDTH_IN_BITS`가 `TICK_TYPE_WIDTH_IN_16_BITS`로 설정되어 있다면, 16비트에서 8비트만 이벤트 그룹으로 쓸 수 있다.
- `configTICK_TYPE_WIDTH_IN_BITS`가 `TICK_TYPE_WIDTH_IN_32_BITS`로 설정되어 있다면, 32비트에서 24비트만 이벤트 그룹으로 쓸 수 있다.
- `configTICK_TYPE_WIDTH_IN_BITS`가 `TICK_TYPE_WIDTH_IN_64_BITS`로 설정되어 있다면, 64비트에서 56비트만 이벤트 그룹으로 쓸 수 있다.

```c
#ifndef configTICK_TYPE_WIDTH_IN_BITS
    #if ( configUSE_16_BIT_TICKS == 1 )
        #define configTICK_TYPE_WIDTH_IN_BITS    TICK_TYPE_WIDTH_16_BITS
    #else
        #define configTICK_TYPE_WIDTH_IN_BITS    TICK_TYPE_WIDTH_32_BITS
    #endif
#endif
```

위 매크로 코드들을 보면 설정된 매크로에 따라 이벤트 그룹의 자료형을 결정한다.

> 남은 8비트는 ??

# 이벤트 그룹 생성

```c
EventGroupHandle_t xEventGroupCreate(void);
```

반환값이 `NULL`이면 힙 메모리 부족으로 생성되지 못한 것이고, `NULL`이 아니면 이벤트 그룹의 핸들을 반환한다.

# 이벤트 그룹 비트값 설정

이벤트 그룹의 비트값을 바꿈으로 태스크들에게 이벤트가 발생했음을 전파한다.

```c
EventBits_t xEventGroupSetBits( 
    EventGroupHandle_t xEventGroup,
    const EventBits_t uxBitsToSet );
```

- `xEventGroup` : 비트값을 바꿀 이벤트 그룹의 핸들

- `uxBitsToSet` : 바꿀 비트값(마스크). 이 값은 이벤트 그룹과 OR 연산으로 합해진다.

이 API는 값을 바꾼 후의 이벤트 그룹을 반환한다. 그러나 반환값에 `uxBitsToSet`값이 드러나지 않을 수 있는데, 중간에 다른 태스크가 이벤트 그룹을 읽고 변경할 수 있기 때문이다.

> 이 함수 역시 중간에 다른 태스크를 깨울 수 있는 API이므로 ISR에서는 사용하면 안된다. 대신 `xEventGroupSetBitsFromISR()`을 사용해야한다.
> 
> ```c
> BaseType_t xEventGroupSetBitsFromISR(
>     EventGroupHandle_t xEventGroup,
>     const EventBits_t uxBitsToSet,
>     BaseType_t *pxHigherPriorityTaskWoken );
> ```
>
> 이 함수는 약간 다르게 동작한다. ISR 내에서 이벤트 비트를 설정하면 여러 태스크가 동시에 깨어날 수 있기 때문에, ISR에서 이 작업을 수행하지는 않고 데몬 태스크가 처리하도록 지연한다. ISR이 실행된 후 다음에 실행될 태스크는 데몬 태스크이므로, 데몬 태스크가 현재 중단된 태스크보다 우선순위가 높은 경우에 이 값이 `pdTRUE`로 바뀐다.
> 반환값이 `pdPASS`라면 **이벤트 그룹에 값이 쓰인게 아니라 타이머 명령 큐에 작업이 전달되었다**를 의미한다. 반대로 `pdFALSE`라면 타이머 명령 큐가 꽉 차서 작업을 전달하지 못했다를 의미한다.

# 이벤트 그룹 대기

태스크가 *Blocked* 상태에서 이벤트 그룹을 읽고 하나 또는 여러 이벤트가 발생하길 기다리게 만든다.

```c
EventBits_t xEventGroupWaitBits( 
    EventGroupHandle_t xEventGroup,
    const EventBits_t uxBitsToWaitFor,
    const BaseType_t xClearOnExit,
    const BaseType_t xWaitForAllBits,
    TickType_t xTicksToWait );
```

- `xEventGroup` : 확인할 이벤트 그룹 핸들
- `uxBitsToWaitFor` : 기다릴 이벤트를 표시한 마스크
- `xClearOnExit` : *Blocked* 상태에서 벗어날 때 이벤트 비트를 `0`으로 만들지 여부
- `xWaitForAllBits` : 이벤트 마스크에 있는 이벤트들 중 하나라도 발생하길 기다릴지 또는 모든 이벤트가 발생하길 기다릴지 여부
- `xTicksToWait` : 기다리는 이벤트가 발생될 때까지 *Blocked* 상태에서 기다릴 대기 시간

`uxBitsToWaitFor`와 `xWaitForAllBits`는 태스크가 *Blocked* 상태에서 벗어나게 만드는 **unblock condition**(이하 대기 해제 조건)이라고 부른다. 호출 시점에 이미 대기 해제 조건이 만족되어 있다면 *Blocked* 상태로 가지 않고 이어서 실행된다. 

다음은 대기 해제 조건과 이벤트 그룹의 값에 따라 태스크가 깨어나는지 설명한 표다.


|이벤트 그룹의 값|`uxBitsToWaitFor` 값|`xWaitForAllBits` 값|대기 해제 조건 만족 여부|
|---|---|---|---|
|`0000`|`0101`|`pdFALSE`|아무 이벤트도 발생하지 않았다. 태스크는 *Blocked* 상태에서 깨어나지 못한다.|
|`0100`|`0101`|`pdTRUE`|`xWaitForAllBits`가 `pdTRUE`이므로, 마스크에 표시된 모든 이벤트가 발생해야 태스크가 *Blocked* 상태에서 깨어난다.\n 2번째 이벤트가 발생했지만 대기 해제 조건을 만족하지 못해 여전히 *Blocked* 상태에 있다.|
|`0100`|`0110`|`pdFALSE`|`xWaitForAllBits`가 `pdFALSE`이므로 마스크에 표시된 이벤트 중 아무 이벤트나 발생하면 *Blocked* 상태에서 벗어난다. 2번째 이벤트가 발생했으므로 태스크는 *Blocked* 상태에서 벗어난다.|
|`0100`|`0110`|`pdTRUE`|`pdTRUE`이므로, 1번째 이벤트가 발생하기까지 태스크는 *Blocked* 상태를 유지한다.|

태스크가 대기 해제 조건을 만족하여 *Blocked* 상태에서 벗어날 때 읽은 이벤트들을 지울 수 있다. `xClearOnExit` 인자가 그 행동을 의미한다. `pdTRUE`라면 이벤트 그룹에서 `uxBitsToWaitFor`에 표시된 자리의 값을 0으로 설정한다. 이 처리는 원자적 연산으로, 다른 태스크나 인터럽트가 끼어들지 못한다. `pdFALSE`라면 이벤트 그룹의 값을 바꾸지 않는다.

이 API는 대기 해제 조건을 만족하는 그 순간의 이벤트 그룹의 값을 반환한다. 만약 대기 시간을 초과하여 더 이상 기다리지 않고 반환된다면, 대기 시간을 초과했을 때 이벤트 그룹의 값을 반환한다.

# 이벤트 그룹 정적 생성

```c
EventGroupHandle_t xEventGroupCreateStatic( StaticEventGroup_t * pxEventGroupBuffer );
```

- `pxEventGroupBuffer` : 이벤트 그룹으로 사용할 실제 버퍼

반환값이 `NULL`이라면 API의 인자에 `NULL`을 넣었음을 의미하고, `NULL`이 아니라면 이벤트 그룹 핸들이 반환된다.

```c
BaseType_t xEventGroupGetStaticBuffer( 
    EventGroupHandle_t xEventGroup,
    StaticEventGroup_t ** ppxEventGroupBuffer );
```

- `xEventGroup` : `xEventGroupCreateStatic()`으로 생성된 이벤트 그룹 핸들
- `ppxEventGroupBuffer` : 이벤트 그룹 버퍼의 주소가 담길 더블 포인터

반환값이 `pdTRUE`라면 정적 생성된 버퍼의 주소를 얻은 것이고, `pdFALSE`라면 버퍼의 주소를 얻지 못한 것이다.

# 예시

이 예시에서 이벤트 그룹의 값은 다음 이벤트들과 매핑된다.

- 0번째 비트 : 태스크 1가 발생시키는 이벤트
- 1번째 비트 : 태스크 2가 발생시키는 이벤트
- 2번째 비트 : ISR이 발생시키는 이벤트

```c
// 이벤트 그룹에 사용될 마스크
#define mainFIRST_TASK_BIT ( 1UL << 0UL )
#define mainSECOND_TASK_BIT ( 1UL << 1UL )
#define mainISR_BIT ( 1UL << 2UL )

// 비트 설정 태스크
static void vEventBitSettingTask(void* pvParameters) {
    const TickType_t xDelay200ms = pdMS_TO_TICKS( 200UL ), xDontBlock = 0;
    for( ;; ) {
        vTaskDelay( xDelay200ms );
        printf( "이벤트 그룹 표시 태스크 : 0번째 비트를 1로 설정\n" );
        xEventGroupSetBits( xEventGroup, mainFIRST_TASK_BIT );
        vTaskDelay( xDelay200ms );
        printf( "이벤트 그룹 표시 태스크 : 1번째 비트를 1로 설정\n" );
        xEventGroupSetBits( xEventGroup, mainSECOND_TASK_BIT );
    }
}
```

```c
// 비트 설정 ISR
static uint32_t ulEventBitSettingISR( void ) {
    static const char *pcString = "ISR : 2번째 비트를 1로 설정\n";
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;
    
    // pcString 출력 요청 전송
    xTimerPendFunctionCallFromISR( daemonTask,
        ( void * ) pcString,
        0,
        &xHigherPriorityTaskWoken );
    // 이벤트 그룹의 2번째 비트를 1로 설정 요청 전송
    xEventGroupSetBitsFromISR( xEventGroup,
        mainISR_BIT,
        &xHigherPriorityTaskWoken );
    
    // 위 두 작업을 진행하면서 얻은 컨텍스트 스위칭에 대한 정보를 전달
    portYIELD_FROM_ISR( xHigherPriorityTaskWoken );
}
```

```c
// 비트 확인 태스크
static void vEventBitReadingTask( void *pvParameters ) {
    EventBits_t xEventGroupValue;
    const EventBits_t xBitsToWaitFor = ( mainFIRST_TASK_BIT |
        mainSECOND_TASK_BIT |
        mainISR_BIT );

    for (;;) {
        xEventGroupValue = xEventGroupWaitBits(
            xEventGroup,
            xBitsToWaitFor,
            pdTRUE,
            pdFALSE,
            portMAX_DELAY );

        if (( xEventGroupValue & mainFIRST_TASK_BIT ) != 0 ) {
            printf( "비트 확인 태스크 : 이벤트 그룹의 0번째 비트가 1임.\n" );
        }
        if (( xEventGroupValue & mainSECOND_TASK_BIT ) != 0 ) {
            printf( "비트 확인 태스크 : 이벤트 그룹의 1번째 비트가 1임.\n" );
        }
        if (( xEventGroupValue & mainISR_BIT ) != 0 ) {
            printf( "비트 확인 태스크 : 이벤트 그룹의 2번째 비트가 1임.\n" );
        }
    }
}
```

```c
int main( void )
{
    xEventGroup = xEventGroupCreate();
    
    xTaskCreate( vEventBitSettingTask, "비트 설정 태스크", 1000, NULL, 1, NULL );
    xTaskCreate( vEventBitReadingTask, "비트 확인 태스크", 1000, NULL, 2, NULL );
    xTaskCreate( vInterruptGenerator, "인터럽트 생성 태스크", 1000, NULL, 3, NULL ); // 이 태스크 구현은 생략...
    vPortSetInterruptHandler( mainINTERRUPT_NUMBER, ulEventBitSettingISR ); // 인터럽트 발생을 처리할 ISR 할당은 port별로 다르므로 이 함수 구현도 생략...

    vTaskStartScheduler();
    for( ;; );

    return 0;
}
```

코드가 길지만, 비트 설정 태스크와 인터럽트 생성 태스크가 주기적으로 이벤트 그룹에 값을 설정하고, 비트 확인 태스크가 대기 해제 조건에 따라 *Blocked* 상태에서 벗어난 후 이벤트 그룹에 따라 다르게 출력하는 예제다.

대기 해제 조건은 0, 1, 2번째 비트들 중 아무거나 `1`로 설정되는 것이다. `xClearOnExit`이 `pdTRUE`이므로 *Blocked* 상태에서 벗어날 때 해당 이벤트 비트를 `0`으로 설정한다.

실행 결과는 다음과 같다.

```txt
이벤트 그룹 표시 태스크 : 0번째 비트를 1로 설정
비트 확인 태스크 : 이벤트 그룹의 0번째 비트가 1임.
이벤트 그룹 표시 태스크 : 1번째 비트를 1로 설정
비트 확인 태스크 : 이벤트 그룹의 1번째 비트가 1임.
ISR : 2번째 비트를 1로 설정
비트 확인 태스크 : 이벤트 그룹의 2번째 비트가 1임.
이벤트 그룹 표시 태스크 : 0번째 비트를 1로 설정
비트 확인 태스크 : 이벤트 그룹의 0번째 비트가 1임.
이벤트 그룹 표시 태스크 : 1번째 비트를 1로 설정
비트 확인 태스크 : 이벤트 그룹의 1번째 비트가 1임.
ISR : 2번째 비트를 1로 설정
비트 확인 태스크 : 이벤트 그룹의 2번째 비트가 1임.
...
```

만약 `xWaitForAllBits`가 `pdTRUE`라면 다음과 같이 실행된다.

```txt
이벤트 그룹 표시 태스크 : 0번째 비트를 1로 설정
이벤트 그룹 표시 태스크 : 1번째 비트를 1로 설정
ISR : 2번째 비트를 1로 설정
비트 확인 태스크 : 이벤트 그룹의 0번째 비트가 1임.
비트 확인 태스크 : 이벤트 그룹의 1번째 비트가 1임.
비트 확인 태스크 : 이벤트 그룹의 2번째 비트가 1임.
이벤트 그룹 표시 태스크 : 0번째 비트를 1로 설정
이벤트 그룹 표시 태스크 : 1번째 비트를 1로 설정
ISR : 2번째 비트를 1로 설정
비트 확인 태스크 : 이벤트 그룹의 0번째 비트가 1임.
비트 확인 태스크 : 이벤트 그룹의 1번째 비트가 1임.
비트 확인 태스크 : 이벤트 그룹의 2번째 비트가 1임.
...
```

# 태스크 간 동기화

태스크 A가 이벤트를 받은 후 다른 태스크 B, C, D에게 작업을 시키는 구조를 생각해보자. 추가로, 태스크 B, C, D가 모두 작업을 끝내야만 다시 작업을 시킬 수 있다고 제약을 두자. 이런 경우에 각 태스크들은 다른 태스크들과 동기화되어야 한다. 

간단한 예시로, 소켓 통신을 수행하기 위해 Tx, Rx 태스크가 있다고 하자. Tx 태스크는 패킷을 전송한 후 Rx 태스크가 모든 데이터를 수신한 다음에야 다음 패킷을 전송할 수 있다. 이벤트 그룹은 이런 상황에서 동기화를 위해 쓸 수 있다.

시나리오는 다음과 같다.

- 동기화를 필요로 하는 태스크는 각자 고유한 이벤트 비트를 이벤트 그룹에 할당해야한다.
- 각 태스크는 동기화 지점에 도달했을 때 이벤트 비트에 표시해야한다.
- 이벤트 비트를 설정한 후에는 대기 해제 조건에 따라 *Blocked* 상태에서 기다려야 한다. 이 때 대기 해제 조건은 다른 태스크들이 모두 이벤트 비트를 1로 설정하는 것이다.

그런데 이런 시나리오에서는 `xEventGroupSetBits()`와 `xEventGroupWaitBits()`를 쓸 수 없는데, 비트를 설정하는 것과 비트를 확인하는 것은 서로 다른 연산이기 때문이다. 다시 말해, 이벤트 비트를 설정하고 대기 해제 조건을 확인하려 했으나 다른 태스크가 중간에 선점할 수 있기 때문이다.

태스크 A, B, C가 이벤트 그룹을 사용해 동기화를 한다고 가정해보자.

1. 태스크 A, B는 동기화 지점에 도착하여 각자 이벤트 비트를 1로 설정하고 대기 해제 조건에 따라 *Blocked* 상태가 되었다.
2. 태스크 C가 동기화 지점에 도착해 자신의 이벤트 비트를 1로 설정한다. 태스크 C가 대기 해제 조건을 확인하기 전에, 태스크 A, B가 대기 해제 조건에 의해서 *Blocked* 상태를 벗어나고 세 태스크의 이벤트 비트를 모두 0으로 초기화한다. 
3. 태스크 C는 대기 해제 조건이 만족되지 않아서 무한정 기다리게 된다.

`xEventGroupSetBits()`와 `xEventGroupWaitBits()`가 연속적으로 실행될 수 있게 하려면 `xEventGroupSync()`를 써야 한다.

# 이벤트 그룹 동기화

`xEventGroupSync()`는 이벤트 그룹에 비트를 설정하고, 대기 해제 조건에 따라 태스크를 기다리게 한다. 이 함수는 하나의 명령어처럼 동작하여, 다른 태스크가 중간 상태를 관찰하지 못한다.

```c
EventBits_t xEventGroupSync( 
    EventGroupHandle_t xEventGroup,
    const EventBits_t uxBitsToSet,
    const EventBits_t uxBitsToWaitFor,
    TickType_t xTicksToWait );
```

- `xEventGroup` : 이벤트 그룹 핸들
- `uxBitsToSet` : 설정할 이벤트 비트 마스크
- `uxBitsToWaitFor` : 대기 해제 조건 마스크
- `xTicksToWait` : 대기 해제 조건이 만족되기까지 기다릴 대기 시간

대기 시간동안 대기 해제 조건이 만족되었다면 그 순간의 이벤트 그룹의 값이 반환된다. 대기 시간동안 기다렸음에도 대기 해제 조건이 만족되지 않았다면, 대기 시간이 만료된 순간의 이벤트 그룹의 값이 반환된다.

# 동기화 예시

세 개의 태스크가 서로 동기화되어야 한다고 가정한다. 각 태스크는 동기화 지점에 도착해서 다른 태스크가 도착했는지 이벤트 그룹을 통해 확인한다. 여기서 `xEventGroupSync()`를 사용한다.

```c
static void vSyncingTask( void *pvParameters )
{
    const TickType_t xMaxDelay = pdMS_TO_TICKS( 4000UL );
    const TickType_t xMinDelay = pdMS_TO_TICKS( 200UL );
    TickType_t xDelayTime;
    EventBits_t uxThisTasksSyncBit;
    const EventBits_t uxAllSyncBits = ( mainFIRST_TASK_BIT |
        mainSECOND_TASK_BIT |
        mainTHIRD_TASK_BIT );

    uxThisTasksSyncBit = ( EventBits_t ) pvParameters;

    for( ;; )
    {
        xDelayTime = ( rand() % xMaxDelay ) + xMinDelay;
        vTaskDelay( xDelayTime );

        vPrintTwoStrings( pcTaskGetTaskName( NULL ), ">>> 동기화 지점 도착 >>>" );
        
        xEventGroupSync(
            xEventGroup,
            uxThisTasksSyncBit,
            uxAllSyncBits,
            portMAX_DELAY );

        vPrintTwoStrings( pcTaskGetTaskName( NULL ), "<<< 동기화 지점 탈출 <<<" );
    }
}
```

```c
#define mainFIRST_TASK_BIT ( 1UL << 0UL ) 
#define mainSECOND_TASK_BIT ( 1UL << 1UL )
#define mainTHIRD_TASK_BIT ( 1UL << 2UL )

EventGroupHandle_t xEventGroup;

int main( void )
{
    xEventGroup = xEventGroupCreate();

    xTaskCreate( vSyncingTask, "태스크 1", 1000, mainFIRST_TASK_BIT, 1, NULL );
    xTaskCreate( vSyncingTask, "태스크 2", 1000, mainSECOND_TASK_BIT, 1, NULL );
    xTaskCreate( vSyncingTask, "태스크 3", 1000, mainTHIRD_TASK_BIT, 1, NULL );

    vTaskStartScheduler();
    for( ;; );
    return 0;
}
```

실행 결과는 다음과 같다.

```txt
태스크 1 : >>> 동기화 지점 도착 >>> 
태스크 3 : >>> 동기화 지점 도착 >>> 
태스크 2 : >>> 동기화 지점 도착 >>> 
태스크 2 : <<< 동기화 지점 탈출 <<<
태스크 1 : <<< 동기화 지점 탈출 <<<
태스크 3 : <<< 동기화 지점 탈출 <<<
태스크 2 : >>> 동기화 지점 도착 >>> 
태스크 3 : >>> 동기화 지점 도착 >>> 
태스크 1 : >>> 동기화 지점 도착 >>> 
태스크 1 : <<< 동기화 지점 탈출 <<<
태스크 2 : <<< 동기화 지점 탈출 <<<
태스크 3 : <<< 동기화 지점 탈출 <<<
...
```

마지막으로 동기화 지점에 도착한 태스크는 제일 먼저 동기화 지점을 벗어난다. 이는 `xEventGroupSync()`가 원자적 연산이기 때문에 이벤트 비트를 1로 설정하고 제일 먼저 대기 해제 조건을 확인하기 때문이다.