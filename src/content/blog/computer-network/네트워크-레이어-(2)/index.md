---
title: 네트워크 레이어 (2)
date: '2023-10-20T03:04:58.347Z'
tags: ["computer-network"]
category:
  name: "Study"
  category:
    name: "컴퓨터 네트워크"
---

> 2023년 2학기 컴퓨터 네트워크 수업을 듣고 정리한 내용입니다. 수업 교재는 [컴퓨터 네트워킹 하향식 접근 8판](https://product.kyobobook.co.kr/detail/S000061694627)입니다.

# 컨트롤 영역

네트워크는 데이터 영역과 컨트롤 영역으로 나뉨.

컨트롤 영역의 구조는 두 가지가 있음

- per-router control(traditional)

  각 라우터가 알고리즘을 통해 스스로 포워딩 테이블을 구성

- Software Define Networking

  원격 컨트롤러가 계산한 포워딩 테이블을 모든 라우터에게 설정

# 라우팅 프로토콜의 목표

네트워크 속 라우터를 통해 시작 지점부터 도착 지점 사이의 최적의 경로(최소 비용, 최대 속도, 최소 혼잡도 등)를 설정하는 것

# Link-state: Dijkstra 알고리즘

- 모든 노드(라우터)가 같은 정보를 공유한다.
- Link state의 브로드캐스트를 통해 전달된다.
- 각 노드마다 모든 노드로 향하는 최소 비용의 경로를 계산한다.
- 최소 비용을 계산하는 데에 $ O(n^2) $ 의 시간복잡도를 갖는다.

## Oscillation possible

노드(라우터)간 비용이 달라졌을 때 경로가 계속 변경되어 진동하는 것처럼 보이는 것.

# Distance vector: Bellman-Ford 알고리즘

- 매 시간마다 인접한 이웃 노드(라우터)에게서 전달받은 정보를 토대로 최소 비용을 계산하는 것
- 이웃이나 자신의 link cost값이 변경되었을 때 계산을 바로 할 수 있음.

## good news travels fast, bad news travels slow

link cost값이 더 작은 값으로 바뀌면 금방 갱신되지만 link cost값이 더 큰 값으로 바뀌면 느리게 갱신되는 것.

최악의 경우 무한번 반복할 수도 있다.

# Autonomous systems

이상적인 모델을 현실적으로 적용하기 위해 만든 작은 네트워크 집합.

한 지역에 있는 라우터들의 집합을 말한다.

## Intra-AS

내부 도메인 라우팅을 말한다.

같은 AS에 있는 라우터들은 동일한 프로토콜을 사용하여 포워딩 테이블을 구성한다.

다른 AS에 있는 라우터와 연결된 라우터들을 gateway router라고 명칭한다.

## Inter-AS

AS간 또는 도메인간 라우팅을 말한다.

> intra as내의 라우터들은 같은 as내에 있는 라우터들로 향하는 포워딩 테이블을 갖지만 gateway router들은 intra-as 포워딩 테이블과 inter-as 포워딩 테이블을 갖는다.

# Intra-AS routing

외부로 나가기 위해 어떤 게이트웨이 라우터를 선택할지 결정하는 프로토콜 사용. RIP, EIGRP, OSPF가 있음

## OSPF

Link-state방식 사용. IP를 사용하여 정보를 주고 받는다.

각 라우터가 OSPF 프로토콜로 정보를 주고받아 같은 AS에 있는 모든 라우터와 정보를 공유한다. 공유한 정보를 토대로 각 라우터는 포워딩 테이블을 구성한다.

### Hierarchical OSPF

Dijkstra 알고리즘을 사용하려면 $$ O(n^2) $$ 의 비용을 써야 한다. AS가 너무 크면 계산하기 힘들기 때문에 AS의 계층을 상위와 하위로 나눈다.

Link-state 정보는 각 area 또는 backbone 내에서만 전파된다.

- Local area

  - Local routers

    area 내의 라우터들에 대한 포워딩 테이블을 갖는다.

    area 밖으로 나가는 패킷은 area border router에게 포워딩한다.

  - Area border router

    라우터가 속한 area로 향하는 비용을 요약해서 backbone에 전파한다.

- Backbone

  - Backbone router

    서로 다른 area를 연결하는 라우터    

  - Boundary router

    다른 AS와 연결되는 라우터.  

# Inter-AS routing

BGP(border gateway protocol)을 사용한다.

서브넷이 자신의 존재를 알려서 다른 인터넷에서 접속이 가능하도록 만든다.

BGP는 eBGP와 iBGP로 나뉜다.

- eBGP(외부 BGP)

  다른 서브넷의 정보를 획득하는 것.

- iBGP(내부 BGP)

  자신의 서브넷에 대한 정보를 모든 내부 도메인 즉, Intra AS내의 라우터에 뿌리는 것.

![Alt text](<../assets/네트워크-레이어-(2)/image-1.png>)

두 BGP 라우터가 세션을 구성하여 반영구적으로 계속 BGP 메세지를 주고 받는다. 새로운 라우터(위 사진의 라우터 X)가 서브넷에 가입되면 eBGP를 통해 다른 AS에 전파되고, 그 AS에서는 iBGP를 통해 AS 내부의 라우터에 전파된다.

BGP는 prefix와 attributes를 전파한다.

- prefix

  전파될 도착 지점

- attributes

  - AS-PATH

    prefix가 전파되면서 거쳐간 AS들의 목록

  - NEXT-HOP

    다음으로 전파될 내부의 AS 라우터를 의미한다.

BGP는 정책에 기반한 라우팅을 한다. 

예시로, 게이트웨이 라우터는 같은 도착 지점에 대해서 다수의 경로 정보를 전달받을 수 있는데, 이 때 정책에 의해 경로가 더 짧은 것을 선택할 수 있다.

## BGP Messages

BGP는 TCP를 사용하여 정보를 주고 받는다.

- OPEN

  두 BGP 라우터(peer) 간 TCP 세션을 구성한다.

- UPDATE

  새로운 경로를 전달하거나, 기존의 경로를 삭제한다.

- KEEPALIVE

  경로의 업데이트가 없을 때에도 연결을 유지한다. 

- NOTIFICATION

  이전 메세지의 오류를 수정한다. 또는 연결을 종료한다.

> iBGP를 통해 다른 AS로 향하기 위해 어떤 게이트웨이 라우터를 선택해야하는지 알게 되면 OSPF로 AS 내부의 모든 라우터에게 그 정보가 전파되어 포워딩 테이블을 구성하게 된다.

## Hot potato routing

inter-AS에서 계산된 비용은 생각하지 않고 intra-AS내에서 게이트웨이까지 나가는 비용이 가장 작은 경로를 선택하게 되는 것.

## Intra-AS와 Inter-AS의 차이점

### 정책

intra-AS에서는 정책으로 관리하지 않기에 중요하지 않지만, inter-AS에서는 관리자가 트래픽 관리를 위해 정책을 설정하게 된다.

### 성능

계층을 나눔으로써 intra-AS는 오직 성능에만 집중할 수 있지만 inter-AS는 정책이 우선된다.

# Software Define Networking

각 라우터가 link-state 정보를 확인하고 경로를 업데이트 하는 방법은 실시간으로 적용하기 어렵다. 그래서 원격 컨트롤러에게 맡긴다.

SDN은 3개의 계층로 분리된다.

## Data-plane Switch

단순하게 포워딩 테이블에 의한 패킷 스위칭을 담당한다. (generalized data-plane forwarding 사용)

상위 계층인 컨트롤러에게 API를 제공하여 포워딩 테이블을 관리할 수 있다. 

OpenFlow 프로토콜를 사용하여 컨트롤러와 통신한다.

## SDN Controller(network OS)

네트워크의 정보를 수집, 관리한다.

상위 계층인 애플리케이션에게 API를 제공하여 알고리즘을 구현할 때 포워딩 테이블을 수정할 수 있도록 한다.

스위치가 제공하는 API를 통해 상호작용한다.

트래픽 관리 시스템을 구현한다.

## Application

컨트롤러가 제공하는 API를 통해 라우팅, 로드밸런싱 같은 알고리즘을 구현한다.

컨트롤러와는 독립적으로, 서드파티에 의해 구현될 수도 있다.(?)

# OpenFlow Protocol

컨트롤러와 스위치 사이에서 메세지를 주고받는 규칙이다. TCP를 사용한다.

## Controller to Switch

- feature : 스위치의 정보를 쿼리로 긁어온다.
- configure : 스위치의 파라미터를 수정한다.
- modify-state : OpenFlow Table에 엔트리를 추가/삭제/수정한다.
- packet-out : 컨트롤러가 직접 특정 스위치의 포트로 패킷을 내보낸다...(?)

## Switch to Controller

- packet-in : 패킷을 컨트롤러에게 보낸다.
- flow-removed : OpenFlow Table에서 특정 엔트리가 지워졌음을 알린다.
- port status : 포트의 상태를 알림. 포트가 변경되었을 때 알리는 것 같다.

# 상호작용 흐름

1. 어떤 오류가 발생하여 `port status`를 통해 컨트롤러에게 알린다.
2. 컨트롤러는 메세지를 수신하여 DB에 저장된 link state의 정보를 수정하고, 애플리케이션에 알린다.
3. 애플리케이션은 상태가 변경되었을 때 Dijkstra 알고리즘을 다시 수행하도록 설정하고 있다. 그러므로 다시 실행되어 경로를 업데이트한다.
4. 애플리케이션이 알고리즘을 실행하면, 컨트롤러에 저장된 정보를 조회하기 위해 상호작용한다. 
5. 업데이트된 경로를 전파하기 위해 애플리케이션이 컨트롤러를 통해 각 스위치의 FlowTable을 업데이트한다.

> 여기까지 중간고사 범위

# ICMP

호스트와 라우터 사이에 데이터 전송과 관련된 문제를 알리기 위한 프로토콜. IP를 사용하지만 payload에 담겨서 전송된다.

TTL이 0이면 전송된 패킷을 버리고 src로 ICMP 오류코드(type: 11, code: 0)가 담긴 메세지를 보낸다.

# Network Management

네트워크에 존재하는 관리시스템이 각 디바이스에 연결된 에이전트를 통해 관리한다.

각 디바이스의 MIB정보를 조회, 수정하기 위해서 SNMP 프로토콜을 사용한다.

## SNMP 프로토콜 메세지

### 시스템

- 정보 검색 : GetRequest, GetNextRequest, GetBulkRequest
- 정보 업데이트 : SetRequest

### 에이전트

- 시스템의 요청에 대한 응답 : Response
- 자발적으로 알림 : Trap (이슈가 생겼을 때 시스템에게 알림)

Get~, Set~은 format이 동일하지만 Trap 메세지만 다른 format이다. 

## MIB(Management Information Base) 

망 관리를 위해 사용되는 관리 정보