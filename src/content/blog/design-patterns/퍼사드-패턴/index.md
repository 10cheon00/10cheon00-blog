---
title: 퍼사드 패턴
description:
date: '2023-07-27T12:17:04.954Z'
tags: ["design-pattern"]
category:
  name: "Study"
  category:
    name: "디자인 패턴"
---

# 의도

한 서브 시스템 내의 인터페이스 집합에 대한 획일화된 하나의 인터페이스를 제공하는 패턴으로, 서브 시스템을 사용하기 쉽도록 상위 수준의 인터페이스를 정의한다.

# UML

![Alt text](<../assets/퍼사드-패턴/image.png>)

서브 시스템을 퍼사드 객체가 감싸 내부 구현을 감추어 버린다. 이로 인해 사용자는 내부 클래스를 모른 채 사용하여 잘못된 접근을 막을 수 있다.

# 사용 시기

- 복잡한 서브 시스템에 대해 단순한 인터페이스를 제공하려할 때. 실제로는 세세한 구현까지 알 필요없는 클래스나 인터페이스를 숨기기 위함이다.
- 사용자와 클래스간 많은 종속성이 존재할 때. 빈번한 메소드 호출을 단순하게 만드는 대신 내부적으로 처리하도록 만든다.
- 서브 시스템을 계층화할 때 퍼사드 패턴을 통해 접근하도록 만든다.

# 장점

서브 시스템의 구성요소를 퍼사드 내부에 숨겨버리기 때문에 사용자로부터 보호할 수 있다.

컴파일 의존성을 줄일 수 있다.(?)

# 단점

단순하게 쓰려고 서브 시스템의 클래스들을 감추는 것인데, 응용을 위해 서브 시스템의 클래스를 활용해야한다면 퍼사드 패턴의 책임이 망가진다.

# 구현

```cpp
class Car {
public:
    void oiling(Oil oil);
    void turnOn(CarKey carKey);
    void setGearToDrive(GearStatus gearStatus);
    void excelerate();
}
```

기름을 넣고 차키를 꽂아 시동을 건 뒤 기어를 드라이브에 놓은 후 엑셀을 밟아 차를 운전하는 시스템을 구성했다.

사용자가 이 시스템을 사용하려면 아래처럼 구현해야 한다.

```cpp
void drive() {
    Car* car = new Car();
    car.oiling(new Oil(5000));
    car.turnOn(inventory->getMyCarKey());
    car.setGearToDrive(GearStatus::DRIVE);
    car.excelerate();
}
```

“차를 운전한다”라는 개념안에 알 필요없는(사실은 다 해야하는 것이지만) 클래스들이 등장한다.

따라서 퍼사드를 통해 차의 부품 클래스들을 숨기고 단순한 인터페이스만 제공하도록 할 수 있다.

```cpp
class CarDriver {
public:
    void drive(CarKey carKey) {
        _car = new Car();
        _car->oiling(new Oil(5000));
        _car->turnOn(carKey);
        _car->setGearToDrive(GearStatus::DRIVE);
        _car->excelerate();
    }
private:
    Car* _car;
}
```

이제 사용자는 CarKey만 갖고 있다면 CarDriver를 생성해서 운전을 할 수 있다.

복잡한 과정을 거쳐 실행될 메소드에 사용자가 알 필요없는 클래스나 인터페이스가 있다면 퍼사드를 통해 실행하게 함으로써 사용자가 그런 클래스나 인터페이스를 모른 채 사용해도 되게 만든다.

> 원래는 기어를 드라이브에 놓는 과정이나 기름을 주유하는 것도 사용자가 담당해야한다.
> 이 때 사용자가 기름을 주유하도록 변경하게 되면 퍼사드 패턴의 책임이 망가지게 된다. 설계를 잘 해야 겠다.