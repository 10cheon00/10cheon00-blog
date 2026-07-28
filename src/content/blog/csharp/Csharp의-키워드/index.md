---
title: Csharp의 키워드
description:
date: '2023-08-25T14:32:32.484Z'
tags: ["csharp"]
category:
  name: "Study"
  category:
    name: "CSharp"
---

몇 가지 처음 보는 키워드들을 정리해보았다.

# as

영어사전에서 as는 '~처럼', '~때문에', '~로서' 등의 의미가 있지만 C#에서는 '~처럼'의 개념을 사용하여 타입을 명시적으로 변환한다.

`E as T`라는 식이 실행되면 인스턴스 `E`는 타입 `T`'처럼' 변환한다.

여기서 중요한 점은 참조, `nullable`, boxing과 unboxing 변환만 가능하다. int를 float으로 바꾸는 것처럼 값 형식에 대해서는 사용할 수는 없다.

# base

서브 클래스에서 부모 클래스의 멤버에 엑세스할 때 사용한다.

C++에서는 부모 클래스의 멤버를 사용하려면 `Parent::x`처럼 직접 부모 클래스명을 써야 했지만 C#에서는 `base`연산자로 접근이 가능하다.

특히 중요한 것은 생성자에서 부모 클래스의 생성자를 호출할 때다.

```csharp
class Parent
{
    private int x;

    Parent(int x)
    {
        _x = x;
    }
}

class Child : Parent
{
    Child(int x) : base(x) { }
}
```

C++에서는 부모 생성자를 호출할 때 직접 부모 클래스명을 써야 했지만 여기서도 `base`연산자를 통해 부모 클래스의 생성자를 호출한다.

# checked / unchecked

[Csharp의 형변환](/csharp/Csharp의-형변환) 게시글에서 `checked`와 `unchecked`가 등장한다.

정수 계열 연산 및 변환 시기에 일어나는 오버플로우를 검사하는 컨텍스트를 지정한다.

`checked`일 때는 `System.OverflowException`이 `throw`되고, 상수 식에서는 컴파일 단계에서 에러가 일어난다.

`unchecked`일 때는 형식에 맞지 않는 상위 비트를 삭제한다고 한다. 

```csharp
int a = int.MaxValue;
unchecked
{
    Console.WriteLine(a + 3); // output : -2147483646
}
checked
{
    Console.WriteLine(a + 3); // throw Arithmetic operation resulted in an overflow.
}
```

기본적으로는 `unchecked` 컨텍스트에서 실행된다. 그러나 상수 식은 `checked` 컨텍스트에서 실행된다.

# decimal

`double`은 8바이트인 반면 `decimal`은 16바이트다. `double`은 부동 소수점 형식이지만, `decimal`은 십진 부동 소수점 형식이다. 부동 소수점 형식의 경우 0.1같은 값을 저장하면 실제로는 약간의 오차가 있지만 십진 부동소수점 형식의 경우 정확하게 0.1을 저장한다.

이렇게 정확한 실수값을 저장해야한다면 `decimal`을 사용하는 것이 좋다.

# delegate

메서드나 람다 식을 인스턴스화 한다. 인스턴스화 된 `delegate`를 호출하면 매개 변수가 인스턴스에게 전달되어 실행된다. 함수형 프로그래밍에서 콜백을 사용하는 것처럼 C#에서도 `delegate`를 통해 인스턴스화된 메서드를 인자로 받아 콜백함수처럼 실행할 수 있다.

# foreach

js에서 배열을 순회하기 위해 `forEach()`를 썼었던 것처럼, C#에서도 인덱스를 사용하지 않고 순회할 수 있다. 

```csharp
int[] arr = new int[5]{1,2,3,4,5};
foreach(int item in arr)
{
    Console.WriteLine($"{item}"); // output : 1 2 3 4 5
}
```

대신에 `foreach`문을 사용하면서 인덱스를 얻으려면 다소 복잡한 방법을 사용해야한다. 

# internal

`public`처럼 엑세스 한정자의 일종이다. 하지만 같은 어셈블리 내에서만 접근이 가능하고 다른 어셈블리에서는 접근이 제한된다.


```csharp
// A.cs
internal class A {}

// B.cs
A a = new A(); // CS0122 error ocurred
```

A.cs와 B.cs는 다른 어셈블리로 나뉜다. 따라서 B.cs 내에서 클래스 A에 접근하려고 할 때 에러가 일어나게 된다.