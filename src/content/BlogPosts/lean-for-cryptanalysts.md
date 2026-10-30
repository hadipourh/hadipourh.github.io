---
title: "Lean for Cryptanalysts: A Practical Introduction to Formal Proofs"
date: "2026-10-29"
excerpt: "Learn how to turn a cryptanalytic argument into a machine-checked proof with Lean, from a Feistel-round warm-up to an identity connecting linear and integral sums."
tags: ["symmetric-key cryptanalysis", "Lean", "formal verification", "tutorial"]
---

Many results in cryptanalysis rest on mathematical arguments, such as an identity that connects two distinguishers or a property of an S-box that justifies a constraint in a search model. We usually check them by hand, so small mistakes can go unnoticed.

This post shows how to let a computer check such arguments using <span class="lean-name">Lean</span>, a language for writing mathematical proofs. We begin with a warm-up, the invertibility of a Feistel round, and then formalize an identity [connecting linear and integral sums](https://ia.cr/2026/2471). By the end, you will be able to read these proofs, run them in your editor, and adapt them to claims from your own research.

**No background in <span class="lean-name">Lean</span> is assumed.** Familiarity with bits, block ciphers, and finite sums is enough.

<p class="lean-download"><a href="/downloads/lean-for-cryptanalysts/lean-for-cryptanalysts.zip">Download the runnable tutorial</a><span>Lean 4.35.0 · Mathlib v4.35.0</span></p>

<nav class="lean-contents" aria-label="In this article">
<strong>In this article</strong>
<ol>
<li><a href="#what-does-lean-check">What does Lean check?</a></li>
<li><a href="#a-warm-up-one-feistel-round">A warm-up: one Feistel round</a></li>
<li><a href="#setting-up-the-tutorial-project">Setting up the tutorial project</a></li>
<li><a href="#a-small-cryptanalytic-argument">A small cryptanalytic argument</a></li>
<li><a href="#reading-the-algebraic-step-in-lean">Reading the algebraic step in Lean</a></li>
<li><a href="#defining-the-cryptographic-objects">Defining the cryptographic objects</a></li>
<li><a href="#building-the-complete-proof">Building the complete proof</a></li>
<li><a href="#from-an-identity-to-divisibility">From an identity to divisibility</a></li>
<li><a href="#finite-checks-and-missing-assumptions">Finite checks and missing assumptions</a></li>
<li><a href="#checking-and-adapting-the-example">Checking and adapting the example</a></li>
</ol>
</nav>

## What does Lean check?

<span class="lean-name">Lean</span> is a programming language for mathematics. Instead of writing a program that computes an answer, we write a theorem and its proof, and <span class="lean-name">Lean</span> checks that every step of the proof is valid. Such a tool is called an **interactive theorem prover**. It is *interactive* because it tells us, while we type, what remains to be proved.

A <span class="lean-name">Lean</span> file has three parts:

- **Definitions** of the objects we study, such as an S-box or a sum over all inputs.
- A **theorem statement**: assumptions, such as “$x$ is even”, and a claim, such as “$x^2$ is even”.
- A **proof** that the claim follows from the assumptions.

While we write a proof, a panel in the editor called the **Infoview** shows the assumptions we may use and the claim that still has to be proved. This remaining claim is called the **goal**. The proof is complete when no goal remains.

Most proofs are written as a sequence of commands called **tactics**. Each tactic performs one step of reasoning, much like one line of a handwritten proof. For example:

- `simp` simplifies the goal using definitions and known identities, such as $y\oplus y=0$.
- `rw` rewrites using an equation. If we know $x=y+1$, it replaces $x$ by $y+1$ in the goal.
- `ring` proves an identity by algebraic rearrangement, such as $(a+b)^2=a^2+2ab+b^2$.
- `linarith` proves a goal that follows from the assumptions by linear arithmetic, such as $x<z$ from $x<y$ and $y<z$.

Each tactic either proves the goal or replaces it with simpler goals. We will use these tactics in the examples below.

Some tactics are large programs, and large programs can have bugs. <span class="lean-name">Lean</span> therefore does not simply trust them. Each tactic produces a complete, detailed proof, and a small separate part of <span class="lean-name">Lean</span>, its **kernel**, checks that proof. We need to trust the kernel, not every tactic. The [Lean reference explains this proof-checking process](https://lean-lang.org/doc/reference/4.35.0/Tactic-Proofs/).

For a cryptanalyst, this catches familiar mistakes. A factor of two cannot disappear between two lines. A sum over half the inputs cannot quietly become a sum over all of them. A theorem about permutations cannot be applied to an arbitrary function until we prove that the function is a permutation.

<span class="lean-name">Lean</span> does not check whether our definitions describe what we intend. If we define an S-box with a wrong table entry, <span class="lean-name">Lean</span> will correctly prove facts about the wrong S-box. Choosing the definitions is our job. <span class="lean-name">Lean</span> checks the reasoning built on them, and anyone can rerun that check.

<figure class="lean-trust">
<div class="lean-trust-flow">
<section class="lean-trust-group lean-trust-human">
<p class="lean-trust-label">Checked by you</p>
<div class="lean-trust-step">
<strong>1. Definitions and statement</strong>
<p>The objects and the claim, for example: if <i>x</i> is even, then <i>x</i><sup>2</sup> is even.</p>
<p><span class="lean-name">Lean</span> cannot tell whether they describe what you intend.</p>
</div>
</section>
<span class="lean-trust-arrow" aria-hidden="true">→</span>
<section class="lean-trust-group lean-trust-machine">
<p class="lean-trust-label">Checked by <span class="lean-name">Lean</span></p>
<div class="lean-trust-steps">
<div class="lean-trust-step">
<strong>2. Proof written with tactics <span class="lean-trust-tag">not trusted</span></strong>
<p>You apply tactics such as <code>simp</code> or <code>ring</code>, one at a time. After each one, the Infoview shows the goal that remains.</p>
<p>Tactics are large programs and may have bugs. Each produces a complete, detailed proof.</p>
</div>
<span class="lean-trust-arrow" aria-hidden="true">→</span>
<div class="lean-trust-step">
<strong>3. Kernel <span class="lean-trust-tag is-trusted">trusted</span></strong>
<p>A small part of <span class="lean-name">Lean</span> checks every step of the detailed proof.</p>
<p class="lean-trust-result">If every step is valid, the theorem is proved, and anyone can rerun the check.</p>
</div>
</div>
</section>
</div>
<figcaption>To trust a result checked by <span class="lean-name">Lean</span>, read its definitions and statement carefully. The kernel checks the proof.</figcaption>
</figure>

## A warm-up: one Feistel round

Before the cryptanalytic example, we prove a fact every cryptanalyst knows. For a round function $F$ on $n$-bit words, one Feistel round maps a pair of words to

$$
(x_L,x_R)\mapsto\bigl(x_R,\;x_L\oplus F(x_R)\bigr).
$$

The round can be undone for every $F$, even when $F$ itself is not invertible: the map $(y_L,y_R)\mapsto(y_R\oplus F(y_L),\;y_L)$ restores the input, because $(x_L\oplus F(x_R))\oplus F(x_R)=x_L$.

This example needs nothing beyond <span class="lean-name">Lean</span> itself, so it is the quickest way to try the editor:

1. **Install <span class="lean-name">Lean</span>.** Follow the [official setup guide](https://lean-lang.org/install/). It walks you through installing VS Code, the *Lean 4* extension for VS Code, and <span class="lean-name">Lean</span> itself.
2. **Open the warm-up file.** Download <a href="/downloads/lean-for-cryptanalysts/Warmup.lean" download>Warmup.lean</a> and open it in VS Code.

The Infoview opens to the right of the file. If it does not, press <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd>, or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Enter</kbd> on Windows and Linux. It shows the proof at the position of the cursor, so we move through a proof by moving the cursor. <span class="lean-name">Lean</span> rechecks the file as we type. There is no compile button, and we do not need to save. If VS Code reports that no default toolchain is configured, run `elan default stable` in a terminal. **elan** is the tool that installs <span class="lean-name">Lean</span> versions and selects one.

The file starts with two definitions:

```lean
def feistel {n : Nat} (F : BitVec n → BitVec n)
    (x : BitVec n × BitVec n) : BitVec n × BitVec n :=
  (x.2, x.1 ^^^ F x.2)

def feistelInv {n : Nat} (F : BitVec n → BitVec n)
    (y : BitVec n × BitVec n) : BitVec n × BitVec n :=
  (y.2 ^^^ F y.1, y.1)
```

Read the first definition piece by piece:

- `def feistel` introduces a definition named `feistel`.
- A colon means “has type.” `Nat` is the type of natural numbers, `BitVec n` is the type of $n$-bit words, and `BitVec n × BitVec n` is the type of pairs of words.
- `(F : BitVec n → BitVec n)` is the round function. The arrow `→` describes a function's input and output types, so `F` may be any function from $n$-bit words to $n$-bit words.
- `{n : Nat}` is an *implicit argument*. <span class="lean-name">Lean</span> infers the word size from the type of `F`, so we never supply `n` ourselves.
- The result follows `:=`. `x.1` and `x.2` are the two halves of `x`, `^^^` is XOR, and `F x.2` applies `F` to `x.2`. Function application uses spaces, without parentheses.

**Typing symbols.** In VS Code, type a backslash, an abbreviation, and a space: `\to` gives `→`, and `\times` or `\x` gives `×`. Most abbreviations are LaTeX command names, so you can often guess them. To find out how to type a symbol you see, hover over it with the mouse.

`feistelInv` follows the same pattern. Now the theorem, with one tactic for each step of the handwritten argument:

```lean
theorem feistel_inverse {n : Nat} (F : BitVec n → BitVec n)
    (l r : BitVec n) :
    feistelInv F (feistel F (l, r)) = (l, r) := by
  simp only [feistel, feistelInv]
  rw [BitVec.xor_assoc]
  rw [BitVec.xor_self]
  rw [BitVec.xor_zero]
```

`theorem feistel_inverse` names the statement. The objects it talks about come before the last colon, and the claim comes after it. Since `n`, `F`, `l`, and `r` are arbitrary, the theorem covers every word size, every round function, and every input. `:= by` starts the proof, and each following line is one tactic:

1. `simp only [feistel, feistelInv]` unfolds the two definitions, simplifying `(a, b).1` to `a`, and does nothing else. The goal becomes `(l ^^^ F r ^^^ F r, r) = (l, r)`. Since `^^^` groups from the left, its first entry is $(l\oplus F(r))\oplus F(r)$.
2. `rw [BitVec.xor_assoc]` rewrites with the library fact that XOR is associative, regrouping the first entry as $l\oplus(F(r)\oplus F(r))$.
3. `rw [BitVec.xor_self]` uses $y\oplus y=0$. Here `0#n` is <span class="lean-name">Lean</span>'s notation for the $n$-bit zero word.
4. `rw [BitVec.xor_zero]` uses $y\oplus 0=y$. Both sides are now identical, so `rw` closes the goal automatically.

Step through the proof with the buttons below, or move the cursor from line to line in the editor. The Infoview lists the assumptions `n`, `F`, `l`, and `r`, followed by the goal after the symbol `⊢` (read “turnstile”; in logic, $\Gamma\vdash\varphi$ means that $\varphi$ can be proved from the assumptions $\Gamma$). At the end of the last line, the Infoview shows *Goals accomplished!*

<figure class="lean-editor" data-lean-stepper>
<div class="lean-controls" role="group" aria-label="Choose the cursor position">
<button type="button" data-view="start" aria-pressed="true">Start</button>
<button type="button" data-view="simp" aria-pressed="false">After simp only</button>
<button type="button" data-view="assoc" aria-pressed="false">After xor_assoc</button>
<button type="button" data-view="self" aria-pressed="false">After xor_self</button>
<button type="button" data-view="zero" aria-pressed="false">After xor_zero</button>
<button type="button" data-view="skip" aria-pressed="false">Skip xor_assoc</button>
</div>
<div class="lean-editor-window">
<div class="lean-editor-pane">
<div class="lean-pane-title">Warmup.lean</div>
<ol class="lean-editor-code" style="counter-reset: line 17" aria-label="Lean source">
<li>theorem feistel_inverse {n : Nat} (F : BitVec n → BitVec n)</li>
<li>    (l r : BitVec n) :</li>
<li>    feistelInv F (feistel F (l, r)) = (l, r) := by</li>
<li class="is-marked" data-mark="start simp">  <span class="lean-caret" data-show="start" aria-hidden="true"></span>simp only [feistel, feistelInv]<span class="lean-caret" data-show="simp" hidden aria-hidden="true"></span></li>
<li data-show="start simp assoc self zero" data-mark="assoc">  rw [BitVec.xor_assoc]<span class="lean-caret" data-show="assoc" hidden aria-hidden="true"></span></li>
<li data-mark="self skip">  rw [<span class="lean-error-token" data-mark="skip">BitVec.xor_self</span>]<span class="lean-caret" data-show="self skip" hidden aria-hidden="true"></span></li>
<li data-mark="zero">  rw [BitVec.xor_zero]<span class="lean-caret" data-show="zero" hidden aria-hidden="true"></span></li>
</ol>
</div>
<div class="lean-editor-pane lean-infoview" aria-live="polite">
<div class="lean-pane-title">Lean Infoview</div>
<div class="lean-infoview-body">
<p class="lean-infoview-label">Tactic state</p>
<div class="lean-goal" data-show="start">n : Nat
F : BitVec n → BitVec n
l r : BitVec n
⊢ feistelInv F (feistel F (l, r)) = (l, r)</div>
<div class="lean-goal" data-show="simp skip" hidden>n : Nat
F : BitVec n → BitVec n
l r : BitVec n
<span class="lean-new">⊢ (l ^^^ F r ^^^ F r, r) = (l, r)</span></div>
<div class="lean-goal" data-show="assoc" hidden>n : Nat
F : BitVec n → BitVec n
l r : BitVec n
<span class="lean-new">⊢ (l ^^^ (F r ^^^ F r), r) = (l, r)</span></div>
<div class="lean-goal" data-show="self" hidden>n : Nat
F : BitVec n → BitVec n
l r : BitVec n
<span class="lean-new">⊢ (l ^^^ 0#n, r) = (l, r)</span></div>
<div class="lean-goal" data-show="zero" hidden>Goals accomplished!</div>
<p class="lean-infoview-label" data-show="skip" hidden>Error</p>
<div class="lean-goal lean-message-error" data-show="skip" hidden>Tactic `rewrite` failed: Did not find an occurrence of the pattern
  ?m.11 ^^^ ?m.11
in the target expression
  (l ^^^ F r ^^^ F r, r) = (l, r)</div>
</div>
</div>
</div>
<figcaption>A simplified view of VS Code with the warm-up file open. Each step changes the goal, highlighted in the Infoview. The Infoview text is <span class="lean-name">Lean</span>'s actual output at each cursor position.</figcaption>
</figure>

The last view shows what happens without step 2. Delete the line `rw [BitVec.xor_assoc]`, and <span class="lean-name">Lean</span> underlines `BitVec.xor_self` in red. The pattern `?m.11 ^^^ ?m.11`, where `?m.11` stands for any word, needs the same word twice, side by side. In `l ^^^ F r ^^^ F r`, the two copies of `F r` are not yet grouped together. A handwritten proof uses associativity without comment; <span class="lean-name">Lean</span> requires it as an explicit step. Undo the change with <kbd>Cmd</kbd>+<kbd>Z</kbd> (<kbd>Ctrl</kbd>+<kbd>Z</kbd>).

Once each step is clear, the whole proof fits in one line, and the file contains this version too:

```lean
example {n : Nat} (F : BitVec n → BitVec n) (l r : BitVec n) :
    feistelInv F (feistel F (l, r)) = (l, r) := by
  simp [feistel, feistelInv, BitVec.xor_assoc]
```

`example` states and proves a claim without giving it a name. Without `only`, `simp` also uses the identities it knows by default, such as `BitVec.xor_self` and `BitVec.xor_zero`, and finds the order of the steps itself. Experienced users often prefer such one-line proofs. The step-by-step version shows what each step does.

Finally, compare the general theorem with a finite check:

```lean
def toyF (r : BitVec 4) : BitVec 4 := r &&& 3

theorem toy_inverse :
    ∀ l r : BitVec 4, feistelInv toyF (feistel toyF (l, r)) = (l, r) := by
  decide
```

`toyF` keeps the two low bits of a 4-bit word and clears the others, because `&&&` is bitwise AND. It is far from invertible. `∀` (typed `\forall`) means “for every.” The tactic `decide` proves the statement by checking all $2^8$ inputs. This works only because the word size and the round function are fixed. The theorem `feistel_inverse` needs no enumeration and covers infinitely many cases. The cryptanalytic proof below works the same way.

As an exercise, prove that `feistel` also undoes `feistelInv`. The statement is at the end of the file, and the same four steps prove it. Together, the two theorems show that the round is a permutation.

## Setting up the tutorial project

The cryptanalytic example uses **Mathlib**, <span class="lean-name">Lean</span>'s community library of mathematics. It provides finite sums and many of the tactics we use. Setting up the project takes four steps. The download in step 3 is large, so start it now and let it run while you read the next section.

1. **Download the tutorial.** Download and extract the [tutorial project](/downloads/lean-for-cryptanalysts/lean-for-cryptanalysts.zip). It contains the <a href="/downloads/lean-for-cryptanalysts/LeanForCryptanalysts.lean" download>complete Lean source</a>, the exact versions of <span class="lean-name">Lean</span> and Mathlib it was checked with, and a short README.
2. **Open the folder, not just the file.** In VS Code, choose *File → Open Folder…* and select the extracted `lean-for-cryptanalysts` folder. <span class="lean-name">Lean</span> reads the project settings in this folder to find Mathlib.
3. **Download Mathlib.** Open a terminal in VS Code (*Terminal → New Terminal*) and run:

   ```bash
   lake exe cache get
   ```

   **Lake** is <span class="lean-name">Lean</span>'s project tool. This command downloads Mathlib already compiled, which needs about 7 GB of disk space. If the terminal reports `lake: command not found`, restart VS Code so that it finds the new installation.
4. **Open `LeanForCryptanalysts.lean`.** The first time, <span class="lean-name">Lean</span> needs a moment to load Mathlib before it can check the file.

## A small cryptanalytic argument

Fix a key and regard encryption as a permutation $E$ of $V=\mathbb{F}_2^n$, where $n$ is the block size. For masks $\alpha,\beta\in V$, $\alpha\cdot x$ denotes the dot product over $\mathbb{F}_2$. We use two signed sums. The **linear sum**

$$
L_{\alpha,\beta}(E)=\sum_{x\in V}(-1)^{\alpha\cdot x\oplus\beta\cdot E(x)}
$$

is the correlation of the linear approximation with masks $\alpha$ and $\beta$, without the factor $2^{-n}$. For a set of plaintexts $\mathcal{X}\subseteq V$, the **signed integral sum** is

$$
I_\beta(\mathcal{X};E)=\sum_{x\in\mathcal{X}}(-1)^{\beta\cdot E(x)}.
$$

If $\mathcal{X}$ contains $M$ plaintexts and $N_1$ of them satisfy $\beta\cdot E(x)=1$, then $I_\beta(\mathcal{X};E)=M-2N_1$. In particular, $I_\beta(\mathcal{X};E)=0$ exactly when $\beta\cdot E$ is balanced on $\mathcal{X}$.

We take the simplest plaintext structure, an **affine halfspace**:

$$
\mathcal{X}_b=\{x\in V:\alpha\cdot x=b\},\qquad b\in\mathbb{F}_2.
$$

For nonzero $\alpha$, the halfspaces $\mathcal{X}_0$ and $\mathcal{X}_1$ split $V$ into two halves of $2^{n-1}$ plaintexts each. With $\alpha$, $\beta$, and $E$ fixed, we abbreviate

$$
L=L_{\alpha,\beta}(E),\qquad I_b=I_\beta(\mathcal{X}_b;E).
$$

The argument has two steps:

- **Splitting.** On $\mathcal{X}_b$, we have $(-1)^{\alpha\cdot x}=(-1)^b$. Splitting the linear sum into the two halfspaces therefore gives $L=I_0-I_1$.
- **Balance.** Since $E$ is a permutation and $\beta\neq0$, the bit $\beta\cdot E(x)$ is zero for exactly half of all $x\in V$. Thus $I_0+I_1=0$.

Together, they give the following identity for every permutation $E$ and all nonzero masks $\alpha$ and $\beta$:

$$
\boxed{L_{\alpha,\beta}(E)=2\,I_\beta(\mathcal{X}_0;E)=-2\,I_\beta(\mathcal{X}_1;E).}
$$

For the formalization, $\alpha$ selects the leftmost input bit and $\beta$ the leftmost output bit. We write an input as $x=(b,z)$, where $b$ is the selected bit and $z\in\mathbb{F}_2^m$ holds the remaining $m=n-1$ bits. Then $\alpha\cdot x=b$, so $\mathcal{X}_b$ contains the inputs whose selected bit equals $b$, and $\beta\cdot E(x)$ is the selected bit of $E(x)$.

Here is an eight-input illustration with $n=3$, where $\alpha$ and $\beta$ select the leftmost bit as above. The toy permutation flips the selected bit exactly when the other two bits are both one. Applying it twice restores the input.

<figure class="lean-explorer" data-halfspace-explorer>
<div class="lean-explorer-heading"><strong>Two halves, one exact relation</strong><span>Each row shows x → E(x) and the term (−1)<sup>β·E(x)</sup>, where β·E(x) is the leftmost bit of E(x)</span></div>
<div class="lean-controls" role="group" aria-label="Choose the example map">
<button type="button" data-map="toy" aria-pressed="true">Toy permutation</button>
<button type="button" data-map="identity" aria-pressed="false">Identity permutation</button>
<button type="button" data-map="constant" aria-pressed="false">Constant function</button>
</div>
<div class="lean-halves">
<section><h4>Halfspace 𝒳<sub>0</sub>: selected bit 0</h4><ul data-half="0"><li><code>000 → 000</code><span class="sign-plus">+1</span></li><li><code>001 → 001</code><span class="sign-plus">+1</span></li><li><code>010 → 010</code><span class="sign-plus">+1</span></li><li><code>011 → 111</code><span class="sign-minus">−1</span></li></ul><p>I₀ = <strong data-i0>2</strong></p></section>
<section><h4>Halfspace 𝒳<sub>1</sub>: selected bit 1</h4><ul data-half="1"><li><code>100 → 100</code><span class="sign-minus">−1</span></li><li><code>101 → 101</code><span class="sign-minus">−1</span></li><li><code>110 → 110</code><span class="sign-minus">−1</span></li><li><code>111 → 011</code><span class="sign-plus">+1</span></li></ul><p>I₁ = <strong data-i1>−2</strong></p></section>
</div>
<div class="lean-result" aria-live="polite" aria-atomic="true"><p data-relation>I₀ + I₁ = 0 · L = I₀ − I₁ = 4 · 2I₀ = 4</p><p data-explanation>All eight outputs are distinct. The two halves have opposite sums, and L = 2I₀.</p></div>
<figcaption>Explore the sums, then compare a permutation with a function that repeats its outputs. This illustration runs in the browser. The downloadable Lean file independently checks the displayed toy and constant-function values.</figcaption>
</figure>

Our goal is to prove the identity for every block size and every permutation, beyond the eight inputs in the illustration. This is the halfspace case of the linear-to-integral conversion, but its short proof is enough for our first formalization.

## Reading the algebraic step in Lean

Start with the last algebraic step. Suppose three integers satisfy $I_0+I_1=0$ and $L=I_0-I_1$. In <span class="lean-name">Lean</span>, we write the following. It is the first theorem in `LeanForCryptanalysts.lean`, so you can follow along in the editor.

```lean
import Mathlib

theorem halfspace_algebra (I₀ I₁ L : ℤ)
    (hbalance : I₀ + I₁ = 0)
    (hlinear : L = I₀ - I₁) :
    L = 2 * I₀ := by
  linarith
```

Compared with the warm-up, three things are new:

- `import Mathlib` loads Mathlib, which provides the tactic `linarith`.
- `(I₀ I₁ L : ℤ)` introduces three arbitrary integers. `ℤ` (typed `\Z`) is the type of integers, and subscripts such as `₀` are typed `\0`.
- `(hbalance : ...)` and `(hlinear : ...)` are assumptions. They are written like the other arguments and given names, so that we can refer to them later.

As before, the claim `L = 2 * I₀` follows the last colon. `linarith` proves it from the assumptions by linear arithmetic.

There are no particular values assigned to these integers. The theorem covers **all** integers satisfying its hypotheses. <span class="lean-name">Lean</span> does not establish the hypotheses by this step. We will prove them from the cryptographic definitions below.

As in the warm-up, place the cursor at the start of the `linarith` line, line 22 of the file, and then at its end. The figure below shows both views.

<figure class="lean-editor" data-lean-stepper>
<div class="lean-controls" role="group" aria-label="Choose what the editor shows">
<button type="button" data-view="before" aria-pressed="true">Cursor before linarith</button>
<button type="button" data-view="after" aria-pressed="false">Cursor after linarith</button>
<button type="button" data-view="broken" aria-pressed="false">Delete hbalance</button>
</div>
<div class="lean-editor-window">
<div class="lean-editor-pane">
<div class="lean-pane-title">LeanForCryptanalysts.lean</div>
<ol class="lean-editor-code" style="counter-reset: line 17" aria-label="Lean source">
<li>theorem halfspace_algebra (I₀ I₁ L : ℤ)</li>
<li data-show="before after">    (hbalance : I₀ + I₁ = 0)</li>
<li>    (hlinear : L = I₀ - I₁) :</li>
<li>    L = 2 * I₀ := by</li>
<li class="is-marked" data-mark="before after broken">  <span class="lean-caret" data-show="before broken" aria-hidden="true"></span><span class="lean-error-token" data-mark="broken">linarith</span><span class="lean-caret" data-show="after" hidden aria-hidden="true"></span></li>
</ol>
</div>
<div class="lean-editor-pane lean-infoview" aria-live="polite">
<div class="lean-pane-title">Lean Infoview</div>
<div class="lean-infoview-body">
<p class="lean-infoview-label">Tactic state</p>
<div class="lean-goal" data-show="before">I₀ I₁ L : ℤ
hbalance : I₀ + I₁ = 0
hlinear : L = I₀ - I₁
⊢ L = 2 * I₀</div>
<div class="lean-goal" data-show="after" hidden>Goals accomplished!</div>
<div class="lean-goal" data-show="broken" hidden>I₀ I₁ L : ℤ
hlinear : L = I₀ - I₁
⊢ L = 2 * I₀</div>
<p class="lean-infoview-label" data-show="broken" hidden>Error</p>
<div class="lean-goal lean-message-error" data-show="broken" hidden>linarith failed to find a contradiction
case h1
I₀ I₁ L : ℤ
hlinear : L = I₀ - I₁
a✝ : L &lt; 2 * I₀
⊢ False
failed</div>
</div>
</div>
</div>
<figcaption>A simplified view of VS Code with the tutorial open. The Infoview text is <span class="lean-name">Lean</span>'s actual output at each cursor position.</figcaption>
</figure>

Next, break the proof on purpose. Delete the line `(hbalance : I₀ + I₁ = 0)`. <span class="lean-name">Lean</span> immediately underlines `linarith` in red and reports the error shown in the third view above.

The message shows how `linarith` works. To prove an equality, it proves two inequalities, each by contradiction. In the first case, named `h1`, it assumes the opposite inequality, `L < 2 * I₀`, and searches the assumptions for a contradiction. `a✝` is the temporary name <span class="lean-name">Lean</span> gives this extra assumption. Without `hbalance`, there is no contradiction to find. For example, $I_0=1$, $I_1=0$, and $L=1$ satisfy $L=I_0-I_1$ but not $L=2I_0$. Undo the deletion with <kbd>Cmd</kbd>+<kbd>Z</kbd> (<kbd>Ctrl</kbd>+<kbd>Z</kbd>), and the error disappears.

This loop is how we work with <span class="lean-name">Lean</span>: write a step, look at what remains, and continue until no goals remain.

## Defining the cryptographic objects

Now we give the sums their actual meaning. <span class="lean-name">Lean</span>'s `Bool` type has two values, `false` and `true`. We use them for bits zero and one. A Boolean is not a number in <span class="lean-name">Lean</span>, so before raising $-1$ to a bit, we convert the bit to $0$ or $1$:

```lean
def sign (b : Bool) : ℤ :=
  (-1) ^ b.toNat

theorem sign_false : sign false = 1 := by
  rfl

theorem sign_true : sign true = -1 := by
  rfl
```

Here `sign` takes a Boolean value `b` and returns the integer $(-1)^b$. The dot notation `b.toNat` applies the library function `Bool.toNat` to `b`, turning `false` and `true` into `0` and `1`. The tactic `rfl` proves an equality when both sides become identical after unfolding definitions and computing. Here, `sign false` computes to $(-1)^0=1$.

We separate the selected bit from the remaining bits:

```lean
abbrev State (m : ℕ) := Bool × BitVec m
```

`ℕ` (typed `\N`) is Mathlib's notation for `Nat`. A `State m` pairs one Boolean coordinate with an $m$-bit word: $n=m+1$ bits in total. `abbrev` gives this type a convenient name. As in the warm-up, a pair is written `(b, z)`, and `.1` selects its first coordinate.

With this representation, `x.1` is $\alpha\cdot x$ and `(E x).1` is $\beta\cdot E(x)$. The two sums become:

```lean
def halfSum {m : ℕ} (E : State m → State m) (b : Bool) : ℤ :=
  ∑ z : BitVec m, sign (E (b, z)).1

def linearSum {m : ℕ} (E : State m → State m) : ℤ :=
  ∑ x : State m, sign x.1 * sign (E x).1
```

`halfSum E b` is $I_b=I_\beta(\mathcal{X}_b;E)$: it fixes the selected bit to `b` and sums over the remaining bits `z`. `linearSum E` is $L=L_{\alpha,\beta}(E)$, written with the product $(-1)^{\alpha\cdot x}(-1)^{\beta\cdot E(x)}$, which equals $(-1)^{\alpha\cdot x\oplus\beta\cdot E(x)}$.

The notation `∑ z : BitVec m, ...`, with `∑` typed `\sum`, sums over every $m$-bit word. As in the warm-up, `{m : ℕ}` is an implicit argument, inferred from the type of `E`.

Both definitions accept any function. The permutation assumption belongs in the theorem, precisely where we need it. Selecting single bits keeps the code small. Other nonzero masks $\alpha$ and $\beta$ reduce to this case by an invertible linear change of coordinates on the input and output.

## Building the complete proof

We organize the proof into the same two steps as the argument above, splitting and balance:

1. `split_linear` proves that `linearSum E = halfSum E false - halfSum E true` for any function `E`.
2. `balanced_halves` proves that `halfSum E false + halfSum E true = 0` when `E` is bijective.

The downloadable file proves both facts. Their full proofs are below, so they can be inspected without interrupting the main argument.

<details class="lean-detail">
<summary>Open the proof that splits the linear sum</summary>

```lean
theorem split_linear {m : ℕ} (E : State m → State m) :
    linearSum E = halfSum E false - halfSum E true := by
  simp only [linearSum, Fintype.sum_prod_type, Fintype.sum_bool,
    sign_false, sign_true, one_mul, neg_one_mul,
    Finset.sum_neg_distrib, halfSum]
  ring
```

`simp only [...]` simplifies using the specified definitions and established identities. Here it expands the sum over pairs into sums over their two coordinates, evaluates the two Boolean cases, and moves a minus sign outside a sum. `ring` finishes by algebraic rearrangement. Neither command needs to enumerate the $2^m$ words.

</details>

<details class="lean-detail">
<summary>Open the proof that a permutation gives balanced outputs</summary>

```lean
theorem balanced_halves {m : ℕ} (E : State m → State m)
    (hE : Function.Bijective E) :
    halfSum E false + halfSum E true = 0 := by
  have reorder :
      (∑ x : State m, sign (E x).1) =
        ∑ y : State m, sign y.1 :=
    Equiv.sum_comp (Equiv.ofBijective E hE) (fun y => sign y.1)
  simpa [Fintype.sum_prod_type, halfSum, sign, add_comm] using reorder
```

`Function.Bijective E` means that every output occurs exactly once. `have reorder` introduces an intermediate equality. The library theorem `Equiv.sum_comp` justifies reordering a finite sum through a bijection, which `Equiv.ofBijective E hE` constructs from `E` and its proof of bijectivity. The expression `fun y => sign y.1` means “the function taking `y` to `sign y.1`,” that is, to $-1$ raised to the first coordinate of `y`.

After reordering, each tail word contributes one output with first bit zero and one with first bit one. Their terms $+1$ and $-1$ cancel. `simpa [...] using reorder` simplifies the intermediate equality into the required statement, using the named definitions and identities. `add_comm` permits swapping the two summands.

</details>

The main theorem combines these facts with our first algebraic proof. Step through it with the buttons, or place the cursor on each line in the editor:

<figure class="lean-editor" data-lean-stepper>
<div class="lean-controls" role="group" aria-label="Choose the cursor position">
<button type="button" data-view="start" aria-pressed="true">Start</button>
<button type="button" data-view="first" aria-pressed="false">After the first have</button>
<button type="button" data-view="second" aria-pressed="false">After the second have</button>
<button type="button" data-view="done" aria-pressed="false">After exact</button>
</div>
<div class="lean-editor-window">
<div class="lean-editor-pane">
<div class="lean-pane-title">LeanForCryptanalysts.lean</div>
<ol class="lean-editor-code" style="counter-reset: line 61" aria-label="Lean source">
<li>theorem halfspace_identity {m : ℕ} (E : State m → State m)</li>
<li>    (hE : Function.Bijective E) :</li>
<li>    linearSum E = 2 * halfSum E false := by</li>
<li class="is-marked" data-mark="start first">  <span class="lean-caret" data-show="start" aria-hidden="true"></span>have hbalance := balanced_halves E hE<span class="lean-caret" data-show="first" hidden aria-hidden="true"></span></li>
<li data-mark="second">  have hlinear := split_linear E<span class="lean-caret" data-show="second" hidden aria-hidden="true"></span></li>
<li data-mark="done">  exact halfspace_algebra _ _ _ hbalance hlinear<span class="lean-caret" data-show="done" hidden aria-hidden="true"></span></li>
</ol>
</div>
<div class="lean-editor-pane lean-infoview" aria-live="polite">
<div class="lean-pane-title">Lean Infoview</div>
<div class="lean-infoview-body">
<p class="lean-infoview-label">Tactic state</p>
<div class="lean-goal" data-show="start">m : ℕ
E : State m → State m
hE : Function.Bijective E
⊢ linearSum E = 2 * halfSum E false</div>
<div class="lean-goal" data-show="first" hidden>m : ℕ
E : State m → State m
hE : Function.Bijective E
<span class="lean-new">hbalance : halfSum E false + halfSum E true = 0</span>
⊢ linearSum E = 2 * halfSum E false</div>
<div class="lean-goal" data-show="second" hidden>m : ℕ
E : State m → State m
hE : Function.Bijective E
hbalance : halfSum E false + halfSum E true = 0
<span class="lean-new">hlinear : linearSum E = halfSum E false - halfSum E true</span>
⊢ linearSum E = 2 * halfSum E false</div>
<div class="lean-goal" data-show="done" hidden>Goals accomplished!</div>
</div>
</div>
</div>
<figcaption>Each <code>have</code> adds one named assumption, highlighted in the Infoview. The goal stays the same until <code>exact</code> proves it. The Infoview text is <span class="lean-name">Lean</span>'s actual output.</figcaption>
</figure>

Each `have` proves one intermediate fact and adds it to the assumptions under the given name. The two new assumptions have exactly the form of the assumptions of `halfspace_algebra`, with `halfSum E false`, `halfSum E true`, and `linearSum E` in place of $I_0$, $I_1$, and $L$. So `exact` can finish the goal by applying `halfspace_algebra`. Each `_` asks <span class="lean-name">Lean</span> to infer one of these three arguments. The proof follows the handwritten argument closely, with each intermediate fact checked separately.

We have proved a statement about **every** block size and **every** bijective `E`. The proof does not loop through possible ciphers or keys.

## From an identity to divisibility

The identity has an immediate consequence:

$$
2^{t+1}\mid L\quad\Longrightarrow\quad 2^t\mid I_0,
\qquad t\geq0.
$$

In <span class="lean-name">Lean</span>, `∣` means “divides.” It is not the vertical bar on the keyboard; type it as `\mid` or `\dvd`. We add the divisibility hypothesis and reuse the identity:

```lean
theorem transfer_divisibility {m : ℕ} (E : State m → State m)
    (hE : Function.Bijective E) (t : ℕ)
    (hdiv : (2 : ℤ) ^ (t + 1) ∣ linearSum E) :
    (2 : ℤ) ^ t ∣ halfSum E false := by
  rw [halfspace_identity E hE, pow_succ'] at hdiv
  exact (mul_dvd_mul_iff_left (by norm_num : (2 : ℤ) ≠ 0)).mp hdiv
```

`rw [...] at hdiv` rewrites the hypothesis using two equalities: $L=2I_0$ and $2^{t+1}=2\cdot2^t$. It becomes $2\cdot2^t\mid2I_0$. The next line cancels the common nonzero factor. The library lemma states that this cancellation is valid, and `.mp` uses its forward implication. `norm_num` proves the numerical side condition $2\ne0$. The annotation `(2 : ℤ)` makes clear that this is integer divisibility.

For example, if $2^{10}$ divides $L$, then $2^9$ divides $I_0$, the signed integral sum over the halfspace $\mathcal{X}_0$. Also, $L=0$ gives $I_0=0$: the bit $\beta\cdot E(x)$ is balanced on $\mathcal{X}_0$. The same conclusions hold on $\mathcal{X}_1$ because $I_1=-I_0$.

The result is useful for keyed ciphers too. A block cipher is a family of permutations $E_K$, one for each key $K$, so the theorem applies to each $E_K$ separately. <span class="lean-name">Lean</span> can express this without enumerating the key space:

```lean
theorem all_keys {Key : Type} {m : ℕ}
    (E : Key → State m → State m)
    (hE : ∀ K, Function.Bijective (E K)) :
    ∀ K, linearSum (E K) = 2 * halfSum (E K) false := by
  intro K
  exact halfspace_identity (E K) (hE K)
```

`Key : Type` leaves the key type arbitrary. `intro K` fixes an arbitrary key for the proof of the `∀` statement. The function `E K` is $E_K$, encryption under that key. This illustrates how a general lemma becomes reusable across cipher families.

## Finite checks and missing assumptions

<span class="lean-name">Lean</span> can also check finite claims by exact computation. For our three-bit illustration, define:

```lean
def toy (x : State 2) : State 2 :=
  (Bool.xor x.1 (x.2 == 3), x.2)

theorem toy_values :
    halfSum toy false = 2 ∧
    halfSum toy true = -2 ∧
    linearSum toy = 4 := by
  decide +kernel
```

`.2` selects the two-bit word. `==` tests whether it equals binary `11`, and `Bool.xor` flips the first bit in that case. The symbol `∧` (typed `\and` or `\wedge`) means “and.” For these finite statements, `decide +kernel` works like `decide` in the warm-up, but carries out the computation directly in <span class="lean-name">Lean</span>'s kernel. The tutorial also proves that applying `toy` twice returns the original state, establishing that it is a permutation.

This kind of finite proof is useful for small S-box identities and exact local table entries. Its cost grows with the computation. The symbolic halfspace proof above instead works at arbitrary block sizes without enumerating the inputs.

Now consider the constant function sending every input to zero. It is not a permutation. On three-bit inputs it has $I_0=I_1=4$ and $L=0$, so $L=2I_0$ is false. The tutorial includes a checked counterexample:

```lean
def constantMap (_ : State 2) : State 2 := (false, 0)

theorem missing_hypothesis_counterexample :
    linearSum constantMap = 0 ∧
    halfSum constantMap false = 4 ∧
    linearSum constantMap ≠ 2 * halfSum constantMap false := by
  decide +kernel
```

Here `_` names an input that the function ignores, and `≠` (typed `\ne`) means “is not equal to.” Removing the bijectivity assumption from the general theorem would prevent the proof from using `balanced_halves`. This concrete counterexample explains why the assumption matters. A tactic failing on its own would only mean that the tactic did not complete the proof.

## Checking and adapting the example

The editor checks the file while you work. To check the whole project from the command line, as a reviewer would, run this in the project folder:

```bash
lake build
```

The complete file wraps the examples in a namespace, a grouping of names that prevents collisions with other projects. Its `module` and `public section` lines make the file's organization explicit and allow its results to be imported elsewhere. Its final commands include:

```lean
#print axioms halfspace_identity
```

This command lists the foundational assumptions on which the theorem depends. For this tutorial the list contains <span class="lean-name">Lean</span>'s standard `propext`, `Classical.choice`, and `Quot.sound`. There are no additional assumed cryptographic claims. <span class="lean-name">Lean</span> also permits an unfinished proof marker called `sorry`, so a file that merely opens or compiles is not necessarily a completed formalization. The supplied project treats warnings as errors and contains no such placeholders.

For a first exercise, change the toy permutation and prove its new sums. Then try proving $L=-2I_1$ from the same two helper lemmas. A completed proof of that second identity is included as `other_half` in the download.

When applying <span class="lean-name">Lean</span> to your own work, start with a small claim that later arguments rely on: a normalization identity, a local cipher property, or a conversion between two statistics. Write its assumptions explicitly, prove the needed intermediate facts, and give each result a mathematical name. Small checked results can then support larger arguments, while remaining understandable to a reader.

If your results are already written in LaTeX, [Tex2Lean](https://github.com/meelgroup/tex2lean-releases) can help with a first draft. It uses a language model to read a paper, translate its results into a <span class="lean-name">Lean</span> project, and work on proofs that <span class="lean-name">Lean</span> then checks. It is designed mainly for papers about algorithms. The usual caution applies: <span class="lean-name">Lean</span> checks the proofs, but you still need to confirm that the translated definitions and statements say what the paper means, and that no `sorry` remains.

For further study, [Theorem Proving in Lean](https://lean-lang.org/theorem_proving_in_lean4/) introduces the language and proof methods. [Mathematics in Lean](https://leanprover-community.github.io/mathematics_in_lean/) develops practical examples with Mathlib. The goal is to make formal proof part of ordinary cryptanalytic work: an argument we can explain, inspect, and check again.
