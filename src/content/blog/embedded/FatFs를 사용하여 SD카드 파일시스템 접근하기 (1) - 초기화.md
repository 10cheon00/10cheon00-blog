---
title: FatFs를 사용하여 SD카드 파일시스템 접근하기 (1) - 초기화
date: "2025-07-12T16:50:34+09:00"
tags: ["embedded"]
category:
  name: "Embedded"
---

# 개발 환경

| 대상 | 버전 |
| --- | --- |
| OS | Windows 10 24H2(Desktop), MacOS Sequoia 15.5(24F74)(MacBook M2 Air) |
| STM32CubeIDE | 1.18.1 |
| STM32CubeMX | 6.14.1 |
| STM32CubeProg | 2.19.0 |
| STM32CubeCLT | 1.18.0 |
| 보드 | Nucleo-F103RB |
| 펌웨어 | V24J46M32 |

# 참고한 자료

> 어댑터에 대한 데이터시트를 찾지 못했고, 비슷한 자료에서는 통신 절차에 대한 설명이 없어서 관련 자료를 위주로 참고했습니다.

['4.2.1 Writing Raw Data to an SD Card via SPI'](https://onlinedocs.microchip.com/oxy/GUID-F9FE1ABC-D4DD-4988-87CE-2AFD74DEA334-en-US-3/GUID-48879CB2-9C60-4279-8B98-E17C499B12AF.html)

['How to Use MMC/SDC'](https://elm-chan.org/docs/mmc/mmc_e.html)

[Lecture 12: SPI and SD cards - EE-379 Embedded Systems and Applications | Electrical Engineering Department, University at Buffalo](https://www.dejazzer.com/ee379/lecture_notes/lec12_sd_card.pdf)

['STM32\_SPI\_SDCARD/Old\_STM32F1/Src at master · eziya/STM32\_SPI\_SDCARD'](https://github.com/eziya/STM32_SPI_SDCARD/tree/master/Old_STM32F1/Src)

# SD카드 어댑터

![](<./assets/fatfs-init-01.jpg>)

Nucleo-F103RB보드에는 SD카드를 삽입할 수 있는 포트가 없어서 어댑터를 연결해야한다. 위 사진과 같은 어댑터와 SPI 통신을 하여 SD카드에 읽고 쓰기를 할 수 있다.

> SDIO를 이용한 방법도 있다는데, 내 보드에서는 그런 미들웨어를 찾지 못해서 일단 SPI 통신으로만 진행했다.

# FatFs

FatFs는 FAT 또는 exFAT과 같은 파일시스템을 임베디드 시스템에서 접근할 수 있도록 도와주는 가벼운 소프트웨어 라이브러리다. 플랫폼 독립적이어서 어느 OS에서도 작동한다고 한다.

## 통신 흐름

![](<./assets/fatfs-init-02.jpg>)

먼저 User Application, 즉 MCU 보드는 읽기/쓰기를 실행하기위해 FatFs 모듈의 함수를 호출한다. 호출된 FatFs 모듈은 작성된 코드에 따라 디스크 드라이버를 호출하고, 디스크 드라이버는 SPI 또는 SDIO나 ATA를 통해 어댑터와 통신한다.

그래서 실제로 작성해야하는 부분은 FatFs가 호출하는 디스크 드라이버이다. FatFs 모듈은 CubeMX가 자동으로 생성해준다.

# CubeMX 설정

![](<./assets/fatfs-init-03.png>)

통신용 SPI와 출력용 UART핀만 설정했다. 어댑터와 연결될 CS핀은 PB12로 설정했다. CS핀은 high 상태

그리고 이번에는 외부 라이브러리를 쓰기 때문에 호출 흐름을 읽기 위해서 SYS>Debug에서 Serial Wire를 선택했다.

## SPI 설정

![](<./assets/fatfs-init-04.png>)

SD카드에게 일방적으로 데이터를 전달하지 않고 응답을 받아오기도 하므로 Full-Duplex Master로 설정했다.

Prescaler는 클럭값에 따라 적절히 설정하면 된다. 단 너무 빠르게 설정할 경우 아래 사진처럼 경고를 띄우면서 최대값으로 바꿔준다.

![](<./assets/fatfs-init-05.png>)

일단 구현하는 것을 목표로 두어서 폴링 방식으로 동작하도록 만들었고, 그 외 설정은 딱히 건드리지 않았다.

## FatFs 설정

Middleware and Software packs 카테고리를 확인하면 FATFS가 비활성화되어 있다. User-define을 체크하면 하단에 매크로를 설정할 수 있는 설정창이 생긴다.

파일 이름이 12바이트를 넘어갈 수 있어서 이름이 긴 파일을 지원할 수 있도록 `USE_LFN`를 `Enabled with static working buffer on BSS`로 바꾼다.

> BSS, stack, heap 중 한 곳에 버퍼를 만들어 활용한다는데, BSS를 활용하는 이점에 대해 공부해야겠다.

그리고 절대경로 대신 현재 디렉토리에서 상대경로로 찾는 기능을 사용할 수 있게 `FS_RPATH`도 활성화한다. 그 외 설정은 건드리지 않았다.

## 폴더 구조

미들웨어를 추가했기 때문에 FATFS폴더와 Middlewares 폴더가 추가된 모습이다.

```
.
├── build
│   └── Debug
│       └── ...
├── cmake
│   ├── gcc-arm-none-eabi.cmake
│   └── stm32cubemx
│       └── CMakeLists.txt
├── CMakeLists.txt
├── CMakePresets.json
├── Core
│   ├── Inc
│   │   ├── fatfs_sd.h  <------------ 내가 추가한 파일
│   │   ├── main.h
│   │   ├── stm32f1xx_hal_conf.h
│   │   └── stm32f1xx_it.h
│   └── Src
│       ├── fatfs_sd.c  <------------ 내가 추가한 파일
│       ├── main.c
│       ├── stm32f1xx_hal_msp.c
│       ├── stm32f1xx_it.c
│       ├── syscalls.c
│       ├── sysmem.c
│       └── system_stm32f1xx.c
├── Drivers
│   ├── CMSIS
│   │   └── ...
│   └── STM32F1xx_HAL_Driver
│       └── ...
├── FATFS
│   ├── App
│   │   ├── fatfs.c
│   │   └── fatfs.h
│   └── Target
│       ├── ffconf.h
│       ├── user_diskio.c
│       └── user_diskio.h
├── MicroSD_FATFS_ex.ioc
├── Middlewares
│   └── Third_Party
│       └── FatFs
├── startup_stm32f103xb.s
└── STM32F103XX_FLASH.ld
```

# 초기화 절차

## Command Frame

![](<./assets/fatfs-init-06.png>)

보드에서 SD카드에게 보낼 명령어 프레임은 위와 같다. 명령어(8비트) + 추가정보(32비트) + CRC(7비트) + Stop(1비트), 총 40비트로 구성되어 있다. 올바르게 명령어를 보냈다면, 약 8비트정도 MISO라인이 high 상태에 있다가 응답이 들어온다고 한다.

### 명령어 목록

| CMD index | Abbreviation | Description | Response Type |
| --- | --- | --- | --- |
| CMD0 | GO\_IDLE | Software reset | R1 |
| CMD1 | INIT | Initiate initialization process | R1 |
| ACMD41 | APP\_INIT | For SDC only. Initiate initialization process. | R1 |
| CMD8 | CHECK\_V | For SDC v2 only. Check voltage range. | R7 |
| CMD12 | STOP\_READ | Stop reading data | R1b |
| CMD16 | SET\_BLOCKLEN | Change R/W block size | R1 |
| CMD17 | READ\_BLOCK | Read single block | R1 |
| CMD18 | READ\_MULTI\_BLOCK | Read multiple blocks | R1 |
| CMD24 | WRITE\_BLOCK | Write single block | R1 |
| CMD25 | WRITE\_MULTI\_BLOCK | Write multiple blocks | R1 |
| CMD55 | ACMD\_LEADING | Leading command of ACMD(n) command | R1 |
| CMD58 | READ\_OCR | Read Operation Conditions Register | R3 |

SD카드에게 보낼 수 있는 명령어들은 대략 위와 같다.

### 응답

![](<./assets/fatfs-init-07.png>)

명령어에 대한 응답은 위와 같다. R1 응답은 8비트로 설정되어 있고 각 비트마다 에러 종류가 하나씩 할당되어 있다. R3, R7 응답의 경우 R1 + 추가정보(32비트)로 구성되어 있다.

초기화 단계에서는 R1이 0이나 1인 경우 또는 요청이 타임아웃된 경우만 신경쓰면 된다. 아래 플로우 차트를 보면 알 수 있다.

## 플로우 차트

![](<./assets/fatfs-init-08.png>)

## 전원 인가

### 클럭 다운스케일링

> To ensure the proper operation of the SD card, the SD CLK signal should have a frequency in the range of 100 to 400 kHz.

먼저 SPI클럭을 100~400Khz 정도로 낮추고 진행한다. 버전에 따라서 느린 속도로 처리하는 SD카드를 위해 이렇게 하는것 같다.

![](<./assets/fatfs-init-09.png>)

내 프로젝트의 클럭 설정은 64Mhz로 해두었기 때문에 Prescaler의 값을 256정도로 설정하면 64000Khz/256 = 250Khz이므로 범위 안에 들도록 만들 수 있다.

```
HAL_Delay(1);
/**
 * 100khz ~ 400khz로 클럭 낮추기
 * -----------------------------------------------------------------------
 * To ensure the proper operation of the SD card, the SD CLK signal should
 * have a frequency in the range of 100 to 400 kHz.
 */
hspi1.Init.BaudRatePrescaler =
    SPI_BAUDRATEPRESCALER_256; /* 64Mhz / 256 = 250Khz */
HAL_SPI_Init(&hspi1);

if (!SD_PowerOn()) {
    return status = STA_NOINIT;
}
```

### SPI 모드 전환

> To communicate with the SD card, your program has to place the SD card into the SPI mode. To do this, set the MOSI and CS lines to logic value 1 and toggle SD CLK for at least 74 cycles. After the 74 cycles (or more) have occurred, your program should set the CS line to 0 and send the command CMD0: 01 000000 00000000 00000000 00000000 00000000 1001010 1  
> After the 74 cycles (or more) have occurred, your program should set the CS line to 0 and send the command CMD0: 01 000000 00000000 00000000 00000000 00000000 1001010 1 This is the reset command, which puts the SD card into the SPI mode if executed when the CS line is low. The SD card will respond to the reset command by sending a basic 8-bit response on the MISO line.

전원이 인가되고 나면 CS핀과 MOSI라인을 high로 두고 74클럭을 보내야한다. SPI 전송이 8비트 단위이므로 10번 전송하면 74클럭을 보낸 셈이 된다.

전송을 완료하면 CS핀을 low로 바꾸고 CMD0과 지정된 CRC값을 전송해야한다.

```
static bool SD_PowerOn() {
    uint8_t res, dummy = 0xFF, n = 0xFF;

    SD_Deselect();
    for (int i = 0; i < 10; i++) {
        SD_SPI_Send(0xFF);
    }

    SD_Select();
    SD_SPI_Send(0x40);
    SD_SPI_Send(0);
    SD_SPI_Send(0);
    SD_SPI_Send(0);
    SD_SPI_Send(0);
    SD_SPI_Send(0x95);

    do {
        HAL_SPI_TransmitReceive(&hspi1, &dummy, &res, 1, SD_SPI_TIMEOUT_MS);
    } while ((res != 0x01) && --n);

    SD_Deselect();
    if (!n) {
        return SD_ERROR;
    }

    return SD_OK;
}
```

응답이 곧바로 오지 않을 수 있기 때문에 적절히 n을 설정하고 retry를 하도록 만들었다. n이 0이면 여러번 시도했음에도 CMD0이 처리되지 않은 것으로 생각해 초기화를 그만둔다.

## 버전 탐색

초기화에 성공했다면 SD카드의 버전을 알아내는 단계로 들어간다. CMD8과 0x1AA를 인자로 하여 SD카드에게 전달하면 버전에 따라 응답이 다르게 들어온다.

1.  응답이 정상이고 추가 정보로 0x1AA로 들어오는 경우 : SD\_V2
2.  응답이 정상이지만 추가 정보가 0x1AA가 아닌 경우 : Unknown
3.  응답이 에러인경우 : SD\_V1 또는 MMC\_V3

SD\_V2인 경우에는 주소가 블럭단위인지 바이트 단위인지 알아내야한다. 먼저 ACMD41명령으로 APP\_INIT을 처리한 뒤 CMD58명령으로 CSD레지스터를 조회한다. ACMD 명령에는 항상 CMD55 명령이 선행된다.

CMD58명령은 추가정보로 CSD레지스터(128비트)의 상위 32비트를 가져온다.

![](<./assets/fatfs-init-10.png>)![](<./assets/fatfs-init-11.png>)

값이 0이면 standard(~2GB)이고, 1이면 High capacity(2~32GB)이다. 이 버전을 기억해두어야 읽기 작업을 할 때 주소 접근법을 다르게 적용할 수 있다.

```
sd_version = SD_TYPE_UNKNOWN;
status     = 0;

SD_Select();
// CMD8 실행
res = SD_Send_Command(SD_CMD8, 0x1AA);

if (res == 1) {
    // Check Voltage
    SD_SPI_ReceiveInformation(info);
    if (info[3] & 0x1AA) {
        Timer1 = 1000;
        do {
            // CMD55 for Leading ACMD
            res = SD_Send_Command(SD_CMD55, 0);
            if (res != SD_RESPONSE_IN_IDLE_STATE) {
                return status = STA_NOINIT;
            }
            // APP Init
            res = SD_Send_Command(SD_ACMD41, 1 << 30);
        } while (Timer1 && res != 0);
        if (!Timer1) {
            return status = STA_NOINIT;
        }

        // Read OCR
        res = SD_Send_Command(SD_CMD58, 0);
        if (res == 0) {
            SD_SPI_ReceiveInformation(info);
            // Check High capacity
            if (info[0] & 0x40) {
                sd_version = SD_TYPE_V2_BLOCK_ADDRESS;
            } else {
                sd_version = SD_TYPE_V2_BYTE_ADDRESS;
            }
        } else {
            sd_version = SD_TYPE_V2_BYTE_ADDRESS;
        }
    } else {
        sd_version = SD_TYPE_UNKNOWN;
    }
} else {
    // SD_V1 또는 MMC_V3버전의 SD카드가 없어서 응답이 에러인 부분은 건너뛰었습니다.
}
```

초기화 작업이 끝나면 CMD1을 전송하여 초기화 상태에서 벗어나게 한다. 이걸 설정하지 않으면 초기화중으로 생각하고 읽기/쓰기가 되지 않는다. CMD1의 응답이 1이 아니면 초기화 상태에서 벗어난 것임을 알 수 있다.

플로우 차트에 따르면 특정 버전들의 경우 CMD16을 전송하여 블럭 사이즈를 512바이트로 고정하라고 한다.

그리고 초기화가 끝났다면 강제로 낮추었던 SPI클럭을 다시 원상복귀 시킨다.

```
do {
    res = SD_Send_Command(SD_CMD1, 0);
} while (res & SD_RESPONSE_IN_IDLE_STATE);

if (sd_version == SD_TYPE_V2_BYTE_ADDRESS || sd_version == SD_TYPE_V1 ||
    sd_version == SD_TYPE_MMC_V3) {
    res = SD_Send_Command(SD_CMD16, 512);
    if (res == 0) {
        // increate SPI Clock Speed...?
        hspi1.Init.BaudRatePrescaler =
            SPI_BAUDRATEPRESCALER_4;
        HAL_SPI_Init(&hspi1);
    } else {
        sd_version = SD_TYPE_UNKNOWN;
    }
}

status &= ~STA_NOINIT;

SD_Deselect();

return status;
```

## 타임아웃 설정

몇몇 명령은 타임아웃을 체크해야하는데, `SysTick_Handler`를 통해 1ms마다 타이머를 감소시키도록 설정했다.

```
//stm32f1xx_it.c

/* Private function prototypes -----------------------------------------------*/
/* USER CODE BEGIN PFP */
void SD_Timer_Handler() {
    if (Timer1 > 0) {
        Timer1--;
    }
    if (Timer2 > 0) {
        Timer2--;
    }
}
/* USER CODE END PFP */
```

타이머값이 설정되면 1씩 감소시키도록 함수를 만든 후 `SysTick_Handler`에 등록한다.

```
/**
  * @brief This function handles System tick timer.
  */
void SysTick_Handler(void)
{
  /* USER CODE BEGIN SysTick_IRQn 0 */
    SD_Timer_Handler();
  /* USER CODE END SysTick_IRQn 0 */
  HAL_IncTick();
  /* USER CODE BEGIN SysTick_IRQn 1 */

  /* USER CODE END SysTick_IRQn 1 */
}
```

# FatFs 모듈 설정

위에서 작성한 디스크 드라이버 코드는 FatFs 모듈 내부에서 호출된다. 정확히는 다음 호출 흐름에 따른다.

## 호출 흐름

```
//fatfs.c
void MX_FATFS_Init(void)
{
  /*## FatFS: Link the USER driver ###########################*/
  retUSER = FATFS_LinkDriver(&USER_Driver, USERPath);

  /* USER CODE BEGIN Init */
    /* additional user code for init */
  /* USER CODE END Init */
}
```

CubeMX에 의해 자동으로 생성되는 메인함수를 보면 위 함수를 호출하고 있다. `USER_Driver`는 함수를 멤버로 갖는 구조체로 `Diskio_drvTypeDef`타입이다.

```
// user_diskio.h
Diskio_drvTypeDef  USER_Driver =
{
  USER_initialize,
  USER_status,
  USER_read,
#if  _USE_WRITE
  USER_write,
#endif  /* _USE_WRITE == 1 */
#if  _USE_IOCTL == 1
  USER_ioctl,
#endif /* _USE_IOCTL == 1 */
};
```

User\_initialize 함수는 다음과 같다.

```
//user_diskio.c
/**
 * @brief  Initializes a Drive
 * @param  pdrv: Physical drive number (0..)
 * @retval DSTATUS: Operation status
 */
DSTATUS
USER_initialize(BYTE pdrv /* Physical drive nmuber to identify the drive */
) {
    /* USER CODE BEGIN INIT */
    return RES_OK;
    /* USER CODE END INIT */
}
```

이곳에 내가 작성한 디스크 드라이버 함수를 끼워넣으면, FatFs 모듈이 내부 로직 중간에 호출하게 된다.

```
//diskio.c
/**
  * @brief  Initializes a Drive
  * @param  pdrv: Physical drive number (0..)
  * @retval DSTATUS: Operation status
  */
DSTATUS disk_initialize (
    BYTE pdrv                /* Physical drive nmuber to identify the drive */
)
{
  DSTATUS stat = RES_OK;

  if(disk.is_initialized[pdrv] == 0)
  { 
    disk.is_initialized[pdrv] = 1;
    stat = disk.drv[pdrv]->disk_initialize(disk.lun[pdrv]);
  }
  return stat;
}
```

`disk.drv`멤버는 아래 코드를 보면 알 수 있듯이 아까 보았던 `Diskio_drvTypeDef`타입이다. pdrv로 연결된 볼륨을 선택하고, 그 볼륨에 할당된 디스크 드라이버 코드를 호출하는 것으로 이해할 수 있다.

```
typedef struct
{ 
  uint8_t                 is_initialized[_VOLUMES];
  Diskio_drvTypeDef       *drv[_VOLUMES];
  uint8_t                 lun[_VOLUMES];
  __IO uint8_t            nbr;

}Disk_drvTypeDef;
```

정리하자면, 초기화 단계에서 내가 정의한 디스크 드라이버 함수를 FatFs 모듈에 등록하고, FatFs 모듈 내부의 라이브러리 함수를 사용하면 최종적으로는 디스크 드라이버 함수가 호출되는 형식이다.

설명이 길었는데, 결론은 `FATFS/Target/user_diskio.c`에 내가 만든 함수들을 끼워넣으면 자동으로 등록된다는 것이다.

---

이렇게 설정하면 SD카드를 SPI 모드로 전환 후 버전을 구분하며 파일 단위로 읽기/쓰기를 할 수 있게 초기화한다.

# 전체 코드

[https://github.com/10cheon00/STM32-Study/tree/main/MicroSD\_FATFS\_ex](https://github.com/10cheon00/STM32-Study/tree/main/MicroSD_FATFS_ex)
