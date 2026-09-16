---
title: C++ STL (3) - std::numeric_limits
date: "2026-09-16T17:00:34+0900"
tags: ["C,C++", "STL"]
category:
  name: "C,C++"
series:
  name: "C++ STL"
  order: 2
---

> C++ 17을 기준으로 cppreference를 참고하여 작성했습니다.

# std::numeric_limits

`int`, `float`, `unsigned long`과 같이 C++이 제공하는 기본 자료형에 대한 속성들을 제공하는 클래스 템플릿이다. 자료형에 `const`, `volatile`이 붙은 타입과 붙지 않은 타입을 동일하게 처리한다.

기본 자료형의 별칭으로 정의된 타입(`std::size_t`)도 이 클래스 템플릿이 특수화(specialization) 될 수 있다. 그러나 `std::nullptr_t`나 `std::complex<T>`와 같이 기본 자료형이 아닌 타입의 경우 특수화된 클래스 템플릿이 없다.

# 예시

사실 특수화된 클래스 템플릿을 쓰는 것이므로, 이미 정의가 다 되어 있다. 

```cpp
#include <iostream>
#include <limits>
#include <iomanip>

using namespace std;

int main()
{
    cout << left
         << setw(8)  << "type"     << "│ "
         << setw(14) << "lowest()" << "│ "
         << setw(14) << "min()"    << "│ "
         << "max()" << '\n';

    cout << setw(8)  << "bool" << "│ "
         << setw(14) << numeric_limits<bool>::lowest() << "│ "
         << setw(14) << numeric_limits<bool>::min()    << "│ "
         << numeric_limits<bool>::max() << '\n';

    cout << setw(8)  << "uchar" << "│ "
         << setw(14) << static_cast<int>(numeric_limits<unsigned char>::lowest()) << "│ "
         << setw(14) << static_cast<int>(numeric_limits<unsigned char>::min())    << "│ "
         << static_cast<int>(numeric_limits<unsigned char>::max()) << '\n';

    cout << setw(8)  << "int" << "│ "
         << setw(14) << numeric_limits<int>::lowest() << "│ "
         << setw(14) << numeric_limits<int>::min()    << "│ "
         << numeric_limits<int>::max() << '\n';

    cout << setw(8)  << "float" << "│ "
         << setw(14) << numeric_limits<float>::lowest() << "│ "
         << setw(14) << numeric_limits<float>::min()    << "│ "
         << numeric_limits<float>::max() << '\n';

    cout << setw(8)  << "double" << "│ "
         << setw(14) << numeric_limits<double>::lowest() << "│ "
         << setw(14) << numeric_limits<double>::min()    << "│ "
         << numeric_limits<double>::max() << '\n';

    return 0;
}
```

```txt
type    │ lowest()      │ min()         │ max()
bool    │ 0             │ 0             │ 1
uchar   │ 0             │ 0             │ 255
int     │ -2147483648   │ -2147483648   │ 2147483647
float   │ -3.40282e+38  │ 1.17549e-38   │ 3.40282e+38
double  │ -1.79769e+308 │ 2.22507e-308  │ 1.79769e+308
```
