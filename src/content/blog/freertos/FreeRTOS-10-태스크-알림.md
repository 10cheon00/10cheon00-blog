
> [FreeRTOS Documentation - FreeRTOS™](https://www.freertos.org/Documentation/02-Kernel/07-Books-and-manual/01-RTOS_book)
> 
> 이 문서에서 제공하는 PDF를 읽고 정리한 글입니다.
> 
> 생성 일 : 2026-07-21
> 최종 수정일 : 2026-07-23

---

# 태스크 알림 (Task Notification)

지금까지는 큐, 세마포어, 이벤트 그룹과 같이 통신 오브젝트를 사용하여 태스크가 다른 태스크와 통신했다. 통신 오브젝트를 사용하기 때문에 한 태스크에서 보내는 메시지가 곧바로 다른 태스크에 전달되지 않고 통신 오브젝트에 저장되기만 한다. 

태스크 알림은 태스크가 다른 태스크와 직접 상호작용할 때 통신 오브젝트 없이도 가능하게 하며 이벤트나 메시지를 다른 태스크에게 보낼 수 있게 한다.

`configUSE_TASK_NOTIFICATIONS` 매크로가 `1`로 설정되어 있어야만 태스크 알림을 사용할 수 있다. 이 매크로가 `1`로 설정되어 있으면 각 태스크는 **태스크 알림 상태**와 **태스크 알림 값**세트를 최소 1개 이상 가지게 된다..

**태스크 알림 상태**는 두 가지다.
- **알림 대기중(Pending)** : 태스크가 알림을 받았고 아직 처리하지 않은 상태
- **대기중인 알림 없음(Not-pending** : 태스크 알림을 읽은 상태

**태스크 알림 값**은 수신했지만 처리하지 않은 태스크 알림 개수 또는 이벤트 데이터

# 장점

두 가지 장점이 있다.

- 태스크 알림을 사용하여 이벤트나 데이터를 전송하는 속도는 큐, 세마포어나 이벤트 그룹을 사용하는 것보다 굉장히 빠르다.
- 태스크 알림을 사용하여 이벤트나 데이터를 전송할 때 사용하는 메모리 크기는 큐, 세마포어나 이벤트 그룹을 사용하는 것보다 작다. 각 태스크마다 `configTASK_NOTIFICATION_ARRAY_ENTRIES * 5`바이트만큼만 차지한다.

# 한계점

비록 다른 통신 오브젝트들보다 메모리도 적게 사용하고 빠르지만, 한계점이 존재한다.

- ISR로 이벤트나 데이터를 보내지 못함

    통신 오브젝트는 ISR로 이벤트나 데이터를 보낼 '수'는 있다. 그러나 태스크 알림은 태스크 또는 ISR에서 태스크로 이벤트나 데이터를 보낼 수만 있고, ISR로 보낼 수는 없다.

- 한 통신 오브젝트를 두고 여러 개의 태스크가 경쟁하지 못함

    통신 오브젝트는 하나의 통신 오브젝트로부터 여러 개의 태스크가 경쟁하여 이벤트를 수신할 수 있지만, 애초에 태스크 알림은 각 태스크의 TCB에 있는 태스크 알림 정보를 변경함으로 태스크에게 알리는 것이기에 하나의 이벤트에 대해 여러 태스크가 경쟁하는 설계를 할 수 없다.

- 이벤트 버퍼링이 불가능함

    큐에는 '길이'가 있으므로 여러 번 메시지를 써도 큐의 길이만큼 버퍼를 쌓아둘 수 있지만, 태스크 알림은 태스크에 있는 TCB 값을 변경하는 것이므로 여러 이벤트를 버퍼링할 수 없다.

- 여러 태스크에 알리지 못함

    이벤트 그룹의 경우에는 이벤트 발생을 여러 태스크에게 알릴 수 있다. 그러나 태스크 알림은 한 번에 한 태스크에게만 알릴 수 있으므로 '한 번에' 여러 태스크에게 이벤트 발생을 알릴 방법은 없다.

- 전송이 가능할 때까지 대기하지 않음

    큐가 꽉차거나, 세마포어의 카운트가 0이하이면 해당 통신 오브젝트를 통해 이벤트를 전송하려는 태스크는 *Blocked* 상태에서 전송 가능할 때 또는 대기 시간이 다 지나갈 때까지 기다린다. 

    그러나 태스크 알림에서는, 수신 태스크가 수신할 수 있을 때까지 기다리지 않는다. 태스크 알림은 버퍼가 아니기 때문에, 기존 이벤트가 아직 처리되지 않았을 때 새로운 이벤트를 전송한다면 이를 덮어쓰거나 보내지 않는 등 송신자가 *Blocked* 상태에 들어가지 않고 처리를 계속한다.

# 태스크 알림 API 개요

태스크 알림은 각 태스크마다 일정 크기만큼 알림을 받는 용도로 메모리를 차지한다. `configTASK_NOTIFICATION_ARRAY_ENTRIES` 매크로에 의해 메모리 크기가 정해지는데, 기본값은 1이지만 이를 더 늘린다면 여러 개의 태스크 알림을 쓸 수 있다. 하나의 태스크 알림을 쓸 때를 기준으로 API가 구현되어 있는데 여러 개의 태스크 알림을 쓴다면 *Indexed*라는 접미사가 붙은 API를 사용하면 된다.

> ISR에서는 태스크 알림을 '보낼 수'는 있지만 받는 API가 없다. 

# 태스크 알림 전송

태스크 핸들을 인자로 받아 해당 태스크에게 알림을 보낸다. 

```c
BaseType_t xTaskNotifyGive( TaskHandle_t xTaskToNotify );
BaseType_t xTaskNotifyGiveIndexed( 
    TaskHandle_t xTaskToNotify, 
    UBaseType_t uxIndexToNotify );
```

- `xTaskToNotify` : 태스크 알림을 받을 수신 태스크의 핸들
- `uxIndexToNotify` : 수신 태스크의 태스크 알림 인덱스

이 API는 내부적으로 `xTaskNotify()`를 호출한다. `xTaskNotify()`가 성공해야 `pdPASS`를 반환한다.

> 대부분의 API들이 위와 동일한 인자를 쓰기 때문에 인자 설명은 생략한다.

> ISR에서는 위 API를 쓰면 안된다. ~FromISR이 붙은 API를 사용해야한다.
> 
> ```c
> void vTaskNotifyGiveFromISR( 
>     TaskHandle_t xTaskToNotify,
>     BaseType_t *pxHigherPriorityTaskWoken );
> ```

# 태스크 알림 수신

태스크 알림이 수신될 때까지 *Blocked* 상태에서 대기 시간동안 기다린다.

```c
uint32_t ulTaskNotifyTake( 
    BaseType_t xClearCountOnExit, 
    TickType_t xTicksToWait );
```

- `xClearCountOnExit` : 태스크 알림을 수신한 후 **태스크 알림 값**을 초기화할지 여부
- `xTicksToWait` : 태스크 알림을 수신할 때까지 *Blocked* 상태에서 대기하는 시간

이 API는 **태스크 알림을 수신하고 나서 알림을 삭제하기 직전의 태스크 알림 상태**를 반환한다. 

반환값이 0이 아니라면 대기 시간동안 기다렸다가 알림을 받았거나, 대기하기 전에 이미 알림이 왔다는 말이다. 반환값이 0이라면 대기 시간동안 기다렸는데도 알림을 받지 못한 것이다.

# 예시

다음 예시는 ISR이 태스크에게 알림을 보내고 태스크가 수신하는 예시 코드다.

```c
const TickType_t xInterruptFrequency = pdMS_TO_TICKS( 500UL );

static void vHandlerTask( void *pvParameters )
{
    const TickType_t xMaxExpectedBlockTime = xInterruptFrequency + pdMS_TO_TICKS( 10 );
    uint32_t ulEventsToProcess;
    for( ;; )
    {
        ulEventsToProcess = ulTaskNotifyTake( pdTRUE, xMaxExpectedBlockTime );
        if( ulEventsToProcess != 0 )
        {
            while( ulEventsToProcess > 0 )
            {
                vPrintString( "핸들러 태스크 - 태스크 알림 수신\n" );
                ulEventsToProcess--;
            }
        }
        else
        {
        }
    }
}
```

```c
// ISR
static uint32_t ulExampleInterruptHandler( void )
{
    BaseType_t xHigherPriorityTaskWoken;
    xHigherPriorityTaskWoken = pdFALSE;
    vTaskNotifyGiveFromISR(
        xHandlerTask,
        &xHigherPriorityTaskWoken );
    portYIELD_FROM_ISR( xHigherPriorityTaskWoken );
}
```

> 기타 main이나 주기 태스크 코드 생략...

위 함수들은 주기 태스크에 의해 실행된 ISR이 핸들러 태스크에게 태스크 알림을 보내는 코드다. 실행 결과는 다음과 같다.

```txt
주기 태스크 - 인터럽트 생성 전
핸들러 태스크 - 태스크 알림 수신
주기 태스크 - 인터럽트 생성 완료

주기 태스크 - 인터럽트 생성 전
핸들러 태스크 - 태스크 알림 수신
주기 태스크 - 인터럽트 생성 완료

주기 태스크 - 인터럽트 생성 전
핸들러 태스크 - 태스크 알림 수신
주기 태스크 - 인터럽트 생성 완료

...
```

![](<./assets/태스크-알림.png>)

주기 태스크가 주기적으로 인터럽트를 발생시키면 곧바로 ISR이 실행되고, ISR은 핸들러 태스크에게 태스크 알림을 전송한다. 핸들러 태스크는 `ulTaskNotifyTake()`에서 대기하고 있다가 태스크 알림을 받으면 깨어난다. 

`ulTaskNotifyTake()`의 `xClearOnExit` 인자값이 `pdTRUE`로 설정되어 있으므로 한 번 태스크 알림을 받고 나서 무조건 **태스크 알림 값**을 `0`으로 설정한다. 만약 `pdFALSE`로 설정되어 있으면 다음과 같이 동작한다.

> 이해를 돕기 위해 ISR 내부에서 태스크 알림을 3번 보낸다고 하자. 

```txt
주기 태스크 - 인터럽트 생성 전
핸들러 태스크 - 태스크 알림 수신
핸들러 태스크 - 태스크 알림 수신
핸들러 태스크 - 태스크 알림 수신
주기 태스크 - 인터럽트 생성 완료

주기 태스크 - 인터럽트 생성 전
핸들러 태스크 - 태스크 알림 수신
핸들러 태스크 - 태스크 알림 수신
핸들러 태스크 - 태스크 알림 수신
주기 태스크 - 인터럽트 생성 완료

주기 태스크 - 인터럽트 생성 전
핸들러 태스크 - 태스크 알림 수신
핸들러 태스크 - 태스크 알림 수신
핸들러 태스크 - 태스크 알림 수신
주기 태스크 - 인터럽트 생성 완료

...
```

ISR에서 핸들러 태스크에게 3번 태스크 알림을 전송하는데, 이 때 핸들러 태스크의 **태스크 알림 값**은 **3**이 된다. 핸들러 태스크는 `ulTaskNotifyTake()`의 `xClearOnExit`인자를 pdFALSE로 설정했으므로, 한 번 태스크 알림을 처리하면 **태스크 알림 값이 1만큼 감소한다.** 그러므로 3번 출력하는 결과를 얻게 된다.

# 태스크 알림 전송 (일반 버전)

`xTaskNotify()`은 `xTaskNotifyGive()`의 일반 버전 API다. 여러가지 방법으로 태스크 상태를 변경할 수 있다.

- 태스크 알림을 전송할 때 **태스크 알림 값**을 1만큼 증가하는 방식
- **태스크 알림 값**을 이벤트 그룹처럼 사용하기 위해 **태스크 알림 값**의 비트를 직접 설정하는 것
- **태스크 알림 값**에 데이터를 쓰고, **태스크 알림 값**을 마치 길이가 1인 큐처럼 사용하는 것(기존 태스크 알림 값에 데이터가 있다면 새로운 데이터 전송에 실패함)
- **태스크 알림 값**에 데이터를 쓰고, 수신하는 쪽에서는 마지막으로 업데이트된 값을 읽도록 하는 것(기존 태스크 알림 값에 데이터가 있어도 새로운 데이터 전송에 성공함)

```c
BaseType_t xTaskNotify( 
    TaskHandle_t xTaskToNotify,
    uint32_t ulValue,
    eNotifyAction eAction );
BaseType_t xTaskNotifyFromISR( 
    TaskHandle_t xTaskToNotify,
    uint32_t ulValue,
    eNotifyAction eAction,
    BaseType_t *pxHigherPriorityTaskWoken );
```

- `eNotifyAction` : 수신하는 태스크에서 취할 동작에 대한 enum값

    |`eNotifyAction`|설명|
    |---|---|
    |`eNoAction`|수신 태스크의 **태스크 상태**를 *Pending*으로 설정한다. `ulValue`인자는 무시한다.|
    |`eSetBits`|수신 태스크의 **태스크 알림 값**에 `ulValue`값을 `|=`연산한다. 마치 경량 이벤트 그룹처럼 동작하도록 만든다.|
    |`eIncrement`|수신 태스크의 **태스크 알림 값**을 증가시킨다. `ulValue` 인자는 무시한다.|
    |`eSetValueWithoutOverwrite`|수신 태스크가 기존 태스크 알림을 처리하기 전이라면, 태스크 알림 전송에 실패하고 `pdFAIL`이 반환된다. 반대로, 수신 태스크가 처리해야할 태스크 알림이 없던 상태라면 태스크 알림 전송에 성공하고, **태스크 알림 값**에 `ulValue`값이 대입된다.|
    |`eSetValueWithOverwrite`|기존 태스크 알림의 존재와 상관없이 항상 수신 태스크의 **태스크 알림 값**에 `ulValue`가 대입된다.|

# 태스크 알림 수신 (일반 버전)

`xTaskNotifyWait()`은 `ulTaskNotifyTake()`의 일반 버전 API다. 여러가지 방법으로 태스크가 알림을 기다릴 수 있다.

```c
BaseType_t xTaskNotifyWait( 
    uint32_t ulBitsToClearOnEntry,
    uint32_t ulBitsToClearOnExit,
    uint32_t *pulNotificationValue,
    TickType_t xTicksToWait );
```

- `ulBitsToClearOnEntry` : 수신 태스크가 처리해야할 태스크 알림이 없다면, 이 인자를 마스크로 사용하여 **태스크 알림 값**의 비트를 `0`으로 만든다. 
    
    예를 들어 **태스크 알림 값이** `0xff`이고, 이 인자의 값이 `0x0f`라면 태스크 알림 처리 후에는 **태스크 알림 값이** `0xf0`이 된다.
- `ulBitsToClearOnExit` : 수신 태스크가 태스크 알림을 수신하여 `xTaskNotifyWait()`을 벗어날 때 이 인자를 마스크로 하여 **태스크 알림 값**의 비트를 `0`으로 설정한다.

    여기서 사라진 비트들은 아래의 `pulNotificationValue`에 저장된다.
- `pulNotificationValue` : `ulBitsToClearOnExit`를 마스크로 사용하여 `0`으로 설정할 때 제거될 비트들이 담겨질 포인터다.
    
    예를 들어 `ulBitsToClearOnExit`가 `0xf0`이고, **태스크 알림 값**의 비트가 `0x3f`라면 이 API의 실행이 끝날 때 **태스크 알림 값**은 `0x0f`이고, `pulNotificationValue`는 `0x30`이 된다.

반환값이 `pdTRUE`라면 대기 시간동안 태스크 알림을 수신한 것이거나 이미 수신해야할 태스크 알림이 있었던 것이다. 반대로 반환값이 `pdFALSE`라면 대기 시간동안 태스크 알림이 수신되지 않은 것이다.

# UART 전송 예시

UART에서 많은 데이터를 전송하는 작업은 완료되기까지 시간이 오래 걸릴 수 있다. 태스크가 폴링 방식을 사용하면 폴링을 하는 동안 CPU을 계속 잡고 있게 되고 이는 성능 저하를 일으킨다.

이를 피하기 위해서, UART 전송을 시작한 태스크는 태스크 알림을 기다리며 *Blocked* 상태가 되도록 한다. UART 전송이 끝났을 때 실행되는 ISR이 해당 태스크에게 알림을 보낸다. 태스크가 기다리는 동안에는 다른 태스크가 실행될 수 있다.

다음 예시는 UART 전송을 요청한 태스크의 핸들을 저장한 뒤, 태스크 알림을 사용하여 전송 완료를 기다리는 코드다.

```c
// UART 전송 함수
BaseType_t xUART_Send( xUART *pxUARTInstance, 
                       uint8_t *pucDataSource, 
                       size_t uxLength )
{ 
    BaseType_t xReturn; 
 
    pxUARTInstance->xTaskToNotify = xTaskGetCurrentTaskHandle(); 
    ulTaskNotifyTake( pdTRUE, 0 ); 
 
    UART_low_level_send( pxUARTInstance, pucDataSource, uxLength ); 
 
    xReturn = ( BaseType_t ) ulTaskNotifyTake( pdTRUE, 
                                               pxUARTInstance->xTxTimeout ); 
 
    return xReturn; 
} 

/*-----------------------------------------------------------*/ 
 
void xUART_TransmitEndISR( xUART *pxUARTInstance )
{ 
    BaseType_t xHigherPriorityTaskWoken = pdFALSE; 
 
    configASSERT( pxUARTInstance->xTaskToNotify != NULL ); 
 
    UART_low_level_interrupt_clear( pxUARTInstance ); 
 
    vTaskNotifyGiveFromISR( pxUARTInstance->xTaskToNotify, 
                            &xHigherPriorityTaskWoken ); 
 
    pxUARTInstance->xTaskToNotify = NULL; 
    portYIELD_FROM_ISR( xHigherPriorityTaskWoken ); 
} 
```

`xUART_Send()`은 먼저 현재 실행 중인 태스크의 핸들을 공통 컨텍스트인 `pxUARTInstance->xTaskToNotify`에 저장한다. 그 후 *UART 전송 완료 알림을 확실히 수신하기 위해 남아 있는 태스크 알림을 제거한 뒤 UART 전송을 시작한다*. 이후 전송 완료 알림이 오거나 대기 시간이 끝날 때까지 *Blocked* 상태로 기다린다.

UART 전송이 완료되면 인터럽트가 발생하고, `xUART_TransmitEndISR()`이 실행된다. ISR은 `xTaskToNotify`에 저장된 태스크에게 알림을 보내고, 컨텍스트 스위칭이 발생할 수 있으므로 `xHigherPriorityTaskWoken`도 사용한다.

만약 UART 전송이 빨리 끝나서 전송 완료 인터럽트가 `ulTaskNotifyTake()` 호출보다 먼저 발생한다고 하더라도 알림은 **태스크 알림 값**에 저장된다. 따라서 이후 호출되는 `ulTaskNotifyTake()`는 대기하지 않고 즉시 반환한다.

바이너리 세마포어를 사용해도 이 코드와 똑같이 작동하도록 구현할 수 있다. 이 예시에서는 한 번에 하나의 태스크만 UART 전송 완료를 기다리기 때문이다. 그러나 여러 대기 태스크를 관리해야한다면 세마포어를 다수 사용하는 것은 복잡성이 올라가고, 세마포어 초기화를 위한 연산과 메모리 공간을 더 사용해야하기 때문에 태스크 알림을 선택하는 것을 고려해봐야 한다.

그렇지만 태스크 알림을 쓸 때 주의할 점이 몇 가지 있다.

- 여러 태스크가 같은 UART를 동시에 사용한다면 뮤텍스로 상호 배제를 구현해야 한다.
- 드라이버가 호출 태스크의 **태스크 알림 상태**와 **태스크 알림 값**을 변경한다는 사실을 문서에 명시해야 한다.
- 태스크와 ISR이 `xTaskToNotify`에 함께 접근하므로, 태스크 핸들을 한 번의 메모리 쓰기로 갱신할 수 없는 프로세서에서는 크리티컬 섹션으로 보호해야 한다.

# ADC 처리 예시

위의 예시는 UART 처리 완료만 전달하면 되는 간단한 이벤트였지만, ADC와 같이 처리 완료뿐만 아니라 처리 결과도 같이 전달해야하는 경우에는 전체 구조는 동일하지만 API 호출이 달라진다.

```c
/* A task that uses an ADC. */
void vADCTask( void *pvParameters )
{
    uint32_t ulADCValue;
    BaseType_t xResult;
    const TickType_t xADCConversionFrequency = pdMS_TO_TICKS( 50 );

    for( ;; )
    {
        xResult = xTaskNotifyWait(
            0,
            0,
            &ulADCValue,
            xADCConversionFrequency * 2 );

        if( xResult == pdPASS )
        {
            ProcessADCResult( ulADCValue );
        }
        else
        {
        }
    }
}

/*-----------------------------------------------------------*/

void ADC_ConversionEndISR( xADC *pxADCInstance )
{
    uint32_t ulConversionResult;
    BaseType_t xHigherPriorityTaskWoken = pdFALSE, xResult;

    ulConversionResult = ADC_low_level_read( pxADCInstance );
    xResult = xTaskNotifyFromISR( xADCTaskToNotify,
        ulConversionResult,
        eSetValueWithoutOverwrite,
        &xHigherPriorityTaskWoken );
    
    configASSERT( xResult == pdPASS );
    portYIELD_FROM_ISR( xHigherPriorityTaskWoken );
}

```

ISR은 `xTaskNotifyFromISR`을 사용하여 알림을 보낼 태스크 핸들을 지정하고, **태스크 알림 값**에 들어갈 값을 ADC 변환값으로 정한다. 그 다음 이전 태스크 알림 값을 덮어쓰지는 않게 설정(`eSetValueWithoutOverwrite`)하고, 컨텍스트 스위칭을 위해 `xHigherPriorityTaskWoken`을 넣는다. 

**태스크 알림 값**에 들어갈 값을 태스크 알림 수 대신 ADC 변환 값으로 설정하면 길이가 1인 큐에 쓰는 것과 동일한 효과를 낼 수 있다. 
