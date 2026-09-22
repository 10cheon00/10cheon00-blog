---
title: C++ STL (4) - std::bitset
date: "2026-09-22T21:48:30+0900"
tags: ["C,C++", "STL"]
category:
  name: "C,C++"
series:
  name: "C++ STL"
  order: 3
---

> C++ 17을 기준으로 cppreference를 참고하여 작성했습니다.

# std::bitset

고정된 크기를 갖는 변수를 값으로 쓰지 않고 비트 플래그의 집합으로 쓰는 상황에서 사용할 수 있는 클래스 템플릿이다. 비트 연산자를 지원한다.

정수값을 인자로 넣을 수도 있지만 문자열도 가능하다. 문자가 의미하는 값을 주입해야한다.

# 예시

```cpp
#include <iostream>
#include <bitset>

int main()
{

	std::bitset<8> zero;
	std::bitset<8> number(42ULL);
	std::bitset<8> text("10110010");
	std::bitset<8> copied(text);


	std::cout << "zero\t : " << zero << std::endl;
	std::cout << "number\t : " << number << std::endl;
	std::cout << "text\t : " << text << std::endl;
	std::cout << "copied\t : " << copied << std::endl;
	
    std::cout << "number.all()\t : " << number.all() << '\n';
    std::cout << "number.any()\t : " << number.any() << '\n';
    std::cout << "number.none()\t : " << number.none() << '\n';
    std::cout << "number.count()\t : " << number.count() << '\n';

	  for (int i = 0; i < number.size(); i++) {
        std::cout << "number.test("<<i<<")\t : " << number.test(i) << '\n';
    }
    
    
    std::cout << std::endl;
    std::cout << "before shifted left, number is " << number.to_string() << std::endl;
    number <<= 2;
    std::cout << "after shifted left, number is " << number.to_string() << std::endl;
    std::cout << std::endl;
    std::cout << "before OR 0xFF, number is " << number.to_string() << std::endl;
    number |= 0b00001111;
    std::cout << "after OR 0xFF, number is " << number.to_string() << std::endl;
    
	return 0;
}
```

```txt
zero	 : 00000000
number	 : 00101010
text	 : 10110010
copied	 : 10110010
number.all()	 : false
number.any()	 : true
number.none()	 : false
number.count()	 : 3
number.test(0)	 : false
number.test(1)	 : true
number.test(2)	 : false
number.test(3)	 : true
number.test(4)	 : false
number.test(5)	 : true
number.test(6)	 : false
number.test(7)	 : false

before shifted left, number is 00101010
after shifted left, number is 10101000

before OR 0xFF, number is 10101000
after OR 0xFF, number is 10101111
```
