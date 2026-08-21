---
title: FreeRTOS (2) - 코드 스타일 분석
date: "2026-06-24"
updated: "2026-06-24"
tags: ["freertos"]
category:
  name: "FreeRTOS"
series:
  name: "FreeRTOS"
  order: 2
---


> [FreeRTOS Documentation - FreeRTOS™](https://www.freertos.org/Documentation/02-Kernel/07-Books-and-manual/01-RTOS_book)
> 
> 이 문서에서 제공하는 PDF를 읽고 정리한 글입니다.
> 
> 생성 일 : 2026-06-24
> 최종 수정일 : 2026-06-24

---

FreeRTOS에는 RTOS를 위한 타입, 함수 등이 있다. 이들의 종류, 명명법을 알면 이름만 봐도 무엇을 하는 함수인지 이해할 수 있다.

# 타입

- `TickType_t`

  틱 인터럽트가 발생한 횟수를 *tick count*라고 한다. 두 틱 인터럽트 사이의 시간을 *tick period*라고 한다.

  `TickType_t`는 *tick count*를 저장하고 시간을 나타내기 위한 타입이다.

  `unsigned` 형식으로 정의되며 비트 수는 16, 32, 64가 될 수 있지만 아키텍쳐에 따라 다르다. 이 값은 `configTICK_TYPE_WIDTH_IN_BITS` 매크로를 확인해봄으로 알 수 있다. (실제 프로젝트에서는 못찾겠는데 확인바람)

- `BaseType_t`

  아키텍처에 따른 가장 효율적으로 사용 가능한 단위를 의미하는 타입이다. 32비트 명령어 아키텍처면 32비트이고, 64비트 명령어 아키텍처면 64비트이다. 

  반환값에도 사용되며, boolean 변수에도 사용된다.

# 명명법

## 변수

- `c`는 `char`
- `s`는 `int16_t(short)`
- `l`은 `int32_t(long)`
- `x`는 `BaseType_t` 또는 구조체, 핸들 등 기본적인 타입이 아닌 타입들을 의미한다.
- `u`가 붙어있다면 unsigned를 의미한다.
- `p`가 붙어있다면 포인터임을 의미한다.

## 함수

접두사가 무엇인지 살펴보면 함수의 반환 타입과 선언 위치를 알 수 있다.

ex) `vTaskPrioritySet()`은 `v` + `Task`이므로 void 반환 타입이고,`tasks.c` 파일 내에 정의되어 있다는걸 알 수 있다.

- `prv`가 붙어있다면 외부로 노출되지 않는 private 함수임을 의미한다.

## 매크로

접두사는 소문자로, 그 외에는 모두 대문자로 작성된다. 접두사를 살펴보면 선언 위치를 알 수 있다.

ex) `portMAX_DELAY`라면, `₩portable.h`나 `portmacro.h`에 있다는걸 알 수 있다.

세마포어는 매크로로 작성된 코드가 엄청 많지만 함수 명명법을 따른다.
