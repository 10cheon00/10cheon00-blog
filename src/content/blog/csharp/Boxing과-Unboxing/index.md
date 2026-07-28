---
title: Boxing과 Unboxing
description:
date: '2023-08-10T06:40:12.917Z'
tags: ["csharp"]
category:
  name: "Study"
  category:
    name: "CSharp"
---

# Boxing

값 형식을 `object`형식 또는 이 값 형식에서 구현된 임의의 인터페이스 형식으로 변환하는 프로세스라고 한다.

전자는 `int`나 `float`같은 값 형식을 `object`형식으로 바꾸는 것을 말하고 후자는 `struct`를 `interface`로 다룰 때를 의미한다. 

```csharp
int n = 123;
object o = n; // boxing
```

```csharp
interface ITest
{
    void DoSomething();
}

struct MyTest : ITest
{
    public void DoSomething()
    {
        // do something
    }
}

var myTest = new MyTest();
var myTestAsITest = (ITest)myTest; // boxing
```

값 형식과 다르게 `object`는 참조 형식이므로 실제 데이터는 힙 영역에 저장된다. 그렇기 때문에 값 형식에서 참조 형식 즉, `object`로 boxing하게 되면 **스택에 있던 데이터가 복사되어 힙에 생성된다**.

![Alt text](<../assets/Boxing과-Unboxing/image.png>)

그림으로 보면 이렇다.

# Unboxing

boxing을 통해 힙 영역에 생성된 데이터를 다시 원래의 값 형식으로 돌리려고 할 때, Unboxing이 일어난다.

```csharp
int n = 123;
object o = n; // boxing
int t = (int)o; // unboxing
```

```csharp
var myTest = new MyTest();
var myTestAsITest = (ITest)myTest; // boxing
var myTestUnboxing = (MyTest)myTestAsITest; // unboxing
```

이 과정에서 `object`가 가리키는 데이터는 무조건 **boxing으로 생성된 데이터여야 한다**. 그렇지 않으면 `InvalidCastException`에러가 발생한다.


```csharp
int n = 123;
object o = n; // boxing
int t = (short)o; // InvalidCastException occured.
```

어떻게 보면 `short`형 값을 `int`형 변수에 대입하는 것이라고 볼 수 있겠지만, boxing을 통해 생성된 데이터를 unboxing하려면 항상 원래의 형식으로 변환해야한다.

# 주의할 점

데이터를 복사하여야 하므로 그 과정이 매우 오래걸린다고 한다... 

# 참고자료

[Boxing 및 Unboxing(C# 프로그래밍 가이드) | Microsoft Learn](https://learn.microsoft.com/ko-kr/dotnet/csharp/programming-guide/types/boxing-and-unboxing)