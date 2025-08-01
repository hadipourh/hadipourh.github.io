---
title: "LaTeX Math Formulas Test"
date: 2025-08-01
excerpt: "Testing LaTeX mathematical notation support in blog posts with various cryptographic formulas and equations."
tags: ["LaTeX", "mathematics", "cryptography", "test"]
draft: false
---

# LaTeX Math Formulas Test

This blog post tests the LaTeX mathematical notation support on the website. Here are various types of mathematical expressions commonly used in cryptography research.

## Inline Math

Here's some inline math: $E_k(P) = C$ represents encryption of plaintext $P$ with key $k$ producing ciphertext $C$.

The probability of a differential characteristic is $p = 2^{-n}$ where $n$ is the number of active S-boxes.

## Block Math Equations

### Basic Cryptographic Operations

The AES encryption function can be represented as:

$$E_k(P) = AddRoundKey(SR(SB(AddRoundKey(P, k_0))), k_{10})$$

Where:
- $SR$ = ShiftRows transformation  
- $SB$ = SubBytes transformation
- $k_i$ = round key for round $i$

### Differential Cryptanalysis

The differential probability of an S-box is defined as:

$$DP^S(\alpha \rightarrow \beta) = \frac{|\{x : S(x) \oplus S(x \oplus \alpha) = \beta\}|}{2^n}$$

For a differential characteristic over $r$ rounds:

$$p = \prod_{i=1}^{r} DP_i(\alpha_i \rightarrow \beta_i)$$

### Linear Cryptanalysis

The linear approximation probability is:

$$LP(\alpha, \beta) = \left(\frac{|\{x : \alpha \cdot x = \beta \cdot S(x)\}|}{2^n} - \frac{1}{2}\right)^2$$

### Complexity Calculations

The data complexity for a differential attack is approximately:

$$D \approx \frac{c}{\sqrt{p \cdot 2^n}}$$

Where:
- $c$ is a small constant (typically 2-8)
- $p$ is the probability of the differential
- $n$ is the block size

### Matrix Operations

The MixColumns operation in AES can be represented as matrix multiplication:

$$\begin{pmatrix}
02 & 03 & 01 & 01 \\
01 & 02 & 03 & 01 \\
01 & 01 & 02 & 03 \\
03 & 01 & 01 & 02
\end{pmatrix}
\begin{pmatrix}
s_{0,c} \\
s_{1,c} \\
s_{2,c} \\
s_{3,c}
\end{pmatrix}
=
\begin{pmatrix}
s'_{0,c} \\
s'_{1,c} \\
s'_{2,c} \\
s'_{3,c}
\end{pmatrix}$$

### Boolean Functions

A Boolean function $f: \{0,1\}^n \rightarrow \{0,1\}$ has algebraic degree:

$$\deg(f) = \max\{|I| : a_I \neq 0 \text{ where } f(x) = \bigoplus_{I \subseteq \{1,...,n\}} a_I \prod_{i \in I} x_i\}$$

### Cryptographic Bounds

The covering radius of a linear code is bounded by:

$$R \leq \frac{n-k}{2} + O(\sqrt{n})$$

Where $n$ is the length and $k$ is the dimension of the code.

### Summations and Products

The bias of a linear approximation over multiple rounds:

$$\varepsilon_{total} = 2^{r-1} \prod_{i=1}^{r} \varepsilon_i$$

And the success probability:

$$P_{success} = \Phi\left(\frac{\sqrt{N} \cdot |\varepsilon|}{2}\right)$$

Where $\Phi$ is the cumulative distribution function of the standard normal distribution.

## Conclusion

If you can see all the mathematical formulas rendered properly above, then LaTeX support is working correctly! The formulas should display as proper mathematical notation, not raw LaTeX code.

## Test Checklist

- [x] Inline math with dollar signs: $x + y = z$
- [x] Block math with double dollar signs
- [x] Greek letters: $\alpha, \beta, \gamma, \Delta, \Phi$  
- [x] Subscripts and superscripts: $x_i^2$
- [x] Fractions: $\frac{a}{b}$
- [x] Square roots: $\sqrt{x}$
- [x] Matrices
- [x] Summations and products
- [x] Complex mathematical expressions

If all items above render correctly, LaTeX support is fully functional!
