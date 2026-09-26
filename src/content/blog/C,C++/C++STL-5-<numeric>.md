---
title: C++ STL (5) - std::numeric
date: "2026-09-26T15:14:32+0900"
tags: ["C,C++", "STL"]
category:
  name: "C,C++"
series:
  name: "C++ STL"
  order: 4
---

> C++ 17을 기준으로 cppreference를 참고하여 작성했습니다.

# <numeric>

다양한 수학 함수와 타입들을 제공하는 라이브러리다. 이 라이브러리에는 `<cmath>`, `<numbers>`, `<linalg>`, `<simd>` 등 여러 개의 헤더로 나뉘어 있다. 그 중에서도 `<numeric>`은 수치 연산과 관련된 함수들을 제공한다.

## `iota`

```cpp
template< class ForwardIt, class T >
void iota( ForwardIt first, ForwardIt last, T value );
```

***itoa***가 아니다!

배열이나 컨테이너에 1씩 증가하는 값을 연속적으로 채울 때 쓰는 함수다.

함수 이름은 [(그리스 문자 ⍳)](https://en.wikipedia.org/wiki/Iota)에서 따온 듯하다.

### 예시

```cpp
#include <iostream>
#include <vector>
#include <numeric>

int main() {
  std::vector<int> list(10);
  std::iota(list.begin(), list.end(), 10);
  for (auto it = list.begin(); it != list.end(); ++it)
  {
    std::cout << *it << ' ';
  }


  // 출력 결과
  // 10 11 12 13 14 15 16 17 18 19
}
```

## `accumulate`

```cpp
template< class InputIt, class T >
T accumulate( InputIt first, InputIt last, T init );
```

배열이나 컨테이너를 순회하며 값에 대해 연산한다.

### 예시

```cpp
#include <iostream>
#include <vector>
#include <numeric>

int main() {
  std::vector<int> list{1,2,3,4,5,6,7,8,9,10};
  std::cout << std::accumulate(list.begin(), list.end(), 0) << std::endl;
  std::cout << std::accumulate(list.begin(), list.end(), 1, [](const auto& a, const auto& b){return a*b;});

  // 출력 결과
  // 55
  // 3628800
}
```

## `reduce`

```cpp
template< class InputIt >
typename std::iterator_traits<InputIt>::value_type
    reduce( InputIt first, InputIt last );

template< class ExecutionPolicy, class ForwardIt >
typename std::iterator_traits<ForwardIt>::value_type
    reduce( ExecutionPolicy&& policy,
            ForwardIt first, ForwardIt last );

template< class ExecutionPolicy, class ForwardIt, class T >
T reduce( ExecutionPolicy&& policy,
          ForwardIt first, ForwardIt last, T init );

template< class InputIt, class T, class BinaryOp >
T reduce( InputIt first, InputIt last, T init, BinaryOp op );

template< class ExecutionPolicy,
          class ForwardIt, class T, class BinaryOp >
T reduce( ExecutionPolicy&& policy,
          ForwardIt first, ForwardIt last, T init, BinaryOp op );
```

`accumulate`와 매우 유사하지만, 시그니처에서 보이듯이 실행 정책을 결정할 수 있다. `accumulate`와 똑같이 무조건 순서를 지켜 실행하도록 하거나, 병렬적으로 실행하도록 결정할 수 있다.

### 예시

아래 코드는 accumulate와 동일한 작업을 병렬적으로 실행시킨 코드다.

```cpp
#include <iostream>
#include <vector>
#include <numeric>
#include <execution>

int main()
{
    std::vector<int> list{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    std::cout << std::accumulate(
        list.begin(),
        list.end(),
        100,
        [](const auto& a, const auto& b) { return a - b; }) << std::endl;

    std::cout << std::reduce(
        std::execution::par, // 병렬적으로 실행
        list.begin(),
        list.end(),
        100,
        [](const auto& a, const auto& b) { return a - b; });

  // 출력 결과
  // 45
  // 81
}
```

## `inner_product`

두 배열 또는 컨테이너에 대해 내적을 수행한다.

```cpp
template< class InputIt1, class InputIt2, class T >
T inner_product( InputIt1 first1, InputIt1 last1,
                 InputIt2 first2, T init );

template< class InputIt1, class InputIt2, class T,
          class BinaryOp1, class BinaryOp2 >
T inner_product( InputIt1 first1, InputIt1 last1,
                 InputIt2 first2, T init,
                 BinaryOp1 op1, BinaryOp2 op2 );
```

```cpp
#include <iostream>
#include <vector>
#include <numeric>

int main()
{
    std::vector<int> v1{1, 3, 5}, v2{2, 4, 6};
    std::cout << std::inner_product(
        v1.begin(),
        v1.end(),
        v2.begin(),
        0);

    // 출력 결과
    // 44
}
```

## `adjacent_difference`

```cpp
template< class ExecutionPolicy,
          class ForwardIt1, class ForwardIt2 >
ForwardIt2 adjacent_difference( ExecutionPolicy&& policy,
                                ForwardIt1 first, ForwardIt1 last,
                                ForwardIt2 d_first );

template< class ExecutionPolicy,
          class ForwardIt1, class ForwardIt2, class BinaryOp >
ForwardIt2 adjacent_difference( ExecutionPolicy&& policy,
                                ForwardIt1 first, ForwardIt1 last,
                                ForwardIt2 d_first, BinaryOp op );
```

주어진 배열 또는 컨테이너의 원소들에 두 인접한 원소의 차를 대입한다.

### 예시

```cpp
#include <iostream>
#include <vector>
#include <numeric>
int main()
{
    std::vector<int> list{ 4, 12, 54, 38, 75, 23, 55, 35, 91 };
    for (auto it = list.begin(); it != list.end(); ++it) { std::cout << *it << ' ';}
    std::cout << std::endl;
    std::adjacent_difference(
        list.begin(),
        list.end(),
        list.begin());
    for (auto it = list.begin(); it != list.end(); ++it) { std::cout << *it << ' ';}
    std::cout << std::endl;

    // 출력 결과
    // 4 12 54 38 75 23 55 35 91
    // 4 8 42 -16 37 -52 32 -20 56
}
```

## `partial_sum`

```cpp
template< class InputIt, class OutputIt >
OutputIt partial_sum( InputIt first, InputIt last,
                      OutputIt d_first );

template< class InputIt, class OutputIt, class BinaryOp >
OutputIt partial_sum( InputIt first, InputIt last,
                      OutputIt d_first, BinaryOp op );
```

주어진 배열 또는 컨테이너의 원소들에 시작 지점부터 해당 원소까지의 구간합을 대입한다. 

```cpp
#include <iostream>
#include <vector>
#include <numeric>
int main()
{
    std::vector<int> list{ 4, 12, 54, 38, 75, 23, 55, 35, 91 };
    for (auto it = list.begin(); it != list.end(); ++it) { std::cout << *it << ' ';}
    std::cout << std::endl;
    std::partial_sum(
        list.begin(),
        list.end(),
        list.begin());
    for (auto it = list.begin(); it != list.end(); ++it) { std::cout << *it << ' ';}
    std::cout << std::endl;

    // 출력 결과
    // 4 12 54 38 75 23 55 35 91 
    // 4 16 70 108 183 206 261 296 387 
}
```

## `gcd`, `lcm`

```cpp
template< class M, class N >
constexpr std::common_type_t<M, N> gcd( M m, N n );

template< class M, class N >
constexpr std::common_type_t<M, N> lcm( M m, N n );
```

최대공약수, 최소공배수를 구한다.

예시는 없어도 될 듯...
