---
title: 백준 24723
description: 백준 24723번 문제풀이입니다.
date: '2023-07-10T07:11:03.422Z'
tags: ["algorithm"]
category:
  name: "Algorithm"
---

# [24723 녹색거탑](https://www.acmicpc.net/problem/24723)

바닥까지 내려오는 경로의 개수를 구하는 문제다.

먼저 A지점에서 B지점까지 최단 거리로 가는 길의 개수를 구하는 방법을 생각했었다. 

그 방법을 생각하니 곧바로 **조합론**이 떠올랐고, 문제에서 제시한 박스 모형이 **파스칼 삼각형**을 의미함을 깨달았다.

즉, $_nC_0$부터 $_nC_n$까지 모두 더하면 된다.

여기서 예전에 배웠던 수학공식을 조금 활용하면 dp를 적용할 수 있다.

$$ _nC_r = _{n-1}C_{r-1} + _{n-1}C_r $$

위 식을 통해 이전에 계산한 값을 또 다시 계산하지 않고 메모이제이션해오면 된다.

# 내 제출

```cpp
#include <stdio.h>
int dp[6][6]={0};
int comb(int n, int r){
    // return nCr
    if(r==0 || r==n){
        return 1;
    }
    if(r==1 || r==n-1){
        return n;
    }
    if(dp[n][r]==0){
        dp[n][r] = dp(n-1,r) + dp(n-1,r-1);    
    }
    return dp[n][r];
}
int main(){
    int N;
    scanf("%d", &N);
    int sum = 0;
    for(int i=0; i<=N; i++){
        sum += comb(N, i);
    }
    printf("%d", sum);
}
```

브론즈 2문제여서 그런지 $1\leq N \leq 5$여서 dp의 효과가 딱히 있진 않은것 같다.

![solved](<../assets/백준-24723/image.png>)