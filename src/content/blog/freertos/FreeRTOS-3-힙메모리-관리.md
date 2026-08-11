---
title: FreeRTOS (3) - 힙 메모리 관리
date: "2026-06-24"
updated: "2026-06-25"
tags: ["freertos"]
category:
  name: "FreeRTOS"
---


> [FreeRTOS Documentation - FreeRTOS™](https://www.freertos.org/Documentation/02-Kernel/07-Books-and-manual/01-RTOS_book)
> 
> 이 문서에서 제공하는 PDF를 읽고 정리한 글입니다.
> 
> 생성 일 : 2026-06-24
> 최종 수정일 : 2026-06-25

---

동적 메모리 할당은 메모리 사용의 설계비용을 줄여주고, 간단하며 총 메모리 사용량(여기서는 RAM footprint라는 용어를 씀)을 줄인다. 정적 메모리 할당은 컴파일 시기에 얼마나 메모리를 쓸지 결정하고, 실행중에 생기는 메모리 파편화 현상을 없앤다. 

FreeRTOS가 정적 혹은 동적 메모리 할당을 사용하는지의 여부는 `configSUPPORT_STATIC_ALLOCATION`, `configSUPPORT_DYNAMIC_ALLOCATION`와 같은 매크로가 정의되어 있는가에 따른다.

# 동적 메모리 할당

C에서는 `malloc()`, `free()`를 쓰지만 이 API들은 임베디드 시스템에게 무겁고 오래 걸리는 연산이다. 

초창기 버전에는 컴파일 타임에 할당된 메모리 풀을 사용했다고 하는데 이제는 쓰지 않는다. 이제는 메모리 할당 정책을 공통 소스 코드에 포함시키지 않고 portable에서 바꿀 수 있게 제공한다. 워낙 임베디드 환경이 다양하기 때문에 자신의 환경에 적합한 정책을 사용할 수 있도록 한다.

동적 메모리 할당을 위해 `malloc()`과 `free()`대신, `pvPortMalloc()`과 `vPortFree()`함수를 쓴다. 이 함수들은 시그니처가 `malloc()`과 `free()`와 완전히 같다. 

FreeRTOS는 `pvPortMalloc()`과 `vPortFree()`를 5가지 방식으로 구현한다. 각각 `heap_1~5.c`로 구현되어 있다.

## `heap_1.c`

작은 임베디드 시스템에서는 RTOS 스케줄러가 시작되기 전에 태스크, 커널 객체들을 생성한다. 이 때 태스크가 필요한 자원들을 모두 할당하고 절대 해제하지 않는 방법이다. 메모리 파편화가 없고, 접근 시간이 예측 가능하다. `pvPortMalloc()`만 구현하고 `vPortFree()`는 구현하지 않는다. 

메모리 할당 방식은 단순하다. `uint8_t`타입의 배열을 힙 메모리로 사용하고, `pvPortMalloc()`요청이 발생할 때마다 앞에서부터 잘라 할당하는 방식이다. 메모리 크기는 `configTOTAL_HEAP_SIZE` 매크로에 의해 정해진다. 프로그램 시작부터 힙 메모리처럼 쓸 배열을 정적 할당하여 사용하기 때문에 메모리 사용량이 높게 잡힌다.

## `heap_2.c`

`heap_4`에 의해 대체된 방식이다. 대체되었지만 남아있는 방식인 이유는 레거시 호환성을 위해서다. 

큰 배열을 힙 메모리로 사용하는건 동일하지만, *Best-Fit* 방식을 사용하여 메모리를 할당해준다. 다시 말해 `heap_1` 방식에서 `vPortFree()`를 구현하고, 메모리 해제로 인해 생긴 파편화된 공간에서 *Best-Fit* 방식을 사용해 메모리를 할당해준다는 말이다. 여전히 큰 배열을 힙 메모리로 사용하기 때문에 메모리 사용량 자체는 많아보인다.

### Best-Fit

메모리 공간이 여러 개일 때, 해당 공간에 메모리를 할당할 경우 남는 공간의 크기가 가장 작은 곳에 할당하는 방식이다.

FreeRTOS에서는 모든 태스크가 사용하는 TCB, 스택의 크기가 동일하게 정해져있다. 따라서 태스크가 사용하는 TCB와 스택이 메모리에서 해제될 때, 다른 태스크가 그 자리에 남는 공간 없이 자신의 TCB와 스택을 올리게 된다.

## `heap_3.c`

기본 라이브러리인 `malloc()`과 `free()`를 사용한다. 링커 옵션에 따라 힙 사이즈가 결정되며, `configTOTAL_HEAP_SIZE`는 사용하지 않게 된다. 

`malloc()`과 `free()`를 thread-safe하게 만들기 위해 FreeRTOS의 메모리 할당, 해제 시 스케줄러를 잠시 멈추게 된다.

## `heap_4.c`

*First-Fit* 방식을 사용한다. `heap_2`와 다르게, 연속한 작은 블럭들을 하나의 큰 블럭으로 합친다. (`heap_2`에서는 작은 블럭들이 연속되어 있더라도 각각 다른 블럭으로 본다.)

### First-Fit

여러 개의 메모리 공간을 처음부터 탐색하여 할당 가능한 첫번째 공간을 찾아 무조건 선택한다.

## `heap_5.c`

`heap_4`와 같은 알고리즘을 사용한다. 그러나 `heap_4`는 여전히 하나의 큰 배열을 힙 메모리로 사용하고 있는데, `heap_5`는 여러 개의 분리된 메모리 공간을 하나의 힙 메모리로 합쳐 사용한다. 메모리 공간이 여러 개인 시스템에서 사용할 수 있는 방식이다. 이 방식에서는 `vPortDefineHeapRegions()`함수를 사용하여 메모리 공간의 주소를 커널에게 알려주어야 하고, 그렇지 않는다면 메모리 할당이 불가능하다.

## 힙 메모리 공간의 주소

`heap_1,2,4`는 모두 배열을 힙 메모리로 사용하는데, 배열의 주소를 지정해줄 수 있다. `configAPPLICATION_ALLOCATED_HEAP`가 정의되어 있다면 `ucHeap`이름을 가진 `uint8_t` 타입의 배열을 할당해야한다.

```c
// gcc 스타일
uint8_t ucHeap[ configTOTAL_HEAP_SIZE ] __attribute__ ( (section( ".my_heap" ) ));
// iar 스타일
uint8_t ucHeap[ configTOTAL_HEAP_SIZE ] @ 0x20000000;
```

## 그 외 유용한 함수들

- `xPortGetFreeHeapSize()`

  힙 내에서 사용 가능한 메모리 공간의 크기를 알려준다. 메모리 파편화에 대한 정보는 없다.

- `xPortGetMinimumEverFreeHeapSize()`

  현재를 기준으로, 시스템이 시작된 이후 할당되지 않았던 메모리 크기의 최소값을 알려준다. 즉, 이 함수가 200을 반환한다면, 지금까지 시스템이 운영되면서 최대로 메모리를 많이 사용했을 때 남은 메모리가 200byte라는 의미다.

- `vPortGetHeapStats(HeapStats_t *)`

  `heap_4`와 `heap_5`만 이 함수를 구현한다. `HeapStats_t`라는 구조체 타입을 요구한다. 

  ```c
  typedef struct xHeapStats
  {
      // 현재 heap에서 free block들의 전체 크기
      size_t xAvailableHeapSpaceInBytes;

      // 현재 heap에서 가장 큰 free block의 크기
      size_t xSizeOfLargestFreeBlockInBytes;
      
      // 현재 heap에서 가장 작은 free block의 크기
      size_t xSizeOfSmallestFreeBlockInBytes;
      
      // 현재 힙에서 할당 가능한 free block의 수
      size_t xNumberOfFreeBlocks;
      
      // 시스템 시작 이후 가장 적게 남았던 free heap의 크기
      size_t xMinimumEverFreeBytesRemaining;
      
      // 시스템 시작 이후 성공한 메모리 할당 횟수
      size_t xNumberOfSuccessfulAllocations;
      
      // 시스템 시작 이후 성공한 메모리 해제 횟수
      size_t xNumberOfSuccessfulFrees;
  } HeapStats_t;
  ```

## 태스크 별 메모리 접근 통계

`vTaskGetInfo()` 함수는 인자로 주어진 `TaskStatus_t` 구조체에 현재 태스크의 메모리 접근 통계에 대한 정보를 담아준다. 이 함수를 통해 정보를 받으려면 `configTRACK_TASK_MEMORY_ALLOCATIONS` 매크로가 `1`이어야 한다.

`TaskStatus_t`는 다음의 정보를 가진다.

- `pvPortMalloc()` 호출 수
- `vPortFree()` 호출 수
- 함수 호출 시점에서 반납하지 않은 힙 메모리 크기
- 시스템 시작 이후 사용했던 가장 큰 힙 메모리 크기

## 메모리 할당 실패 콜백

`pvPortMalloc()`이 실패하면 NULL을 반환한다. 이 때 실행될 콜백을 정의할 수 있는데, `configUSE_MALLOC_FAILED_HOOK` 매크로가 `1`이어야 한다.

개발자가 꼭 정의해야할 콜백의 시그니처는 다음과 같다.

```c
void vApplicationMallocFailedHook( void );
```

메모리 할당 실패 시 바로 시스템이 터질 수 있는데, 상용 시스템은 그러면 안되니 위 콜백을 정의해서 대처할 수 있다.

## 힙 일부를 스택으로 이동

태스크가 읽고 쓰는 스택은 빠르게 접근되어야 하므로 힙 메모리보다 더 속도가 빠른 곳에 두고 싶을 수 있다. `pvPortMallocStack()`, `pvPortFreeStack()` 매크로를 이용해 태스크가 사용하는 스택을 별도 메모리 공간에 할당할 수 있다.

기본적으로는 `pvPortMallocStack()`은 `pvPortMalloc()`을 호출하는 매크로지만, `pvPortMallocFastMemory()`를 호출하는 매크로로 재정의하면 별도 메모리 영역에 할당할 수 있다. 

# 정적 메모리 할당

동적 메모리 할당은 메모리 파편화 및 메모리 결정적이지 않다. 정적 메모리는 메모리 결정적이고 메모리 파편화가 없다는 장점이 있지만, 커널 메모리를 다루는 함수 몇 개를 개발자가 구현하여야 한다는 단점이 있다.

`configSUPPORT_STATIC_ALLOCATION` 매크로가 `1`이면 정적 메모리 할당을 지원한다. 정적 메모리 할당이 지원되면 다음 함수들이 사용 가능하게 된다.

- `xTaskCreateStatic`
- `xEventGroupCreateStatic`
- `xEventGroupGetStaticBuffer`
- `xQueueGenericCreateStatic`
- `xQueueGenericGetStaticBuffers`
- `xQueueCreateMutexStatic` (`configUSE_MUTEXES`이 `1`이어야 함)
- `xQueueCreateCountingSemaphoreStatic`(`configUSE_COUNTING_SEMAPHORES`이 `1`이어야 함)
- `xStreamBufferGenericCreateStatic`
- `xStreamBufferGetStaticBuffers`
- `xTimerCreateStatic`(`configUSE_TIMERS`이 `1`이어야 함)
- `xTimerGetStaticBuffer`(`configUSE_TIMERS`이 `1`이어야 함)

## 커널 내부에서 사용되는 정적 메모리

커널에서는 Idle 태스크와 Timer 태스크가 정적 메모리를 사용한다. 개발자는 이 두 태스크가 사용하는 정적 메모리를 제공해야한다. 정적 메모리를 제공하기 위해서는 다음 함수를 개발자가 직접 구현해야한다.

```c
void vApplicationGetTimerTaskMemory( 
  StaticTask_t **ppxTimerTaskTCBBuffer,
  StackType_t **ppxTimerTaskStackBuffer,
  uint32_t *pulTimerTaskStackSize );

void vApplicationGetIdleTaskMemory( 
  StaticTask_t **ppxIdleTaskTCBBuffer,
  StackType_t **ppxIdleTaskStackBuffer,
  uint32_t *pulIdleTaskStackSize );
```

함수 내부에서 `static` 키워드를 사용해 TCB와 스택 버퍼를 만들어 넘겨주면 된다.
