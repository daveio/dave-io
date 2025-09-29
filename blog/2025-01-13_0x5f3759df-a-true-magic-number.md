---
title: "0x5f3759df: a true Magic Number"
date: 2025-01-13
slug: 0x5f3759df-a-true-magic-number
snippet: "The document discusses the magic number 0x5f3759df, used in the Quake 3: Arena source code for a fast calculation of the inverse square root. This technique, developed by John Carmack, utilizes bit manipulation to generate an approximation that is significantly faster than traditional methods, achieving results with acceptable tolerances in 3D rendering. The origins of this magic number remain unclear, adding to its mystique in programming history."
---

![Quake 3: Arena](/images/blog/headers/2025-01-13_0x5f3759df-a-true-magic-number.jpg)

---

## `0x5f3759df`

The use of 'magic numbers' in code is a well-known antipattern, meaning a common but bad practice. It refers to the inclusion of set values without documentation of their purpose, making it a thorough pain in the arse for anyone other than the original author to maintain and fix code that relies on them.

`0x5f3759df` , or  `1,597,463,007`  in decimal notation, is one such magic number that appears in the Quake 3: Arena source code, in a genuinely beautiful hack committed by John Carmack.

## Here comes the maths bit, concentrate

When you're doing 3D rendering, you have to find the square root of  `x`  (where  `x`  is a variable input) rather a lot.

Carmack's code contains a fast way of working out the inverse square root of  `x` , which can be written as  `1/sqrt(x)` . With that information. we can work out  `sqrt(x)`  easily -

```c
x * (1/sqrt(x)) = sqrt(x)
```

The beauty here is that we don't have to be exactly correct. 3D modelling can operate in tolerances. If our result for  `sqrt(x)`  is out a little bit, that's okay - nobody will notice that the reflected light levels are off by a tiny amount. Carmack's code accepts this and embraces it. Here it is, trimmed a bit for clarity but with original comments -

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

```c
i = 0x5f3759df - (i >> 1); // what the fuck?
```

So - if you take your input floating point number, turn it into an integer, do some very fast bitflipping magic that essentially just halves your input, subtract the result from  `0x5f3759df` , then turn that integer back into a floating point number, you get an eerily good approximation to the inverse square root of the input.

There is no obvious reason why this should work, and how Carmack or any of the previous users of this stunningly elegant hack came across the magic value  `0x5f3759df`  appears to have been lost to history. [Beyond3D tried to trace it back through the ages](https://www.beyond3d.com/content/articles/8/), but after going through Carmack, an x86 assembly hacker called Terje Matheson, NVIDIA and eventually Gary Tarolli who used it in his days at 3dfx, the trail went cold.

It's a real pity, because finding that constant would have required someone to think in a completely different direction to everyone else, and be convinced enough that such a constant even existed to spend time narrowing it down.
