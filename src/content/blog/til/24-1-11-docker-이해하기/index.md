---
title: 24-1-11 docker 이해하기
date: "2024-01-11T08:26:12.959Z"
tags: ["TIL", "docker"]
category:
  name: "Study"
  category:
    name: "Docker"
---

# docker란

[초보를 위한 도커 안내서 - 도커란 무엇인가](https://subicura.com/2017/01/19/docker-guide-for-beginners-1.html)를 보고 도커가 어떤건지 대략 이해했다. 옛날에는 가상화를 한다면 VMWare같은 OS를 가상화하는 방법을 사용했었다. 도커는 OS위에 OS를 올리지 않고 *프로세스를 격리하는 방법*을 사용한다. 

각 프로세스는 **컨테이너**라는 단위로 구분되고, 컨테이너는 서로 독립적으로 동작하여 영향을 주지 않는다. 

컨테이너를 실행하기 위해서는 **이미지**가 필요한데, 실행 파일 및 환경 변수 등이 저장되어 있다. 컨테이너는 단순히 이미지를 실행한 것에 지나지 않는다. 이미지는 상태가 불변이므로 컨테이너의 상태가 바뀌어도 영향을 받지 않는다.

# 겪었던 오류들

간단하게 ubuntu:20.04 이미지를 받아 실행했다. 

```bash
docker run ubuntu:20.04
```

그런데 위 명령어를 실행하니 별다른게 뜨지 않고 종료되었다. 이상해서 한 번 더 명령어를 실행했더니 똑같이 아무것도 뜨지 않았다. `docker ps`명령어로 실행된 컨테이너를 확인해보니 아무것도 없었다. 이상해서 `docker ps -a`를 해보니 그제서야 출력되었다.

```
CONTAINER ID   IMAGE          COMMAND       CREATED              STATUS                          PORTS     NAMES
4e05d2f7e6f3   ubuntu:20.04   "/bin/bash"   About a minute ago   Exited (0) About a minute ago             frosty_carson
f51ebaa85d03   ubuntu:20.04   "/bin/bash"   About a minute ago   Exited (0) About a minute ago             upbeat_lichterman
f98810b0c068   ubuntu:20.04   "/bin/bash"   2 minutes ago        Exited (0) 2 minutes ago                  fervent_mayer
```

잘 보면 같은 이미지로 여러번 컨테이너를 생성한 모습이다. 대신 모든 상태가 `Exited`로 나온다. 컨테이너를 실행하면서 전달된 명령은 `/bin/bash`인데, 아마 별다른 입력이 없어서 그대로 종료된것 같다. 

이 현상을 보고 도커는 이미지를 컨테이너 단위로 실행한다는 것을 이해했다. 컨테이너를 종료시켜도 사라지지 않고 어딘가에 남아있다. 이를 확인하기 위해 wsl를 아예 종료시킨 다음 다시 `docker ps -a`를 했더니 여전히 컨테이너가 살아있음을 확인했다.

```
docker run -it ubuntu:20.04
```

실행할 때 이런 옵션을 넣어주니까 익숙한 bash가 등장하면서 `docker ps`에도 나타난다.

```
# docker ps
CONTAINER ID   IMAGE          COMMAND       CREATED          STATUS          PORTS     NAMES
2685c0d6e891   ubuntu:20.04   "/bin/bash"   21 seconds ago   Up 20 seconds             bold_germain
```

```
# docker ps -a
CONTAINER ID   IMAGE          COMMAND       CREATED          STATUS                      PORTS     NAMES
2685c0d6e891   ubuntu:20.04   "/bin/bash"   50 seconds ago   Up 50 seconds                         bold_germain
4e05d2f7e6f3   ubuntu:20.04   "/bin/bash"   16 minutes ago   Exited (0) 16 minutes ago             frosty_carson
f51ebaa85d03   ubuntu:20.04   "/bin/bash"   16 minutes ago   Exited (0) 2 minutes ago              upbeat_lichterman
f98810b0c068   ubuntu:20.04   "/bin/bash"   17 minutes ago   Exited (0) 11 minutes ago             fervent_mayer
```

컨테이너 내에서 파일을 생성한 후 컨테이너를 종료하여도 그 컨테이너가 삭제되지 않았다면 다시 시작할 때에도 상태가 유지되어 있다. 간단하게 `touch testfile`한 후 `docker container stop bold_germain`를 실행하여 컨테이너를 종료했다. 다시 `docker container start bold_germain`로 컨테이너를 실행하면 그 파일이 남아있음을 알 수 있는데 컨테이너의 파일 시스템은 로컬 파일시스템과는 독립적이므로 그 파일을 로컬 시스템에서 접근할 수는 없다.
