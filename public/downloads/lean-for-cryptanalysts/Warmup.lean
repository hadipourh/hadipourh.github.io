/-!
# Warm-up: one Feistel round

This file needs only Lean itself, without Mathlib.
-/

-- One Feistel round with an arbitrary round function F.
def feistel {n : Nat} (F : BitVec n → BitVec n)
    (x : BitVec n × BitVec n) : BitVec n × BitVec n :=
  (x.2, x.1 ^^^ F x.2)

-- The candidate inverse.
def feistelInv {n : Nat} (F : BitVec n → BitVec n)
    (y : BitVec n × BitVec n) : BitVec n × BitVec n :=
  (y.2 ^^^ F y.1, y.1)

-- For every word size n, every round function F, and every input (l, r).
theorem feistel_inverse {n : Nat} (F : BitVec n → BitVec n)
    (l r : BitVec n) :
    feistelInv F (feistel F (l, r)) = (l, r) := by
  simp only [feistel, feistelInv]
  rw [BitVec.xor_assoc]
  rw [BitVec.xor_self]
  rw [BitVec.xor_zero]

-- The same proof in one line: simp finds the steps itself.
example {n : Nat} (F : BitVec n → BitVec n) (l r : BitVec n) :
    feistelInv F (feistel F (l, r)) = (l, r) := by
  simp [feistel, feistelInv, BitVec.xor_assoc]

-- A finite check: one fixed round function on 4-bit words.
def toyF (r : BitVec 4) : BitVec 4 := r &&& 3

theorem toy_inverse :
    ∀ l r : BitVec 4, feistelInv toyF (feistel toyF (l, r)) = (l, r) := by
  decide

-- Exercise: prove that feistel also undoes feistelInv.
-- theorem feistel_inverse' {n : Nat} (F : BitVec n → BitVec n)
--     (l r : BitVec n) :
--     feistel F (feistelInv F (l, r)) = (l, r) := by
--   sorry
