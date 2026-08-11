---
title: FatFs를 사용하여 SD카드 파일시스템 접근하기 (2) - io 및 기타 함수들
date: "2025-07-21T16:50:34+09:00"
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

# Read, Write

이전 글에서 전체 흐름을 살펴보았었다. FatFs 라이브러리의 `f_read`나 `f_write`를 호출한다면 `user_diskio.c`의 `USER_Read`, `USER_Write`함수 내부에서 내가 정의한 함수를 호출하게 됨을 알 수 있었다.

## Read

![](<./assets/fatfs-io-01.png>)

단일 블록을 읽는 과정은 위와 같다. CMD17을 전송하고 명령에 대한 응답(Command Response)을 확인한다면 블록 크기만큼의 데이터를 가진 데이터 패킷이 전달된다. 각 응답들의 포맷은 다음과 같다.

![](<./assets/fatfs-io-02.png>)

먼저 Command Response는 8비트 길이로, 상위 3개는 Don't care, 하위 4개 중에 3개가 성공, 오류 여부를 응답한다. 이를 뒤따르는 데이터 패킷은 토큰(8비트) + 데이터 블럭(1~2048비트?) + CRC(16비트)로 구성되어 있다. 토큰은 어떤 명령어에 대한 응답인가를 구분하는 용도로 쓰인다. 데이터 블럭은 CubeMX에서 정한 데이터 블럭을 따른다. CRC는 2바이트나 전달되지만 건너뛰어도 무방하다.

```
DSTATUS SD_Read(BYTE pdrv, BYTE *buff, DWORD sector, UINT count) {
    SD_DataToken token;
    SD_Response  res;
    uint8_t      dummy = 0xFF, crc = 0x01;
    DWORD        addr = (sd_version == SD_TYPE_V2_BLOCK_ADDRESS)
                            ? sector        /* SDHC/SDXC: block address */
                            : sector * 512; /* SDSC: byte address */

    if (count == 1) {
        SD_Select();

        res = SD_Send_Command(SD_CMD17, addr);

        if (res == 0) {
            /**
             * Read DataToken
             */
            Timer1 = 200; // 타임아웃 200ms
            do {
                SD_SPI_SendReceive(dummy, &token);
            } while (Timer1 && token == 0xFF);
            /**
             * 에러 토큰 검사
             */
            if (token != 0xFE) {
                SD_Deselect();
                SD_SPI_Send(0xFF);
                return RES_ERROR;
            }

            /**
             * Read DataBlock
             */
            for (UINT i = 0; i < 512; i++) {
                SD_SPI_SendReceive(dummy, &buff[i]);
            }

            /**
             * Read CRC, but skip
             */
            SD_SPI_Send(crc);
            SD_SPI_Send(crc);

            SD_Deselect();
        } else {
            return RES_ERROR;
        }

    } else {
    }
    return RES_OK;
}
```

> 단일 블록에 대해서 읽기만 가능해도 SD카드에서 데이터를 읽어올 수 있었다. 멀티 블록은 나중에 구현해보기로...

## Write

쓰기 작업의 절차는 다음과 같다.

![](<./assets/fatfs-io-03.png>)

CMD24를 전송하고 응답이 도착했다면 잠시 1바이트 정도 기다렸다가 쓸 내용을 담은 데이터 패킷을 전송한다. 전송이 끝났다면 Data Response를 확인하고 Busy Flag가 들어오게 되는데 이 신호가 끝날 때까지 기다려야 SD카드에게 다음 명령을 보낼 수 있다.

```
DSTATUS SD_Write(BYTE pdrv, const BYTE *buff, DWORD sector, UINT count) {
    SD_DataResponse data_res;
    SD_Response     res;
    uint8_t         dummy = 0xFF;

    SD_Select();
    if (count == 1) {
        data_res = (SD_DataResponse)SD_Send_Command(SD_CMD24, sector);

        if (data_res == 0) {
            /**
             * 0. 더미 1바이트 전송
             * 1. 데이터 토큰 전송
             * 2. 데이터 블록 전송
             * 3. CRC 전송
             * 4. busy flag 처리
             */
            uint8_t token = SD_DATA_TOKEN_CMD17_18_24;
            uint8_t crc   = 0xFF;

            SD_SPI_Send(dummy);
            SD_SPI_Send(token);

            for (int i = 0; i < 512; i++) {
                SD_SPI_Send(*(buff++));
            }
            SD_SPI_Send(crc);
            SD_SPI_Send(crc);

            SD_SPI_SendReceive(dummy, &data_res);
            if (SD_IS_DATA_ACCEPTED(data_res)) {
                do {
                    SD_SPI_SendReceive(dummy, &res);
                } while (res != 0xFF);
            }
        }
    } else {
    }
    SD_Deselect();
    return RES_OK;
}
```

# ioctl

FatFs 라이브러리를 사용할 때 가장 먼저 호출하게 되는 함수는 `f_mount`다. 디스크를 마운트하는 작업을 하는데, 이 함수 내부에서는 볼륨(디스크)을 찾기 위해 `find_volume`이라는 함수를 호출한다. `find_volume`함수는 다음과 같다.

```

static
FRESULT find_volume (    /* FR_OK(0): successful, !=0: any error occurred */
    FATFS** rfs,        /* Pointer to pointer to the found file system object */
    const TCHAR** path,    /* Pointer to pointer to the path name (drive number) */
    BYTE wmode            /* !=0: Check write protection for write access */
)
{
    BYTE fmt, *pt;
    int vol;
    DSTATUS stat;
    DWORD bsect, fasize, tsect, sysect, nclst, szbfat, br[4];
    WORD nrsv;
    FATFS *fs;
    UINT i;

    // 생략 ...

    if (fs->fs_type) {                    /* If the volume has been mounted */
        stat = disk_status(fs->drv);
        if (!(stat & STA_NOINIT)) {        /* and the physical drive is kept initialized */
            if (!_FS_READONLY && wmode && (stat & STA_PROTECT))    /* Check write protection if needed */
                return FR_WRITE_PROTECTED;
            return FR_OK;                /* The file system object is valid */
        }
    }

    /* The file system object is not valid. */
    /* Following code attempts to mount the volume. (analyze BPB and initialize the fs object) */

    fs->fs_type = 0;                    /* Clear the file system object */
    fs->drv = LD2PD(vol);                /* Bind the logical drive and a physical drive */
    stat = disk_initialize(fs->drv);    /* Initialize the physical drive */
    if (stat & STA_NOINIT)                /* Check if the initialization succeeded */
        return FR_NOT_READY;            /* Failed to initialize due to no medium or hard error */
    if (!_FS_READONLY && wmode && (stat & STA_PROTECT))    /* Check disk write protection if needed */
        return FR_WRITE_PROTECTED;
#if _MAX_SS != _MIN_SS                        /* Get sector size (multiple sector size cfg only) */
    if (disk_ioctl(fs->drv, GET_SECTOR_SIZE, &SS(fs)) != RES_OK
        || SS(fs) < _MIN_SS || SS(fs) > _MAX_SS) return FR_DISK_ERR;
#endif

    // 생략 ... 
}
```

`disk_`가 접두어인 함수들은 모두 `diskio.h` 에 정의되어 있는 함수들인데, 이전 글에서 작성했었던 초기화 함수 역시 `disk_initialize`에 의해 호출된다. 위 함수에서 등장하는 `disk_status`, `disk_ioctl` 역시 `diskio.h`에 정의되어 있고, 구현하지 않으면 정상적으로 동작하지 않는다.

## `disk_status`

```
DSTATUS SD_Status(BYTE pdrv) { return status; }
```

초기화 함수나, 읽기, 쓰기 함수의 성공 여부를 별도 변수에 저장해둔다. 이 함수에서는 그것을 반환하기만 한다.

## `disk_ioctl`

읽기 쓰기만 구현하기로 마음먹어서, 처리해야할 명령어는 두 가지 밖에 되지 않는다.

![](<./assets/fatfs-io-04.png>)

```

DSTATUS SD_ioctl(BYTE pdrv, BYTE cmd, void *buff) {
    SD_Response r;
    uint8_t     csd[32];
    uint8_t     dummy = 0xFF;
    DSTATUS     res   = RES_OK;

    if (cmd == CTRL_SYNC) {
        // Timer2 = 1000;

        if (!SD_BusyWait()) {
            res = RES_ERROR;
        }
    } else if (cmd == GET_SECTOR_SIZE) {
        *(WORD *)buff = 512; // 왜 512?
    } else if (cmd == GET_BLOCK_SIZE) {
        *(DWORD *)buff = 8;
    } else {
        res = RES_PARERR;
    }
    return res;
}
```

# 전체 코드

[https://github.com/10cheon00/STM32-Study/tree/main/MicroSD\_FATFS\_ex](https://github.com/10cheon00/STM32-Study/tree/main/MicroSD_FATFS_ex)
