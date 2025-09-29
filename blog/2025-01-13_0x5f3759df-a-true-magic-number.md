---
title: "0x5f3759df: a true Magic Number"
date: 2025-01-13
slug: 0x5f3759df-a-true-magic-number
snippet: "The document discusses the magic number 0x5f3759df, used in the Quake 3: Arena source code for a fast calculation of the inverse square root. This technique, developed by John Carmack, utilizes bit manipulation to generate an approximation that is significantly faster than traditional methods, achieving results with acceptable tolerances in 3D rendering. The origins of this magic number remain unclear, adding to its mystique in programming history."
---

# 0x5f3759df: a true Magic Number

![quake3.jpg](0x5f3759df%20a%20true%20Magic%20Number%2017cb7795690c804da6dad9f836e0369a/quake3.jpg)

---

---

## `0x5f3759df`

The use of 'magic numbers' in code is a well-known antipattern, meaning a common but bad practice. It refers to the inclusion of set values without documentation of their purpose, making it a thorough pain in the arse for anyone other than the original author to maintain and fix code that relies on them.

`0x5f3759df` , or  `1,597,463,007`  in decimal notation, is one such magic number that appears in the Quake 3: Arena source code, in a genuinely beautiful hack committed by John Carmack.

## Here comes the maths bit, concentrate

When you're doing 3D rendering, you have to find the square root of  `x`  (where  `x`  is a variable input) rather a lot.

Carmack's code contains a fast way of working out the inverse square root of  `x` , which can be written as  `1/sqrt(x)` . With that information. we can work out  `sqrt(x)`  easily -

[](data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20version='1.1'%20viewBox='0%200%2024%2024'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='m17.426%2016.84%200.51209%202.975c-0.31701%200.1707-0.82909%200.3292-1.5119%200.47551-0.69497%200.1585-1.5119%200.24385-2.4507%200.24385-2.6945-0.04877-4.7185-0.85348-6.0719-2.3897-1.3899-1.5485-2.0483-3.5114-2.0483-5.889%200.04877-2.8165%200.87786-4.9746%202.4873-6.4864%201.5606-1.5241%203.5602-2.3044%205.9743-2.3044%200.91444%200%201.707%200.085348%202.3654%200.23166%200.6584%200.14631%201.1461%200.30481%201.4631%200.4877l-0.73155%203.0359-1.268-0.41455c-0.4877-0.12193-1.0608-0.18289-1.707-0.18289-1.4021-0.012192-2.5726%200.43893-3.4871%201.3412-0.92663%200.89005-1.3899%202.2556-1.4387%204.0723%200.012193%201.6582%200.45112%202.9506%201.3168%203.9016%200.86567%200.93882%202.0727%201.4265%203.6456%201.4387l1.6216-0.14631c0.52428-0.09754%200.96321-0.23166%201.329-0.39016z'%20fill='%230288d1'%20stroke-width='1.2192'/%3e%3c/svg%3e)

```c
x * (1/sqrt(x)) = sqrt(x)
```

The beauty here is that we don't have to be exactly correct. 3D modelling can operate in tolerances. If our result for  `sqrt(x)`  is out a little bit, that's okay - nobody will notice that the reflected light levels are off by a tiny amount. Carmack's code accepts this and embraces it. Here it is, trimmed a bit for clarity but with original comments -

[](data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20version='1.1'%20viewBox='0%200%2024%2024'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='m17.426%2016.84%200.51209%202.975c-0.31701%200.1707-0.82909%200.3292-1.5119%200.47551-0.69497%200.1585-1.5119%200.24385-2.4507%200.24385-2.6945-0.04877-4.7185-0.85348-6.0719-2.3897-1.3899-1.5485-2.0483-3.5114-2.0483-5.889%200.04877-2.8165%200.87786-4.9746%202.4873-6.4864%201.5606-1.5241%203.5602-2.3044%205.9743-2.3044%200.91444%200%201.707%200.085348%202.3654%200.23166%200.6584%200.14631%201.1461%200.30481%201.4631%200.4877l-0.73155%203.0359-1.268-0.41455c-0.4877-0.12193-1.0608-0.18289-1.707-0.18289-1.4021-0.012192-2.5726%200.43893-3.4871%201.3412-0.92663%200.89005-1.3899%202.2556-1.4387%204.0723%200.012193%201.6582%200.45112%202.9506%201.3168%203.9016%200.86567%200.93882%202.0727%201.4265%203.6456%201.4387l1.6216-0.14631c0.52428-0.09754%200.96321-0.23166%201.329-0.39016z'%20fill='%230288d1'%20stroke-width='1.2192'/%3e%3c/svg%3e)

```c
float Q_rsqrt(float number) {
  long i;
  float x2, y;
  const float threehalfs = 1.5F;
  x2 = number * 0.5F;
  y = number;
  i = *(long*) &y; // evil floating point bit level hacking
  i = 0x5f3759df - (i >> 1); // what the fuck?
  y = *(float*) &i;
  y = y * (threehalfs - (x2 * y * y)); // 1st iteration
  return y;
}
```

What it does is generate a guess for  `1/sqrt(x)`  very, very quickly. With that information, Newton's algorithm (which is used to intelligently refine a guess for any mathematical function) only needs one iteration to get to a tolerable margin of error.

Turns out that, on the processors of the time, this is  *four times faster*  than asking the CPU to find the square root by itself.

## So where's the magic?

Check out that line with the fairly colourful comments.

[](data:image/svg+xml,%3c?xml%20version='1.0'%20encoding='UTF-8'?%3e%3csvg%20version='1.1'%20viewBox='0%200%2024%2024'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='m17.426%2016.84%200.51209%202.975c-0.31701%200.1707-0.82909%200.3292-1.5119%200.47551-0.69497%200.1585-1.5119%200.24385-2.4507%200.24385-2.6945-0.04877-4.7185-0.85348-6.0719-2.3897-1.3899-1.5485-2.0483-3.5114-2.0483-5.889%200.04877-2.8165%200.87786-4.9746%202.4873-6.4864%201.5606-1.5241%203.5602-2.3044%205.9743-2.3044%200.91444%200%201.707%200.085348%202.3654%200.23166%200.6584%200.14631%201.1461%200.30481%201.4631%200.4877l-0.73155%203.0359-1.268-0.41455c-0.4877-0.12193-1.0608-0.18289-1.707-0.18289-1.4021-0.012192-2.5726%200.43893-3.4871%201.3412-0.92663%200.89005-1.3899%202.2556-1.4387%204.0723%200.012193%201.6582%200.45112%202.9506%201.3168%203.9016%200.86567%200.93882%202.0727%201.4265%203.6456%201.4387l1.6216-0.14631c0.52428-0.09754%200.96321-0.23166%201.329-0.39016z'%20fill='%230288d1'%20stroke-width='1.2192'/%3e%3c/svg%3e)

```c
i = 0x5f3759df - (i >> 1); // what the fuck?
```

So - if you take your input floating point number, turn it into an integer, do some very fast bitflipping magic that essentially just halves your input, subtract the result from  `0x5f3759df` , then turn that integer back into a floating point number, you get an eerily good approximation to the inverse square root of the input.

There is no obvious reason why this should work, and how Carmack or any of the previous users of this stunningly elegant hack came across the magic value  `0x5f3759df`  appears to have been lost to history. [Beyond3D tried to trace it back through the ages](https://www.beyond3d.com/content/articles/8/), but after going through Carmack, an x86 assembly hacker called Terje Matheson, NVIDIA and eventually Gary Tarolli who used it in his days at 3dfx, the trail went cold.

It's a real pity, because finding that constant would have required someone to think in a completely different direction to everyone else, and be convinced enough that such a constant even existed to spend time narrowing it down.

---

# Comments

[https://apption.co/app_posts/aa576d9a](https://apption.co/app_posts/aa576d9a)
