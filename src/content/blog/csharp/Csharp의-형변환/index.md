---
title: Csharp의 형변환
description:
date: '2023-08-10T09:19:41.466Z'
tags: ["csharp"]
category:
  name: "Study"
  category:
    name: "CSharp"
---

# 암시적 형변환

암시적 형변환은 여러 상황에서 일어난다. 대표적으로 function member invocation(?), 캐스팅 또는 대입 시기에 일어난다.

### 동일 형변환

같은 타입으로의 형변환할 때 일어난다.

- `object`와 `dynamic` 사이
- 튜플이 같은 항을 가질 때 각각 대응하는 항 사이
- 같은 제네릭 형식으로 형성된 타입 사이

대부분의 경우에 이런 형변환은 런타임에서 영향이 없다고 한다.

### 숫자 형변환

- `byte` -> `short`, `int`, `long` ...
- `int` -> `long`, `float`, ...
- `long` -> `float`, `double` ...
- `float` -> `double`
- ...

어떤 자료형이 상대적으로 더 큰 자료형으로 형변환 될 때 암시적 숫자 형변환이 일어난다.

정수 자료형에서 실수 자료형으로 형변환이 일어날 때, (ex. `int`나 `long`이 `float`이나 `double`로 형변환이 일어날 때) 정확도가 떨어질 수 있지만 크기값(magnitude)은 변하지 않는다고 한다.

### 열거 형변환

`int`값 또는 `0`값이 `enum_type` 그리고 기본 유형이 `enum_type`인 `nullable_value_type`으로 형변환 될 때 일어난다.

```csharp
enum E {
  A = 0,
  B
}

E e = 0; // implicit enumeration conversion
```

### 보간(?) 문자열 형변환

`$"{variable}"`를 이용해 만들어진 문자열이 `"{0}", variable`로 바뀔 때 일어난다.

구체적으로는 interpolated_string_expression이 `System.FormattableString`이나 `System.IFormattable`로 형변환될 때 일어난다.

### Boxing

값 형식이 참조 형식으로 변환될 때 일어난다. 자세한 설명은 [Boxing과 Unboxing](/others/Boxing과-Unboxing)에 정리했다.

### 그 외

공식 문서에는 정말 많은 형변환이 있는데 나머지는 이해하기 어려워 정리하지 않기로 했다...

# 명시적 형변환

명시적 형변환은 캐스팅을 할 때 일어난다. 암시적 형변환이 항상 성공하는 것과는 반대로 명시적 형변환은 성공하지 않을 때도 있으며 정보를 잃어버리기도 한다.

### 숫자 형변환

- `int` -> `short`, `byte`, ...
- `float` -> `int` , `short`, `byte`, ...
- `double` -> `float`, `int` ...
- ...

대개 더 큰 자료형이 작은 자료형으로 형변환 될 때 일어난다.

이 때 정보를 잃어버릴 수 있을 뿐만 아니라 에러를 throw할 수도 있다.

- `decimal` -> 정수형 변수

  실수값을 원점에 가까운 방향으로 반올림(?)하여 정수형 변수에 저장한다. 만약 정수형 변수의 범위 바깥의 값이라면 `System.OverflowException`이 발생한다.

- `float` 또는 `decimal` -> 정수형 변수

  - `checked`
    - `NaN`이나 무한값일 경우 `System.OverflowException`이 발생한다.
    - 그렇지 않으면 실수값을 원점에 가까운 방향으로 반올림(?)하여 저장한다. 이 때 정수형 변수의 범위 바깥의 값이라면 `System.OverflowException`이 발생한다.
  - `unchecked`

    항상 형변환이 성공한다.

    - `NaN`이나 무한값일 경우 불특정값으로 저장된다.
    - 그렇지 않으면 실수값을 원점에 가까운 방향으로 반올림(?)하여 저장한다. 이 때 정수형 변수의 범위 바깥의 값이라면 불특정값으로 저장된다.

- `double` -> `float`

  `double`값이 가까운 `float`값으로 바뀌어 저장된다.

  - `float`으로 나타내기엔 너무 작은 값이 변환될 때에는 `0`이 저장된다. 
  - `float`으로 나타내기에 너무 큰 값이 변환될 때에는 무한값이 저장된다.
  - `double`값이 `NaN`이라면 `float`에도 `NaN`으로 저장된다.

- `float` 또는 `double` -> `decimal`

  실수값이 `decimal`타입으로 변환되고 가까운 값으로 반올림되어 저장된다.
  
  - `decimal`로 나타내기에 너무 작은 값이 변환될 때에는 `0`이 저장된다.
  - `decimal`로 나타내기에 너무 큰 값이거나 무한값이 변환될 때에는, `decimal`이 무한값을 지원한다면(?) 무한값으로 저장되고 그렇지 않다면 `System.OverflowException`이 발생한다.
  - `NaN`이 변환될 때에는 `decimal`이 `NaN`을 지원한다면 `NaN`이 저장되고 그렇지 않으면 `System.OverflowException`이 발생한다.

- `decimal` -> `float` 또는 `double`

  가까운 값으로 반올림되어 저장된다. `float` 또는 `double`이 `decimal`로 변환될 때처럼 동작하지만 정확도가 조금 떨어질 수 있을 뿐 에러를 일으키지 않는다.

### 참조 형변환

런타임에 참조 형변환이 성공하려면, 대상이 `null`이거나, 대상의 타입이 암시적인 형변환으로 목표의 타입이 될 수 있어야 한다. 그렇지 않은 경우에는 `System.InvalidCastException`이 발생한다.

> 암시적 또는 명시적 참조 형변환은 값을 수정하는 일이 일어나지 않는다.

- `object`나 `dynamic`이 다른 참조 형식으로 변환될 때
- 자식 클래스로 생성된 인스턴스를 부모 클래스로 변환할 때
- 인터페이스로 참조하는 인스턴스를 그 인스턴스의 클래스 형식으로 변환할 때
- ...솔직히 나머지는 잘 모르겠다.

### Unboxing

Unboxing은 Boxing을 통해 생성된 데이터를 다시 값 형식으로 변환할 때 일어난다.

### 그 외

공식 문서에는 정말 많은 형변환이 있는데 나머지는 이해하기 어려워 정리하지 않기로 했다... 참고 자료를 확인하면 좋을 것 같다.

# 참고 자료

[Conversions | Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/conversions)