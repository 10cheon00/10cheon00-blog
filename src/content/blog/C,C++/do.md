---
title: C와 C++파일을 같이 빌드할 때 생기는 naming mangling 문제 파헤치기
date: "2026-09-01T13:09:20+09:00"
tags: ["C,C++"]
category:
  name: "C,C++"
---

# Naming Mangling

컴파일러가 링커에게 링킹에 도움이 될 정보를 더 전달하고자 심볼 이름에 몇가지 정보를 섞어 전달하는 기법이다. 

여기서 네임 맹글링이 일어나는 심볼은 함수, 구조체, 클래스 등이다.

[네임 맹글링](https://ko.wikipedia.org/wiki/%EB%84%A4%EC%9E%84_%EB%A7%B9%EA%B8%80%EB%A7%81)

# 이게 왜 문제일까

다음 두 코드를 각각 C 컴파일러와 C++ 컴파일러로 컴파일한 결과를 비교해보자. 

> M2 Air를 사용중이므로 GCC 버전은 다음과 같습니다.
> ❯ gcc -v
> Apple clang version 21.0.0 (clang-2100.1.1.101)
> Target: arm64-apple-darwin25.5.0
> Thread model: posix
> InstalledDir: /Library/Developer/CommandLineTools/usr/bin

```c
// main.c
extern int add(int a, int b);
int main() {
    add(10, 20);
}
```
```cpp
// add.c
int add(int a, int b) {
    return a + b;
}
```

```shell
❯ ls  
add.cpp main.c
❯ gcc main.c -c
❯ g++ add.cpp -c   
❯ ls
add.cpp add.o   main.c  main.o
❯ nm main.o
                 U _add
0000000000000000 T _main
0000000000000000 t ltmp0
0000000000000020 N ltmp1
❯ nm add.o
0000000000000000 T __Z3addii
0000000000000000 t ltmp0
0000000000000020 N ltmp1
❯ 
```

main.o에서는 add 함수를 `U _add`라고 남겨두었기 때문에 링크 단계에서 이 심볼을 찾아 연결할 것이다. 하지만 add.o에서는 연결되어야 할 add 함수가 `__Z3addii`라는 심볼로 컴파일되었다. 따라서 두 오브젝트 파일을 함께 링크한다면 당연히 일치하는 심볼이 없기 때문에 링크에 실패한다.

```shell
❯ g++ main.o add.o -o result
Undefined symbols for architecture arm64:
  "_add", referenced from:
      _main in main.o
ld: symbol(s) not found for architecture arm64
clang++: error: linker command failed with exit code 1 (use -v to see invocation)
```

# 해결 방법

문법에 의한 문제가 아니라 링킹 단계에서 인식할 수 없는 심볼을 만드는 것이 문제다. 두 가지 방법이 존재한다.

## 1. 싹 다 C++ 컴파일러로 빌드해버리기

```shell
❯ g++ main.c add.cpp
clang++: warning: treating 'c' input as 'c++' when in C++ mode, this behavior is deprecated [-Wdeprecated]
❯ ls
a.out   add.cpp main.c
❯ 
```

된다. 하지만 출력 결과에 나오듯 C 파일을 C++ 파일로 취급하는 것은 deprecated 됐다고 한다. 이 방법이 더 이상 쓰이지 않는 이유는 다음과 같다.

```c
int main() {
    printf("%lu", sizeof('A'));
}
```

위 코드를 C에서 실행하면 4, C++에서 실행하면 1이 출력된다. 즉, 컴파일러에 따라서 예기치 못한 결과를 낼 수 있다. 

```c
#include <stdlib.h>
int main() {
    int * ptr = malloc(sizeof(int)* 10);
    free(ptr);
}
```

또한, 위 코드는 C에서 컴파일 오류를 내지 않지만, C++에서는 컴파일 오류를 낸다. 그러므로 C 파일은 C 컴파일러로, C++ 파일은 C++ 컴파일러로 빌드해야 한다.

## 2. 각각 빌드하되 심볼을 일치시키기

C 코드가 C++로 컴파일한 함수의 심볼을 찾을 수 있도록, C++ 파일의 심볼을 바꾸면 해결된다.

```cpp
// add.cpp
extern "C" {

int add(int a, int b) {
    return a + b;
}

}
```

위와 같이 C 스타일 심볼로 컴파일되어야 하는 함수들은 `extern "C"`로 감싼다. 그 후 각각의 컴파일러로 컴파일 한 후 C++ 컴파일러로 링크를 수행하면 성공한다.

```shell
❯ gcc main.c -c
❯ g++ add.cpp -c
❯ g++ main.o add.o -o result
❯ ls
add.cpp add.o   main.c  main.o  result
❯ nm add.o
0000000000000000 T _add
0000000000000000 t ltmp0
0000000000000020 N ltmp1
❯ nm main.o
                 U _add
0000000000000000 T _main
0000000000000000 t ltmp0
0000000000000020 N ltmp1
❯ 
```

컴파일은 C++ 문법에 따라 수행되지만, 심볼을 C 스타일로 노출시킨다. 이렇게 한다면 C 코드에서 C++ 코드로 만들어진 함수를 호출하더라도 링크 문제가 발생하지 않는다.
