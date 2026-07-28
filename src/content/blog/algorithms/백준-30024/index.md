---
title: 백준 30024
description:
date: '2023-09-21T13:19:09.960Z'
tags: ["algorithm"]
category:
  name: "Algorithm"
---

# [옥수수밭](https://www.acmicpc.net/problem/30024)

가능한 최대 가치를 갖는 옥수수를 K번 수확하는 문제다.

수확할 때마다 최대 가치를 갖는 옥수수를 수확하기 위해서 정렬을 할 필요가 있는데, 조건으로는 **수확 가능한 옥수수중** 최대 가치를 갖는 옥수수를 수확해야한다는 것이다.

옥수수를 수확할 때마다 *수확 가능한 옥수수들의 리스트는 계속 변하기 때문에* 매번 정렬을 하기엔 부담스러웠다.

여기까지 고민했을 때 곧바로 **최대힙**이 떠올랐다.

1. 입력이 끝난 후에는 먼저 수확 가능한 옥수수들을 최대힙에 삽입한다.
2. 그 다음 최대힙에서 제일 가치가 큰 옥수수를 꺼낸다(수확한다).
3. 수확한 옥수수밭의 상하좌우에서 수확하지 않은 옥수수를 최대힙에 삽입한다.

2, 3번 과정을 K번 반복하면 된다.

여기서 이미 수확을 한 옥수수를 또 추가할 수 없기 때문에 체크를 해야한다.

# 내 제출

```cpp
#include <iostream>
#include <queue>
#include <algorithm>
using namespace std;

struct Coord {
    int x;
    int y;
    Coord() {}
    Coord(int _x, int _y) {
        x = _x;
        y = _y;
    }
};

using PAIR = pair<int, Coord>;

struct compare {
    bool operator()(PAIR& a, PAIR& b) {
        return a.first < b.first;
    }
};

priority_queue<PAIR, vector<PAIR>, compare> maxHeap;
int check[1001][1001] = { 0 };
int N, M;

// 외곽에 있는 것부터 추가
// 수확하는 순간 주변에 있는 옥수수를 힙에 담기
// 수확하려는 때에는 힙에서 제일 위에 있는 옥수수를 수확하기

void push(int y, int x) {
    maxHeap.push(make_pair(check[y][x], Coord(x, y)));
    check[y][x] = 0;
}

int main() {
    int value;
    Coord coord;
    scanf("%d%d", &N, &M);
    for (int i = 1; i <= N; i++) {
        for (int j = 1; j <= M; j++) {
            scanf("%d", &check[i][j]);
            if (i == 1 || i == N || j == 1 || j == M) {
                push(i, j);
            }
        }
    }

    int K; scanf("%d", &K);

    for (int i = 0; i < K; i++) {
        PAIR pair = maxHeap.top();
        Coord coord = pair.second;
        int x = coord.x, y = coord.y;
        printf("%d %d\n", coord.y, coord.x);
        maxHeap.pop();
        // check[][]가 0이 아니면 수확 가능한 옥수수다.
        if (y > 1 && check[y - 1][x]) {
            push(y - 1, x);
        }
        if (y < N && check[y + 1][x]) {
            push(y + 1, x);
        }
        if (x > 1 && check[y][x - 1]) {
            push(y, x - 1);
        }
        if (x < M && check[y][x + 1]) {
            push(y, x + 1);
        }
    }
}
```

`check`에 옥수수의 가치를 담아두고, 힙에 추가했을 때 0으로 만든다.

나중에 `check[i][j]`를 확인하여 값이 0이면 힙에 추가했다는 의미이므로 그 때는 힙에 추가하지 않는다.

힙에 옥수수의 가치와 좌표값을 저장하기 위해 `pair<>`를 사용했다. 그래서 어쩔 수 없이 비교 구조체를 작성해야했다.

> `compare(a, b)`함수를 작성할 때 `a < b`라면 내림차순으로, `a > b`라면 오름차순으로 정렬된다. 