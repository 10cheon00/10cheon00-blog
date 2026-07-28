---
title: 24-2-21 Spring Dependency Injection
date: '2024-02-21T06:49:05.492Z'
tags: ["TIL", "spring"]
category: 
  name: Study
  category:
    name: Spring
---

# DIP

Dependency Inversion Principle, 의존성 주입 원칙은 SOLID 원칙 중 마지막에 속하는 원칙이다. 

> 의존성 역전 원칙에서 말하는, 유연성이 극대화된 시스템이란 소스 코드 의존성이 추상에 의존하며 구체에는 의존하지 않는 시스템이다. (클린 아키텍처, 92p)

[위키피디아](https://en.wikipedia.org/wiki/Dependency_inversion_principle)에서는 이렇게 정의하고 있다.

- High-level modules should not import anything from low-level modules. Both should depend on abstractions (e.g., interfaces).
  
  > 상위 모듈은 그 어떤 하위 모듈에도 의존하면 안된다. 상위 모듈과 하위 모듈은 모두 추상화에 의존해야한다.
- Abstractions should not depend on details. Details (concrete implementations) should depend on abstractions.
  
  > 추상화는 세부 사항에 의존해선 안되며 세부 사항(구체)이 추상화에 의존해야한다.

# Dependency Injection

위에서 얘기했듯 구체는 추상화에 의존해야한다. 전통적으로 객체는 자신이 필요로 하는 의존성 구체를 직접 생성하여 사용했다.

```java
interface I { }

public class A implements I{ }

public class B {
  private I i;

  public B() {
    this.i = new A(); // 필요로 하는 의존성 구체를 직접 생성했다.
  }
}
```

하지만 구체를 직접 생성하다보니 아래와 같은 문제가 생겼다.

- How can a class be independent from the creation of the objects it depends on?
- How can an application, and the objects it uses support different configurations?

분명 인터페이스를 사용하여 추상화에 의존하도록 했지만 결국 **객체는 구체를 직접 생성해야하는 책임을 갖게 되었고**, 인터페이스를 사용하여 다형성을 갖도록 구현했지만 **의존성을 변경하려면 모든 객체를 직접 수정해야하는 작업**을 요구하게 되었다.

따라서 구체를 생성하는 책임을 분리하는 것이 **Dependency Injection**이다. 외부에서 의존성을 주입하는 것이다.

```java
interface I { }

public class A implements I { }

public class B {
  private I i;

  public B(I i) {
    this.i = i;
  }
}

public static void main(String []args) {
  B b = new B(new A()); // dependency injection
}
```

클래스의 생성자에 의존성을 가지는 추상화를 명시하고, 외부에서 구체를 주입해준다. 이렇게 하면 예시의 클래스 `B`는 자신이 요구하는 `I` 타입 구체들을 생성할 책임이 없을 뿐더러 생성 과정에 대해서 몰라도 된다.

외부에서 의존성을 주입하는 방법은 크게 세 가지인데, 생성자를 이용하는 방법, setter를 이용하는 방법, interface를 이용하는 방법이 있다. 

> 마지막 방법은 그다지 친숙하지 않고, Spring에서 활용하지 않아 생략했다.

## Constructor-based Injection

위에서 보았듯이 생성자를 통해 의존성을 주입한다.

생성자를 통해 객체를 생성하게 되면 *모든 의존성이 주입된 상태*가 된다.

만약 의존성이 엄청 많은 클래스라면 생성자의 인자 또한 비례하여 늘어나게 된다. 그 때에는 클래스를 분리해야할지 검토해야한다.

## Setter-based Injection

setter를 이용하여 의존성을 주입한다.

```java
interface I { }

public class A implements I { }

public class B {
  private I i;

  public B() { }

  public void setI(I i) {
    this.i = i;
  }
}

public static void main(String []args) {
  B b = new B();
  b.setI(new A()); // setter-based injection
}
```

생성 시기에는 의존성이 주입되어 있지 않으므로 Null check를 해야한다. 런타임에 의존성이 변경되어야 한다면 이런 방법을 사용해야한다.

# Spring Bean 등록

Spring은 Bean 객체를 통해 의존성을 주입한다. IoC 컨테이너가 Bean 객체를 관리하며 의존성이 필요할 때에는 적절한 Bean 객체를 찾아 주입시킨다.

따라서 Bean 객체를 등록하고, `@Autowired` 어노테이션을 통해 의존성을 주입해야한다고 명시하면 IoC 컨테이너가 런타임에 의존성을 주입시킨다.

## `@Configuration` & `@Bean`

별도의 설정 클래스를 작성하여 Bean 객체를 등록하는 방법이다. `@Configuration` 어노테이션으로 설정 클래스를 명시한다.

```java

@Configuration
public class SpringConfig {
  @Bean 
  public SomeService someService() {
    // 의존성을 가진 객체를 Bean으로 등록
    return new SomeService(otherService());
  }

  @Bean
  public OtherService otherService() {
    return new OtherService();
  }
}

public class SomeService {
  private final OtherService otherService;
  public SomeService(OtherService otherService) {
    this.otherService = otherService;
  }
}
```

## `@Component`

또는 Spring에서 제공하는 컴포넌트 스캔을 이용하여 별도의 설정 클래스를 작성하지 않고 런타임에 직접 Bean 객체를 수집하도록 만들 수 있다.

`@Component` 어노테이션을 사용하여 Bena 객체임을 명시한다.

`@Controller`, `@Service`, `@Repository` 등 `@Component`를 상속한 다른 어노테이션 또한 동일하게 Bean 객체로 수집된다.

```java
@Component
public class SomeService {
  private final OtherService otherService;

  @Autowired
  public SomeService(OtherService otherService) {
    // OtherService라는 의존성을 갖기 때문에 
    // 생성 시기에 객체를 주입받도록 @Autowired를 사용
    this.otherService = otherService;
  }
}

@Component
public class OtherService { }
```
