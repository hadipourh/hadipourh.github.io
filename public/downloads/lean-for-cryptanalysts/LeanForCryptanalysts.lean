module

public import Mathlib

public section

/-!
# Lean for Cryptanalysts: a small, complete tutorial

Checked with Lean 4.35.0 and Mathlib v4.35.0.
All sums are integer sums, without normalization.
The first coordinate is the selected bit; the other `m` bits are arbitrary.
-/

namespace LeanForCryptanalysts

-- A warm-up: the algebra at the end of the halfspace proof.
theorem halfspace_algebra (I₀ I₁ L : ℤ)
    (hbalance : I₀ + I₁ = 0)
    (hlinear : L = I₀ - I₁) :
    L = 2 * I₀ := by
  linarith

-- false represents bit 0; true represents bit 1.
def sign (b : Bool) : ℤ :=
  (-1) ^ b.toNat

theorem sign_false : sign false = 1 := by
  rfl

theorem sign_true : sign true = -1 := by
  rfl

-- A state has m + 1 bits: the selected bit and an m-bit word.
abbrev State (m : ℕ) := Bool × BitVec m

def halfSum {m : ℕ} (E : State m → State m) (b : Bool) : ℤ :=
  ∑ z : BitVec m, sign (E (b, z)).1

def linearSum {m : ℕ} (E : State m → State m) : ℤ :=
  ∑ x : State m, sign x.1 * sign (E x).1

-- Splitting the input sum does not require E to be a permutation.
theorem split_linear {m : ℕ} (E : State m → State m) :
    linearSum E = halfSum E false - halfSum E true := by
  simp only [linearSum, Fintype.sum_prod_type, Fintype.sum_bool,
    sign_false, sign_true, one_mul, neg_one_mul,
    Finset.sum_neg_distrib, halfSum]
  ring

-- Every output occurs once because E is bijective.
theorem balanced_halves {m : ℕ} (E : State m → State m)
    (hE : Function.Bijective E) :
    halfSum E false + halfSum E true = 0 := by
  have reorder :
      (∑ x : State m, sign (E x).1) =
        ∑ y : State m, sign y.1 :=
    Equiv.sum_comp (Equiv.ofBijective E hE) (fun y => sign y.1)
  simpa [Fintype.sum_prod_type, halfSum, sign, add_comm] using reorder

-- The complete conversion, for every block size m + 1 and every permutation E.
theorem halfspace_identity {m : ℕ} (E : State m → State m)
    (hE : Function.Bijective E) :
    linearSum E = 2 * halfSum E false := by
  have hbalance := balanced_halves E hE
  have hlinear := split_linear E
  exact halfspace_algebra _ _ _ hbalance hlinear

theorem other_half {m : ℕ} (E : State m → State m)
    (hE : Function.Bijective E) :
    linearSum E = -2 * halfSum E true := by
  have hbalance := balanced_halves E hE
  have hlinear := split_linear E
  linarith

-- An arbitrary power of two, not a check of a few numerical exponents.
theorem transfer_divisibility {m : ℕ} (E : State m → State m)
    (hE : Function.Bijective E) (t : ℕ)
    (hdiv : (2 : ℤ) ^ (t + 1) ∣ linearSum E) :
    (2 : ℤ) ^ t ∣ halfSum E false := by
  rw [halfspace_identity E hE, pow_succ'] at hdiv
  exact (mul_dvd_mul_iff_left (by norm_num : (2 : ℤ) ≠ 0)).mp hdiv

-- The diagram's toy permutation: flip x₀ exactly when both other bits are 1.
def toy (x : State 2) : State 2 :=
  (Bool.xor x.1 (x.2 == 3), x.2)

theorem toy_involutive : Function.Involutive toy := by
  change ∀ x, toy (toy x) = x
  decide +kernel

theorem toy_bijective : Function.Bijective toy :=
  toy_involutive.bijective

theorem toy_values :
    halfSum toy false = 2 ∧
    halfSum toy true = -2 ∧
    linearSum toy = 4 := by
  decide +kernel

-- A genuine counterexample when the bijectivity hypothesis is omitted.
def constantMap (_ : State 2) : State 2 := (false, 0)

theorem missing_hypothesis_counterexample :
    linearSum constantMap = 0 ∧
    halfSum constantMap false = 4 ∧
    linearSum constantMap ≠ 2 * halfSum constantMap false := by
  decide +kernel

-- Each key may select a different permutation. No key enumeration is needed.
theorem all_keys {Key : Type} {m : ℕ}
    (E : Key → State m → State m)
    (hE : ∀ K, Function.Bijective (E K)) :
    ∀ K, linearSum (E K) = 2 * halfSum (E K) false := by
  intro K
  exact halfspace_identity (E K) (hE K)

#print axioms halfspace_identity
#print axioms transfer_divisibility
#print axioms toy_values
#print axioms missing_hypothesis_counterexample
#print axioms all_keys

end LeanForCryptanalysts
