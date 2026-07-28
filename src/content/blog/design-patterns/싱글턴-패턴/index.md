---
title: 싱글턴 패턴
description:
date: '2023-07-22T11:49:46.575Z'
tags: ["design-pattern"]
category:
  name: "Study"
  category:
    name: "디자인 패턴"
---

# 의도

오직 한 개의 클래스 인스턴스만을 갖도록 하고 그 인스턴스를 전역적으로 접근할 수 있게 한다.

# UML

![Alt text](<../assets/싱글턴-패턴/image.png>)

싱글턴 클래스는 자기 자신을 `static`으로 제공한다. 외부에서 싱글턴 클래스에 접근하기 위해서는 static 메서드인 **`Instance`를 통해서만** 접근할 수 있다.

# 사용 시기

- 클래스의 인스턴스가 **오직 하나**여야 하고 **모든 사용자가 접근할 수 있도록** 할 때
- 유일한 인스턴스가 서브 클래싱으로 확장되어야 하며(?) 별도의 코드 수정없이 서브 클래스의 인스턴스를 사용할 수 있어야 할 때

# 장점

namespace를 구분지어 관리할 수 있다. 전역 변수들과 다른 공간에 변수를 둘 수 있게 된다.

싱글턴 클래스를 상속하여 새로운 인스턴스를 만들 수 있다.(?) 

# 단점

클래스의 인스턴스가 여러 개 존재해야한다면 수정하기 어렵다. 보통 C++에서는 `static`를 이용해 구현하기 때문에 서브 클래스에서 이를 override할 수 없다.

# 구현

클래스 내에 정적 멤버를 정의하고 그 정적 멤버에 대해 유일한 접근자를 정의하면 된다.

```cpp
class Singleton {
public:
    static Singleton* Instance() {
        return _instance;
    }
protected:
    // 서브 클래싱을 위해 생성자를 protected로 설정한다.
    // 외부에서 싱글턴 클래스를 생성하지 않도록 막는 효과도 있다.
    Singleton(); 
private:
    static Singleton* _instance;
}
```

```cpp
Singleton* Singleton::_instance = nullptr;
Singleton* Singleton::Instance() {
    if(_instance == nullptr) {
        _instance = new Singleton();
    }
    return _instance;
}
```

싱글턴 클래스를 사용하려면 유일한 접근 방법인 `Instance` 메서드로 접근하여야 한다.

`static` 변수의 초기화 시기는 언제인지 알 수 없기 때문에, 미리 `nullptr`을 대입하고, 실제 객체에 접근할 때 초기화를 시도한다.

## 서브 클래싱

싱글턴 클래스를 상속받아 서브 클래스를 구성했을 때 상위 클래스의 `_instance`를 그대로 사용하게 된다. 

서브 클래스 또한 `Instance()`를 통해 인스턴스에 접근하게 되지만 _instance가 `static`이기 때문에 상위 클래스와 공유되어 있다. 따라서 서브 클래스의 인스턴스를 반환하기 위해서는 상위 클래스의 `Instance()`를 수정하여야 한다. 

> `Instance()`가 `static` 메서드이기 때문에 가상함수로 선언할 수 없으므로 다형성을 가질 수 없다…

레지스트리 또는 환경변수를 통해 `Instance()`를 호출할 때마다 클래스에 따라 다른 싱글턴 인스턴스를 반환하도록 구성할 수 있다.

```cpp
Singleton* Singleton::Instance() {
    if(_instance == nullptr) {
        // 환경변수를 통해 다른 싱글턴을 반환하도록 설정
        const char* key = getEnv("SINGLETON");
        _instance = findInstanceWithKey(key);
    }
    return _instance;
}
```

서브 클래스에서 `Instance()`를 호출하게 되는데 미리 등록된 인스턴스를 갖고와 반환한다. 하지만 이렇게 구성하면 서브 클래스를 구현할 때마다 강제로 등록해야하는 부수효과가 생긴다. 

다른 방법으로 상위 클래스의 `Instance()`내에서 서브 클래스의 인스턴스를 생성하도록 할 수 있다.

```cpp
Singleton* Singleton::Instance() {
    if(_instance == nullptr) {
      const char* name = getEnv("SINGLETON");

      // 환경변수값을 직접 비교하여 어떤 싱글턴 클래스를 반환할지 결정
      if(strcmp(name, "Custom") { 
          _instance = new CustomSingleton();
      }
      else if(strcmp(name, "MySingleton") {
          _instance = new MySingleton();
      }
      else {
          _instance = new Singleton();
      }
    }
    return _instance;
}
```

하지만 이 방법도 서브 클래스가 생길 때마다 `Instance()`에 추가해야하는 부수효과가 있다.