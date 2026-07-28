---
title: record
description:
date: '2023-08-23T15:18:04.704Z'
tags: ["csharp"]
category:
  name: "Study"
  category:
    name: "CSharp"
---

# record

`record`는 주로 변하지 않는, immutable한 데이터를 다루기 위해 도입되었다.

C#9부터 추가된 키워드인 새로운 참조 형식이다. C#10에서는 이 `record`를 값 형태로 다루기 위해 레코드 구조체가 추가되었다고 한다. 이는 참조 기반이 아닌 값을 기반으로 한다는 점에서 클래스와 다르다고 한다.

`record` 또는 `record class`로 선언하면 참조 형식으로, `record struct`로 선언하면 값 형식으로 다룰 수 있다.

# 사용방법

두 가지 방법이 있다.

```csharp
public record Coord(double x, double y, double z);
// or
public record Coord
{
  public required double x { get; init; };
  public required double y { get; init; };
  public required double z { get; init; };
}
```

전자의 경우 primary constructor를 사용하여 `record`를 정의하는 방법이다. 정의된 각 파라미터마다 컴파일러가 자동으로 public형태의 변수를 생성한 후 파라미터에 전해진 값이 저장된다.

`record`, `readonly record struct`로 선언한다면 인스턴스를 생성한 이후로는 값을 수정할 수 없고, `record struct`로 선언하면 인스턴스를 생성한 이후에도 값을 수정할 수 있다.

# 동일성 판단

`class`는 두 변수가 같은 인스턴스를 참조하고 있을 때 동일하다.

`struct`는 두 변수가 같은 타입이고 내부에 저장된 값이 모두 같을 경우 동일하다.

`record`는 `struct`와 동일하게 두 변수가 같은 타입이고 내부에 저장된 값이 모두 같을 경우 동일하다.

따라서 사용자가 기본 제공되는 비교 연산자를 재정의하지 않는 이상, `record`형 변수의 비교는 값이 모두 동일한지 검사하게 된다.

```csharp
public record Person(string FirstName, string LastName, string[] PhoneNumbers);

public static void Main()
{
    var phoneNumbers = new string[2];
    Person person1 = new("Nancy", "Davolio", phoneNumbers);
    Person person2 = new("Nancy", "Davolio", phoneNumbers);
    Console.WriteLine(person1 == person2); // output: True

    person1.PhoneNumbers[0] = "555-1234";
    Console.WriteLine(person1 == person2); // output: True

    Console.WriteLine(ReferenceEquals(person1, person2)); // output: False
}
```

공식 문서에서 제공하는 예시에는 두 개의 레코드를 생성한 후 비교하고 있다. 

```csharp
var phoneNumbers = new string[2];
Person person1 = new("Nancy", "Davolio", phoneNumbers);
Person person2 = new("Nancy", "Davolio", phoneNumbers);
Console.WriteLine(person1 == person2); // output: True
```

이 시점에서는 `person1`과 `person2`에 저장된 값은 모두 동일하다. `PhoneNumbers`에 저장된 값은 모두 같은 `phoneNumbers`인스턴스를 가리키고 있기 때문에 동일하다고 판단한다. (string은 참조 형식이다.)

```csharp
person1.PhoneNumbers[0] = "555-1234";
Console.WriteLine(person1 == person2); // output: True

Console.WriteLine(ReferenceEquals(person1, person2)); // output: False
```

여기서 person1의 PhoneNumbers를 변경하여도 phoneNumbers의 값을 변경하게 되므로 두 `record` 인스턴스는 동일하다.

하지만 레퍼런스 형태로 비교하게 된다면 `class`형태의 두 변수를 비교하는 것처럼 같은 인스턴스를 가리키는지 비교하는 것이므로 동일하지 않다.

# 비파괴적 수정(Nondestructive mutation)

immutable한 `record`를 정의 후 생성하였다 하더라도 수정이 필요한 경우가 있을 때에는 `with` 키워드를 사용하여 수정할 수 있다.

사실 수정이 아니라 **새로운 인스턴스**를 생성하여 대입한다.

```csharp
Person person1 = new("Nancy", "Davolio") { PhoneNumbers = new string[1] };
Console.WriteLine(person1);
// output: Person { FirstName = Nancy, LastName = Davolio, PhoneNumbers = System.String[] }

Person person2 = person1 with { FirstName = "John" };
Console.WriteLine(person2);
// output: Person { FirstName = John, LastName = Davolio, PhoneNumbers = System.String[] }
Console.WriteLine(person1 == person2); // output: False
```

생성한 `person1`인스턴스를 기반으로 `with`키워드를 사용하여 새로운 인스턴스를 생성하여 `person2`에 할당한다.

이렇게 한 후 `person1`과 `person2`를 비교하면 두 인스턴스가 다른 값을 갖고 있기 때문에 같지 않다고 한다.

`with`키워드를 사용하여 복제하는 경우, **얕은 복사**를 통해 복제하는 것이기 때문에 참조 형식의 변수일 경우, 복제 후에는 같은 인스턴스를 가리키게 된다.

# 상속

상속은 `record class`로 선언하였을 때에만 가능하다.

`record`간 상속이 가능하지만 `record`와 `class`간 상속은 불가능하다.

```csharp
public abstract record Person(string FirstName, string LastName);
public record Teacher(string FirstName, string LastName, int Grade)
    : Person(FirstName, LastName);

public static void Main()
{
    Person teacher = new Teacher("Nancy", "Davolio", 3);
    Console.WriteLine(teacher);
    // output: Teacher { FirstName = Nancy, LastName = Davolio, Grade = 3 }
}
```

클래스를 상속할 때처럼 `record`간 상속을 정의하면 된다. 

**[:link: Records | Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record)**
