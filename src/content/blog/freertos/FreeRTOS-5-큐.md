---
title: FreeRTOS (5) - 큐
date: "2026-07-01"
updated: "2026-07-04"
tags: ["freertos"]
category:
  name: "FreeRTOS"
series:
  name: "FreeRTOS"
  order: 5
---


> [FreeRTOS Documentation - FreeRTOS™](https://www.freertos.org/Documentation/02-Kernel/07-Books-and-manual/01-RTOS_book)
> 
> 이 문서에서 제공하는 PDF를 읽고 정리한 글입니다.
> 
> 생성 일 : 2026-07-01
> 최종 수정일 : 2026-07-04

---

# 큐

큐는 태스크가 태스크에게, 태스크가 인터럽트에게, 인터럽트가 태스크에게 통신을 가능하게 해주는 도구?다. FIFO로, 먼저 들어간 원소가 가장 먼저 삭제된다.

큐는 두 가지 방식으로 구현된다.

1. 값 복사 큐

    원본 데이터를 그대로 복사해 큐에 넣는다.

2. 값 참조 큐

    원본 데이터를 그대로 넣지 않고 참조 즉, 포인터만 넣는다.

FreeRTOS는 복사 큐 방식을 선택한다. 그 이유로는 다음과 같다.

- 복사 큐를 쓰더라도, 주소값을 복사해 넣으면 참조 큐와 동일하게 동작한다.
- 스택에 담긴 변수를 큐에 보낼 수 있다. 참조 큐라면 스택에 담긴 변수의 주소를 보내게 되는 셈이므로 나중에 주소 참조 오류가 발생할 수 있다.
- 참조 큐를 사용한다면 어떤 데이터를 우선 스택에 저장한 뒤 그 주소를 보내야 하므로 임시 버퍼 할당이 필요하다. 복사 큐라면 큐 내부에 저장하므로 개발자가 불필요한 버퍼 할당을 하지 않게 된다.
- 큐로 데이터를 전송한 다음 곧바로 재사용하더라도 큐에 보낸 데이터에 영향을 주지 않는다. 참조 큐였다면 송신자가 보낸 후 재사용하는 경우 큐에 보낸 데이터가 변경되어 버린다.
- 복사 큐에서는 큐에 데이터를 보내면 끝이지만 참조 큐에서는 데이터가 가리키는 버퍼를 뒷정리할 당사자가 누군지, 버퍼의 접근을 제한할지 등 여러가지를 결정해야하는 문제가 있다.
- RTOS가 메모리 관리를 담당하므로 굳이 복잡한 메모리 관리를 핦 필요가 없다.(= 레퍼런스 큐를 사용하면 비효율적이다)
- 참조 큐에서는 송신자와 수신자 모두 데이터의 주소에 접근 가능해야한다. 메모리 보호 시스템이 작동중이라면 수신자가 송신자의 버퍼에 접근 권한이 없는 경우 오류가 발생한다.

# 큐 특징

여러 태스크 또는 ISR이 같은 큐에 쓰기를 할 수 있다. 동일하게, 여러 태스크나 ISR이 같은 큐를 읽을 수 있다. 대개 다수의 송신자들이 있는 경우가 많고 다수의 수신자들이 있는 경우는 드물다.

## 읽기 대기 시간

태스크가 큐를 읽으려 할 때 대기 시간을 지정할 수 있다. 대기 시간이란, 큐가 비어있어서 *Blocked* 상태에서 기다리는 시간이다. 다른 태스크나 ISR이 큐에 데이터를 보낸다면 대기하던 태스크는 *Ready* 상태가 된다. 만약 지정된 시간동안 큐에 데이터가 들어오지 않으면, 자동으로 태스크는 *Ready* 상태가 된다.

다수의 수신자가 큐에 데이터가 들어오길 기다린다면, 한 수신자만 깨어나고 나머지 수신자들은 계속 기다리게 된다. 수신자들 사이에서도 제일 먼저 수신하는 태스크는 우선순위가 가장 높은 태스크다. 만약 수신자들이 모두 우선순위가 같은 태스크라면, 기다린 시간이 가장 오래된 태스크가 먼저 수신하게 된다.

## 쓰기 대기 시간

읽기 작업에서 대기 시간을 갖던 것과 동일하게, 쓰기 작업에서도 대기 시간을 가질 수 있다. 큐가 꽉 차있어서 *Blocked* 상태에서 잠시 기다리는 시간을 말한다. 

읽기 대기 시간에서 다수의 수신자가 기다리던 것과 마찬가지로, 다수의 송신자가 큐에 자리가 생기길 기다릴 때 큐에 가장 먼저 데이터를 보내는 송신자는 우선순위가 가장 높은 태스크다. 동일한 우선순위의 태스크들이 큐에 송신하기 위해 대기한다면 가장 오래 기다린 태스크가 제일 먼저 송신하게 된다.

# 큐 생성

큐를 생성하는 API는 `xQueueCreate()`, `xQueueCreateStatic()` 두 가지이다. 큐 생성에는 두 개의 메모리 블록이 필요한데, 하나는 큐에 대한 정보를 저장할 공간이고 다른 하나는 큐 버퍼이다. `xQueueCreate()`은 두 공간을 힙에 생성하는 대신 `xQueueCreateStatic()`은 이미 할당된 두 공간의 주소를 인자로 받는다.

```c
QueueHandle_t xQueueCreate( 
    UBaseType_t uxQueueLength, 
    UBaseType_t uxItemSize );
```

- `uxQueueLength` : 큐에 저장 가능한 원소 수
- `uxItemSize` : 원소의 바이트 크기

반환값이 `NULL`이면 힙 공간이 부족해서 할당이 안됐다는 말이다. 그렇지 않으면 큐 핸들이 반환된다.

# 큐 삽입(=쓰기)

FreeRTOS의 큐는 앞뒤에 모두 삽입이 가능하다.

```c
BaseType_t xQueueSendToFront( 
    QueueHandle_t xQueue,
    const void * pvItemToQueue,
    TickType_t xTicksToWait );
BaseType_t xQueueSendToBack( 
    QueueHandle_t xQueue,
    const void * pvItemToQueue,
    TickType_t xTicksToWait );
```

> `xQueueSend()`함수는 `xQueueSendToBack()`함수를 호출한다.

- `xQueue` : 큐 핸들
- `pvItemToQueue` : 삽입할 데이터의 주소
- `xTicksToWait` : 삽입에 필요한 대기 시간

대기 시간은 ms단위가 아니라 틱 단위이므로 `pdMS_TO_TICKS()` 매크로를 사용해야한다. 대기 시간을 무한히 설정하고 싶다면 `portMAX_DELAY`를 인자로 넣어주면 된다. 단, `INCLUDE_vTaskSuspend`가 `1`로 정의되어 있어야 한다.

반환값이 `pdPASS`라면 삽입에 성공한 것이다. `errQUEUE_FULL`(=`pdFAIL`)이면 큐에 데이터가 꽉차서 대기 시간 동안 기다렸음에도 못썼다는 말이다.

> 위 함수들을 절대 ISR에서 호출해선 안된다. 대신 `xQueueSendFromISR()`, `xQueueSendFrontFromISR()`, `xQueueSendBackFromISR()` 함수를 사용해야한다.

# 큐 삭제(=읽기)

삽입을 할 땐 앞뒤에 삽입이 가능했지만 삭제는 무조건 앞에서만 가능하다.

```c
BaseType_t xQueueReceive( 
    QueueHandle_t xQueue,
    void * const pvBuffer,
    TickType_t xTicksToWait );
```

- `xQueue` : 큐 핸들
- `pvBuffer` : 큐에서 값을 읽고 저장할 버퍼
- `xTicksToWait` : 삭제에 필요한 대기 시간

반환값이 `pdPASS`라면 삭제에 성공하고 pvBuffer에 데이터가 담겨진다. 반대로 `errQUEUE_EMPTY`(=`pdFAIL`)라면 큐에 데이터가 없어서 대기 시간 동안 기다렸지만 데이터를 꺼내질 못했다는 말이다.

> 위 함수도 역시 ISR에서는 사용하면 안되고, `xQueueReceiveFromISR()` 함수를 사용하여야 한다.

# 큐 크기 조회

`uxQueueMessagesWaiting()`은 큐 안에 들어있는 메세지 수를 반환한다.

```c
UBaseType_t uxQueueMessagesWaiting( QueueHandle_t xQueue );
```

# 여러 태스크가 보내는 메세지들

![여러 태스크가 보내는 메세지](<./assets/여러 태스크가 보내는 메세지.png>)

사진과 같이 여러 태스크가 컨트롤러에게 이벤트 메세지를 보내야한다면 이벤트 구조체를 정의하고 그 이벤트 구조체를 담는 큐를 둔 다음, 다른 태스크에서 이벤트 타입과 전송할 값들을 담아 큐에 전송하면 된다. 수신측에서는 메세지에 부여된 타입을 읽어 어디에서 보냈는지 확인하면 된다. 간단한 예로, TCP/IP 프로토콜을 처리할 때 여러 송신자로부터 전달된 다양한 메세지를 처리해야한다. 이럴 때 메세지 타입을 정의하고 서로 그 타입에 맞춰 메세지를 보내고 읽으면 된다.

다수의 송신 태스크가 하나의 수신 태스크에게 메세지를 보낼 때 발생하는 두 가지 예시가 있다.

## 예시 1

수신 태스크의 우선순위가 가장 높고, 송신 태스크 1, 2의 우선순위가 같다고 할 때 송신 태스크의 코드, 수신 태스크의 코드가 다음과 같다고 하자.

```c
void vSender() {
    // 우선순위 = 1
    // 큐 핸들 = q_handle
    // 보낼 데이터 = value, 송신 태스크 1은 100, 송신 태스크 2는 200
    for (;;) {
        xQueueSend(q_handle, &value, 0);
    }
}
```
```c
void vReceiver() {
    // 우선순위 = 2
    // 큐 핸들 = q_handle
    int32_t buffer = NULL;
    for (;;) {
        xQueueReceive(q_handle, &buffer, pdMS_TO_TICKS(100));
        print_buffer(buffer);
    }
}
```

위 태스크들이 실행되면 실행 결과는 다음과 같다.

![다수의 송신자와 하나의 수신자의 스케줄링](<./assets/다수의 송신자와 하나의 수신자의 스케줄링.png>)

모든 태스크가 *Ready* 상태이므로 우선순위가 가장 높은 수신 태스크가 실행된다. 하지만 큐가 비어있어서 *Blocked* 상태가 된다. 그 다음으로 우선순위가 높은 송신자 1, 2 중 2가 실행된다.

송신 태스크 2는 큐에 데이터를 넣는데, 넣자마자 큐에 데이터가 차길 기다리던 수신 태스크가 *Ready* 상태가 되어 수신 태스크가 코어를 선점하게 된다. 그 뒤로 다시 큐에서 데이터를 읽을 때 큐가 비어있으므로 *Blocked* 상태가 된다.

*라운드로빈* 스케줄링에 의해 송신 태스크 1이 실행되는데 역시 큐에 데이터를 넣자마자 바로 수신 태스크 1이 *Ready* 상태가 되어 다시 선점한다. 

이 과정이 반복되므로 큐에서 값을 읽어온 결과는 다음과 같다.

```text
Value: 200
Value: 100
Value: 200
Value: 100
Value: 200
...
```

## 예시 2

이번엔 예시 1과 반대로, 송신 태스크 1, 2의 우선순위가 서로 같지만 수신 태스크보다 높은 경우라면?

```c
void vSender() {
    // 우선순위 = 2
    // 큐 핸들 = q_handle
    // 보낼 데이터 = value, 송신 태스크 1은 100, 송신 태스크 2는 200
    for (;;) {
        xQueueSend(q_handle, &value, 0);
    }
}
```
```c
void vReceiver() {
    // 우선순위 = 1
    // 큐 핸들 = q_handle
    int32_t buffer = NULL;
    for (;;) {
        if (uxQueueMessageWaiting(q_handle) != 3) {
            print_str("Queue isn\'t full.\n");
        }
        xQueueReceive(q_handle, &buffer, pdMS_TO_TICKS(100));
        print_buffer(buffer);
    }
}
```

큐의 사이즈가 3이라고 가정하고 위 코드를 실행한다면 실행 결과는 아래 사진과 같다.

![다수의 송신자와 하나의 수신자의 스케줄링_우선순위역전](<./assets/다수의 송신자와 하나의 수신자의 스케줄링_우선순위역전.png>)

먼저 송신 태스크 1이 가장 높은 우선순위이므로 실행된다. 송신 태스크 1은 틱 주기 동안 실행되면서 큐에 데이터를 쓰게 되는데, 큐의 사이즈가 3이므로 3개를 넣고 다음 쓰기 작업 시 큐가 꽉차있으므로 t2 시점부터 *Blocked* 상태로 바뀐다. 

그 다음으로는 송신 태스크 2가 가장 높은 우선순위이므로 실행되는데, 큐가 여전히 꽉차있으므로  t3 시점에 *Blocked* 상태로 바뀐다. 

그 다음으로 높은 우선순위가 수신 태스크이므로, 수신 태스크가 드디어 큐에서 데이터를 읽는다. 데이터 하나를 꺼내는 t4 시점에 큐에 자리가 하나 비게 된다. 이 때 **큐에 데이터를 쓸 자리가 생기길 기다리는 태스크 중 가장 오래 기다린 송신자 1이 *Ready* 상태가 된다.**. 송신 태스크 1의 우선순위가 수신 태스크의 우선순위보다 높으므로 선점하게 된다. 송신 태스크1은 큐에 데이터를 넣고 다시 쓰려고 했지만 큐가 꽉 찼으므로 t5 시점에 *Blocked* 상태가 된다. 

송신 태스크 2는 여전히 *Blocked* 상태이므로 실행 가능한 태스크인 수신 태스크가 실행된다. 이전과 마찬가지로 큐에서 데이터를 꺼내자마자 t6 시점에 **큐에 데이터를 쓸 자리가 생기길 기다리는 태스크 중 가장 오래 기다린 태스크가 *Blocked* 상태에서 벗어난다.** 송신 태스크 2가 *Ready*상태가 되며 수신 태스크를 선점하게 된다. 송신 태스크 2는 큐에 데이터를 쓰고, 큐가 꽉찼으므로 다시 *Blocked* 상태가 된다.

위 과정이 계속 반복되면서 출력 결과는 다음과 같다.

```text
100
100
100
100
200
100
200
...
```

수신 태스크에는 큐에 자리가 있는지 검사하는 코드가 있다. 현재 송신 태스크의 우선순위가 수신 태스크의 우선순위보다 높으므로 항상 큐에 데이터가 꽉차있고 송신 태스크들이 *Blocked* 상태가 되어야 수신 태스크가 실행되기 때문에 큐에 자리가 있다는 출력은 발생하지 않는다.

# 큐 세트

다른 태스크로부터 메세지를 받아야 할 때 크기가 다르고 의미가 달라도 하나의 메세지 타입을 정의하고 그러한 메세지 타입만 받는 큐를 사용하는 것이 가능했다. 하지만 다른 사람의 코드에 정의된 메세지를 받아야 하는 경우 앞서 정의한 메세지 타입과 다르기 때문에 한 개의 큐로는 처리할 수 없다. 이런 경우에 **큐 세트**가 사용된다.

큐 세트 역시 큐로 구현되어 있다. 단, 데이터를 담는 큐가 아니라 큐 핸들을 담는 큐다. 큐 세트에 큐 핸들이 담겨있다면 해당 핸들이 가리키는 큐에 데이터가 담겨있다는 뜻이다. 구조가 이러하므로, 하나의 큐로 모든 메세지를 수신하는 것보다 효율이 떨어지고 설계가 복잡해진다. 그러므로 큐 세트을 사용하지 않고서는 문제가 해결되지 않을 때에만 선택해야한다. 

큐 세트은 `configUSE_QUEUE_SETS` 매크로를 `1`로 정의해야 사용할 수 있다.

# 큐 세트 생성

큐 세트은 일반 큐와 다르게 정적으로 생성하는 API가 구현되어 있지 않다.(아마 `xQueueCreateSetStatic()`을 의미하는 듯) 이론적으로는 큐 세트 역시 큐이므로, `xQueueCreateStatic()` 함수를 적절히 호출하여 큐 세트를 생성할 수도 있다.

어쨌든 큐 세트를 생성하는 함수는 다음과 같다.

```c
QueueSetHandle_t xQueueCreateSet( const UBaseType_t uxEventQueueLength);
```

- `uxEventQueueLength` : 한 번에 큐 세트에 저장 가능한 원소 수(큐 핸들 수)

    이 값은 큐 세트에 연결된 모든 큐의 길이를 합한 값이어야 한다. 3개의 큐가 있고 모두 길이가 5라면, 3x5이므로 이 값을 15로 설정해야한다. 그렇지 않다면, 큐 세트에 속하는 큐가 메세지를 수신했는데도 큐 세트의 길이가 짧아서 큐 세트에 큐 핸들이 담기지 않는다. 그러면 큐가 메세지를 받았는지 모르는 셈이 된다. 그러므로 모든 큐가 꽉차기 전까지 메세지를 수신했는지 알기 위해서, 큐 세트의 길이를 큐 세트에 속한 모든 큐의 길이를 합한 값으로 설정해야한다.

반환값이 NULL이라면 메모리 부족으로 생성되지 않은 것이다. 생성에 성공했다면 큐 세트의 핸들이 반환된다.

# 큐 세트에 큐 삽입

```c
BaseType_t xQueueAddToSet( 
    QueueSetMemberHandle_t xQueueOrSemaphore,
    QueueSetHandle_t xQueueSet );
```

- `xQueueOrSemaphore` : 큐 세트에 추가할 큐 또는 세마포어

    큐 세트는 큐 뿐만 아니라 세마포어도 추가할 수 있다. 이럴 경우 큐 세트의 길이를 정할 때 세마포어의 카운팅 수를 포함해야 한다. 큐 세트에서는 큐와 세마포어를 모두 `QueueSetMemberHandle_t`라는 타입으로 관리한다.

- `xQueueSet` : 큐 세트  핸들

반환값이 `pdPASS`라면 큐 세트에 추가가 된 것이고, `pdFAIL`이면 추가에 실패한 것이다. 추가가 가능한 상황은 큐가 비어있거나, 세마포어의 카운트가 0일 때에 가능하다.

# 큐 세트 읽기

큐 세트에 포함된 큐 또는 세마포어가 데이터를 수신하면, 수신한 큐 또는 세마포어의 핸들이 큐 세트에 추가된다. 태스크는 큐 세트에 추가된 핸들을 읽을 때 `xQueueSelectFromSet()` 함수를 사용해야하고 시그니처는 아래와 같다. 이 함수는 **큐 세트에서 핸들을 읽어올 뿐, 데이터를 읽는게 아니다.** 그러므로 실제 메세지를 확인하려면 읽어온 핸들을 통해 큐나 세마포어에 직접 접근해 데이터를 읽어야 한다.

```c
QueueSetMemberHandle_t xQueueSelectFromSet( 
    QueueSetHandle_t xQueueSet,
    const TickType_t xTicksToWait );
```

- `xQueueSet` : 큐 세트 핸들
- `xTicksToWait` : 큐 세트 읽기 대기 시간

    `xTicksToWait`는 큐에서 데이터를 읽거나 쓸 때 사용했던 대기 시간과 동일한 개념이다.

반환값이 `NULL`이 아니면 반환값으로 얻은 핸들이 데이터를 가지고 있다는 의미다. 반환값이 `NULL`이면 큐 세트에서 데이터를 읽지 못한 것이다. 이 함수를 호출한 태스크가 대기 시간 동안에는 *Blocked* 상태로 전환되었는데, 대기 시간동안 다른 태스크나 인터럽트가 큐에 메세지를 쓰지 않아서 다시 *Ready* 상태로 복귀했다는 말이다.

## 예시 1

```c
// sender.c
void vSender1() {
    // q_handle1 = 큐1 핸들
    // data = 100
    for(;;) {
        xQueueSend(q_handle1, &data, 0);
    }
}

void vSender2() {
    // q_handle2 = 큐2 핸들
    // data = 200
    for(;;) {
        xQueueSend(q_handle2, &data, 0);
    }
}
```

```c
// receiver.c
void vReceiver() {
    // qset_handle = 큐 세트 핸들
    // data = 버퍼
    for (;;) {
        q_handle = (QueueHandle_t) xQueueSelectFromSet(qset_handle, portMAX_DELAY);
        xQueueReceive(q_handle, &data, 0);
        print_value(data);
    }
}
```

```c
// main.c
int main() {
    q_handle1 = xQueueCreate(1, sizeof(int));
    q_handle2 = xQueueCreate(1, sizeof(int));
    qset_handle = xQueueCreateSet(1 * 2);
    xQueueAddToSet(qset_handle, q_handle1);
    xQueueAddToSet(qset_handle, q_handle2);
    xTaskCreate(vSender1, "Sender1", 1000, NULL, 1, NULL);
    xTaskCreate(vSender2, "Sender2", 1000, NULL, 1, NULL);
    xTaskCreate(vReceiver, "Receiver", 1000, NULL, 2, NULL);
}
```

송신 태스크 1과 2가 각각 다른 큐에 100, 200의 데이터를 송신한다. 수신 태스크에서는 두 큐가 추가된 큐 세트를 통해 데이터를 수신한다. 수신 태스크의 우선순위가 제일 높으므로, 수신 태스크가 가장 먼저 실행된다.

수신 태스크는 큐 세트를 읽되 `portMAX_DELAY`를 인자로 넣었으므로 *Blocked* 상태로 바뀌며 무한정 대기한다. 수신 태스크 다음으로 우선순위가 높은 송신 태스크들이 실행된다. 

송신 태스크 1이 실행되면 큐 1에 100을 넣게 되고, 그 순간 수신 태스크가 *Ready* 상태로 바뀌며 우선순위에 의해 선점하게 된다. 수신 태스크가 큐 세트에서 핸들을 읽고, 읽은 핸들로부터 데이터를 꺼낸 뒤 다시 *Blocked* 상태가 된다. 

라운드로빈에 의해 다음으로 실행되는건 송신 태스크 2인데, 송신 태스크 1과 마찬가지로 큐 2에 데이터를 쓰는 순간 수신 태스크가 깨어나 큐 세트에서 핸들을 읽고 메세지를 꺼내간다. 따라서 실행 결과는 다음과 같다.

```text
100
200
100
200
...
```

실제로는 큐 세트에 큐만 담기는게 아니라 바이너라 세마포어, 카운팅 세마포터도 담길 수 있으므로, 큐 세트에서 읽어온 핸들이 어떤 핸들인지 검사하는 과정이 필요하다.

# 메일박스

'메일박스'라는 용어를 여러 RTOS에서 사용하고 있지만, 큐나 태스크같이 모든 RTOS에서 같은 의미는 아니다.

- Zephyr에서는 메세지 큐보다 강화된 메세지 교환 도구를 말한다. 
- CMSIS-RTOS에서는 메모리 블록 큐를 말한다.
- VxWorks, QNX에서는 메일박스란 용어를 쓰지 않는다.

FreeRTOS에서는 메일박스를 길이가 1인 큐로 부른다. 

보통 큐는 태스크에서 태스크, 인터럽트에서 태스크로 데이터를 전달하는 용도로 사용한다. 메일박스도 큐이므로 송신자로부터 수신자에게 데이터를 전달하는 역할은 같지만, 데이터가 '통과'하지는 않는다. 다시 말해 수신자가 데이터를 읽지만 꺼내가지는 않는 것이다. 송신자는 메일박스에 데이터를 쓸 때 남아있던 데이터를 덮어씌우게 된다.

# 메일박스 덮어쓰기

```c
BaseType_t xQueueOverwrite( 
    QueueHandle_t xQueue, 
    const void * pvItemToQueue );
```

시그니처는 `xQueueSendToBack()`과 유사하다. 하지만 `xQueueSendToBack()`은 대기 시간 인자를 받는 반면, `xQueueOverwrite()`는 대기 시간 인자가 없다. 큐가 꽉 찰경우 큐에 있는 데이터를 덮어씌워버리는 것이다. 

만약 길이가 2 이상인 큐에 `xQueueOverwrite()`함수를 사용한다면 잘못된 사용이다. `configASSERT` 매크로가 활성화되어 있으면 assert가 트리거된다.

큐가 꽉 차더라도 덮어씌우기 때문에 이 함수는 항상 `pdPASS`를 반환한다.

> 이 함수도 ISR 내부에서 사용한다면 `xQueueOverwriteFromISR()`를 써야한다.

# 메일박스 조회

수신자는 메일박스에서 데이터를 조회만하고 꺼내가지 않는다. 그 때 쓰는 함수는 `xQueuePeek()`로 다음과 같다.

```c
BaseType_t xQueuePeek( 
    QueueHandle_t xQueue,
    void * const pvBuffer,
    TickType_t xTicksToWait );
```

`xQueueReceive()`와 시그니처가 같다.

> 이 함수도 ISR 내부에서 사용한다면 `xQueuePeekFromISR()`를 써야한다.
