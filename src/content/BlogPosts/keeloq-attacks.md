---
title: "Revisiting Practical Attacks on KeeLoq"
date: "2026-09-22"
excerpt: "A full-codebook fixed-point attack with 84.7% modeled success, and reproducible GPU measurements for exhaustive search and slide meet-in-the-middle key recovery."
tags: ["symmetric-key cryptanalysis", "KeeLoq", "slide attacks", "GPU"]
---

<div class="article-lead">

KeeLoq has a 64-bit key and 528 rounds, but its key schedule repeats every 64 rounds. This repeated structure is central to its cryptanalysis. In this work, we revisit three attack settings: exhaustive search, a full-codebook fixed-point attack, and the known slide meet-in-the-middle attack.

Our main analytical contribution is a refinement of the fixed-point strategy. By exploiting cycles of length **1, 2, 4, and 8** in the 64-round core, we obtain a modeled success probability of **84.7%** under the full-codebook assumption. We also provide public implementations and measurements that put the computational costs of the three approaches into context.

</div>

<p class="article-source"><a href="https://github.com/hadipourh/KeeLoq">Source code on GitHub ↗</a><span>Full 528-round KeeLoq · Black-box key recovery</span></p>

<nav class="article-contents" aria-label="In this article">
<span class="contents-label">In this article</span>
<ol>
<li><a href="#the-structure-behind-the-attacks">The cipher structure</a></li>
<li><a href="#a-full-codebook-fixed-point-attack">The fixed-point contribution</a></li>
<li><a href="#what-the-experiments-show">Experimental results</a></li>
<li><a href="#exhaustive-search-as-a-baseline">The exhaustive-search baseline</a></li>
<li><a href="#slide-meet-in-the-middle-with-less-data">Slide meet-in-the-middle</a></li>
<li><a href="#reproducing-the-results">Code and reproduction</a></li>
</ol>
</nav>

## The structure behind the attacks

KeeLoq is a 32-bit block cipher with a 64-bit key. Its nonlinear feedback shift register (NLFSR) updates one bit per round. The feedback depends on five state bits, two additional linear taps, and one key bit. The nonlinear function is specified by the lookup constant `0x3A5C742E`.

<figure class="attack-figure">
<a href="/images/blog/keeloq/keeloq-encryption.svg" target="_blank" rel="noopener"><img src="/images/blog/keeloq/keeloq-encryption.svg" alt="KeeLoq encryption round: a 32-bit shift register, nonlinear feedback function, linear taps, and a bit from the rotating 64-bit key register." width="1000" height="706" loading="lazy" /></a>
<figcaption><span>Figure 1.</span> KeeLoq encryption. Select a figure to open the full-size vector image.</figcaption>
</figure>

For a fixed key, write $F=E_{64}$ for the 64-round core. The period-64 key schedule gives the decomposition

$$
E_{528}=E_{16}\circ F^8.
$$

Thus encryption consists of eight applications of the same permutation $F$, followed by 16 rounds using the low 16 key bits again. Both structural attacks exploit this identity.

A second property is useful throughout. After $t\leq32$ forward rounds from a state $A$ to a state $B$, the low $32-t$ output bits are unchanged copies of the high $32-t$ input bits. In particular, after 16 rounds,

$$
B[0..15]=A[16..31].
$$

The remaining output bits are the feedback bits introduced during those rounds. If both endpoint states are known, each round equation determines one key bit. The intervening key fragment can therefore be **extracted in time linear in the number of rounds**, rather than enumerated.

<details class="technical-detail">
<summary>The inverse round structure</summary>
<figure class="attack-figure">
<a href="/images/blog/keeloq/keeloq-decryption.svg" target="_blank" rel="noopener"><img src="/images/blog/keeloq/keeloq-decryption.svg" alt="KeeLoq decryption round, reversing the state shift and using the key schedule in reverse order." width="1000" height="706" loading="lazy" /></a>
<figcaption>Decryption reverses the shift. This permits the S/MITM attack to peel rounds from the ciphertext side as well as from the plaintext side.</figcaption>
</figure>
</details>

## A full-codebook fixed-point attack

The attack assumes access to **all $2^{32}$ plaintext–ciphertext pairs under one key**. This is a strong data assumption. It is the setting in which we compare our success probability with the earlier fixed-point attacks of [Courtois, Bard, and Wagner](#references).

Suppose that a plaintext $P$ is a fixed point of $F^8$. Then

$$
F^8(P)=P
\quad\Longrightarrow\quad
E_{528}(K,P)=E_{16}(K,P).
$$

For this plaintext, a full-round encryption gives a 16-round relation with the same endpoints. The question is how to find such plaintexts and complete key recovery.

### Why cycles of length 1, 2, 4, and 8 matter

A state returns to itself after eight applications of a permutation exactly when its cycle length divides eight. A fixed point of $F$ contributes one fixed point of $F^8$; a 2-cycle contributes two; a 4-cycle contributes four; and an 8-cycle contributes eight.

The following illustration shows this deterministic property. It is a cycle diagram, not a simulation of KeeLoq or a sample from the random-permutation model.

<div class="cycle-explorer" data-cycle-explorer>
<div class="visual-heading"><span class="figure-kicker">Cycle structure</span><strong>Which states return after eight applications of F?</strong></div>
<div class="cycle-controls" role="group" aria-label="Choose a cycle length">
<button type="button" data-cycle="1" aria-pressed="false">1-cycle</button>
<button type="button" data-cycle="2" aria-pressed="false">2-cycle</button>
<button type="button" data-cycle="3" aria-pressed="false">3-cycle</button>
<button type="button" data-cycle="4" aria-pressed="false">4-cycle</button>
<button type="button" data-cycle="8" aria-pressed="true">8-cycle</button>
</div>
<svg data-cycle-svg viewBox="0 0 600 285" role="img" aria-label="An 8-cycle returns to its starting state after eight applications of F."><text x="300" y="140" text-anchor="middle" fill="currentColor">P → F(P) → ⋯ → F⁸(P) = P</text></svg>
<div class="cycle-actions"><button type="button" data-cycle-step>Apply F once</button><button type="button" data-cycle-eight>Apply F eight times</button><button type="button" data-cycle-reset>Reset</button></div>
<p class="cycle-status" data-cycle-status aria-live="polite">An 8-cycle contributes eight fixed points of F⁸.</p>
<noscript><p>Cycle lengths 1, 2, 4, and 8 divide eight, so every state in those cycles is fixed by F⁸. A state in a 3-cycle does not return after eight steps.</p></noscript>
</div>

We model **$F$ as a uniformly random permutation** on $2^{32}$ states. This is a heuristic assumption about KeeLoq; $F^8$ is not itself modeled as a uniform random permutation. For small $d$, the number $X_d$ of $d$-cycles is approximately Poisson with mean $1/d$, and these counts are asymptotically independent.

The number of useful fixed points is consequently modeled by

$$
m=X_1+2X_2+4X_4+8X_8,
\qquad X_d\approx\operatorname{Poi}(1/d).
$$

Each cycle length contributes one to the expected count, giving $\mathbb{E}[m]=4$. The variance is $1+2+4+8=15$: an 8-cycle contributes eight useful states at once, so the distribution is substantially more dispersed than a Poisson variable of mean four.

The structural success event is the presence of at least one useful fixed point. Under the small-cycle Poisson approximation,

$$
\Pr[m>0]\approx1-e^{-(1+1/2+1/4+1/8)}
=1-e^{-15/8}\approx84.7\%.
$$

Earlier full-codebook Slide-Determine variants succeed for about 63% or 30% of keys. The improvement here is the **success probability under the same full-codebook assumption**. It is not a reduction in data complexity, nor a claim of a universal time-complexity improvement over those variants.

### Phase 1: filter, peel, and group

For each codebook pair $(P,C)$, retain it only if

$$
C[0..15]=P[16..31].
$$

Every true fixed point of $F^8$ passes. Under the filter heuristic, approximately $2^{16}$ other records pass as well. For each survivor, the 16-round relation determines a candidate $\kappa$ for $k[0..15]$.

We group survivors by $\kappa$ and sort the groups by their vote counts. The true group contains exactly the fixed points of $F^8$: if peeling gives the correct low key, then $E_{16}(K,P)=E_{528}(K,P)$, and invertibility of $E_{16}$ implies $F^8(P)=P$. False survivors therefore populate the wrong-key groups.

Wrong-bin counts are approximately Poisson with mean one. The largest false groups often have seven to nine members, while the true group may contain only one or two. **Keeping only the highest-ranked group would lose many recoverable keys.** Phase 1 retains all groups; their ranking only determines the search order.

### Phase 2: recover the remaining 48 bits

For a candidate $\kappa$, compute $M_{16,i}=E_{16}(\kappa,P_i)$. In the true group, $F$ permutes the plaintexts, so the unknown suffix $k^+=k[16..63]$ satisfies relations of the form

$$
E_{48}(k^+,M_{16,i})=P_j.
$$

**Sweep A** processes groups with at least two members. Fix two source indices and try all $n^2$ directed target pairs in a group of size $n$. Each hypothesis gives two 48-round constraints, solved using Boolean satisfiability (SAT). The correct successor pair occurs among these hypotheses. Candidate keys are verified using full-round plaintext–ciphertext pairs.

**Sweep B** processes singleton groups if Sweep A returns no verified key. A true singleton corresponds to a 1-cycle. Its single 48-round relation leaves exactly $2^{16}$ constructive completions: choose the first 16 feedback bits, use the output state to determine the remaining feedback bits, and reconstruct the key suffix. Verification rejects wrong completions. An optional GPU prefilter accelerates this enumeration.

<figure class="attack-figure figure-tall">
<a href="/images/blog/keeloq/fixedpoint-workflow.svg" target="_blank" rel="noopener"><img src="/images/blog/keeloq/fixedpoint-workflow.svg" alt="Fixed-point attack workflow: scan the codebook, apply a 16-bit filter, peel and group survivors, then perform directed-pair SAT or singleton recovery and verify candidates." width="1000" height="1437" loading="lazy" /></a>
<figcaption><span>Figure 2.</span> The two-phase fixed-point attack workflow. The theoretical recovery procedure is exhaustive; the implementation limit below applies to SAT-model enumeration.</figcaption>
</figure>

> **Search coverage.** The 84.7% prediction describes the structural event combined with exhaustive recovery and sufficient verification. The current implementation tries all directed target pairs but checks at most 100 SAT models per pair. This prevents an unconditional completeness claim for Sweep A. The singleton path enumerates all completions. In the recorded experiment, every key with a true fixed point was recovered.

Scanning an already available codebook inspects $2^{32}$ records. Our benchmark instead generates the pairs from a known test key, performing $2^{32}$ full encryptions. These are different accounting conventions. Phase 2 adds instance-dependent SAT work and, when needed, singleton reconstruction **and full-round verification**; suffix-completion counts alone do not measure its complete cost.

## What the experiments show

The end-to-end experiment used an NVIDIA RTX PRO 6000 Blackwell Workstation Edition for phase 1 and **192 CPU workers with CaDiCaL** for phase 2. The 100 keys were generated with seed 42.

<figure class="result-figure">
<a href="/images/blog/keeloq/fixedpoint-results.svg" target="_blank" rel="noopener"><img src="/images/blog/keeloq/fixedpoint-results.svg" alt="100-key fixed-point experiment: 15 keys had zero true votes and failed; 29 had one to three votes, 36 had four to seven votes, and 20 had at least eight votes. All 85 present keys were recovered." width="1000" height="500" loading="lazy" /></a>
<figcaption><span>Figure 3.</span> True-bin vote counts from the <a href="https://github.com/hadipourh/KeeLoq/blob/b549a4d486b91fcb09da8f3ed37d6cc1ca578164/benchmarks/fixedpoint_benchmark.csv">committed per-key measurements</a>. Vote count determines neither a universal rank threshold nor a runtime guarantee.</figcaption>
</figure>

The attack recovered **85 of 100 keys**. The 15 failures were precisely the keys for which $F^8$ had no fixed point. Of the successful recoveries, 74 finished in Sweep A and 11 in Sweep B. Only 20 keys had the correct group ranked first, illustrating why searching beyond the largest group matters.

For successful keys, the reported total time had mean **6.2 seconds** and median **3.5 seconds**. Phase 2 alone had mean 6.0 seconds, median 3.3 seconds, and maximum 17.7 seconds. Over all 100 keys, including failures, the reported total-time mean was 7.9 seconds. The complete benchmark invocation took 947 seconds.

These timing scopes matter. The CSV's `total_time` adds the rounded phase-1 scan time to phase-2 process wall time. It excludes phase-1 setup and output overhead, and it does not measure codebook acquisition from a device. Scan times are printed to one decimal place; a reported `0.0` is a rounded value. The 6.2-second result is also a GPU-plus-CPU measurement, not a single-GPU key-recovery time.

The observed 85% rate is consistent with the 84.7% model. Its 95% Wilson confidence interval is approximately 76.7%–90.7%, so this experiment supports the model without establishing the heuristic as a theorem about KeeLoq.

A separate single-key experiment on a 10-core Apple M4 took about 29 minutes for CPU phase 1; phase 2 completed in 0.1 seconds for that key. This demonstrates a CPU execution path, but it is not a 100-key average and does not relax the full-codebook assumption.

## Exhaustive search as a baseline

The exhaustive-search implementation tests the first known pair for every candidate key and tests the second pair only after a first-pair match. Almost every wrong key is rejected after one encryption.

The full-round contiguous-key path uses **32-lane bit slicing**. Each bit plane is a 32-bit machine word containing the corresponding state bit from 32 candidate keys. One sequence of Boolean instructions therefore advances 32 KeeLoq instances through a round. A CUDA warp also contains 32 threads, but the two forms of parallelism are distinct: each thread operates on its own 32 lanes.

<details class="technical-detail">
<summary>GPU execution model and memory hierarchy</summary>
<figure class="attack-figure">
<a href="/images/blog/keeloq/gpu-execution-model.svg" target="_blank" rel="noopener"><img src="/images/blog/keeloq/gpu-execution-model.svg" alt="CUDA grid divided into blocks, with one 192-thread block expanded into six warps. Each thread scans a consecutive range of candidate keys." width="1000" height="522" loading="lazy" /></a>
<figcaption>A grid contains thread blocks; a 192-thread block contains six warps. Bit slicing provides another level of parallelism inside each thread.</figcaption>
</figure>
<figure class="attack-figure">
<a href="/images/blog/keeloq/gpu-memory-hierarchy.svg" target="_blank" rel="noopener"><img src="/images/blog/keeloq/gpu-memory-hierarchy.svg" alt="GPU memory scopes: thread-private registers, block-local shared memory, and device-wide global memory." width="1000" height="362" loading="lazy" /></a>
<figcaption>The hot cipher state stays in registers, keeping memory traffic low.</figcaption>
</figure>
</details>

Three bounded runs on the RTX PRO 6000 gave a median throughput of **176.909 billion tested keys per second**, approximately $2^{37.36}$ keys/s. The runs fixed 24 low key bits and exercised the remaining $2^{40}$-candidate subspace; they did not scan all $2^{64}$ keys.

Extrapolating that rate to the full key space gives about **1.65 years to reach a uniformly placed true key**, or 3.30 years for a complete scan on one GPU. These estimates describe search work at the measured rate.

Two known pairs do not guarantee unique recovery of a 64-bit key for a 32-bit block cipher. Under an ideal-cipher heuristic, approximately one wrong key is expected to survive two distinct pairs over the full key space, in addition to the true key. The current executable reports a matching candidate; additional independent pairs are needed to establish that it is the original key. A high candidate-testing rate should not be confused with a guarantee of unique key recovery.

## Slide meet-in-the-middle with less data

The S/MITM attack is based on the earlier practical attack of [Indesteege et al.](#references), subsequently extended in the journal treatment by Aerts et al. Our contribution here is an implementation and experimental evaluation; the theoretical attack complexity is established prior work.

A slid pair satisfies

$$
P_j=F(P_i).
$$

After peeling the final 16 rounds, the ciphertext-side relation is $Y_j=F(Y_i)$, where $Y_i=D_{16}(K_0,C_i)$. Equivalently, on the unpeeled ciphertexts, $C_j=E'_{64}(K,C_i)$, where the prime denotes the 64-round key schedule starting at offset 16. Keeping this offset explicit avoids confusing the two relations.

For $N$ distinct plaintexts, the expected number of ordered slid pairs is approximately $N(N-1)/2^{32}$. The corresponding Poisson approximation gives

$$
\Pr[\text{at least one slid pair}]
\approx1-\exp\!\left(-\frac{N(N-1)}{2^{32}}\right).
$$

At $N\approx2^{16}$, this is about **63%**. Unlike the fixed-point attack, this setting needs only about $2^{16}$ known pairs. The two success rates therefore describe different data assumptions.

<div class="data-explorer" data-data-explorer>
<div class="visual-heading"><span class="figure-kicker">Data and success probability</span><strong>The slid-pair threshold</strong></div>
<label for="keeloq-data-bits">Number of known pairs: <output id="keeloq-data-count" for="keeloq-data-bits">2¹⁶ = 65,536</output></label>
<input id="keeloq-data-bits" type="range" min="12" max="18" step="1" value="16" aria-describedby="keeloq-data-note" />
<div class="range-endpoints"><span>2¹² pairs</span><span>2¹⁸ pairs</span></div>
<div class="probability-result"><output id="keeloq-data-probability" for="keeloq-data-bits">63.2%</output><span>probability of at least one slid pair</span></div>
<div class="probability-track" aria-hidden="true"><span data-probability-bar style="width:63.2%"></span></div>
<p id="keeloq-data-note">Random-permutation and Poisson approximations for distinct plaintexts. This is a presence probability, not a runtime estimate or an empirical recovery rate.</p>
<noscript><p>At 2¹⁴ pairs the approximation gives 6.1%; at 2¹⁶ pairs it gives 63.2%.</p></noscript>
</div>

### The baseline profile

Split the key into four 16-bit chunks,

$$
K=K_3\mathbin\|K_2\mathbin\|K_1\mathbin\|K_0.
$$

For each guess of $K_0$, compute $X_i=E_{16}(K_0,P_i)$ and $Y_i=D_{16}(K_0,C_i)$. A 16-bit overlap guess $u$, together with the passthrough property, determines two intermediate states:

$$
P_j^\star=P_j[15:0]\mathbin\|u,
\qquad
X_i^\star=u\mathbin\|X_i[31:16].
$$

<figure class="attack-figure">
<a href="/images/blog/keeloq/mitm-state-layout.svg" target="_blank" rel="noopener"><img src="/images/blog/keeloq/mitm-state-layout.svg" alt="Two S/MITM state paths. The plaintext path uses key chunks K0, K1, K2, K3; the ciphertext path uses K1, K2, K3, K0. Passthrough halves connect adjacent states." width="1000" height="281" loading="lazy" /></a>
<figcaption><span>Figure 4.</span> State layout for the baseline S/MITM attack. Each arrow represents 16 rounds; the ciphertext path begins at key offset 16.</figcaption>
</figure>

On the right side, extract $K_3$, compute $Y_j^\star=D_{16}(K_3,Y_j)$, and store candidates indexed by $Y_j^\star[15:0]$. On the left side, extract $K_1$, compute $C_i^\star=E_{16}(K_1,C_i)$, and probe using $C_i^\star[31:16]$. A table hit provides two ways to extract $K_2$. Only agreeing extractions proceed to full-round key verification.

<details class="technical-detail">
<summary>The complete build-and-probe workflow</summary>
<figure class="attack-figure">
<a href="/images/blog/keeloq/mitm-workflow.svg" target="_blank" rel="noopener"><img src="/images/blog/keeloq/mitm-workflow.svg" alt="Baseline S/MITM workflow: guess the low key chunk and overlap, build a right-side table, probe from the left, check middle-key consistency, and verify the assembled key." width="1000" height="839" loading="lazy" /></a>
<figcaption>The table is built before it is probed. Every right-side candidate is retained; a fixed bucket-capacity truncation would change the attack's coverage.</figcaption>
</figure>
</details>

The generalized profile uses parameters $(t_p,t_c,t_o)$ with $t_o=t_p+t_c-16$. The known-plaintext baseline $(16,16,16)$ costs about $2^{45.0}$ full encryptions; the $(15,15,14)$ profile reduces the nominal cost to about $2^{44.5}$.

### Measured throughput and extrapolated scans

With $2^{16}$ pairs, a complete scan of **64 out of $2^{16}$ low-key values** took 17.58 seconds for $(16,16,16)$ and 22.37 seconds for $(15,15,14)$. The target key was outside the scanned range, so early success could not shorten these measurements.

Multiplying by $2^{16}/64=1024$ gives estimated complete-scan times of **5.0 hours** and **6.4 hours**, respectively. These are extrapolations, not completed full scans. The nominally cheaper profile was slower on this GPU: candidate multiplicity and bucket occupancy also affect execution cost. The measurements do not isolate every contribution to that difference.

The GPU implementation of $(20,13,17)$ uses that parameter geometry but does not implement the chosen-plaintext structure that reduces the overlap search. Its 37.1-hour extrapolation should therefore not be presented as the cost of the complete chosen-plaintext attack. The generalized CPU reference supports the chosen-plaintext reduction.

All 18 randomized bounded GPU recovery tests succeeded. These tests used injected slid pairs, $2^8$ records, and restricted low-key ranges. They validate those executions, not the natural 63% slid-pair presence probability.

## What the comparison tells us

The three approaches answer different questions. Exhaustive search requires very little data but remains expensive over a 64-bit key space. The fixed-point attack has a much smaller measured computational cost once the full codebook is available, and improves structural success in that setting. S/MITM uses much less data than the fixed-point attack, at a higher computational cost.

The remaining challenge is black-box key recovery with substantially fewer than $2^{16}$ pairs and a competitive time and memory cost. Simply shrinking the S/MITM dataset does not solve it: at $N=2^{14}$, the slid-pair presence probability falls to about 6.1%. An improvement must change the available relation or use weaker evidence effectively, and report its success probability alongside data, time, and memory complexities.

Side-channel attacks on KeeLoq belong to a different threat model: they exploit implementation leakage and device access. They should not be ranked against these black-box attacks by time alone.

## Reproducing the results

The implementations are available in the [public KeeLoq repository](https://github.com/hadipourh/KeeLoq). The links below identify the public revision used for this article:

- [Fixed-point implementation and instructions](https://github.com/hadipourh/KeeLoq/tree/b549a4d486b91fcb09da8f3ed37d6cc1ca578164/attacks/fixedpoint), including the documented SAT enumeration limit.
- [GPU exhaustive search](https://github.com/hadipourh/KeeLoq/tree/b549a4d486b91fcb09da8f3ed37d6cc1ca578164/attacks/bruteforce).
- [Generalized CPU and GPU S/MITM implementations](https://github.com/hadipourh/KeeLoq/tree/b549a4d486b91fcb09da8f3ed37d6cc1ca578164/attacks/mitm).
- [Fixed-point benchmark CSV, summary, and GPU environment](https://github.com/hadipourh/KeeLoq/tree/b549a4d486b91fcb09da8f3ed37d6cc1ca578164/benchmarks).

A bounded CPU S/MITM example is a useful starting point:

```bash
git clone https://github.com/hadipourh/KeeLoq.git
cd KeeLoq
git checkout b549a4d486b91fcb09da8f3ed37d6cc1ca578164
make -C attacks/mitm generalized
./attacks/mitm/mitm_generalized \
  --tp 15 --tc 15 --key 000000000000001F \
  --pairs-log2 8 --max-k0 32 --inject-slid-pair
```

This example generates synthetic data and injects a slid pair. It tests bounded recovery; it does not measure the probability of acquiring a useful pair. The README gives CUDA architecture choices, full-codebook experiments, and benchmark commands. Report the GPU, CPU allocation, build flags, dataset size, and scanned key range when comparing timings.

## References

1. Andrey Bogdanov. **Linear Slide Attacks on the KeeLoq Block Cipher.** Inscrypt 2007. [Publication](https://doi.org/10.1007/978-3-540-79499-8_7).
2. Nicolas T. Courtois, Gregory V. Bard, and David Wagner. **Algebraic and Slide Attacks on KeeLoq.** FSE 2008; the full-codebook variants discussed here are described in the earlier extended report. [Publication](https://doi.org/10.1007/978-3-540-71039-4_6), [ePrint 2007/062](https://eprint.iacr.org/2007/062).
3. Sebastiaan Indesteege, Nathan Keller, Orr Dunkelman, Eli Biham, and Bart Preneel. **A Practical Attack on KeeLoq.** EUROCRYPT 2008. [Publication](https://doi.org/10.1007/978-3-540-78967-3_1). See also the extended journal treatment by Wim Aerts et al., *Journal of Cryptology* 25 (2012), 136–157: [Publication](https://doi.org/10.1007/s00145-010-9091-9).
4. Thomas Eisenbarth et al. **On the Power of Power Analysis in the Real World: A Complete Break of the KeeLoq Code Hopping Scheme.** CRYPTO 2008. [Publication](https://doi.org/10.1007/978-3-540-85174-5_12).
5. Markus Kasper, Timo Kasper, Amir Moradi, and Christof Paar. **Breaking KeeLoq in a Flash: On Extracting Keys at Lightning Speed.** AFRICACRYPT 2009. [Publication](https://doi.org/10.1007/978-3-642-02384-2_25).
