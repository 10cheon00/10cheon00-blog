---
title: C++ STL (1) - std::array
date: "2026-09-08T12:23:33+0900"
tags: ["C,C++"]
category:
  name: "C,C++", "C++ STL"
series:
  name: "C++ STL"
  order: 1
---

# std::array

```cpp
template<
    class T,
    std::size_t N
> struct array;
```

고정된 크기의 배열을 캡슐화한 컨테이너다. 컨테이너 타입은 집합체(aggregate type)로, 모든 멤버가 public이고 가상함수가 없으므로 C 스타일 구조체와 거의 비슷하다. (vector, deque는 내부에 private 멤버가 존재함.)

array의 모든 원소는 C 스타일 배열과 동일하게 인덱스로 임의 접근이 가능하다. 컨테이너의 크기도 알 수 있다. 또한 STL의 반복자(LegacyRandomAccessIterator, LegacyContinuousIterator)를 제공한다.

# 예시

```cpp
#include <array>
#include <iostream>

int main(){
    // 크기 5의 std::array 선언
    std::array<int, 5> arr = {1,2,3,4,5}; 
    
    // 인덱스를 사용하여 접근
    arr[1] = 100;

    for (const auto& n : arr) {
        std::cout << n << ' ';
    }
    std::cout << std::endl;
    for (auto iter = arr.rbegin(); iter != arr.rend(); ++iter) {
        std::cout << *iter << ' ';
    }
    std::cout << std::endl;
    // 출력 결과
    // 1 100 3 4 5 
    // 5 4 3 100 1 

    std::cout << "arr의 길이 : " << arr.size() << std::endl;
    // 출력 결과
    // arr의 길이 : 5
}
```
