
> [FreeRTOS Documentation - FreeRTOS™](https://www.freertos.org/Documentation/02-Kernel/07-Books-and-manual/01-RTOS_book)
> 
> 이 문서에서 제공하는 PDF를 읽고 정리한 글입니다.
> 
> 생성 일 : 2026-06-24
> 최종 수정일 : 2026-06-24

---

FreeRTOS를 이루는 파일들은 다음과 같다.

```text
FreeRTOS
│
└─Source
 │
 ├─tasks.c         FreeRTOS source file - always required
 ├─list.c          FreeRTOS source file - always required
 ├─queue.c         FreeRTOS source file - nearly always required
 ├─timers.c        FreeRTOS source file - optional
 ├─event_groups.c  FreeRTOS source file – optional
 ├─stream_buffer.c FreeRTOS source file - optional
```

FreeRTOS는 하나의 컴파일러와 CPU 아키텍처에 종속적이지 않고 독립적인 소스코드다. 컴파일러와 아키텍처의 조합을 Port라고 부르는데, FreeRTOS는 여러 Port위에서 동작할 수 있다. 공통 커널 로직을 구현한 소스 코드는 FreeRTOS/Source/`폴더 직하위에 있지만, Port에 종속된 소스 코드는 컴파일러와 아키텍쳐별로 따로 구현되어야 한다. FreeRTOS에서는 이를 파일트리로 구분하여 소스코드를 보관하고 있다.

```text
FreeRTOS
│
└─Source
 │
 └─portable Directory containing all port specific source files
 │
 ├─MemMang Directory containing the alternative heap allocation source
files
 │
 ├─[compiler 1] Directory containing port files specific to compiler 1
 │ │
 │ ├─[architecture 1] Contains files for the compiler 1 architecture 1
port
 │ ├─[architecture 2] Contains files for the compiler 1 architecture 2
port
 │ └─[architecture 3] Contains files for the compiler 1 architecture 3
port
 │
 └─[compiler 2] Directory containing port files specific to compiler 2
 │
 ├─[architecture 1] Contains files for the compiler 2 architecture 1
port
 ├─[architecture 2] Contains files for the compiler 2 architecture 2
port
 └─[etc.]
```

먼저 컴파일러 폴더 안에 여러 아키텍쳐 폴더가 있고, 한 아키텍쳐 폴더안에는 Port에 종속된 코드를 담은 파일들이 여러 개 들어있다.

```text
FreeRTOS
└── Source
    ├── portable
    │   ├── GCC
    │   │   └── ARM_CM4F
    │   │       ├── port.c
    │   │       └── portmacro.h
    │   └── MemMang
    │       └── heap_4.c
    ...
```

STM32CubeMX로 FreeRTOS를 프로젝트에 추가하면 위와 같이 `FreeRTOS/Source/portable/` 하위에 GCC 컴파일러와 ARM_CM4F 아키텍처 폴더가 있는걸 볼 수 있다.

FreeRTOS를 프로젝트에 추가하였지만 사용하기 위해서는 include를 해야하는데, FreeRTOS의 헤더파일들은 `FreeRTOS/Source/include/`에 있다. 여러 파일들이 있지만 `FreeRTOS.h` 하나만 include한다.
