---
title: C++ STL (2) - <algorithm> (1)
date: "2026-09-08T13:03:37+0900"
tags: ["C,C++", "STL"]
category:
  name: "C,C++"
series:
  name: "C++ STL"
  order: 2
---

> C++ 17을 기준으로 cppreference를 참고하여 작성했습니다.

# algorithm

C++이 미리 구현해둔 알고리즘 라이브러리의 일부를 제공한다. <algorithm>에서는 **순차적으로 실행되는 처리 연산이나 정렬에 대한 알고리즘**을 제공하고, 수치 연산이나 메모리 등에 대해서는 다른 STL이 제공한다.

## `for_each`

```cpp
template< class ExecutionPolicy, class ForwardIt, class UnaryFunc >
void for_each( ExecutionPolicy&& policy,
               ForwardIt first, ForwardIt last, UnaryFunc f );
```

주어진 범위 내에서 반복자를 순회하며 지정된 f를 실행한다.

### 예시

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

void f(const int& n) {
  std::cout << n << ' ';
}

int main() {
  std::vector<int> v{3, -4, 2, -8, 15, 267};
  std::for_each(v.begin(), v.end(), f);

  // 출력 결과
  // 3 -4 2 -8 15 267
}
```

## `all_of`, `any_of`, `none_of`

```cpp

template< class ExecutionPolicy, class ForwardIt, class UnaryPred >
bool all_of( ExecutionPolicy&& policy,
             ForwardIt first, ForwardIt last, UnaryPred p );

template< class ExecutionPolicy, class ForwardIt, class UnaryPred >
bool any_of( ExecutionPolicy&& policy,
             ForwardIt first, ForwardIt last, UnaryPred p );
template< class ExecutionPolicy, class ForwardIt, class UnaryPred >

bool none_of( ExecutionPolicy&& policy,
              ForwardIt first, ForwardIt last, UnaryPred p );
```

`for_each`와 비슷하게 주어진 범위 내를 순회하여 조건에 맞는 원소가 있는지 `bool` 타입으로 반환하는 함수들이다.

`all_of`는 모든 원소가 조건을 만족해야 `true`를, `any_of`는 아무 원소가 조건을 만족하면 `true`를, `none_of`는 모든 원소가 조건을 만족하지 않아야 `true`를 반환한다.

### 예시

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1,2,3,4,5};

  std::cout << std::all_of(v.begin(), v.end(), [](int n){return n > 0;})  << std::endl;
  // 출력 결과
  // 1
  std::cout << std::any_of(v.begin(), v.end(), [](int n){return n == 6;}) << std::endl;
  // 출력 결과
  // 0
  std::cout << std::none_of(v.begin(), v.end(), [](int n){return n != 0;}) << std::endl;
  // 출력 결과
  // 1

}
```

## `find`, find_if

```cpp
template< class ExecutionPolicy, class ForwardIt, class T >
ForwardIt find( ExecutionPolicy&& policy,
                ForwardIt first, ForwardIt last, const T& value );

template< class ExecutionPolicy, class ForwardIt, class UnaryPred >
ForwardIt find_if( ExecutionPolicy&& policy,
                   ForwardIt first, ForwardIt last, UnaryPred p );
```

주어진 범위 내에서 조건을 만족할 때까지 반복자를 순회한 후 반복자를 반환한다. 조건에 맞는 원소가 없었을 경우 `last` 반복자가 반환된다.

`find`는 원소의 값을 바로 비교하고, `find_if`는 비교 함수를 인자로 받아 실행 결과를 조건으로 삼는다.

### 예시

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1,2,3,4,5};

  auto it = std::find(v.begin(), v.end(), 10);
  std::cout << (bool)(it == v.end()) << std::endl;
  // 출력 결과
  // 1

  auto it2 = std::find_if(v.begin(), v.end(), [](const int& n) { return n % 2 == 0; });
  std::cout << *it2 << std::endl;
  // 출력 결과
  // 2
}
```

## count, count_if

```cpp
template< class ExecutionPolicy, class ForwardIt, class T >
typename std::iterator_traits<ForwardIt>::difference_type
    count( ExecutionPolicy&& policy,
           ForwardIt first, ForwardIt last, const T& value );

template< class ExecutionPolicy, class ForwardIt, class UnaryPred >
typename std::iterator_traits<ForwardIt>::difference_type
    count_if( ExecutionPolicy&& policy,
              ForwardIt first, ForwardIt last, UnaryPred p );
```

주어진 범위 내에서 반복자를 순회하며, 조건을 만족하는 원소의 개수를 반환한다.

`find`와 비슷하게, `count`는 원소의 값을 바로 비교하고, `count_if`는 비교 함수를 인자로 받아 실행한다.

### 예시

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> v{1,2,2,3,4};

  auto num = std::count(v.begin(), v.end(), 2);
  std::cout << num << std::endl;
  // 출력 결과
  // 2

  auto num2 = std::count_if(v.begin(), v.end(), [](const int& n) { return n <= 2; });
  std::cout << num2 << std::endl;
  // 출력 결과
  // 3
}
```

## search

```cpp
template< class ExecutionPolicy, class ForwardIt1, class ForwardIt2 >
ForwardIt1 search( ExecutionPolicy&& policy,
                   ForwardIt1 first1, ForwardIt1 last1,
                   ForwardIt2 first2, ForwardIt2 last2 );

template< class ExecutionPolicy,
class ForwardIt1, class ForwardIt2, class BinaryPred >
ForwardIt1 search( ExecutionPolicy&& policy,
                   ForwardIt1 first1, ForwardIt1 last1,
                   ForwardIt2 first2, ForwardIt2 last2,
                   BinaryPred p );

template< class ForwardIt, class Searcher >
ForwardIt search( ForwardIt first1, ForwardIt last1,
                  const Searcher& searcher );
```

[`first1`, `last1`)에서, [`first2`, `last2`)이 등장하는 구간의 첫 반복자를 반환한다. 찾고자 하는 범위의 원소들이 타겟에 없다면, `last2`가 반환된다.

> 시간 복잡도는 O(n)이다.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> target{1,2,3,5,4};
  std::vector<int> src1{3,5};
  std::vector<int> src2{1,4,3};

  auto it = std::search(target.begin(), target.end(), src1.begin(), src1.end());
  std::cout << (it != src1.end()) << std::endl;
  // 출력 결과
  // 1

  auto it2 = std::search(target.begin(), target.end(), src2.begin(), src2.end(),
                        [](const int& a, const int& b){return a == b; });
  std::cout << (it2 != src2.end()) << std::endl;
  // 출력 결과
  // 0
}

```

## copy, copy_if

```cpp
template< class ExecutionPolicy,
          class ForwardIt1, class ForwardIt2 >
ForwardIt2 copy( ExecutionPolicy&& policy,
                 ForwardIt1 first, ForwardIt1 last,
                 ForwardIt2 d_first );

template< class ExecutionPolicy,
          class ForwardIt1, class ForwardIt2, class UnaryPred >
ForwardIt2 copy_if( ExecutionPolicy&& policy,
                    ForwardIt1 first, ForwardIt1 last,
                    ForwardIt2 d_first, UnaryPred pred );
```

[`first`, `last`) 범위의 원소들을 `d_first`부터 차례대로 복사하여 넣는다. `copy_if`는 범위 내 원소들 중 조건을 만족하는 원소들만 복사하여 넣는다.

### 예시

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> src{10,20,30,40,50};
  std::vector<int> target1 = std::vector<int>(5);
  std::vector<int> target2 = std::vector<int>(2);
  std::vector<int> target3 = std::vector<int>(5);

  std::copy(src.begin(), src.end(), target1.begin());

  for(const int& n : target1) {
    std::cout << n << ' ';
  }
  std::cout << std::endl;

  // 출력 결과
  // 10 20 30 40 50

  // 크기가 2인 컨테이너에 5개를 복사하는 경우
  std::copy(src.begin(), src.end(), target2.begin());

  for(const int& n : target2) {
    std::cout << n << ' ';
  }
  std::cout << std::endl;

  // 출력 결과
  // 10 20

  std::copy_if(src.begin(), src.end(), target3.begin(), [](const int& n) { return n >= 30; });

  for(const int& n : target3) {
    std::cout << n << ' ';
  }
  std::cout << std::endl;

  // 출력 결과
  // 30 40 50
}
```

## move

```cpp
template< class ExecutionPolicy, class ForwardIt1, class ForwardIt2 >
ForwardIt2 move( ExecutionPolicy&& policy,
                 ForwardIt1 first, ForwardIt1 last, ForwardIt2 d_first );
```

[`first`, `last`) 범위의 모든 원소들을 `d_first`에 차례대로 옮긴다.

옮기는 연산은 <utility>에 정의된 `std::move`를 사용한다.

### 예시

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> from{10,20,30,40,50};
  std::vector<int> to{0,1,2,3,4,5,6,7,8,9};

  std::move(from.begin(), from.end(), to.begin());

  for(const int& n : to) {
    std::cout << n << ' ';
  }
  std::cout << std::endl;

  // 출력 결과
  // 10 20 30 40 50 5 6 7 8 9
}
```

## swap

```cpp
template< class T >
void swap( T& a, T& b );

template< class T2, std::size_t N >
void swap( T2 (&a)[N], T2 (&b)[N] );
```

주어진 두 변수가 가리키는 값을 교환한다. 컨테이너에 따라 이 함수를 자신의 타입에 맞게 템플릿 특수화를 할 수 있다.

### 예시

```cpp
#include <algorithm>
#include <iostream>

int main() {
  int a = 100, b = 200;
  std::swap(a, b);
  std::cout << a << ", " << b;
  // 출력 결과
  // 200, 100
}
```

## transform

```cpp
template< class ExecutionPolicy,
          class ForwardIt1, class ForwardIt2, class UnaryOp >
ForwardIt2 transform( ExecutionPolicy&& policy,
                      ForwardIt1 first1, ForwardIt1 last1,
                      ForwardIt2 d_first, UnaryOp unary_op );

template< class ExecutionPolicy,
          class ForwardIt1, class ForwardIt2,
          class ForwardIt3, class BinaryOp >
ForwardIt3 transform( ExecutionPolicy&& policy,
                      ForwardIt1 first1, ForwardIt1 last1,
                      ForwardIt2 first2,
                      ForwardIt3 d_first, BinaryOp binary_op );
```

[`first`, `last`) 범위의 원소들을 주어진 `unary_op` 또는 `BinaryOp`에 따라 변환한 후 `d_first`부터 차례대로 넣는다.

### 예시

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> from{10,20,30,40,50};
  std::vector<int> to1 = std::vector<int>(5);
  std::vector<int> to2 = std::vector<int>(5);

  std::transform(from.begin(), from.end(), to1.begin(), [](const int& n) { return n + 1000; });

  for(const int& n : to1) {
    std::cout << n << ' ';
  }
  std::cout << std::endl;
  // 출력 결과
  // 1010 1020 1030 1040 1050

  std::transform(from.begin(), from.end(), to2.begin(), [](const int& n) { return n >= 30; });
  for(const int& n : to2) {
    std::cout << n << ' ';
  }
  std::cout << std::endl;
  // 출력 결과
  // 0 0 1 1 1
}
```

## fill, fill_n

```cpp
template< class ExecutionPolicy, class ForwardIt, class T >
void fill( ExecutionPolicy&& policy,
           ForwardIt first, ForwardIt last, const T& value );

template< class ExecutionPolicy,
          class ForwardIt, class Size, class T >
ForwardIt fill_n( ExecutionPolicy&& policy,
                  ForwardIt first, Size count, const T& value );
```

[`first`, `last`) 범위의 원소에 `value`를 대입한다. `fill_n`은 `count`만큼의 원소에 대해서만 대입을 수행한다.

### 예시

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> target1 = std::vector<int>(5);
  std::vector<int> target2 = std::vector<int>(3);

  std::fill(target1.begin(), target1.end(), 100);
  for (const int& n : target1) {
    std::cout << n << ' ';
  }
  std::cout << std::endl;
  // 출력 결과
  // 100 100 100 100 100

  std::fill_n(target2.begin(), 5, 300);
  for (const int& n : target2) {
    std::cout << n << ' ';
  }
  std::cout << std::endl;
  // 출력 결과
  // 300 300 300
}
```

## remove, remove_if

```cpp
template< class ExecutionPolicy, class ForwardIt, class T >
ForwardIt remove( ExecutionPolicy&& policy,
                  ForwardIt first, ForwardIt last, const T& value );

template< class ExecutionPolicy, class ForwardIt, class UnaryPred >
ForwardIt remove_if( ExecutionPolicy&& policy,
                     ForwardIt first, ForwardIt last, UnaryPred p );
```

[`first`, `last`) 범위의 원소의 값이 `value`라면 삭제한다. `remove_if`는 값 대신 조건에 따라 삭제한다.

### 예시

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> arr1{1,2,2,2,3,4,4,5};
  std::vector<int> arr2{1,2,3,3,4,4,5,5};

  std::remove(arr1.begin(), arr1.end(), 2);
  for (const int& n : arr1) {
    std::cout << n << ' ';
  }
  std::cout << std::endl;
  // 출력 결과
  // 1 3 4 4 5 4 4 5

  auto bound = std::remove_if(arr2.begin(), arr2.end(), [](const int& n){return n % 2 == 0; });
  for (const int& n : arr2) {
    std::cout << n << ' ';
  }
  std::cout << std::endl;
  for (auto it = arr2.begin(); it != bound; ++it) {
    std::cout << *it << ' ';
  }
  // 출력 결과
  // 1 3 3 5 5 4 5 5
  // 1 3 3 5 5
}
```

출력 결과를 보면 삭제를 한다고 크기가 줄어들지는 않는 것을 알 수 있다. 처리 과정에서 현재 원소를 삭제한다는 것은 그 자리에 다음 원소의 값을 옮기는 것이다.

`remove`함수의 실행 결과로 반환되는 반복자는 삭제 연산이 처리된 이후 유효한 값의 범위를 나타낸다.

## unique

```cpp
template< class ExecutionPolicy, class ForwardIt >
ForwardIt unique( ExecutionPolicy&& policy,
                  ForwardIt first, ForwardIt last );

template< class ExecutionPolicy, class ForwardIt, class BinaryPred >
ForwardIt unique( ExecutionPolicy&& policy,
                  ForwardIt first, ForwardIt last, BinaryPred p );
```

[`first`, `last`) 범위의 원소에 대해 연속에서 등장하는 원소들 중 첫 원소를 제외한 나머지 원소를 제거한다.

### 예시

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> arr1{1,2,2,2,2,4,4,4,1,1,4,3,3,2,5};
  std::vector<int> arr2 = arr1;
  auto bound1 = std::unique(arr1.begin(), arr1.end());
  auto bound2 = std::unique(arr2.begin(), arr2.end(), [](int& res, int& n){return n == res;});

  for (auto it = arr1.begin(); it != bound1; ++it) {
    std::cout << *it << ' ';
  }
  // 출력 결과
  // 1 2 4 1 4 3 2 5
  std::cout << std::endl;

  for (auto it = arr2.begin(); it != bound2; ++it) {
    std::cout << *it << ' ';
  }
  // 출력 결과
  // 1 2 4 1 4 3 2 5
}
```

## reverse

```cpp
template< class ExecutionPolicy, class BidirIt >
void reverse( ExecutionPolicy&& policy, BidirIt first, BidirIt last );
```

[`first`, `last`) 범위의 원소에 대해 순서를 뒤집는다.

### 예시

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
  std::vector<int> arr{1,2,3,4,5,6,7,8};
  std::reverse(arr.begin(), arr.end());

  for (const int& n : arr) {
    std::cout << n << ' ';
  }
  // 출력 결과
  // 8 7 6 5 4 3 2 1
}
```
