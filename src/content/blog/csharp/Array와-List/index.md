---
title: Array와 List
description:
date: '2023-08-21T14:01:03.000Z'
tags: ["csharp"]
category:
  name: "Study"
  category:
    name: "CSharp"
---

# Array

`Array`는 정적인 크기를 가지는 1차원 배열이다. `int arr[] = new int[5]`처럼 고정된 크기를 갖는 배열을 의미한다.

몇 가지 유용한 도구 메서드들이 `Array`클래스에 구현되어 있지만 사용자가 직접 `Array` 클래스를 상속하여 다른 모습의 배열을 만들 수는 없다.

시작 인덱스는 0이지만 `CreateInstance()`를 통해 시작 인덱스를 다르게 정의할 수 있다.

# List<T>

`List`는 동적으로 크기가 변하는 1차원 배열이다. 내부적으로는 `Array`를 사용하지만 필요에 따라 실제 용량이 늘어나도록 설계되어있다.

특이하게도 인덱스를 통한 직접 접근이 된다. `Array`를 사용하여 구현되어 있기 때문인것 같다.

# ArrayList

`ArrayList`는 동적으로 크기가 변하도록 설계된 1차원 배열이다. `List`보다 더 다양한 종류의 객체? 데이터를 다루도록 설계된 클래스다.

# List vs ArrayList

[Performance Consideration](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.list-1?view=net-7.0#performance-considerations)

C#은 거의 대부분의 상황에서 `List`를 추천하고 있다. 더 빠르고, 타입-안전하기 때문이라고 한다.

> `ArrayList`는 꽤 오래전에(.NET 1.x 시절에) 사용되었던 자료구조라고 한다.

# 시간복잡도

`List`가 사실은 `Array`로 구현되었다는 점을 생각하면 시간복잡도는 의외로 간단하다.

### 삽입

`Add`는 데이터를 배열의 맨 뒤에 추가하기 때문에 $O(1)$이고, `Insert`는 데이터를 배열의 중간에 추가하기 때문에 $O(N)$이다.

### 삭제

`Remove`는 특정 데이터를 배열에서 지운 후 빈 공간을 메꾸기 위해 한 칸씩 옮기기 때문에 $O(N)$이다. `RemoveAt`도 특정 인덱스를 삭제했다면 빈 공간을 메꿔야 하므로 $O(N)$이다.

### 조회

`IndexOf`는 데이터가 어느 위치에 있는지 알기 위해 전체를 순회하므로 $O(N)$이다. `Contains`, `Find` 또한 `List`가 데이터를 갖고 있는지 확인해야하므로 $O(N)$이다.

## 정리

|         | `Add`  | `Insert` | `Remove` | `RemoveAt` | `IndexOf` | `Contains` | `Find` |
| ------- | ------ | -------- | -------- | ---------- | --------- | ---------- | ------ |
| `List`  | $O(1)$ | $O(N)$   | $O(N)$   | $O(N)$     | $O(N)$    | $O(N)$     | $O(N)$ |
| `Array` | $O(1)$ | $O(N)$   | $O(N)$   | $O(N)$     | $O(N)$    | $O(N)$     | $O(N)$ |
