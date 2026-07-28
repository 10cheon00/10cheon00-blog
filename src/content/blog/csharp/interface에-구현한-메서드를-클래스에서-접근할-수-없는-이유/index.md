---
title: interface에 구현한 메서드를 클래스에서 접근할 수 없는 이유
description:
date: "2023-08-22T12:47:15.703Z"
tags: ["csharp"]
category:
  name: "Study"
  category:
    name: "CSharp"
---

# 동기

인터페이스에 기본 메서드를 구현한 다음 그 인터페이스를 구현하는 클래스에서 기본 메서드를 호출하려고 하니 에러가 생겼다.

```csharp
using System;

public class HelloWorld
{
    public interface IA
    {
        void Foo()
        {
            Bar();
        }

        void Bar();
    }
    public class B : IA
    {
        public void Bar()
        {
            Console.WriteLine ("Hello World");
        }
    }
    public static void Main(string[] args)
    {
        B b = new B();
        b.Foo(); // error CS1061
    }
}
```

에러 메시지는 이렇다.

> /tmp/C2ywkFh53T.cs(27,11): error CS1061: 'HelloWorld.B' does not contain a definition for 'Foo' and no accessible extension method 'Foo' accepting a first argument of type 'HelloWorld.B' could be found (are you missing a using directive or an assembly reference?)

해석하자면, 클래스 `B`에는 `Foo`메서드에 대한 정의가 없고, 클래스 `B` 타입의 인수를 사용하는 확장 메서드가 없다는 말이다. 후자는 확장명 메서드를 의미하는데 인터페이스와는 관계없는 내용이다.

어쨌든 클래스 `B`의 인스턴스 `b`는 `Foo`메서드에 대한 정의가 없다는 것이다. 여기까지만 해도 인터페이스를 구현했고, 인터페이스에 정의된 모든 메서드는 `public`이니까 클래스에서도 접근이 될거라 생각했다. 그런데 에러를 얻으니 당황스러웠다.

# 이유

이 문제는 인스턴스를 **클래스로 접근하지 않고 인터페이스로 접근하면 해결된다**.

```csharp
public static void Main(string[] args)
{
    IA b = new B();
    b.Foo();
}
```

이렇게 인터페이스로의 접근을 강제함으로써 클래스가 아닌 인터페이스를 사용하게 되므로 특정 클래스에 의존하지 않게 되는 효과를 볼 수 있다.

**[:link: Explicit interface implementation | Stack Overflow](https://stackoverflow.com/a/3034603)**

하지만 왜 클래스로 접근했을 때에는 메서드를 호출할 수 없었을까?

> An explicit interface implementation doesn't have an access modifier since it isn't accessible as a member of the type it's defined in. Instead, it's only accessible when called through an instance of the interface.
>
> **[:link: Explicit interface implementation | Microsoft Learn ](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/interfaces/explicit-interface-implementation)**

공식 문서에 따르면 명시적 인터페이스 메서드는 ***접근 제한자를 가지지 않고 오직 인스턴스를 인터페이스로 접근했을 때에만 사용가능하다***고 되어있다.

접근 제한자를 가지지 않고 인터페이스로만 접근해야하기 때문에 클래스로는 그 메서드를 호출할 수 없던 것이다.

따라서 명시적 인터페이스 메서드를 호출하기 위해서는 타입 캐스팅이 꼭 필요하다.

# 귀찮은 캐스팅

하지만 캐스팅을 빈번하게 해야하는 상황이라면 클래스 인스턴스를 인터페이스로 참조하는 변수를 만들어야 한다.

변수가 하나 더 생기기 때문에 조금 마음에 안든다면 아래처럼 내부적으로 캐스팅하는 메서드를 두어 관리할 수 있다.

```csharp
using System;

public class Program
{
    public interface IA
    {
        void Foo()
        {
            // explicit interface method.
        }
    }
    public class B : IA
    {
        private IA _castToIA => this;
        public IA CastToIA
        {
            get { return _castToIA; }
        }
    }
    public static void Main(string[] args)
    {
        B b = new B();
        b.CastToIA.Foo();
    }
}
```

**[:link: How to call explicit interface implementation methods internally without explicit casting?](https://stackoverflow.com/a/1869420)**