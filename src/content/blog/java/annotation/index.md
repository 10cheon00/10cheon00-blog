---
title: Annotation
date: '2023-11-06T12:01:06.489Z'
tags: ["java"]
category: 
  name: "Study"
  category:
    name: "Java"
---

Annotation은 영어로 번역했을 때 주석이라는 뜻을 갖는다. 주석은 코드의 흐름에 영향을 주지 않는다. 하지만 코드를 보는 사람으로 하여금 어떤 코드인지 이해하게 만들고 함수 또는 라이브러리를 어떤 상황에 써야하는지 설명한다. 

Java의 어노테이션도 이와 비슷하다. 프로그램에 직접적으로 영향을 주지 않지만 다른 라이브러리나 툴이 그 프로그램을 어떻게 쓸 수 있는지 제시한다. 어노테이션은 런타임에 영향을 준다고 한다.

# 선언 및 사용 방법

```java
public @interface NewAnnotation {
    int id();
    String name();
    String description() default "설명을 넣어주세요"
}

@NewAnnotation(
    id = 10,
    name = "새로운 Annotation"
)
public class Foo {
    // ...
}
```

선언할 때에는 `@interface` 타입으로 선언하고, 사용할 때에는 어노테이션을 선언할 때 정의한 속성에 맞게 파라미터를 괄호 안에 넣어준다. `default`로 기본값 선언을 해두었다면 별도로 인자를 넣지 않아도 된다.

속성을 정의하지 않은 어노테이션도 있다. 

```java
public @interface NoArgumentAnnotation { }

@NoArgumentAnnotation
public class Foo {
    // ...
}
```

괄호 없이 어노테이션 이름만 붙여준다.

속성이 한 개인 어노테이션이라면 속성명을 넣지 않고 그냥 파라미터를 넣는다.

```java
public @interface OneArgumentAnnotation {
    int age();
}

@OneArgumentAnnotation(30)
public class Person {
    // ...
}
```

이렇게 어노테이션 선언을 했는데, 클래스나 객체가 어노테이션을 갖는지 확인하려면 `java.lang.reflect` 패키지를 이용해야 한다. 공식 문서를 참조하면 아래의 코드는 `args[0]`가 가리키는 클래스로부터 `@Test`를 갖는 모든 함수를 실행한 다음, 에러를 검출하여 전체 테스트 케이스를 돌려보고 있다.

```java
import java.lang.reflect.*;

public class RunTests {
   public static void main(String[] args) throws Exception {
      int passed = 0, failed = 0;
      for (Method m : Class.forName(args[0]).getMethods()) {
         if (m.isAnnotationPresent(Test.class)) {
            try {
               m.invoke(null);
               passed++;
            } catch (Throwable ex) {
               System.out.printf("Test %s failed: %s %n", m, ex.getCause());
               failed++;
            }
         }
      }
      System.out.printf("Passed: %d, Failed %d%n", passed, failed);
   }
}
```

---

# 참고 문헌

[Annotations | Oracle Help Center](https://docs.oracle.com/javase/8/docs/technotes/guides/language/annotations.html)